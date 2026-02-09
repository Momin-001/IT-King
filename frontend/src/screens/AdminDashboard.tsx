import { useContext, useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const { user } = useContext(AuthContext) as AuthContextType;

  useEffect(() => {
    async function fetchCounts() {
      try {
        const url = user?.isAdmin ? "/dashboard/admin" : "/dashboard";
        const counts = await apiClient.get(url);
        setUserCount(counts.data.users);
        setTeamCount(counts.data.teams);
        setProjectCount(counts.data.projects);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "An error occured");
      }
    }

    if (user) {
      //If logged in
      fetchCounts();
    }
  }, [user]);
  return (
    <>
      {/* Main Content */}
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
          Gulzar Soft
        </h1>
        <p className="text-lg">
          <span className="font-normal text-slate-600">Welcome to </span>
          <span className="font-bold text-slate-900">Gulzar Soft!</span>
          <span className="text-slate-600">
            {" "}
            Let's start by building your team and adding your first project.
          </span>
        </p>
      </section>

      {/* Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon="person"
          title="Total Members"
          value={`${userCount}`}
          desc="You can view members of your business"
          url="/users"
          hidden={!user?.isAdmin}
          buttonText="View Members"
        />
        <StatCard
          icon="groups"
          title="Total Teams"
          value={`${teamCount}`}
          desc="You can view Teams of your business"
          url="/teams"
          buttonText="View Teams"
        />
        <StatCard
          icon="assignment"
          title="Projects In Progress"
          value={`${projectCount}`}
          desc="You can view Project of your business"
          url="/projects"
          buttonText="View Projects"
        />
      </section>
      {/* </main> */}
    </>
  );
}

export default AdminDashboard;
