import { useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface Team {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  startDate: string; // ISO string from backend
  dueDate: string; // ISO string from backend
  teams: Team[];
  _count?: {
    tasks: number;
  };
}

export default function AllProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const { user } = useContext(AuthContext) as AuthContextType;

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/project");
      setProjects(res.data.data);
    } catch (err) {
      toast.error("Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch teams when creating new project
  useEffect(() => {
    const fetchTeams = async () => {
      const res = await apiClient.get("/team");
      setAllTeams(res.data.data);
    };
    if (isModalOpen && user?.isAdmin) {
      //Only run when opening modal. (admin only)
      fetchTeams();
    }
  }, [isModalOpen, user]);

  const handleCreateProject = async (data: any) => {
    try {
      await apiClient.post("/project", data);
      await fetchProjects(); // Refresh your grid
      toast.success("Project created!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <>
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableTeams={allTeams}
        onCreate={handleCreateProject}
      />
      <main className="ml-24 p-4 lg:p-8 max-[425px]:ml-1">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Projects</h1>
        </div>

        {user?.isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#90D5E0] hover:bg-[#7bc0cb] text-slate-800 font-bold py-3.5 px-8 rounded-full flex items-center gap-2 mb-10 transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Create Project
          </button>
        ) : (
          <p className="pb-8 text-slate-500">You can only view the projects that you are a part of</p>
        )}

        {isLoading ? (
          <div className="p-20 text-center text-slate-400">
            Loading your projects...
          </div>
        ) : projects?.length === 0 ? (
          <p className="text-center">No Projects yet</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
