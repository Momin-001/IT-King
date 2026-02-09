import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface Team {
  id: number;
  name: string;
  _count?: { users: number };
}

interface ProjectData {
  id: number;
  name: string;
  description: string;
  isComplete: boolean;
  startDate: string;
  dueDate: string;
  teams: Team[];
}

export default function ProjectDetails() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState(false); // `status` means `isCompleted`
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) as AuthContextType;

  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        const res = await apiClient.get(`/project/${id}`);
        setProject(res.data.data);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load project");
        navigate("/projects");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchProjectDetails();
  }, [id, navigate]);

  if (isLoading)
    return (
      <div className="p-20 text-center font-bold text-slate-400">
        Loading Project Details...
      </div>
    );
  if (!project) return null;

  const handleToggleStatus = async () => {
    if (!project) return;

    setIsStatusLoading(true);
    const nextStatus = !project.isComplete;

    try {
      await apiClient.patch(`/project/${id}/status`, {
        isComplete: nextStatus,
      });

      // Update local state
      setProject({ ...project, isComplete: nextStatus });
      toast.success(`Project marked as ${nextStatus ? "complete" : "active"}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setIsStatusLoading(false);
    }
  };

  return (
    <>
      <main className="ml-0 p-8 lg:p-12 max-[375px]:px-0">
        <div className="mb-10">
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#90D5E0] transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
            Back to Projects
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-3">
                Project Details: {project.name}
              </h1>
            </div>
            <div className={`flex gap-3 ${user?.isAdmin ? "" : "hidden"}`}>
              <button
                onClick={() => navigate(`/projects/edit/${id}`)}
                className="bg-white border border-slate-200 rounded-full px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit Project
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isStatusLoading}
                className={`font-bold py-2.5 px-6 rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                  project.isComplete
                    ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    : "bg-[#A5DEE5] text-slate-800 hover:bg-[#90D5E0]"
                } ${isStatusLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="material-symbols-outlined text-lg">
                  {project.isComplete
                    ? "settings_backup_restore"
                    : "check_circle"}
                </span>
                {isStatusLoading
                  ? "Processing..."
                  : project.isComplete
                    ? "Reopen Project"
                    : "Mark as Complete"}
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2">
            <section className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#90D5E0]">
                    info
                  </span>
                  General Info
                </h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                  {project?.isComplete ? "Complete" : "In Progress"}
                </span>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Project Title
                  </label>
                  <p className="text-xl font-bold text-slate-800">
                    {project.name}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Description
                  </label>
                  <p className="text-slate-600 leading-relaxed">
                    {project.description ||
                      "No description provided for this project."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DateCard
                    label="Start Date"
                    date={project.startDate}
                    icon="calendar_today"
                  />
                  <DateCard
                    label="Due Date"
                    date={project.dueDate}
                    icon="event_available"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Teams Sidebar */}
          <div className="lg:col-span-1">
            <section className="bg-white border border-slate-200 rounded-2xl p-8 sticky top-8 shadow-sm">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#90D5E0]">
                  diversity_3
                </span>
                Assigned Teams
              </h2>

              <div className="space-y-4">
                {project?.teams?.length <= 0 ? ( // If not teams, show just text
                  <p className="text-slate-500 text-center">No teams assigned yet.</p>
                ) : (
                  project?.teams?.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

/* --- Helper Components --- */

const DateCard = ({
  label,
  date,
  icon,
}: {
  label: string;
  date: string;
  icon: string;
}) => (
  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
      {label}
    </label>
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-slate-400">{icon}</span>
      <span className="text-lg font-bold text-slate-800">
        {new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })}
      </span>
    </div>
  </div>
);

const TeamCard = ({ team }: { team: Team }) => (
  <Link
    to={`/teams/${team.id}`}
    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#90D5E0] transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#A5DEE5]/20 flex items-center justify-center text-[#90D5E0] group-hover:bg-[#A5DEE5] group-hover:text-slate-800 transition-colors">
        <span className="material-symbols-outlined">groups</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-slate-800">{team.name}</span>
        <span className="text-[11px] text-slate-400 font-medium">
          Team Member Access
        </span>
      </div>
    </div>
    <span className="material-symbols-outlined text-slate-300">
      chevron_right
    </span>
  </Link>
);
