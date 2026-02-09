import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

export default function Redirect() {
  const navigate = useNavigate();
  const { isLoading, user } = useContext(AuthContext) as AuthContextType;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login");
      } else {
        navigate("/dashboard");
      }
    }
    console.log("User: ", user);
  }, [user, isLoading]);

  return <div>Redirecting...</div>;
}
