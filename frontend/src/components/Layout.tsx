import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import { useContext, useEffect } from "react";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, user } = useContext(AuthContext) as AuthContextType;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login");
      }
    }
  }, [location.pathname, user, isLoading]);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex h-screen p-6 gap-8 max-[375px]:px-1">
        <SideBar />
        <main className="flex-1 flex flex-col gap-8 overflow-y-auto pt-2">
          <AdminHeader />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
