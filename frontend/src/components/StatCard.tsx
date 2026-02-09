import { useNavigate } from "react-router-dom";

export default function StatCard({
  icon = "",
  title = "",
  value = "",
  desc = "",
  url = "",
  buttonText = "",
  hidden = false,
}) {
  const navigate = useNavigate();
  return (
    <div
      className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-300 flex flex-col gap-6 group hover:shadow-md transition-shadow ${hidden ? "hidden" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center bg-[#8bd4e7] justify-center border border-primary/20">
          <span className="material-symbols-outlined text-primary text-3xl">
            {icon}
          </span>
        </div>
        <span className="text-3xl font-bold">{value}</span>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>

      <button
        onClick={() => navigate(url)}
        className={`cursor-pointer mt-auto w-full py-3 rounded-4xl flex items-center justify-center gap-2 transition-all bg-[#8bd4e7] text-black   hover:opacity-90 border-2 border-[#8bd4e7] text-primary hover:bg-white`}
      >
        <span className="material-symbols-outlined">visibility</span>
        {buttonText}
      </button>
    </div>
  );
}
