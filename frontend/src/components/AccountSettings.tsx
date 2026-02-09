import React, { useState, useEffect, useContext } from "react";
import { SettingsSection } from "./SettingSection";
import toast from "react-hot-toast";
import apiClient from "../api/apiClient";
import {
  ProfileContext,
  type ProfileContextType,
} from "../context/ProfileContext";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

export const Account = () => {
  const [profileName, setProfileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useContext(ProfileContext) as ProfileContextType;
  const { logout } = useContext(AuthContext) as AuthContextType;

  const [passwords, setPasswords] = useState({
    current: "", // current password for security verification
    new: "",
    confirm: "",
  });

  // Fetch current user name on load
  useEffect(() => {
    if (profile && profile?.name) {
      setProfileName(profile.name);
    }
  }, [profile]);

  const handleUpdateProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return toast.error("Name cannot be empty");

    setIsLoading(true);
    try {
      await apiClient.patch("/users/update-name", { name: profileName });
      toast.success("Profile updated successfully! Please login again.");
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    if (passwords.new !== passwords.confirm) {
      return toast.error("Passwords do not match!");
    }

    setIsLoading(true);
    try {
      await apiClient.patch("/users/update-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success("Password changed successfully! Please login again.");
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-4xl shadow-sm">
      {/* Profile Section */}
      <SettingsSection
        title="Account"
        description="Update your public display name. This is how other team members will see you."
      >
        <form onSubmit={handleUpdateProfileName} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">
              Display Name
            </label>
            <input
              type="text"
              disabled={isLoading}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 focus:ring-[#90D5E0] focus:border-[#90D5E0] disabled:opacity-50"
              placeholder="Your Name"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#90D5E0] text-slate-800 font-semibold px-8 py-3 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </SettingsSection>

      <div className="my-10 border-t border-slate-100" />

      {/* Password Section */}
      <SettingsSection
        title="Security"
        description="Change your password regularly to keep your account secure."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 focus:ring-[#90D5E0] focus:border-[#90D5E0]"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 focus:ring-[#90D5E0] focus:border-[#90D5E0]"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 focus:ring-[#90D5E0] focus:border-[#90D5E0]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#90D5E0] text-slate-800 font-semibold px-8 py-3 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Change Password"}
          </button>
        </form>
      </SettingsSection>
    </div>
  );
};
