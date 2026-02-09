import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./screens/Login";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { Toaster } from "react-hot-toast";
import Redirect from "./screens/Redirect";
import AdminDashboard from "./screens/AdminDashboard";
import AllUsers from "./screens/AllUsers";
import AdminLayout from "./components/Layout";
import VerifyUserPage from "./screens/VerifyUser";
import AllTeams from "./screens/AllTeams";
import EditTeam from "./screens/EditTeam";
import ViewTeam from "./screens/ViewTeam";
import AllProjects from "./screens/AllProjects";
import EditProject from "./screens/EditProject";
import ProjectDetails from "./screens/ProjectDetails";
import AllTasks from "./screens/AllTasks";
import CreateTask from "./screens/CreateTask";
import Chats from "./screens/Chats";
import Settings from "./screens/Settings";

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <Toaster />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-user/:token" element={<VerifyUserPage />} />
              <Route path="/" element={<Redirect />} />
              <Route path="/" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AllUsers />} />
                <Route path="teams" element={<AllTeams />} />
                <Route path="teams/edit/:id" element={<EditTeam />} />
                <Route path="teams/:id" element={<ViewTeam />} />
                <Route path="projects" element={<AllProjects />} />
                <Route path="projects/:id" element={<ProjectDetails />} />
                <Route path="projects/edit/:id" element={<EditProject />} />
                <Route path="tasks" element={<AllTasks />} />
                <Route path="tasks/create" element={<CreateTask />} />
                <Route path="tasks/edit/:taskId" element={<CreateTask />} />
                <Route path="chats" element={<Chats />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
