import { type Request, type Response } from "express";
import { prisma } from "../config/prisma.js";
import { getSocket } from "../config/sockets.js";

export const sendMessage = async (req: Request, res: Response) => {
  const { chatId, content } = req.body;
  const userId = req.user?.id;

  // Validation
  if (!userId || typeof userId !== "number") {
    return res.status(401).json({ message: "Unauthorised request." });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create the message
    const msg = await tx.message.create({
      data: { content, chatId: parseInt(chatId), userId },
      include: {
        sender: { select: { id: true, name: true } }, // including sender's info to be returned
      },
    });

    // Setting this message as lastMessage of the Chat
    await tx.chat.update({
      where: { id: parseInt(chatId) },
      data: { messageId: msg.id },
    });

    // Marking this msg as `read` for the sender
    await tx.userChatState.update({
      where: { userId_chatId: { userId, chatId: parseInt(chatId) } },
      data: { lastReadId: msg.id },
    });

    return msg;
  });

  // sending message via socket to whoever's online
  const io = await getSocket();
  io?.to(result.chatId.toString()).emit("receive-message", result);
  console.log("Message emitted to: ", result.chatId.toString());

  res.status(201).json({ status: "success", data: result });
};

export const getUserChats = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // Validation
  if (!userId)
    return res.status(401).json({ message: "Unauthorised request." });

  // fetching from userChatState(a join table of user and chat along with some extra fields)
  const states = await prisma.userChatState.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          team: { select: { name: true } },
          lastMessage: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });

  const formatted = await Promise.all(
    states.map(async (state) => {
      const lastMsg = state.chat.lastMessage;
      const isVisible = lastMsg && lastMsg.createdAt >= state.joinedAt;

      // Calculate Unread Count for this specific chat
      const unreadCount = await prisma.message.count({
        where: {
          chatId: state.chatId,
          id: { gt: state.lastReadId || 0 },
          createdAt: { gte: state.joinedAt }, // Ensure to not count messages before user joined
        },
      });

      return {
        chatId: state.chatId,
        teamName: state.chat.team.name,
        unreadCount, // the frontend can show the unread count badge
        lastMessageId: state.chat.lastMessage?.id, // Also sending last message's id
        lastMessageSnippet: isVisible
          ? lastMsg.isDeleted // if last message is (soft) deleted, send deletion text
            ? "[Last message was deleted]"
            : lastMsg.content
          : "Welcome to the team!",
      };
    }),
  );
  console.log("Chats: ", formatted);

  res.json({ data: formatted });
};

export const markAsRead = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user?.id;

  // Validation
  if (!userId || typeof userId !== "number") {
    return res.status(401).json({ message: "Unauthorised request." });
  }
  if (!chatId || typeof chatId !== "string") {
    return res.status(400).json({ message: "Chat ID is required." });
  }

  try {
    // Fetch state and the parent chat to get the global messageId(last message)
    const state = await prisma.userChatState.findUnique({
      where: {
        userId_chatId: { userId: userId as number, chatId: parseInt(chatId) },
      },
      include: { chat: true }, // Need this to see chat.messageId
    });

    const globalLatestId = state?.chat?.messageId;

    if (globalLatestId) {
      await prisma.userChatState.update({
        where: {
          userId_chatId: { userId: userId as number, chatId: parseInt(chatId) },
        },
        data: { lastReadId: globalLatestId },
      });
    }

    res.json({ status: "success", message: "Read marker updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating read status" });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    // Validation
    if (!chatId || typeof chatId !== "string") {
      return res.status(400).json({ message: "Chat ID is required." });
    }
    if (!userId) {
      return res.status(401).json({ message: "Unauthorised request." });
    }

    // Parsing
    const parsedChatId = parseInt(chatId);
    const cursor = req.query.cursor // This will be used as offset
      ? parseInt(req.query.cursor as string)
      : NaN;

    // Fetch User State for privacy (joinedAt)
    const state = await prisma.userChatState.findUnique({
      where: {
        userId_chatId: { userId: userId as number, chatId: parsedChatId },
      },
    });

    if (!state)
      return res.status(403).json({ message: "Not a member of this chat." });

    // Fetching Older Messages
    const messages = await prisma.message.findMany({
      where: {
        chatId: parsedChatId,
        id: isNaN(cursor) ? {} : { lt: cursor }, // If no cursor is provided (Initial Load), we fetch the latest
        createdAt: { gte: state.joinedAt }, // Only get messages that are after the user joined the chat
        isDeleted: false,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { id: "desc" }, // We use 'desc' to get the messages closest to the cursor first
      take: 50,
    });

    // Reversing it so the Frontend receives them as (Oldest -> Newest).
    const result = messages.reverse();

    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Validation
    if (!userId || typeof userId !== "number") {
      return res.status(401).json({ message: "Unauthorised request." });
    }
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Message ID required." });
    }

    const messageId = parseInt(id);

    // Fetch message to ensure it exists and the user owns it
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Ensuring Only the sender and admin can delete a message
    if (message.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        message: "Access Denied: You can only delete your own messages.",
      });
    }

    // Perform Soft Delete
    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    const io = await getSocket();
    io?.to(message.chatId.toString()).emit("message-deleted", {
      chatId: message.chatId,
      messageId: message.id,
    });

    res.status(200).json({
      status: "success",
      message: "Message has been deleted.",
    });
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
