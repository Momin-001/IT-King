import toast from "react-hot-toast";
import apiClient from "../api/apiClient";
import CreateTeamModal from "../components/CreateTeamModal";
import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface Team {
  id: number;
  name: string;
  description: string;
  membersCount: number;
  projectsCount: number;
}

export default function AllTeams() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext) as AuthContextType;
  const navigate = useNavigate();

  const fetchTeams = useCallback(async () => {
    try {
      const res = await apiClient.get("/team");
      setTeams(res.data.data);
    } catch (err) {
      toast.error("Failed to load teams.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (teamData: {
    name: string;
    description: string;
    teamLeadId: number;
  }) => {
    try {
      // Hitting backend
      await apiClient.post("/team", {
        name: teamData.name,
        description: teamData.description,
        teamLeadId: teamData.teamLeadId,
      });

      // Success Feedback
      toast.success("Team created successfully!");

      // Refresh the UI
      fetchTeams();
    } catch (err: any) {
      console.log(err);
      toast.error(err.response?.data?.message || "Failed to create team.");
    }
  };

  const handleDeleteTeam = async (id: number) => {
    try {
      const res = await apiClient.delete(`/team/${id}`);
      toast.success(res.data.message);

      // Refresh the list
      fetchTeams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not delete team.");
    }
  };

  return (
    <>
      <CreateTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateTeam}
      />
      <main className="flex-1 p-8 max-[768px]:px-0">
        {/* --- Content Header --- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Teams in Gulzar Soft</h1>
        </div>

        {user?.isAdmin ? (
          <div className="mb-8">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#94D9E2] hover:opacity-90 text-slate-800 font-semibold py-3 px-8 rounded-[100px] flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Create New Team</span>
            </button>
          </div>
        ) : (
          <p className="text-slate-500 pb-8">
            You can only see the teams that you are a member of.
          </p>
        )}

        {/* --- Teams Table --- */}
        {teams.length <= 0 ? (
          <p className="text-center">No Teams Created</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#94D9E2]">
                  <th className="py-4 px-6 text-sm font-semibold text-slate-800">
                    Name
                  </th>
                  <th className="py-4 px-6 text-sm font-semibold text-slate-800">
                    Description
                  </th>
                  <th className="py-4 px-6 text-center text-sm font-semibold text-slate-800">
                    Total Members
                  </th>
                  <th className="py-4 px-6 text-center text-sm font-semibold text-slate-800">
                    Total Projects
                  </th>
                  <th className="py-4 px-6 text-sm font-semibold text-slate-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-6 px-6 align-top">
                      <span className="font-medium">{team.name}</span>
                    </td>
                    <td className="py-6 px-6 align-top line-clamp-1">
                      <span className="font-medium">{team.description}</span>
                    </td>
                    <td className="py-6 px-6 align-top">
                      <div className="flex text-center justify-center -space-x-3">
                        {team.membersCount}
                      </div>
                    </td>
                    <td className="py-6 px-6 align-top justify-center text-center">
                      <span className="text-sm text-center justify-center">
                        {team.projectsCount}
                      </span>
                    </td>
                    <td className="py-6 px-6 align-top">
                      <div className="flex items-center space-x-6 text-sm font-medium">
                        <button
                          onClick={() => navigate(`/teams/${team.id}`)}
                          className={`flex items-center space-x-1 transition-colors hover:text-[#8bd4e7] cursor-pointer`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => navigate(`/teams/edit/${team.id}`)}
                          className={`flex items-center space-x-1 transition-colors hover:text-green-500 cursor-pointer ${user?.isAdmin ? "" : "hidden"}`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className={`flex items-center space-x-1 transition-colors  hover:text-red-500 cursor-pointer ${user?.isAdmin ? "" : "hidden"}`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
