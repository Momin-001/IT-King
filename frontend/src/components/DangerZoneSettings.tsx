import type { Users } from "../screens/Settings";
import { SettingsSection } from "./SettingSection";

interface DangerZoneProp {
  users: Users[];
  selectedUser: number | undefined;
  setSelectedUser: React.Dispatch<React.SetStateAction<number | undefined>>;
  handleTransferOwnership: (id: number | undefined) => Promise<void>;
}

export function DangerZone({
  users,
  selectedUser,
  setSelectedUser,
  handleTransferOwnership,
}: DangerZoneProp) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-4xl shadow-sm">
      <SettingsSection
        title="Transfer Admin"
        description="Only one Admin is allowed. This action will transfer ownership and downgrade your role to regular user."
      >
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Admin List
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(parseInt(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-slate-500 focus:outline-[#90D5E0] focus:border-[#90D5E0] appearance-none cursor-pointer"
          >
            <option>-Select-</option>
            {users.map((user) => (
              <option key={user.email} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleTransferOwnership(selectedUser)}
          className="bg-[#90D5E0] text-slate-800 font-semibold px-8 py-3 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          Transfer Ownership
        </button>
      </SettingsSection>
    </div>
  );
}
