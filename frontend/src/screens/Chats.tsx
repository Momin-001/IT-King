import { useState, useEffect, useContext, useRef } from "react";
import ActiveChatArea from "../components/ActiveChatArea";
import ChatListItem from "../components/ChatListItem";
import apiClient from "../api/apiClient";
import { useSearchParams } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import { type Socket } from "socket.io-client";
import { getSocket } from "../config/socket";

export interface MessageSender {
  id: number;
  name: string;
}
export interface ChatMessage {
  id: number;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  chatId: number;
  userId: number;
  sender: MessageSender;
}
export interface ChatListItemData {
  chatId: number;
  teamName: string;
  unreadCount: number;
  lastMessageSnippet: string;
}
export interface GetChatMessagesResponse {
  status: string;
  data: ChatMessage[];
}
export interface GetChatsResponse {
  status: string;
  data: ChatListItemData[];
}

export default function Chats() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [selectedChatName, setSelectedChatName] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext) as AuthContextType;
  const socket = useRef<Socket | null>(null);

  // Fetch the Chat List for the Sidebar
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const res = await apiClient.get<GetChatsResponse>("/chats");
        setChats(res.data.data);

        // opening the selected chat
        if (res.data.data.length > 0 && !selectedChatId) {
          const paramChatId = searchParams.get("chatId");
          if (paramChatId !== null) {
            setSelectedChatId(parseInt(paramChatId));
          }
        }
      } catch (err) {
        console.error("Failed to load sidebar chats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  // Setting up socket on mount
  useEffect(() => {
    if (user?.userId && !socket.current?.connected) {
      socket.current = getSocket({
        url: "http://localhost:3000",
        userId: user.userId,
      });
    }

    const handleNewMessage = (newMessage: ChatMessage) => {
      console.log("Message received: ", newMessage);

      setChats((prevChats) =>
        prevChats.map((chat) => {
          return chat.chatId === newMessage.chatId
            ? {
                ...chat,
                unreadCount:
                  newMessage.chatId !== selectedChatId // only change unread count if chat not opened
                    ? chat.unreadCount + 1
                    : chat.unreadCount,
                lastMessageSnippet: newMessage.content,
              }
            : chat;
        }),
      );
    };

    const handleDeleteMessage = async ({ chatId, messageId }: any) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.chatId === chatId
            ? {
                ...chat,
                lastMessageSnippet:
                  chat.lastMessageId === messageId
                    ? "[Last message was deleted]"
                    : chat.lastMessageSnippet,
              }
            : chat,
        ),
      );
    };

    socket.current?.on("receive-message", handleNewMessage);
    socket.current?.on("message-deleted", handleDeleteMessage);

    return () => {
      socket.current?.off("receive-message", handleNewMessage);
      socket.current?.off("message-deleted", handleDeleteMessage);
    };
  }, [user?.userId, socket.current, selectedChatId]);

  // everytime a chat is selected, put it in searchParams and set chat name
  useEffect(() => {
    if (selectedChatId) {
      setSelectedChatName(
        chats.find((chat) => chat.chatId === selectedChatId)?.teamName,
      );
      setSearchParams({ chatId: selectedChatId.toString() }); // Setting the selectedChatId in searchparam so it persists across refresh
    }
  }, [selectedChatId]);

  const handleChatSelect = async (chatId: number) => {
    setSelectedChatId(chatId);

    // clear the unread count
    setChats((prevChats) =>
      prevChats.map(
        (chat) => (chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat), // only clear the unread count of selected chat, else do nothing
      ),
    );
  };

  const changeLastMessage = (chatId: number, snippet: string) => {
    // will be called when sending a new message
    setChats((prevChats) =>
      prevChats.map((chat) => {
        return chat.chatId === chatId
          ? {
              ...chat,
              lastMessageSnippet: snippet,
            }
          : chat;
      }),
    );
  };

  return (
    <main className="flex-1 p-8 flex flex-col overflow-hidden max-[768px]:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Chat</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-1">
        {/* List of all chats(Sidebar) */}
        <div
          className={`w-72 border-r border-slate-100 bg-slate-100/60 p-4 overflow-y-auto custom-scrollbar ${selectedChatId ? "max-md:hidden" : "max-md:block max-md:w-full"}`}
        >
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-slate-400 text-sm p-4">Loading teams...</p>
            ) : (
              chats.map((chat) => (
                <ChatListItem
                  key={chat.chatId}
                  name={chat.teamName}
                  unread={chat.unreadCount}
                  active={selectedChatId === chat.chatId}
                  lastMessage={chat.lastMessageSnippet}
                  onClick={() => handleChatSelect(chat.chatId)}
                />
              ))
            )}
          </div>
        </div>

        {/* Active Chat Area */}
        {selectedChatId ? (
          <ActiveChatArea
            chatName={selectedChatName}
            chatId={selectedChatId}
            socket={socket.current}
            onBack={() => setSelectedChatId(null)}
            changeLastMessage={changeLastMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white text-slate-400 max-md:hidden">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl mb-2">
                chat_bubble
              </span>
              <p>Select a team to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
