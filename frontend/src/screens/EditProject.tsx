import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

interface Team {
  id: number;
  name: string;
}

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  // UI/Data State
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useContext(AuthContext) as AuthContextType;

  // If user is not admin, go back
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate(-1);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, teamsRes] = await Promise.all([
          apiClient.get(`/project/${id}`),
          apiClient.get("/team"),
        ]);

        const project = projectRes.data.data;
        setName(project.name);
        setDescription(project.description || "");
        // Format dates to YYYY-MM-DD for the HTML5 date input
        setStartDate(project.startDate.split("T")[0]);
        setDueDate(project.dueDate.split("T")[0]);
        setSelectedTeamIds(project.teams.map((t: Team) => t.id));

        setAvailableTeams(teamsRes.data.data);
      } catch (err) {
        toast.error("Failed to load project data");
        navigate("/projects");
      } finally {
        setIsLoading(false);
      }
    };

    // only fetch data is user is admin
    if (user?.isAdmin) {
      fetchData();
    }
  }, [id, navigate, user]);

  const handleAddTeam = (teamId: number) => {
    if (teamId && !selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  const handleRemoveTeam = (teamId: number) => {
    setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updateData = {
      name,
      description,
      startDate: new Date(startDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      teamIds: selectedTeamIds,
    };

    try {
      await apiClient.patch(`/project/${id}`, updateData);
      toast.success("Project updated successfully!");
      navigate(`/projects`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return <div className="p-20 text-center">Loading Project...</div>;

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Form */}
        <div className="px-10 py-6 overflow-y-auto flex-1">
          <div className="max-w-200 mx-auto pb-10">
            <div className="bg-white rounded-4xl shadow-sm p-10 border border-slate-300">
              <div className="flex flex-col gap-8">
                <h2 className="text-[28px] font-bold text-slate-900">
                  Edit Project: {name}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold ml-1">
                      Project Title
                    </label>
                    <input
                      className="w-full h-14 px-6 rounded-full border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] outline-none transition-all text-sm"
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
                      className="w-full px-6 py-4 rounded-3xl border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] outline-none text-sm h-32 resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Team Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold ml-1 text-slate-700">
                      Assigned Teams
                    </label>
                    <div className="min-h-14 w-full px-4 py-2 rounded-[28px] border border-slate-300 flex flex-wrap items-center gap-2 bg-white transition-all focus-within:ring-2 focus-within:ring-[#A5DEE5]">
                      {availableTeams
                        .filter((team) => selectedTeamIds.includes(team.id))
                        .map((team) => (
                          <div
                            key={team.id}
                            className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold border border-slate-200 text-slate-700"
                          >
                            <span>{team.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(team.id)}
                              className="text-slate-400 hover:text-red-500 flex items-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                close
                              </span>
                            </button>
                          </div>
                        ))}
                      <select
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-w-35 outline-none appearance-none cursor-pointer text-slate-400"
                        value=""
                        onChange={(e) => handleAddTeam(Number(e.target.value))}
                      >
                        <option value="" disabled>
                          + Add team...
                        </option>
                        {availableTeams
                          .filter((team) => !selectedTeamIds.includes(team.id))
                          .map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold ml-1">
                        Start Date
                      </label>
                      <input
                        className="w-full h-14 px-6 rounded-full border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] outline-none text-sm"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold ml-1">
                        Due Date
                      </label>
                      <input
                        className="w-full h-14 px-6 rounded-full border border-slate-300 focus:ring-2 focus:ring-[#A5DEE5] outline-none text-sm"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-start pt-6">
                    <button
                      disabled={isSaving}
                      className="bg-[#A5DEE5] hover:brightness-95 text-slate-800 font-bold px-12 h-14 rounded-full transition-all active:scale-95 disabled:opacity-50"
                      type="submit"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
