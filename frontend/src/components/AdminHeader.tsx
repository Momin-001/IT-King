import { useContext } from "react";
import {
  ProfileContext,
  type ProfileContextType,
} from "../context/ProfileContext";

export default function AdminHeader() {
  const { profile } = useContext(ProfileContext) as ProfileContextType;
  return (
    <header className="flex justify-end">
      <div className="flex self-end items-center gap-4">
        <div className="flex items-center gap-3 bg-white py-1.5 pl-1.5 pr-4 rounded-full shadow-sm border border-slate-100 cursor-pointer">
          <div className="flex flex-col px-4">
            <span className="text-sm font-bold leading-none">
              {profile?.name}
            </span>
            <span className="text-[10px] text-slate-400">{profile?.email}</span>
          </div>
          {/* <span className="material-symbols-outlined text-slate-400">
            expand_more
          </span> */}
        </div>
      </div>
    </header>
  );
}
