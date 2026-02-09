import { Link, useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import { useContext } from "react";

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

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) as AuthContextType;
  return (
    <div className="bg-white border border-slate-500 rounded-2xl p-10 flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-2xl font-bold mb-8">{project.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 mb-10">
        <div
          className={`flex flex-col gap-1 col-span-3 ${user?.isAdmin ? "" : "hidden"}`}
        >
          <span className="text-xs text-slate-900 font-semibold uppercase">
            Teams
          </span>
          <span className="flex flex-row">
            {project.teams && project.teams.length > 0 ? (
              project?.teams.map((team, index) => (
                <>
                  {index !== 0 && ", "}
                  <Link
                    to={`/teams/${team?.id}`}
                    key={"team " + team.name}
                    className={`text-sm hover:underline hover:text-[#8bd4e7]`}
                  >
                    {team.name}
                  </Link>
                </>
              ))
            ) : (
              <p className="text-sm text-slate-600">No Teams Assigned</p>
            )}
          </span>
        </div>
        <CardInfo
          label="Start"
          value={new Date(project.startDate).toLocaleDateString("en-GB")}
        />
        <CardInfo
          label="Due"
          value={new Date(project.dueDate).toLocaleDateString("en-GB")}
        />
      </div>
      <button
        onClick={() => navigate(`/projects/${project.id}`)}
        className="mt-auto self-start bg-[#90D5E0] hover:bg-[#7bc0cb] text-slate-800 font-bold py-3.5 px-10 rounded-full transition-colors max-[375px]:px-2 cursor-pointer"
      >
        View Project
      </button>
    </div>
  );
}
const CardInfo = ({ label, value, valueClass = "" }: any) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-900 font-semibold uppercase max-[425px]:col-span-3">
        {label}
      </span>
      <span className={`text-sm  ${valueClass}`}>{value}</span>
    </div>
  );
};
