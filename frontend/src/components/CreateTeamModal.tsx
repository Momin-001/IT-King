import React, { useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface users {
  id: number;
  name: string;
  email: string;
  ledTeam: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  //   users: users[]; // Passing available users to populate the Team Lead dropdown
  onCreate: (teamData: {
    name: string;
    description: string;
    teamLeadId: number;
  }) => void;
}

const CreateTeamModal = ({ isOpen, onClose, onCreate }: ModalProps) => {
  const [name, setName] = useState("");
  const [allUsers, setAllUsers] = useState<users[]>([]);
  const [description, setDescription] = useState("");
  const [teamLeadId, setTeamLeadId] = useState<number | "">("");
  const { user } = useContext(AuthContext) as AuthContextType;

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users/all/verified");
      const filteredUsers = res.data.users.filter(
        (user: users) => !user.ledTeam,
      ); //Getting only users who are not teamLeads. not done in backend to keep the api general
      setAllUsers(filteredUsers);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "An unexpected error occurred.",
      );
    }
  };

  useEffect(() => {
    if (isOpen && user && user?.isAdmin) {
      fetchUsers();
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamLeadId) return toast("Please select a Team Lead");

    onCreate({
      name,
      description,
      teamLeadId: Number(teamLeadId),
    });

    // Reset form and close modal
    setName("");
    setDescription("");
    setTeamLeadId("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={() => onClose()} // clicking outside modal closes it
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 font-sans max-[375px]:px-1"
    >
      <div
        onClick={(e) => e.stopPropagation()} // stop clicking inside modal from closing it
        className="bg-white w-full max-w-145 rounded-4xl shadow-2xl relative p-10 overflow-hidden max-[375px]:px-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex flex-col gap-8">
          <header>
            <h2 className="text-[28px] font-bold text-slate-900">
              Create New Team
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Organize your workforce by assigning a lead and a mission.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900 ml-1">
                Team Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 px-6 rounded-full border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] focus:border-transparent text-sm placeholder:text-slate-400 outline-none transition-all"
                placeholder="e.g. Morning Shift Alpha"
                type="text"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900 ml-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] focus:border-transparent text-sm placeholder:text-slate-400 outline-none transition-all resize-none h-28"
                placeholder="Briefly describe the team's responsibilities..."
                required
              />
            </div>

            {/* Team Lead Selector */}
            <div className="space-y-2 pb-2">
              <label className="block text-sm font-semibold text-slate-900 ml-1">
                Assign Team Lead
              </label>
              <div className="relative">
                <select
                  value={teamLeadId}
                  onChange={(e) =>
                    setTeamLeadId(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full h-14 px-6 rounded-full border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] focus:border-transparent text-sm text-slate-700 outline-none transition-all appearance-none bg-white cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    Select a Lead
                  </option>
                  {allUsers?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#A5DEE5] hover:brightness-95 text-slate-800 font-bold px-10 h-14 rounded-full transition-all text-sm shadow-sm active:scale-95 cursor-pointer"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;
