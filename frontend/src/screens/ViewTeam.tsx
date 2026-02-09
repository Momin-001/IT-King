import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Project {
  id: number;
  name: string;
  isComplete: boolean;
}

interface TeamData {
  id: number;
  name: string;
  description?: string;
  TeamLead: User;
  users: User[];
  projects: Project[];
}

export default function ViewTeam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext) as AuthContextType;

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await apiClient.get(`/team/${id}`);
        setTeam(res.data.data);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Failed to load team details",
        );
        navigate("/teams"); // Redirect back if team not found
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchTeam();
  }, [id, navigate]);

  if (isLoading)
    return (
      <div className="p-20 text-center font-bold">Loading Team Details...</div>
    );
  if (!team) return null;

  return (
    <>
      <main className="flex-1 ml-2 p-2">
        {/* Back Button & Title */}
        <div className="mb-8 flex flex-col items-start gap-4">
          <button
            onClick={() => navigate("/teams")}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
            <span className="font-medium">Back to Teams</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-1">{team.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* General Info */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">General Info</h2>
                <button
                  onClick={() => navigate(`/teams/edit/${id}`)}
                  className={`text-[#8bd4e7] group font-medium flex items-center space-x-1 cursor-pointer ${user?.isAdmin ? "" : "hidden"}`}
                >
                  <span className="material-symbols-outlined hover:no-underline! text-sm">
                    edit
                  </span>
                  <span className="group-hover:underline">Edit</span>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1">
                    Team Name
                  </label>
                  <p className="text-lg font-medium text-slate-900">
                    {team.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1">
                    Description
                  </label>
                  <p className="text-slate-600 leading-relaxed">
                    {team.description ||
                      "No description provided for this team."}
                  </p>
                </div>
              </div>
            </section>

            {/* Assigned Projects */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6">Assigned Projects</h2>
              {team.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="w-10 h-10 bg-[#A5DEE5]/20 rounded-lg flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-[#76c7d2] text-xl">
                          assignment
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-400 font-medium uppercase">
                          {project.isComplete
                            ? "Project Completed"
                            : "Active Project"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">
                  No projects assigned to this team yet.
                </p>
              )}
            </section>
          </div>

          {/* Members Sidebar */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Team Members</h2>
                <span className="bg-[#A5DEE5]/20 text-slate-800 px-3 py-1 rounded-full text-xs font-bold">
                  {team.users.length} Total
                </span>
              </div>

              <div className="space-y-4">
                {/* Always show Team Lead at the top */}
                <MemberRow user={team.TeamLead} isLead={true} />

                {/* Show other members (excluding the lead to avoid duplicates) */}
                {team.users
                  .filter((u) => u.id !== team.TeamLead.id)
                  .map((member) => (
                    <MemberRow key={member.id} user={member} />
                  ))}
              </div>

              <button
                onClick={() => navigate(`/teams/edit/${team.id}`)}
                className={`w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-[#A5DEE5] hover:border-[#A5DEE5] transition-all text-sm font-medium flex items-center justify-center space-x-2 cursor-pointer ${user?.isAdmin ? "" : "hidden"}`}
              >
                <span className="material-symbols-outlined text-lg">
                  person_add
                </span>
                <span>Manage Members</span>
              </button>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

const MemberRow = ({
  user,
  isLead = false,
}: {
  user: User;
  isLead?: boolean;
}) => (
  <div className="flex items-center space-x-4 p-2 hover:bg-slate-50 rounded-xl transition-colors group">
    <div className="relative">
      <img
        alt={user.name}
        className={`w-10 h-10 rounded-full border-2 ${isLead ? "border-[#A5DEE5]" : "border-white"} shadow-sm`}
        src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
      />
      {isLead && (
        <span className="absolute -top-1 -right-1 bg-[#A5DEE5] text-[8px] px-1 rounded-full border border-white">
          LEAD
        </span>
      )}
    </div>
    <div className="overflow-hidden">
      <p className="text-sm font-semibold truncate">{user.name}</p>
      <p className="text-xs text-slate-400 truncate">{user.email}</p>
    </div>
  </div>
);
