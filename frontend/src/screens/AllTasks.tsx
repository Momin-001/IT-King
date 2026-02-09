import { useEffect, useState, useCallback, useContext } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import TaskRow from "../components/TaskRow";

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  project: {
    name: string;
    teams: { name: string }[];
  };
  user: {
    name: string;
    email: string;
  };
}
interface Project {
  id: number;
  name: string;
}
interface User {
  id: number;
  name: string;
  email: string;
}

export default function AllTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [ledTeamId, setLedTeamId] = useState(""); // This will tell whether or not the user is a teamLead
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useContext(AuthContext) as AuthContextType;
  const navigate = useNavigate();

  // Filter States
  const [filters, setFilters] = useState({
    projectId: searchParams.get("projectId") || "",
    teamId: searchParams.get("teamId") || "",
    userId: searchParams.get("userId") || "", // Only usable by Admins/Leads
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await apiClient.get("/project");
        setProjects(projRes.data.data);

        const ledTeamRes = await apiClient.get(
          `/users/${user?.userId}/led-team`, // finding out if the user is a teamLead
        );
        setLedTeamId(ledTeamRes.data.teamId);

        if (user?.isAdmin) {
          const userRes = await apiClient.get("/users/all/verified");
          setUsers(userRes.data.users);
        }
      } catch (error) {
        toast.error("Failed to load projects");
      }
    };
    fetchData();
  }, []);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query string from active filters
      const params = new URLSearchParams();
      if (filters.projectId) params.append("projectId", filters.projectId);
      if (filters.teamId) params.append("teamId", filters.teamId);
      if (filters.userId) params.append("userId", filters.userId);

      const taskRes = await apiClient.get(`/tasks?${params.toString()}`);
      setTasks(taskRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch tasks everytime a filter is changed
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Toggle Task Completion
  const toggleTask = async (id: number, currentStatus: boolean) => {
    try {
      console.log("MArked task as:", !currentStatus);
      
      await apiClient.patch(`/tasks/${id}/status`, {
        completed: !currentStatus,
      });
      setTasks((prev) =>
        prev.map(
          (t) => (t.id === id ? { ...t, completed: !currentStatus } : t), // finding and replacing
        ),
      );
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.projectId) params.set("projectId", newFilters.projectId);
    if (newFilters.teamId) params.set("teamId", newFilters.teamId);
    if (newFilters.userId) params.set("userId", newFilters.userId);

    setSearchParams(params);
  };

  async function handleTaskDeletion(id: number) {
    try {
      const res = await apiClient.delete(`/tasks/${id}`);
      if (res.status === 200) {
        setTasks(tasks.filter((task) => task.id !== id)); // remove deleted task from UI
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load tasks");
    }
  }

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 py-6 overflow-y-auto flex-1 max-[425px]:px-1">
          <div className="mb-8 flex justify-between items-end max-[768px]:flex-col">
            <div>
              <h2 className="text-[28px] font-bold">Assigned Tasks</h2>
              <p className="py-4 text-slate-500">
                Unless you are a Team Lead, you may only see tasks assigned to
                you.
              </p>
            </div>

            {/* Filter */}
            <div className="flex gap-3 ">
              <select
                className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#A5DEE5]"
                value={filters.projectId}
                onChange={(e) =>
                  handleFilterChange("projectId", e.target.value)
                }
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                className={`bg-white border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#A5DEE5] ${user?.isAdmin ? "" : "hidden"}`}
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigate("/tasks/create")}
                className={`bg-[#A5DEE5] text-slate-800 font-bold px-6 py-2 rounded-full text-sm hover:brightness-95 transition-all ${ledTeamId || user?.isAdmin ? "" : "hidden"}`}
              >
                Add Task
              </button>
            </div>
          </div>

          <div className="bg-white rounded-4xl shadow-sm overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-20 text-center text-slate-400">
                  Loading tasks...
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm font-semibold text-black uppercase tracking-wider border-b border-slate-50 bg-[#94D9E2]">
                      <th className="px-8 py-5 w-20">Status</th>
                      <th className="px-6 py-5">Task Title</th>
                      <th className="px-6 py-5">Assigned To</th>
                      <th className="px-6 py-5">Project</th>
                      {(ledTeamId || user?.isAdmin) && (
                        <th className="px-8 py-5 w-20 text-right">Actions</th> // only show actions if team lead or admin
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id, task.completed)}
                        ledTeamId={ledTeamId}
                        isAdmin={user?.isAdmin}
                        onDelete={handleTaskDeletion}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
