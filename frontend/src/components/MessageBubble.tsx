import { useContext, useEffect, useRef, useState } from "react";
import { getAvatarColor, getFirstLetters } from "./ChatListItem";
import {
  ProfileContext,
  type ProfileContextType,
} from "../context/ProfileContext";
import type { ChatMessage } from "../screens/Chats";

export interface MessageBubbleProps extends ChatMessage {
  isMe: boolean;
  onDelete: (id: number) => void;
}

export default function MessageBubble({
  id,
  sender,
  content,
  createdAt,
  isMe,
  onDelete,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatar, setAvatar] = useState("");
  const { profile } = useContext(ProfileContext) as ProfileContextType;

  useEffect(() => {
    let letters = "";
    if (sender) {
      letters = getFirstLetters(sender.name);
    } else if (profile) {
      // If we don't have the sender. This will mostly happen when sending a message
      letters = getFirstLetters(profile?.name);
    }
    setAvatar(letters);
  }, [getFirstLetters, sender, profile]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`flex items-start space-x-4 group relative ${
        isMe ? "flex-row-reverse space-x-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${
          isMe ? "bg-amber-400 text-white" : "bg-sky-100 text-sky-800"
        }`}
        style={{ backgroundColor: getAvatarColor(sender?.name) }}
      >
        {avatar}
      </div>

      {/* Content Area */}
      <div className={`flex-1 relative ${isMe ? "text-right" : ""}`}>
        <p className="text-xs font-bold text-slate-800">
          {sender?.name || profile?.name}
        </p>

        <div className="relative inline-block group/bubble">
          {/* The Message Bubble */}
          <div
            className={`flex mt-1 px-4 py-2 rounded-2xl text-sm relative ${
              isMe
                ? "bg-[#87CEEB]/10 text-slate-800 rounded-tr-none"
                : "bg-slate-100 text-slate-800 rounded-tl-none"
            }`}
          >
            <p>{content}</p>
            <p className="text-slate-400 text-xs pl-1 flex flex-col justify-end">
              {new Date(createdAt).toLocaleTimeString("en-GB", {
                timeStyle: "short",
              })}
            </p>
          </div>

          {/* Arrow Button (shown on hover) */}
          <button
            onClick={() => setShowMenu((showMenu) => !showMenu)}
            onMouseDown={(e) => e.stopPropagation()} // stop parent from hiding the menu so the element itself can hide it. This prevents UI bugs
            className={`absolute top-1 right-0 ${isMe || profile?.isAdmin ? "" : "hidden"} 
              opacity-0 group-hover:opacity-100 transition-all duration-200
              w-6 h-6 rounded-full bg-transparent
              flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md z-10`}
          >
            <span className="material-symbols-outlined text-sm">
              keyboard_arrow_up
            </span>
          </button>

          {/* Menu(for message deletion) */}
          {showMenu && (
            <div
              ref={menuRef}
              className={`absolute bottom-full mb-2 ${
                isMe ? "left-0" : "right-0"
              } min-w-25 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in slide-in-from-bottom-2`}
            >
              <button
                onClick={() => {
                  onDelete(id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  delete
                </span>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        <div className="clear-both"></div>
      </div>
    </div>
  );
}
