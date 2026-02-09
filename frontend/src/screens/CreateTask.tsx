// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import apiClient from "../api/apiClient";
// import toast from "react-hot-toast";

// interface Project {
//   id: number;
//   name: string;
// }

// interface User {
//   id: number;
//   name: string;
//   email: string;
// }

// export default function CreateTask() {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);

//   // Form State
//   const [projectId, setProjectId] = useState<string>("");
//   const [title, setTitle] = useState<string>("");
//   const [userId, setUserId] = useState<string>("");

//   // Data State
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Fetch Projects on mount
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const projRes = await apiClient.get("/project");
//         setProjects(projRes.data.data);
//       } catch (error) {
//         toast.error("Failed to load projects");
//       }
//     };
//     fetchData();
//   }, []);

//   // Fetch users based on selected project
//   useEffect(() => {
//     const fetchEligibleUsers = async () => {
//       if (!projectId) {
//         setUsers([]); // Clear users if project is deselected
//         return;
//       }

//       setIsLoading(true);
//       try {
//         const res = await apiClient.get(
//           `/users/all/verified?projectId=${projectId}`,
//         );
//         setUsers(res.data.users);
//         setUserId(""); // Reset selected user when project changes
//       } catch (error) {
//         toast.error("Failed to load eligible team members");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchEligibleUsers();
//   }, [projectId]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!projectId || !title || !userId) {
//       return toast.error("Please fill in all fields");
//     }

//     setIsSubmitting(true);
//     try {
//       await apiClient.post("/tasks", {
//         projectId: parseInt(projectId),
//         title,
//         userId: parseInt(userId),
//       });
//       toast.success("Task created successfully!");
//       navigate("/tasks");
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to create task");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <main className="flex-1 flex flex-col overflow-hidden">
//         {/* Form Area */}
//         <div className="px-10 py-6 overflow-y-auto flex-1">
//           <div className="mb-8">
//             <h2 className="text-[28px] font-bold">Create Task</h2>
//           </div>

//           <div className="max-w-3xl">
//             <div className="bg-white rounded-4xl shadow-sm p-10 border border-slate-100">
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* Project Selection */}
//                 <div className="space-y-2">
//                   <label className="block text-sm font-semibold text-slate-700 ml-1">
//                     Select Project
//                   </label>
//                   <select
//                     value={projectId}
//                     onChange={(e) => setProjectId(e.target.value)}
//                     className="w-full h-14 bg-slate-50 border border-slate-200 rounded-full px-6 focus:ring-2 focus:ring-[#A5DEE5]/50 outline-none text-slate-600 appearance-none cursor-pointer"
//                   >
//                     <option value="">-Select Project-</option>
//                     {projects.map((p) => (
//                       <option key={p.id} value={p.id}>
//                         {p.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Title */}
//                 <div className="space-y-2">
//                   <label className="block text-sm font-semibold text-slate-700 ml-1">
//                     Task Name
//                   </label>
//                   <input
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     className="w-full h-14 bg-slate-50 border border-slate-200 rounded-full px-6 focus:ring-2 focus:ring-[#A5DEE5]/50 placeholder:text-slate-400 outline-none"
//                     placeholder="Enter Task Name"
//                     type="text"
//                   />
//                 </div>

//                 {/* Assignee Selection */}
//                 <div className="space-y-2">
//                   <label className="block text-sm font-semibold text-slate-700 ml-1">
//                     Assignee
//                   </label>
//                   <select
//                     value={userId}
//                     onChange={(e) => setUserId(e.target.value)}
//                     className="w-full h-14 bg-slate-50 border border-slate-200 rounded-full px-6 focus:ring-2 focus:ring-[#A5DEE5]/50 outline-none text-slate-600 appearance-none cursor-pointer"
//                   >
//                     <option value="">-Select Assignee-</option>
//                     {users.map((u) => (
//                       <option key={u.id} value={u.id}>
//                         {u.name} ({u.email})
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="pt-4">
//                   <button
//                     disabled={isSubmitting}
//                     className="w-full bg-[#A5DEE5] hover:brightness-95 text-slate-800 font-bold h-14 rounded-full transition-all text-base shadow-lg shadow-[#A5DEE5]/20 disabled:opacity-50"
//                     type="submit"
//                   >
//                     {isSubmitting ? "Creating..." : "Create Task"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </main>
//     </>
//   );
// }

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Added useParams
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

