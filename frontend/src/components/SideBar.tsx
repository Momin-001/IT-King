import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import logo from "../assets/gulzarsoft-logo.webp";

export default function SideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useContext(AuthContext) as AuthContextType;

  const handleLogout = async () => {
    window.dispatchEvent(new Event("logout"));
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile blurred bg */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50 
        w-20 flex flex-col items-center justify-between py-6
        bg-white md:bg-transparent transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        border-r md:border-none border-slate-100
      `}
      >
        {/* Hub Icon (Logo + Toggle) */}
        <div
          onClick={toggleSidebar}
          className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-100 cursor-pointer hover:scale-105 transition-transform active:scale-95"
        >
          <span
            className="flex-1 h-full transition-transform duration-100"
            style={{
              backgroundImage: `url(${logo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: isOpen ? `rotate(0deg)` : `rotate(180deg)`,
            }}
          ></span>
          {/* <span className="material-symbols-outlined text-primary text-3xl font-bold">
            hub
          </span> */}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-4 bg-slate-50/50 md:bg-pill-bg py-6 px-3 rounded-full border border-slate-100">
          <SidebarIcon
            title="Dashboard"
            icon="dashboard"
            link="/dashboard"
            onClick={() => setIsOpen(false)}
          />
          <SidebarIcon
            title="Users"
            icon="people"
            link="/users"
            hidden={!user?.isAdmin} // Only admin can see all users
            onClick={() => setIsOpen(false)}
          />
          <SidebarIcon
            title="Teams"
            icon="groups"
            link="/teams"
            onClick={() => setIsOpen(false)}
          />
          <SidebarIcon
            title="Projects"
            icon="assignment"
            link="/projects"
            onClick={() => setIsOpen(false)}
          />
          <SidebarIcon
            title="Tasks"
            icon="task_alt"
            link="/tasks"
            onClick={() => setIsOpen(false)}
          />
          <SidebarIcon
            title="Chats"
            icon="chat"
            link="/chats"
            onClick={() => setIsOpen(false)}
          />
          <SidebarIcon
            title="Settings"
            icon="settings"
            link="/settings"
            onClick={() => setIsOpen(false)}
          />
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 flex items-center justify-center bg-white text-red-500 rounded-full shadow-md border border-red-50 hover:bg-red-50 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
        </button>
      </aside>

      {/* Floating Trigger (Mobile) */}
      {!isOpen && (
        <div className="fixed top-6 left-4 md:hidden z-30">
          <button
            onClick={toggleSidebar}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100"
          >
            <span
              className="flex-1 h-full transition-transform duration-100"
              style={{
                backgroundImage: `url(${logo})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: isOpen ? `rotate(0deg)` : `rotate(180deg)`,
              }}
            ></span>
          </button>
        </div>
      )}
    </>
  );
}

function SidebarIcon({
  title = "",
  icon = "",
  link = "",
  hidden = false,
  onClick = () => {},
}) {
  return (
    <NavLink
      to={link}
      onClick={onClick}
      className={({ isActive }) =>
        `group w-12 h-12 rounded-full hover:text-black hover:bg-[#8bd4e7]/50 flex items-center justify-center transition-colors ${
          isActive
            ? "bg-[#8bd4e7] shadow-lg text-black shadow-primary/30"
            : "text-slate-400 hover:text-primary"
        } ${hidden ? "hidden" : ""}`
      }
    >
      <span title={title} className="material-symbols-outlined text-2xl">
        {icon}
      </span>
    </NavLink>
  );
}
