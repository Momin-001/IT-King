import { useState, useEffect, useContext } from "react";
import axios from "axios";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// types based on backend response
interface VerifiedUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface UnverifiedUser {
  id: number;
  email: string;
  expiresIn: string; // or Date
  link: string;
}

interface ApiResponse {
  status: string;
  totalCount: number;
  data: {
    verified: VerifiedUser[];
    unverified: UnverifiedUser[];
  };
}

export default function AllUsers() {
  const [email, setEmail] = useState("");
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) as AuthContextType;

  // Do not allow if user is not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate(-1);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse>("/users/all");

      if (response.data.status === "success") {
        setVerifiedUsers(response.data.data.verified || []);
        setUnverifiedUsers(response.data.data.unverified || []);
      } else {
        toast.error("An error occurred. Please try again.");
        console.log("Error: ", response);
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err) ? err.message : "Failed to load members",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetching users on mount only if user is admin
    if (user && user.isAdmin) {
      fetchUsers();
    }
  }, [user]);

  const handleUserActivation = async (id: number) => {
    try {
      const res = await apiClient.patch(`/users/${id}/toggle-activation`);
      if (res.status === 200) {
        console.log(res.data);

        toast.success(res.data.message || "Toggle Successful");
        fetchUsers();
      } else {
        toast.error("An unexpected error occurred.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "An unexpected error occurred.",
      );
    }
  };

  const handleUserDeletion = async (id: number) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      toast.success(response.data.message);
      fetchUsers();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "An unexpected error occurred.",
      );
    }
  };

  const handleInvite = async (
    e:
      | React.SubmitEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    email: string,
  ) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/auth/register-user", { email });
      if (res.status === 201) {
        await fetchUsers(); // refresh users
        setEmail("");
        toast.success(`${email} successfully added`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "An error occured");
    }
  };

  const copyVerificationLink = async (link: string) => {
    const url = `${window.location.protocol}://${window.location.hostname}:${window.location.port}/verify-user/${link}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification link copied.");
  };

  const handleCancelation = async (id: number) => {
    try {
      const res = await apiClient.delete(`/auth/unverified/${id}`);
      if (res.status === 200) {
        await fetchUsers(); // refresh users
        toast.success("Invitation Cancelled Successfully");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "An error occured");
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <section className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Members of Gulzar Soft
          </h1>
          <p className="text-lg text-gray-600">
            Manage who can access this business. Invite new users and assign
            roles.
          </p>
        </section>

        {/* Invite form */}
        <form
          onSubmit={(e) => handleInvite(e, email)}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-12"
        >
          {/* Email + Send Invite button */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Email
            </label>
            <input
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none shadow-sm"
              placeholder="Enter Email"
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-[#8bd4e7]/80 hover:bg-[#8bd4e7] text-gray-800 py-3.5 rounded-full transition-all shadow-sm cursor-pointer"
            >
              Send Invite
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading members...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">Error: {error}</div>
        ) : (
          <>
            {/* Verified Users Table */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Verified Members ({verifiedUsers.length})
              </h2>

              {verifiedUsers.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">
                  No verified members yet.
                </p>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#8bd4e7] text-gray-700 font-bold text-sm">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {verifiedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-4 py-1.5 rounded-full text-xs font-medium text-white ${user.isActive ? "bg-green-500" : "bg-red-500"}`}
                            >
                              {user.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-5 text-gray-600">
                              <button
                                onClick={() => handleUserActivation(user.id)}
                                className={`flex items-center gap-1 hover:${user.isActive ? "text-red-600" : "text-green-600"} transition-colors`}
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {user.isActive ? "block" : "check_circle"}
                                </span>
                                {user.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleUserDeletion(user.id)}
                                className="flex items-center gap-1 hover:text-red-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  delete
                                </span>
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Unverified */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Pending Invites ({unverifiedUsers.length})
              </h2>

              {unverifiedUsers.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">
                  No pending invitations.
                </p>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#8bd4e7] text-gray-700 font-bold text-sm">
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Expires</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {unverifiedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(user.expiresIn).toLocaleString() || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-5 text-gray-600">
                              <button
                                onClick={(e) => handleInvite(e, user.email)}
                                className="flex items-center gap-1 hover:text-teal-600 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  mark_email_read
                                </span>
                                Resend
                              </button>
                              <button
                                onClick={() => copyVerificationLink(user.link)}
                                className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  content_paste
                                </span>
                                Copy Verification Link
                              </button>
                              <button
                                onClick={() => handleCancelation(user.id)}
                                className="flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  delete
                                </span>
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
