import { useNavigate } from "react-router-dom";
import type { Task } from "../screens/AllTasks";

export default function TaskRow({
  task,
  ledTeamId,
  isAdmin,
  onDelete,
  onToggle,
}: {
  task: Task;
  ledTeamId: string;
  isAdmin: boolean | undefined;
  onDelete: (id: number) => Promise<void>;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-8 py-5">
        <div
          onClick={onToggle}
          className={`w-5.5 h-5.5 border-2 rounded-full cursor-pointer transition-all flex items-center justify-center 
              ${task.completed ? "bg-[#A5DEE5] border-[#A5DEE5]" : "border-slate-300 bg-white"}`}
        >
          {task.completed && (
            <span className="material-symbols-outlined text-sm text-slate-800 font-bold">
              check
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-5">
        <span
          className={`text-sm font-medium ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}
        >
          {task.title}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-500 border border-blue-100">
            {task.user.name.charAt(0)}
          </div>
          <span className="text-sm text-slate-500">{task.user.email}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium text-center max-[768px]:flex max-[768px]:justify-center">
          {task.project.name}
        </span>
      </td>
      {(ledTeamId || isAdmin) && (
        <td className="px-8 py-5 text-right flex flex-row gap-5">
          <button
            onClick={() => navigate(`/tasks/edit/${task.id}`)}
            className={`text-slate-400 hover:text-teal-600 group flex flex-row cursor-pointer ${ledTeamId || isAdmin ? "" : "hidden"}`}
          >
            <span className="material-symbols-outlined text-xl">edit</span>
            <span className="text-slate-600 group-hover:text-teal-600">
              Edit
            </span>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className={`text-slate-400 hover:text-red-600 group flex flex-row cursor-pointer ${ledTeamId || isAdmin ? "" : "hidden"}`}
          >
            <span className="material-symbols-outlined text-xl">delete</span>
            <span className="text-slate-600 group-hover:text-red-600">
              Delete
            </span>
          </button>
        </td>
      )}
    </tr>
  );
}
