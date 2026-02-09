import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import apiClient from "../api/apiClient";
import { AuthContext } from "./AuthContext";

interface Team {
  id: number;
  name: string;
}

interface Profile {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  teams: Team[];
}

export interface ProfileContextType {
  profile: Profile | null;
  fetchProfile: () => Promise<void>;
  isFetching: boolean;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined,
);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const auth = useContext(AuthContext);
  const [isFetching, setIsFetching] = useState(false);

  // Initialize with data from storage
  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem("user_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const fetchProfile = async () => {
    if (!auth?.accessToken) return; // do nothing if not logged in

    setIsFetching(true); // For loading
    try {
      const res = await apiClient.get("/users/me");
      const freshData = res.data.data;

      setProfile(freshData); // setting data to state
      localStorage.setItem("user_profile", JSON.stringify(freshData)); // update local storage data
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      if (error?.response?.status === 401) { // expired auth token
        auth.logout();
      }
    } finally {
      setIsFetching(false);
    }
  };

  // fetching data on mount or when the user changes (login)
  useEffect(() => {
    if (auth?.accessToken) {
      //If user is logged in
      fetchProfile();
    } else {
      //If user logged out
      setProfile(null);
    }
  }, [auth?.accessToken]); // Will run on mount + login/logout

  return (
    <ProfileContext.Provider value={{ profile, fetchProfile, isFetching }}>
      {children}
    </ProfileContext.Provider>
  );
};
