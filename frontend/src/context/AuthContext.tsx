import { createContext, useState, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthUser {
  userId: number;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (
    accessToken: string,
    refreshToken: string,
    userId: number,
    isAdmin: boolean,
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken"),
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken"),
  );

  // Initialize user from localStorage for instant access
  const [user, setUser] = useState<AuthUser | null>(() => {
    const userId = localStorage.getItem("userId");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    return userId ? { userId: parseInt(userId), isAdmin } : null;
  });

  const login = async (
    newAccessToken: string,
    newRefreshToken: string,
    userId: number,
    isAdmin: boolean,
  ) => {
    setIsLoading(true);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    const authUser = { userId, isAdmin };
    setUser(authUser);

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("userId", userId.toString());
    localStorage.setItem("isAdmin", isAdmin.toString());
    setIsLoading(false);
  };

  const logout = () => {
    setIsLoading(true);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.clear();
    navigate("/login");
    setIsLoading(false);
  };

  // Sync logout event from apiClient interceptors
  useEffect(() => {
    window.addEventListener("logout", logout);
    return () => window.removeEventListener("logout", logout);
  }, [logout]);

  // Protecting all routes except login and user verification
  useEffect(() => {
    const publicPaths = ["/login", "/verify-user"];
    const isPublicPath = publicPaths.some((path) =>
      location.pathname.startsWith(path),
    );

    if (!accessToken && !isPublicPath && !isLoading) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [location.pathname, accessToken, isLoading]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