interface Project {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function AddEditTask() {
  const navigate = useNavigate();
  const { taskId } = useParams(); // Get ID from URL if editing
  const isEditMode = Boolean(taskId);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch Projects and Task Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await apiClient.get("/project");
        setProjects(projRes.data.data);

        if (isEditMode) {
          const taskRes = await apiClient.get(`/tasks/${taskId}`);
          const task = taskRes.data.data;

          // Populate Title immediately
          setTitle(task.title);

          // This will trigger the second useEffect to fetch users
          setProjectId(task.projectId.toString());

          // IMPORTANT: Store the assignee ID temporarily so the
          // second useEffect can apply it AFTER users are loaded
          setUserId(task.userId.toString());
        }
      } catch (error) {
        toast.error("Failed to load task data");
      }
    };
    fetchData();
  }, [taskId, isEditMode]);

  // Fetch users and handle the pre-selection
  useEffect(() => {
    const fetchEligibleUsers = async () => {
      if (!projectId) {
        setUsers([]);
        return;
      }

      setIsLoadingUsers(true);
      try {
        const res = await apiClient.get(
          `/users/all/verified?projectId=${projectId}`,
        );
        const fetchedUsers = res.data.users;
        setUsers(fetchedUsers);

        // If we are in edit mode, we don't want to reset the userId. If we are in create mode and change projects, then we reset it.
        if (!isEditMode) {
          setUserId("");
        }
      } catch (error) {
        toast.error("Failed to load eligible team members");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchEligibleUsers();
  }, [projectId, isEditMode]); // Add isEditMode to dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title || !userId) {
      return toast.error("Please fill in all fields");
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // EDIT MODE
        await apiClient.patch(`/tasks/${taskId}`, {
          title,
          userId: parseInt(userId),
        });
        toast.success("Task updated successfully!");
      } else {
        // CREATE MODE
        await apiClient.post("/tasks", {
          projectId: parseInt(projectId),
          title,
          userId: parseInt(userId),
        });
        toast.success("Task created successfully!");
      }
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="px-10 py-6 overflow-y-auto flex-1">
        <div className="mb-8">
          <h2 className="text-[28px] font-bold">
            {isEditMode ? "Edit Task" : "Create Task"}
          </h2>
        </div>

        <div className="max-w-3xl">
          <div className="bg-white rounded-4xl shadow-sm p-10 border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection (Disabled in Edit Mode usually) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">
                  Select Project
                </label>
                <select
                  disabled={isEditMode}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-full px-6 focus:ring-2 focus:ring-[#A5DEE5]/50 outline-none disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="">-Select Project-</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">
                  Task Name
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-full px-6 focus:ring-2 focus:ring-[#A5DEE5]/50 outline-none"
                  placeholder="Enter Task Name"
                  type="text"
                />
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">
                  Assignee{" "}
                  {isLoadingUsers && (
                    <span className="text-xs text-primary animate-pulse ml-2">
                      (Loading...)
                    </span>
                  )}
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-full px-6 focus:ring-2 focus:ring-[#A5DEE5]/50 outline-none appearance-none cursor-pointer"
                >
                  <option value="">-Select Assignee-</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  disabled={isSubmitting}
                  className="w-full bg-[#A5DEE5] hover:brightness-95 text-slate-800 font-bold h-14 rounded-full transition-all shadow-lg shadow-[#A5DEE5]/20 disabled:opacity-50"
                  type="submit"
                >
                  {isSubmitting
                    ? "Processing..."
                    : isEditMode
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
