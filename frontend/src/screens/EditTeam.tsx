import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
}

interface TeamData {
  id: number;
  name: string;
  description: string;
  teamLeadId: number;
  users: User[];
}

export default function EditTeam() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamLeadId, setTeamLeadId] = useState<number | "">("");
  const [members, setMembers] = useState<User[]>([]);
  const [unselectedMembers, setUnselectedMembers] = useState<User[]>([]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useContext(AuthContext) as AuthContextType;

  // If user is not admin, go back
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate(-1);
    }
  }, [user]);

  // Load Team and Users data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamRes, usersRes] = await Promise.all([
          apiClient.get(`/team/${id}`),
          apiClient.get("/users/all"),
        ]);

        const team: TeamData = teamRes.data.data;
        setName(team.name);
        setDescription(team.description || "");
        setTeamLeadId(team.teamLeadId);
        setMembers(team.users || []);

        setAllUsers(usersRes.data.data.verified || usersRes.data.data || []);
      } catch (err) {
        toast.error("Failed to load team details");
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.isAdmin) {
      // only load data if user is admin
      loadData();
    }
  }, [id, user]);

  useEffect(() => {
    //Filter members so user can only select to add members that are not already in the team
    if (allUsers && members) {
      const memberIds = new Set(members.map((m) => m.id)); // direct comparison between allUsers and members would have caused problems bcz JS would've compared reference

      setUnselectedMembers(allUsers.filter((user) => !memberIds.has(user.id)));

      console.log("initial Member: ", members);
      console.log("initial Users: ", allUsers);
      console.log(
        "initial unselected users: ",
        allUsers.filter((user) => !members.includes(user)),
      );
    }
  }, [allUsers, members]);

  const handleRemoveMember = (userId: number) => {
    if (userId === teamLeadId) {
      // If removed user is teamLead
      toast.error("Change Team Lead before removing");
    } else if (user?.isAdmin && user.userId === userId) {
      toast.error("Admin can not be removed.");
    } else {
      setMembers(members.filter((m) => m.id !== userId) || []);
    }
  };

  const handleAddMember = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const userToAdd = allUsers.find((u) => u.id === selectedId);

    if (userToAdd && !members.some((m) => m.id === selectedId)) {
      // If user exists and not already in members
      setMembers([...members, userToAdd]);
    }
  };

  const handleSetTeamLead = async (
    e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>,
  ) => {
    if (!members.some((member) => member.id === Number(e.target.value))) {
      //If new Team Lead is not a member of team, add to team
      const user = allUsers.find((user) => user.id === Number(e.target.value));
      if (!user) return; //If somehow user to be added does not exist at all(TS Problem)

      setMembers([...members, user]);
    }
    setTeamLeadId(Number(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Dynamic update object
    const updateData: any = {
      memberIds: members.map((m) => m.id),
    };
    // Add optional fields only if they have values
    if (name?.trim()) updateData.name = name.trim();
    if (description?.trim()) updateData.description = description.trim();
    if (teamLeadId) updateData.teamLeadId = Number(teamLeadId);

    try {
      await apiClient.patch(`/team/${id}`, updateData);
      toast.success("Team updated successfully!");
      navigate("/teams");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
      console.log("error: ", err.response?.data);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 py-6 overflow-y-auto flex-1">
          <div className="max-w-200 mx-auto">
            <div className="bg-white rounded-4xl shadow-sm p-10 border border-slate-100">
              <h2 className="text-[28px] font-bold mb-8">Edit Team: {name}</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold ml-1">
                    Team Name
                  </label>
                  <input
                    className="w-full h-14 px-6 rounded-full border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] outline-none transition-all"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold ml-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-6 py-4 rounded-3xl border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] outline-none h-32 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold ml-1">
                    Members
                  </label>
                  <div className="min-h-14 w-full px-4 py-2 rounded-[28px] border border-slate-300 flex flex-wrap items-center gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium border border-slate-200"
                      >
                        <span>{member.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                    <select
                      onChange={handleAddMember}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-w-30 outline-none appearance-none cursor-pointer"
                      value=""
                    >
                      <option value="" disabled>
                        + Add member...
                      </option>
                      {unselectedMembers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Team Lead */}
                <div className="space-y-2 pb-2">
                  <label className="block text-sm font-semibold ml-1">
                    Team Lead
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-14 px-6 rounded-full border border-slate-300 appearance-none bg-white focus:ring-2 focus:ring-[#A5DEE5] outline-none"
                      value={teamLeadId}
                      onChange={(e) => handleSetTeamLead(e)}
                    >
                      {allUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex justify-start pt-4">
                  <button
                    disabled={isSaving}
                    className="bg-[#A5DEE5] hover:brightness-95 text-slate-800 font-bold px-12 h-14 rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    type="submit"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
