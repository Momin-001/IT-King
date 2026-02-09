import { useMemo } from "react";

export interface ChatListItemProps {
  name: string;
  unread: number;
  active?: boolean; // defaults to false
  lastMessage?: string; // snippet to show on sidebar
  onClick: () => void;
}

export const getFirstLetters = (name: string) => {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0][0].toUpperCase();
};

export const getAvatarColor = (name: string) => {
  const letters = getFirstLetters(name);
  const first = letters.charCodeAt(0) || 65;
  const second = letters.charCodeAt(1) || first;
  const hue = (first * 7 + second * 11) % 360;
  return `hsl(${hue}, 70%, 58%)`;
};

export default function ChatListItem({
  name = "",
  unread,
  active = false,
  lastMessage,
  onClick,
}: ChatListItemProps) {
  // useMemo means we only calculate the color when the name changes
  const bgColor = useMemo(() => getAvatarColor(name), [name]);
  const initials = useMemo(() => getFirstLetters(name), [name]);

  return (
    <div
      onClick={onClick} // Selecting a Chat
      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
        active
          ? "bg-[#87CEEB] border-[#87CEEB] shadow-md scale-[1.02]"
          : "bg-white border-slate-100 hover:shadow-sm hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-white shadow-sm"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>

        <div className="flex flex-col overflow-hidden text-left">
          <span
            className={`text-sm font-bold truncate ${active ? "text-white" : "text-slate-800"}`}
          >
            {name}
          </span>
          {lastMessage && (
            <span
              className={`text-[11px] truncate ${active ? "text-sky-50" : "text-slate-400"}`}
            >
              {lastMessage}
            </span>
          )}
        </div>
      </div>

      {!!unread && unread > 0 && !active && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          {unread}
        </span>
      )}
    </div>
  );
}
