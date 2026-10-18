"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  Lock, 
  Key, 
  ArrowRight, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  HelpCircle,
  Cpu
} from "lucide-react";
import { adminLogin } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the administrator password or admin key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminLogin({
        username: username.trim(),
        password: password.trim(),
        admin_key: password.trim()
      });

      if (res.token) {
        localStorage.setItem("autovaluate_admin_token", res.token);
        localStorage.setItem("autovaluate_admin_key", res.token);
        localStorage.setItem("autovaluate_admin_user", JSON.stringify(res.user));
        router.push("/admin");
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid administrator credentials or secret key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-xl shadow-blue-500/20 text-white mx-auto">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Auto<span className="text-cyan-400">Valuate</span> Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
              Restricted management gateway for machine learning retraining, candidate benchmarking, and model deployment.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel-elevated rounded-3xl p-7 sm:p-8 border border-slate-800 bg-[#0B1120]/90 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-mono text-[11px] leading-relaxed">{error}</div>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Administrator Username
              </label>
              <div className="relative">
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Password / Admin Key Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Password / Admin Key
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">Required</span>
              </div>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    autoComplete="off"
                    required
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
            </div>

            {/* Login Action Button */}
            <button
              id="admin-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Explanation: What is Admin-Key Auth? */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold font-mono">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restricted Administration</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Administrative functions, model retraining, and deployment rollbacks are protected by server-side authorization. Only authorized administrators with verified credentials may sign in.
            </p>
          </div>
        </div>

        {/* Back to Public Web Application */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Return to Public Car Valuation Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
