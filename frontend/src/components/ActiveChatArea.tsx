import React, { useState, useEffect, useRef, useContext } from "react";
import MessageBubble from "./MessageBubble";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import type { ChatMessage } from "../screens/Chats";
import { type Socket } from "socket.io-client";

interface ActiveChatAreaProps {
  chatId: number;
  chatName: string;
  socket: Socket | null;
  onBack: () => void;
  changeLastMessage: (chatId: number, snippet: string) => void;
}

export default function ActiveChatArea({
  chatId,
  chatName,
  socket,
  onBack,
  changeLastMessage,
}: ActiveChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useContext(AuthContext) as AuthContextType;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initially Load messages & call markAsRead api
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/chats/${chatId}/messages`);
        setMessages(res.data.data);

        // Mark as read on mount
        await apiClient.patch(`/chats/${chatId}/read`);

        // Reset scroll to bottom on initial load
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Failed to load chat", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      loadInitialMessages();
    }
  }, [chatId]);

  // setting socket for receiving message
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (newMessage: ChatMessage) => {
      try {
        // Only add if it's not from me(avoiding duplicate) and is for current chat/group.
        if (
          newMessage.userId !== user?.userId &&
          newMessage.chatId === chatId
        ) {
          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 50);
          await apiClient.patch(`/chats/${chatId}/read`); // Mark as read on receiving
        }
      } catch (err: any) {
        toast.error("An unknown error occured while receiving new message.");
        console.log(
          "An unknown error occured while receiving new message: ",
          err,
        );
      }
    };

    const handleDeleteMessage = async ({ messageId }: any) => {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== messageId),
      );
    };

    socket.on("receive-message", handleNewMessage);
    socket.on("message-deleted", handleDeleteMessage);

    return () => {
      socket.off("receive-message", handleNewMessage);
      socket.off("message-deleted", handleDeleteMessage);
    };
  }, [socket, chatId]);

  // Pagination Handler
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;

    // If at the top, not loading, and has more history to fetch
    if (scrollTop === 0 && !isLoading && hasMore && messages.length > 0) {
      const cursor = messages[0].id; // The oldest message currently visible
      setIsLoading(true);

      try {
        const res = await apiClient.get(
          `/chats/${chatId}/messages?cursor=${cursor}`,
        );
        const olderMessages = res.data.data;

        if (olderMessages.length < 50) setHasMore(false);

        setMessages((prev) => [...olderMessages, ...prev]);
      } catch (err) {
        console.error("Error fetching history", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return; // If empty message, do nothing

    try {
      const res = await apiClient.post("/chats/send", {
        chatId,
        content: messageInput,
      });
      setMessages((prev) => [...prev, res.data.data]);
      changeLastMessage(chatId, messageInput.trim());
      setMessageInput("");
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      toast.error("Failed to send message.");
      console.error("Send failed", err);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      const res = await apiClient.delete(`/chats/message/${id}`);
      if (res.status === 200) {
        setMessages((prevMessages) => {
          return prevMessages.filter((message) => message.id !== id); // filter/remove message if it's id matches deleted message's id
        });
      } else {
        toast.error("An error occured");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "An error occured");
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-white ${chatId ? "" : "hidden"}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        {/* Back button(for mobile) */}
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <h3 className="font-bold text-slate-800">{chatName}</h3>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-8 "
      >
        {isLoading && hasMore && (
          <p className="text-center text-xs text-slate-400">
            Loading history...
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            isMe={msg.userId === user?.userId}
            onDelete={() => handleDeleteMessage(msg.id)}
            {...msg}
          />
        ))}
      </div>
      {/* Input Area */}
      {chatId && (
        <div className="p-6">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#87CEEB]">
            <input
              className="flex-1 px-4 py-3 text-sm outline-none"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="m-1.5 w-10 h-10 bg-[#87CEEB] text-white rounded-xl flex items-center justify-center shadow-md"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
