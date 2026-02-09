// LoginPage.tsx
import { useContext, useEffect, useState } from "react";
import "./Login.css"; // ← we'll put custom styles here
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../context/AuthContext";
import apiClient from "../api/apiClient";

export default function LoginPage() {
  const auth = useContext(AuthContext) as AuthContextType;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (auth?.user) {
      navigate("/");
    }
  }, [auth?.user, navigate]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Backend Response: res.status(200).json({ status: "success", token, user })
      const res = await apiClient.post("/auth/login", { email, password });

      const { accessToken, refreshToken, user } = res.data;

      // Update AuthContext (saves to localStorage and fetches Profile)
      if (auth) {
        console.log("Login Data: ", res.data);
        
        await auth.login(accessToken, refreshToken, user.id, user.isAdmin);
        console.log("Received Login Data: ", user);
        navigate("/");
      } else {
        console.log("Auth not working: ", auth);
      }
    } catch (err: any) {
      // Handle error
      const message =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left img */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-login-image flex-col justify-end p-20 text-white">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-center mb-2">Tips</h2>
          <p className="text-sm text-white/80 leading-relaxed text-center">
            You should definitely hire the creator.
            <br />
            He's a really chill dude
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex flex-col max-[425px]:p-1 p-6 lg:p-10">
        {/* Centered form */}
        <div className="grow flex items-center justify-center">
          <div className="w-full border border-[rgba(0,0,0,0.3)] mx-20 bg-white rounded-3xl p-10 max-[425px]:mx-0 max-[320px]:px-1 lg:p-12 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-8 h-8 bg-primary rounded-full mb-2 bg-[#45bcb1]" />
              <h1 className="text-[28px] font-bold text-black mb-2">Login</h1>
              <p className="text-center text-slate-400 text-[14px] leading-relaxed max-w-70">
                You must login before proceeding to use the app
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#4A5568]"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-500 text-sm 
                           focus:ring-1 focus:ring-primary focus:border-primary outline-none 
                           placeholder:text-slate-300"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#4A5568]"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-500 text-sm 
                             focus:ring-1 focus:ring-primary focus:border-primary outline-none 
                             placeholder:text-slate-300"
                  />

                  {error && (
                    <div className="text-sm text-red-500 my-2">{error}</div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 -translate-y-1/12 text-primary text-[12px] font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-primary bg-[#45bcb1] text-black
                         py-3.5 rounded-4xl transition-all text-sm mt-2"
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
