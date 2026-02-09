import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

export default function VerifyUserPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [tokenValid, setTokenValid] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user details on mount to verify the token is valid
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(`/auth/verify-details/${token}`);
        setEmail(res.data.data.email);
      } catch (err: any) {
        setError(err.response?.data?.message || "Invalid or expired link.");
        setTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [token]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(`/auth/verify-complete/${token}`, {
        name,
        password,
      });

      // Redirect to login after successful verification
      toast.success("Account verified! Please login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side (Same as Login) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-login-image flex-col justify-end p-20 text-white">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-center mb-2">Tips</h2>
          <p className="text-sm text-white/80 leading-relaxed text-center">
            Set a strong password to keep your tasks secure.
            <br />
            Welcome to the team!
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex flex-col max-[425px]:p-1 p-6 lg:p-10">
        <div className="grow flex items-center justify-center">
          <div className="w-full border border-[rgba(0,0,0,0.3)] mx-20 bg-white rounded-3xl p-10 max-[425px]:mx-0 max-[320px]:px-1 lg:p-12 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-8 h-8 bg-[#45bcb1] rounded-full mb-2" />
              <h1 className="text-[28px] font-bold text-black mb-2">
                Verify User
              </h1>
              <p className="text-center text-slate-400 text-[14px] leading-relaxed">
                Completing verification for{" "}
                <span className="text-black font-semibold">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4A5568]">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-500 text-sm focus:ring-1 focus:ring-primary outline-none"
                  required
                  disabled={!tokenValid}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4A5568]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-500 text-sm focus:ring-1 focus:ring-primary outline-none"
                    required
                    disabled={!tokenValid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 -translate-y-1/12 text-[#45bcb1] text-[12px] font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4A5568]">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-500 text-sm focus:ring-1 focus:ring-primary outline-none"
                  required
                  disabled={!tokenValid}
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 mt-2">{error}</div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#45bcb1] text-black py-3.5 rounded-4xl transition-all text-sm mt-4 font-bold"
              >
                {isSubmitting ? "Verifying..." : "Complete Verification"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
