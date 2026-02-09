import { useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import toast from "react-hot-toast";
import { DangerZone } from "../components/DangerZoneSettings";
import { Account } from "../components/AccountSettings";

export interface Users {
  id: number;
  name: string;
  email: string;
  ledTeam: number;
}

export default function Settings() {
  const tabs = ["Account", "Danger Zone"];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const { user, logout } = useContext(AuthContext) as AuthContextType;

  // Danger Zone: START
  const [users, setUsers] = useState<Users[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | undefined>();

  async function fetchUsers() {
    try {
      const res = await apiClient.get("/users/all/verified", {
        params: {
          unAssigned: true,
        },
      });
      setUsers(res.data.users);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "An error occurred");
    }
  }

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchUsers();
    }
  }, [user]);

  const handleTransferOwnership = async (id: number | undefined) => {
    try {
      // Validation
      if (!id) {
        toast.error("Select a user first.");
        return;
      }

      const res = await apiClient.patch("/users/transfer-ownership", {
        newAdminId: id,
      });
      if (res.status === 200) {
        toast.success(
          res.data?.message || "Transfer successful. Please login again",
        );
        logout();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "An error occurred");
    }
  };
  // Danger Zone: END

  const handleChangeTab = (tabName: string) => {
    setSelectedTab(tabName);
  };

  useEffect(() => console.log("Selected User: ", selectedUser), [selectedUser]);

  return (
    <>
      <main className="ml-20 p-8 max-[768px]:p-1 max-[768px]:ml-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleChangeTab(tab)}
              className={`px-6 py-2 rounded-full border border-slate-200 text-sm font-medium transition-colors cursor-pointer ${selectedTab === tab ? "bg-[#90D5E0] text-slate-800 hover:bg-[#90D5E0]/70" : "hover:bg-[#90D5E0]/10"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Card */}
        {selectedTab === "Account" && <Account />}
        {selectedTab === "Danger Zone" && (
          <DangerZone
            users={users}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            handleTransferOwnership={handleTransferOwnership}
          />
        )}
      </main>
    </>
  );
}
