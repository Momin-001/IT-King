import React, { useState } from "react";

interface Team {
  id: number;
  name: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTeams: Team[];
  onCreate: (projectData: {
    name: string;
    description: string;
    startDate: string;
    dueDate: string;
    teamIds: number[];
  }) => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  availableTeams,
  onCreate,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamIds.length === 0) {
      alert("Please assign at least one team.");
      return;
    }
    onCreate({
      name,
      description,
      startDate,
      dueDate,
      teamIds: selectedTeamIds,
    });

    // Reset and close
    setName("");
    setStartDate("");
    setDueDate("");
    setSelectedTeamIds([]);
    onClose();
  };

  return (
    <div
      onClick={onClose} // Closing modal when clicked outside the modal
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()} // This stops click inside of modal from closing it
        className="bg-white w-full max-w-160 rounded-4xl p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-2xl font-bold mb-8 text-slate-900">
          Create Project
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-semibold mb-2.5 text-slate-700 ml-1">
              Project Title
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-full px-6 py-3.5 focus:ring-2 focus:ring-[#90D5E0]/50 focus:border-[#90D5E0] outline-none transition-all placeholder:text-slate-400"
              placeholder="Enter Project Title"
              type="text"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2.5 text-slate-700 ml-1">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-3xl px-6 py-4 focus:ring-2 focus:ring-[#90D5E0]/50 focus:border-[#90D5E0] outline-none transition-all placeholder:text-slate-400 min-h-30 resize-none"
              placeholder="What is this project about?"
            />
          </div>

          {/* Assign to Teams (Multi-select) */}
          <div>
            <label className="block text-sm font-semibold mb-2.5 text-slate-700 ml-1">
              Assign to Teams
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTeams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => toggleTeam(team.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedTeamIds.includes(team.id)
                      ? "bg-[#90D5E0] border-[#90D5E0] text-slate-800"
                      : "bg-white border-slate-200 text-slate-400 hover:border-[#90D5E0]"
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 ml-2 italic">
              Select one or more teams
            </p>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2.5 text-slate-700 ml-1">
                Start Date
              </label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-full px-6 py-3.5 focus:ring-2 focus:ring-[#90D5E0]/50 outline-none text-slate-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2.5 text-slate-700 ml-1">
                Due Date
              </label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={startDate} // dueDate can not be before start date
                className="w-full border border-slate-200 rounded-full px-6 py-3.5 focus:ring-2 focus:ring-[#90D5E0]/50 outline-none text-slate-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-[#90D5E0] text-slate-800 font-bold px-12 py-4 rounded-full shadow-lg shadow-[#90D5E0]/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
