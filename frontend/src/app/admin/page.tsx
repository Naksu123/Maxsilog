"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Key,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Award,
  Terminal,
  FileCheck,
  LogOut,
  Eye,
  EyeOff,
  HelpCircle,
  ArrowRight,
  Car,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter
} from "lucide-react";
import {
  getTrainingStatus,
  getTrainingHistory,
  getArchivedModels,
  triggerManualTraining,
  rollbackModelVersion,
  adminLogin
} from "@/lib/api";
import {
  TrainingStatusResponse,
  TrainingHistoryItem,
  ModelVersionItem,
  BenchmarkModel,
  CandidateArtifactItem
} from "@/types";

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminKey, setAdminKey] = useState<string>("");
  const [adminUser, setAdminUser] = useState<string>("admin");

  // Login Form State
  const [loginUsername, setLoginUsername] = useState<string>("admin");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data State
  const [status, setStatus] = useState<TrainingStatusResponse | null>(null);
  const [history, setHistory] = useState<TrainingHistoryItem[]>([]);
  const [versions, setVersions] = useState<ModelVersionItem[]>([]);

  // Audit Log Pagination & Filtering State
  const [historyPage, setHistoryPage] = useState<number>(1);
  const historyPageSize = 5;
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [historySearch, setHistorySearch] = useState<string>("");

  // Model Artifact Versions Pagination, Model Filter, View Mode & Search State
  const [versionsPage, setVersionsPage] = useState<number>(1);
  const versionsPageSize = 5;
  const [versionsSearch, setVersionsSearch] = useState<string>("");
  const [versionsModelFilter, setVersionsModelFilter] = useState<string>("all");
  const [versionsViewMode, setVersionsViewMode] = useState<"artifacts" | "versions">("artifacts");

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [forceRetrain, setForceRetrain] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Rollback confirmation modal state
  const [rollbackModalVersion, setRollbackModalVersion] = useState<string | null>(null);
  const [rollbackModalError, setRollbackModalError] = useState<string | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState<boolean>(false);

  // Check authentication status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken =
        localStorage.getItem("autovaluate_admin_token") ||
        localStorage.getItem("autovaluate_admin_key");

      if (storedToken) {
        setAdminKey(storedToken);
        setIsAuthenticated(true);
        const storedUser = localStorage.getItem("autovaluate_admin_user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setAdminUser(parsed.username || "admin");
          } catch {}
        }
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const fetchData = useCallback(async (keyToUse: string) => {
    if (!keyToUse) return;
    try {
      setLoading(true);
      const [statusRes, historyRes, versionsRes] = await Promise.all([
        getTrainingStatus(keyToUse),
        getTrainingHistory(keyToUse),
        getArchivedModels(keyToUse)
      ]);
      setStatus(statusRes);
      const rawHistory = Array.isArray(historyRes) ? historyRes : ((historyRes as any)?.items || []);
      setHistory(rawHistory);
      setVersions(versionsRes);
      setFeedback(null);
    } catch (err: any) {
      console.error("Error loading admin data:", err);
      if (err.message && err.message.toLowerCase().includes("unauthorized")) {
        // Token expired or invalid, log out
        handleLogout();
        setLoginError("Session expired or invalid key. Please log in again.");
      } else {
        setFeedback({
          type: "error",
          message: err.message || "Failed to fetch admin status."
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && adminKey) {
      fetchData(adminKey);
    }
  }, [isAuthenticated, adminKey, fetchData]);

  // Polling when training is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status?.is_training && adminKey) {
      interval = setInterval(() => {
        getTrainingStatus(adminKey)
          .then((newStatus) => {
            setStatus(newStatus);
            if (!newStatus.is_training) {
              fetchData(adminKey);
            }
          })
          .catch((e) => console.error("Polling error:", e));
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status?.is_training, adminKey, fetchData]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) {
      setLoginError("Please enter your administrator password or admin key.");
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await adminLogin({
        username: loginUsername.trim(),
        password: loginPassword.trim(),
        admin_key: loginPassword.trim()
      });

      if (res.token) {
        setAdminKey(res.token);
        setIsAuthenticated(true);
        setAdminUser(res.user?.username || loginUsername || "admin");
        if (typeof window !== "undefined") {
          localStorage.setItem("autovaluate_admin_token", res.token);
          localStorage.setItem("autovaluate_admin_key", res.token);
          localStorage.setItem("autovaluate_admin_user", JSON.stringify(res.user));
        }
      } else {
        setLoginError("Authentication failed. Please check credentials.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Invalid administrator credentials or secret key.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setAdminKey("");
    setIsAuthenticated(false);
    setStatus(null);
    setHistory([]);
    setVersions([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("autovaluate_admin_token");
      localStorage.removeItem("autovaluate_admin_key");
      localStorage.removeItem("autovaluate_admin_user");
    }
  };

  const handleTriggerTraining = async () => {
    setActionLoading(true);
    setFeedback({
      type: "info",
      message: `Dispatching training job (Force Retraining: ${forceRetrain ? "Enabled" : "Disabled"})...`
    });
    try {
      const res = await triggerManualTraining(adminKey, forceRetrain);
      setFeedback({
        type: "info",
        message: res.message || `Training job dispatched (Force Retrain: ${forceRetrain ? "Enabled" : "Disabled"}). Live monitoring active...`
      });

      // Poll until training finishes
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const newStatus = await getTrainingStatus(adminKey);
          setStatus(newStatus);

          if (!newStatus.is_training || attempts >= 40) {
            clearInterval(pollInterval);
            setActionLoading(false);
            await fetchData(adminKey);
            setHistoryPage(1); // Reset to page 1 to see the newest execution

            const lastRun = newStatus.last_training_run;
            if (lastRun) {
              if (lastRun.status === "completed") {
                setFeedback({
                  type: "success",
                  message: `Retraining completed successfully! Promoted version ${lastRun.version_id || ""} (${lastRun.selected_model || "Champion"}) with CV MAE RM ${lastRun.champion_cv_mae?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
                });
              } else if (lastRun.status === "skipped") {
                setFeedback({
                  type: "info",
                  message: `Retraining skipped: ${lastRun.skip_reason || lastRun.message || "Dataset is unchanged since the last successful training. Retraining skipped under automated data-change policy."}`
                });
              } else if (lastRun.status === "failed") {
                setFeedback({
                  type: "error",
                  message: `Retraining failed: ${lastRun.error || lastRun.message || "Pipeline execution failed."}`
                });
              }
            }
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 1500);

    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to trigger training."
      });
      setActionLoading(false);
    }
  };

  // Auto-dismiss feedback notification after 8 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleConfirmRollback = async () => {
    if (!rollbackModalVersion) return;
    setRollbackLoading(true);
    setRollbackModalError(null);
    try {
      const res = await rollbackModelVersion(adminKey, rollbackModalVersion);
      setFeedback({
        type: "success",
        message: res.message || `Successfully rolled back active model to ${rollbackModalVersion}`
      });
      setRollbackModalVersion(null);
      setRollbackModalError(null);
      await fetchData(adminKey);
      setVersionsPage(1);
    } catch (err: any) {
      const errMsg = err.message || "Failed to perform model rollback.";
      setRollbackModalError(errMsg);
      setFeedback({
        type: "error",
        message: errMsg
      });
    } finally {
      setRollbackLoading(false);
    }
  };

  const formatMytDate = (isoStr?: string) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  // -------------------------------------------------------------
  // RENDER 1: Dedicated Administrator Login Screen (When Not Logged In)
  // -------------------------------------------------------------
  if (isAuthenticated === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-xl shadow-blue-500/20 text-white mx-auto">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Auto<span className="text-cyan-400">Valuate</span> Admin Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                Restricted gateway for machine learning retraining, candidate benchmarking, and model deployment.
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="glass-panel-elevated rounded-3xl p-7 sm:p-8 border border-slate-800 bg-[#0B1120]/90 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-mono text-[11px] leading-relaxed">{loginError}</div>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Administrator Username
                </label>
                <input
                  id="admin-username-input"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
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
                    id="admin-password-input"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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

              {/* Submit Button */}
              <button
                id="admin-login-submit"
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                {loginLoading ? (
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

            {/* Explanation: Restricted Access */}
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

          {/* Return link */}
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

  // -------------------------------------------------------------
  // Audit Log Filtering & Pagination Logic (5 records/page)
  // -------------------------------------------------------------
  const filteredHistory = history.filter((item) => {
    if (historyStatusFilter !== "all" && item.status !== historyStatusFilter) {
      return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchRun = item.run_id?.toLowerCase().includes(q);
      const matchVer = item.version_id?.toLowerCase().includes(q);
      const matchModel = item.selected_model?.toLowerCase().includes(q);
      const matchAction = item.action?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchErr = item.error?.toLowerCase().includes(q);
      const matchSkip = item.skip_reason?.toLowerCase().includes(q);
      if (!matchRun && !matchVer && !matchModel && !matchAction && !matchMsg && !matchErr && !matchSkip) {
        return false;
      }
    }
    return true;
  });

  const totalHistoryRecords = filteredHistory.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryRecords / historyPageSize));
  const currentHistoryPage = Math.min(Math.max(1, historyPage), totalHistoryPages);
  const startIdx = totalHistoryRecords === 0 ? 0 : (currentHistoryPage - 1) * historyPageSize;
  const endIdx = Math.min(startIdx + historyPageSize, totalHistoryRecords);
  const paginatedHistory = filteredHistory.slice(startIdx, endIdx);

  // Helper: Sliding window of at most 5 page numbers for pagination controls
  const getPaginationPages = (currentPage: number, totalPages: number, maxVisible: number = 5): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Helper: Model badge styling by model family
  const getModelBadge = (modelName: string) => {
    if (modelName.includes("Gradient")) {
      return {
        bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        tag: "Nonlinear Boosting",
        short: "GBR"
      };
    } else if (modelName.includes("Random")) {
      return {
        bg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
        tag: "Tree Ensemble",
        short: "RF"
      };
    } else if (modelName.includes("Ridge")) {
      return {
        bg: "bg-amber-500/15 text-amber-300 border-amber-500/40",
        tag: "L2 Regularized",
        short: "Ridge"
      };
    } else {
      return {
        bg: "bg-slate-500/15 text-slate-300 border-slate-500/40",
        tag: "Baseline OLS",
        short: "Linear"
      };
    }
  };

  // Extract all registered candidate model artifacts across all versions
  const allCandidateArtifacts: CandidateArtifactItem[] = [];
  versions.forEach((ver) => {
    if (ver.candidate_artifacts && ver.candidate_artifacts.length > 0) {
      ver.candidate_artifacts.forEach((cand) => allCandidateArtifacts.push(cand));
    } else {
      const filenameMap: Record<string, string> = {
        "Gradient Boosting Regressor": "gbr_model.joblib",
        "Random Forest Regressor": "rf_model.joblib",
        "Ridge Regression": "ridge_model.joblib",
        "Simple Linear Regression (Baseline)": "baseline_model.joblib"
      };
      if (ver.benchmark && ver.benchmark.length > 0) {
        ver.benchmark.forEach((b) => {
          const isChamp = b.model === (ver.selected_algorithm || ver.selected_model) || b.is_selected;
          const isAct = Boolean(isChamp && ver.is_active);
          const fname = filenameMap[b.model] || `${b.model.toLowerCase().replace(/ /g, "_")}.joblib`;
          allCandidateArtifacts.push({
            artifact_id: `${ver.version_id}_${fname.replace(".joblib", "")}`,
            version_id: ver.version_id,
            model_name: b.model,
            model_type: b.model,
            algorithm: b.model,
            artifact_filename: fname,
            artifact_location: `versions/${ver.version_id}/${fname}`,
            cv_mae: b.cv_mae,
            cv_mae_std: b.cv_mae_std,
            cv_rmse: b.cv_rmse,
            cv_rmse_std: b.cv_rmse_std,
            cv_r2: b.cv_r2,
            cv_r2_std: b.cv_r2_std,
            test_mae: b.test_mae,
            test_rmse: b.test_rmse,
            test_r2: b.test_r2,
            generalization_gap: b.generalization_gap,
            is_champion: isChamp,
            is_active: isAct,
            role: isAct
              ? "Champion (Production Active)"
              : isChamp
              ? "Champion (Archived)"
              : b.model.includes("Baseline")
              ? "Baseline Standby"
              : "Candidate Standby",
            status: isAct ? "active" : isChamp ? "archived" : "standby",
            timestamp_utc: ver.timestamp_utc,
            timestamp_myt: ver.timestamp_myt,
            dataset_fingerprint: ver.dataset_fingerprint,
            record_count: ver.record_count
          });
        });
      } else {
        const champModel = ver.selected_algorithm || ver.selected_model || "Gradient Boosting Regressor";
        allCandidateArtifacts.push({
          artifact_id: `${ver.version_id}_gbr`,
          version_id: ver.version_id,
          model_name: champModel,
          model_type: champModel,
          algorithm: champModel,
          artifact_filename: "gbr_model.joblib",
          artifact_location: `versions/${ver.version_id}/gbr_model.joblib`,
          cv_mae: ver.cv_mae,
          cv_r2: ver.cv_r2,
          is_champion: true,
          is_active: ver.is_active,
          role: ver.is_active ? "Champion (Production Active)" : "Champion (Archived)",
          status: ver.is_active ? "active" : "archived",
          timestamp_utc: ver.timestamp_utc,
          timestamp_myt: ver.timestamp_myt,
          dataset_fingerprint: ver.dataset_fingerprint,
          record_count: ver.record_count
        });
      }
    }
  });

  // Filter candidate artifacts
  const filteredCandidateArtifacts = allCandidateArtifacts.filter((cand) => {
    if (versionsModelFilter !== "all" && !cand.model_name.toLowerCase().includes(versionsModelFilter.toLowerCase())) {
      return false;
    }
    if (!versionsSearch.trim()) return true;
    const q = versionsSearch.toLowerCase().trim();
    return (
      cand.artifact_id.toLowerCase().includes(q) ||
      cand.version_id.toLowerCase().includes(q) ||
      cand.model_name.toLowerCase().includes(q) ||
      cand.artifact_filename.toLowerCase().includes(q)
    );
  });

  // Filter version runs
  const filteredVersions = versions.filter((ver) => {
    if (versionsModelFilter !== "all") {
      const matchCandidate = ver.candidate_artifacts?.some((c) =>
        c.model_name.toLowerCase().includes(versionsModelFilter.toLowerCase())
      );
      const matchSelected = (ver.selected_algorithm || ver.selected_model || "")
        .toLowerCase()
        .includes(versionsModelFilter.toLowerCase());
      if (!matchCandidate && !matchSelected) return false;
    }
    if (!versionsSearch.trim()) return true;
    const q = versionsSearch.toLowerCase().trim();
    const matchId = ver.version_id?.toLowerCase().includes(q);
    const matchModel = (ver.selected_algorithm || ver.selected_model || "")
      .toLowerCase()
      .includes(q);
    return matchId || matchModel;
  });

  const totalVersionRecords =
    versionsViewMode === "artifacts"
      ? filteredCandidateArtifacts.length
      : filteredVersions.length;

  const totalVersionPages = Math.max(1, Math.ceil(totalVersionRecords / versionsPageSize));
  const currentVersionsPage = Math.min(Math.max(1, versionsPage), totalVersionPages);
  const versionStartIdx = totalVersionRecords === 0 ? 0 : (currentVersionsPage - 1) * versionsPageSize;
  const versionEndIdx = Math.min(versionStartIdx + versionsPageSize, totalVersionRecords);

  const paginatedArtifacts = filteredCandidateArtifacts.slice(versionStartIdx, versionEndIdx);
  const paginatedVersions = filteredVersions.slice(versionStartIdx, versionEndIdx);

  // -------------------------------------------------------------
  // RENDER 2: Full Administrator Dashboard (When Authenticated)
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Automated Daily Machine-Learning Retraining
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl mt-1 leading-relaxed">
            Persistent autonomous retraining at 2:00 AM MYT (Asia/Kuala_Lumpur), candidate model benchmarking, atomic version promotion, and safe rollback safeguards.
          </p>
        </div>

        {/* Global Action & Authentication Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Administrator Identity Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Logged in: <strong className="text-white font-mono">{adminUser}</strong></span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30 font-bold">
              Super Admin
            </span>
          </div>

          <button
            onClick={() => fetchData(adminKey)}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            title="Refresh All Dashboard Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            title="Sign out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start space-x-3 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : feedback.type === "error"
              ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
              : "bg-blue-950/30 border-blue-500/40 text-blue-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : feedback.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-mono">{feedback.message}</div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pipeline Execution Status */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-mono tracking-wider">Scheduler Status</span>
            <RefreshCw className={`w-3.5 h-3.5 ${status?.is_training ? "animate-spin text-cyan-400" : "text-slate-500"}`} />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  status?.is_training
                    ? "bg-amber-400"
                    : status?.last_training_run?.status === "failed"
                    ? "bg-rose-400"
                    : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  status?.is_training
                    ? "bg-amber-500"
                    : status?.last_training_run?.status === "failed"
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                }`}
              />
            </span>
            <span className="text-lg font-bold text-white">
              {status?.is_training ? "Retraining Active" : "Scheduled"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {status?.is_training
              ? status.current_job?.progress || "Training in progress..."
              : `Next: ${formatMytDate(status?.next_scheduled_run_myt)}`}
          </p>
        </div>

        {/* Card 2: Active Production Model */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-mono tracking-wider">Active Champion</span>
            <Award className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="pt-1">
            <div className="text-base font-bold text-white truncate" title={status?.active_model_name}>
              {status?.active_model_name || "Gradient Boosting"}
            </div>
            <div className="text-xs font-mono text-cyan-400 mt-0.5">
              {status?.active_version || "v1.2.0-research"}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            In-memory atomic model serving live predictions.
          </p>
        </div>

        {/* Card 3: Next Scheduled Run */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-mono tracking-wider">Cron Schedule</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="pt-1">
            <div className="text-base font-bold text-white font-mono">02:00 AM MYT</div>
            <div className="text-xs text-slate-400">Asia/Kuala_Lumpur (UTC+8)</div>
          </div>
          <p className="text-[11px] text-slate-400">
            Persistent daily cron scheduler via APScheduler / background job.
          </p>
        </div>

        {/* Card 4: Dataset Integrity */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-mono tracking-wider">Dataset Checksum</span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="pt-1">
            <div className="text-xs font-mono text-slate-200 truncate" title={status?.dataset_sha256 || "N/A"}>
              {status?.dataset_sha256 ? status.dataset_sha256.substring(0, 16) + "..." : "Calculating..."}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Target Leakage Barred</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Skipped if fingerprint matches previous successful run.
          </p>
        </div>
      </div>

      {/* Manual Retraining Trigger Card */}
      <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-blue-500/20 bg-gradient-to-r from-blue-950/20 via-[#0B1120] to-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                Authorized Operations
              </span>
              <span className="text-xs font-mono text-slate-400">Non-blocking background thread</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Execute Model Retraining Pipeline</span>
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Triggers the complete automated workflow: dataset integrity audit, 80/20 partitioning, 5-fold cross-validation on all 4 regression models, atomic champion promotion, and manifest archiving.
            </p>

            <div className="pt-2 flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceRetrain}
                  onChange={(e) => setForceRetrain(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="font-mono text-slate-300">Force Retraining (bypass unchanged dataset fingerprint check)</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="run-training-btn"
              onClick={handleTriggerTraining}
              disabled={actionLoading || status?.is_training}
              className={`flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer ${
                status?.is_training
                  ? "bg-amber-600/30 border border-amber-500/40 text-amber-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/20 hover:shadow-cyan-500/30"
              }`}
            >
              {status?.is_training ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Training in Progress...</span>
                </>
              ) : actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Run Retraining Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Progress Bar if actively training */}
        {status?.is_training && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-cyan-400 font-semibold flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Job: {status.current_job?.run_id}</span>
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                Started: {formatMytDate(status.current_job?.started_at)}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full animate-pulse w-full" />
            </div>
            <p className="text-xs font-mono text-slate-300">
              Current Step: <span className="text-cyan-300 font-semibold">{status.current_job?.progress}</span>
            </p>
          </div>
        )}
      </div>

      {/* Model Benchmark Comparative Evaluation */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Current Production Benchmark (All 4 Algorithms)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across 5-fold cross-validation on 80% training set and held-out 20% test set.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 self-start sm:self-auto bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            Version: {status?.active_version || "v1.2.0-research"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-3">5-Fold CV MAE</th>
                <th className="py-3 px-3">5-Fold CV RMSE</th>
                <th className="py-3 px-3">5-Fold CV R²</th>
                <th className="py-3 px-3">Test MAE</th>
                <th className="py-3 px-3">Test R²</th>
                <th className="py-3 px-3">Generalization Gap</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {status?.active_metrics && status.active_metrics.length > 0 ? (
                status.active_metrics.map((m: BenchmarkModel, idx: number) => {
                  const isSelected = m.is_selected;
                  return (
                    <tr
                      key={idx}
                      className={
                        isSelected
                          ? "bg-emerald-950/20 text-emerald-300 font-medium"
                          : "hover:bg-slate-900/40 text-slate-300"
                      }
                    >
                      <td className="py-3.5 px-4 font-sans font-medium flex items-center space-x-2">
                        {isSelected ? (
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                        )}
                        <span>{m.model}</span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-cyan-400">
                        RM {m.cv_mae?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        RM {m.cv_rmse?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {m.cv_r2?.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        RM {m.test_mae?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {m.test_r2?.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={
                            m.generalization_gap > 3000
                              ? "text-rose-400"
                              : m.generalization_gap > 1500
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          RM {m.generalization_gap?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSelected ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            PROD CHAMPION
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                            Evaluated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    No active metrics loaded. Run training or verify backend connection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Version Archive & Safe Rollback */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Model Artifact Versions & Rollback</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                4 Supervised Models
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Every retraining cycle evaluates and registers all 4 candidate algorithms: Gradient Boosting, Random Forest, Ridge Regression, and Simple Linear. Paginated at strictly 5 records per table view.
            </p>
          </div>

          {/* View Mode Toggle and Search Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
              <button
                id="view-artifacts-toggle-btn"
                onClick={() => {
                  setVersionsViewMode("artifacts");
                  setVersionsPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  versionsViewMode === "artifacts"
                    ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All 4 Candidate Models
              </button>
              <button
                id="view-bundles-toggle-btn"
                onClick={() => {
                  setVersionsViewMode("versions");
                  setVersionsPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  versionsViewMode === "versions"
                    ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Version Runs
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="versions-search-input"
                type="text"
                value={versionsSearch}
                onChange={(e) => {
                  setVersionsSearch(e.target.value);
                  setVersionsPage(1);
                }}
                placeholder="Search models or artifacts..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <span className="text-xs font-mono text-cyan-400 bg-blue-950/40 border border-blue-800/40 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
              {totalVersionRecords} Records
            </span>
          </div>
        </div>

        {/* Algorithm Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Model:</span>
          </span>
          {[
            { id: "all", label: "All Models (4)" },
            { id: "Gradient Boosting", label: "Gradient Boosting" },
            { id: "Random Forest", label: "Random Forest" },
            { id: "Ridge", label: "Ridge Regression" },
            { id: "Linear", label: "Simple Linear" }
          ].map((tab) => {
            const isTabActive = versionsModelFilter === tab.id;
            return (
              <button
                key={tab.id}
                id={`filter-model-${tab.id.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => {
                  setVersionsModelFilter(tab.id);
                  setVersionsPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isTabActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold"
                    : "bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Table View (Responsive Container) */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Artifact ID & File</th>
                <th className="py-3 px-3">Date (MYT)</th>
                <th className="py-3 px-3">Model Name / Algorithm</th>
                <th className="py-3 px-3">Validation CV MAE</th>
                <th className="py-3 px-3">Validation CV R²</th>
                <th className="py-3 px-3">Candidate Role / Status</th>
                <th className="py-3 px-3">Artifact Storage</th>
                <th className="py-3 px-4 text-right">Deployment / Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {versionsViewMode === "artifacts" ? (
                paginatedArtifacts.length > 0 ? (
                  paginatedArtifacts.map((cand, idx) => {
                    const badge = getModelBadge(cand.model_name);
                    return (
                      <tr
                        key={`art-${cand.artifact_id || cand.version_id}-${versionStartIdx + idx}`}
                        className={cand.is_active ? "bg-emerald-950/20" : "hover:bg-slate-900/40"}
                      >
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-200">{cand.artifact_id}</span>
                            {cand.is_active && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] rounded font-bold uppercase">
                                Active
                              </span>
                            )}
                            {cand.is_champion && !cand.is_active && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] rounded font-bold uppercase">
                                Champion
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal font-mono mt-0.5">
                            {cand.artifact_filename}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 font-sans whitespace-nowrap">
                          {formatMytDate(cand.timestamp_myt || cand.timestamp_utc)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-200 font-sans">
                          <div className="font-semibold text-white">{cand.model_name}</div>
                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono border mt-0.5 ${badge.bg}`}>
                            {badge.tag}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-cyan-400 font-semibold whitespace-nowrap">
                          RM {cand.cv_mae?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "N/A"}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                          {cand.cv_r2 !== undefined && cand.cv_r2 !== null ? cand.cv_r2.toFixed(4) : "N/A"}
                        </td>
                        <td className="py-3.5 px-3 font-sans">
                          {cand.is_active ? (
                            <span className="inline-flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Production Active</span>
                            </span>
                          ) : cand.is_champion ? (
                            <span className="inline-flex items-center space-x-1 text-amber-400 text-xs">
                              <Award className="w-3.5 h-3.5" />
                              <span>Archived Champion</span>
                            </span>
                          ) : cand.model_name.includes("Baseline") ? (
                            <span className="text-slate-400 text-xs">Baseline Standby</span>
                          ) : (
                            <span className="text-cyan-400/90 text-xs">Candidate Standby</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={cand.artifact_location}>
                          {cand.artifact_location}
                        </td>
                        <td className="py-3.5 px-4 text-right font-sans">
                          {cand.is_active ? (
                            <span className="text-[11px] text-slate-500 italic">Current Active Model</span>
                          ) : (
                            <button
                              id={`rollback-btn-${cand.artifact_id || cand.version_id}`}
                              onClick={() => {
                                setRollbackModalVersion(cand.version_id);
                                setRollbackModalError(null);
                              }}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs transition-colors cursor-pointer"
                              title={`Rollback production model to version ${cand.version_id}`}
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Rollback</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No candidate model artifacts found matching the current search or filter.
                    </td>
                  </tr>
                )
              ) : (
                paginatedVersions.length > 0 ? (
                  paginatedVersions.map((ver, idx) => (
                    <tr
                      key={`ver-${ver.version_id || "v"}-${versionStartIdx + idx}`}
                      className={ver.is_active ? "bg-blue-950/20" : "hover:bg-slate-900/40"}
                    >
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center space-x-2">
                          <span>{ver.version_id}</span>
                          {ver.is_active && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] rounded font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal font-sans mt-0.5">
                          {ver.candidate_artifacts?.length || 4} Trained Models Registered
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-sans whitespace-nowrap">
                        {formatMytDate(ver.timestamp_myt || ver.timestamp_utc)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-200 font-sans">
                        <div className="font-semibold text-white">
                          {ver.selected_algorithm || ver.selected_model || "Gradient Boosting Regressor"}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ver.candidate_artifacts?.map((c) => (
                            <span key={c.artifact_id} className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {c.model_name.replace(" Regressor", "").replace(" Regression", "")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-cyan-400 font-semibold whitespace-nowrap">
                        RM {(ver.cv_mae ?? ver.champion_metrics?.cv_mae)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "N/A"}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                        {(ver.cv_r2 ?? ver.champion_metrics?.cv_r2)?.toFixed(4) || "N/A"}
                      </td>
                      <td className="py-3.5 px-3 font-sans">
                        {ver.is_active ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Production Active</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Archived Standby</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[10px] text-slate-400 font-mono">
                        versions/{ver.version_id}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        {ver.is_active ? (
                          <span className="text-[11px] text-slate-500 italic">Current Model</span>
                        ) : (
                          <button
                            id={`rollback-btn-${ver.version_id}`}
                            onClick={() => {
                              setRollbackModalVersion(ver.version_id);
                              setRollbackModalError(null);
                            }}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Rollback</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No versioned model archives detected.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Functional Pagination Controls Bar (Strictly 5 Records Per Page) */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
          <div className="text-slate-400">
            {totalVersionRecords === 0 ? (
              <span>Showing 0 records</span>
            ) : (
              <span>
                Showing <strong className="text-white">{versionStartIdx + 1}–{versionEndIdx}</strong> of{" "}
                <strong className="text-white">{totalVersionRecords}</strong> {versionsViewMode === "artifacts" ? "model artifacts" : "version archives"}{" "}
                <span className="text-slate-500">(Page {currentVersionsPage} of {totalVersionPages})</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
            {/* First Page Button */}
            {totalVersionPages > 5 && (
              <button
                id="versions-first-page-btn"
                onClick={() => setVersionsPage(1)}
                disabled={currentVersionsPage <= 1}
                title="First Page"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-medium transition-all ${
                  currentVersionsPage <= 1
                    ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                }`}
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Previous Page Button */}
            <button
              id="versions-prev-page-btn"
              onClick={() => setVersionsPage((p) => Math.max(1, p - 1))}
              disabled={currentVersionsPage <= 1}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                currentVersionsPage <= 1
                  ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Numbered Page Buttons (Limited to 5 Pages) */}
            <div className="flex items-center space-x-1">
              {getPaginationPages(currentVersionsPage, totalVersionPages, 5).map((pageNum) => {
                const isActive = pageNum === currentVersionsPage;
                return (
                  <button
                    key={pageNum}
                    id={`versions-page-btn-${pageNum}`}
                    onClick={() => setVersionsPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20 border border-blue-500"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              id="versions-next-page-btn"
              onClick={() => setVersionsPage((p) => Math.min(totalVersionPages, p + 1))}
              disabled={currentVersionsPage >= totalVersionPages}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                currentVersionsPage >= totalVersionPages
                  ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page Button */}
            {totalVersionPages > 5 && (
              <button
                id="versions-last-page-btn"
                onClick={() => setVersionsPage(totalVersionPages)}
                disabled={currentVersionsPage >= totalVersionPages}
                title="Last Page"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-medium transition-all ${
                  currentVersionsPage >= totalVersionPages
                    ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                }`}
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Retraining Execution Audit History with 5-Records-Per-Page Pagination */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Training Execution History (Audit Log)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive audit trail of completed runs, policy-skipped runs, and failures. Strictly 5 records per page.
            </p>
          </div>

          {/* Filtering and Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Status Filter Tabs */}
            <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-800 p-1 text-xs">
              {(["all", "completed", "skipped", "failed"] as const).map((st) => {
                const count = st === "all" ? history.length : history.filter((h) => h.status === st).length;
                const active = historyStatusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      setHistoryStatusFilter(st);
                      setHistoryPage(1); // Reset to page 1 on filter change
                    }}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                      active
                        ? "bg-blue-600/30 text-cyan-300 border border-cyan-500/40 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{st}</span>
                    <span className="ml-1.5 text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1); // Reset to page 1 on search change
                }}
                placeholder="Filter audit records..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Run ID & Version</th>
                <th className="py-3 px-3">Date (MYT)</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3">Force Flag</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-4">Decision & Execution Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item, idx) => (
                  <tr
                    key={`run-${item.run_id || "hist"}-${item.timestamp_utc || item.timestamp_myt || ""}-${startIdx + idx}`}
                    className="hover:bg-slate-900/40"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      <div>{item.run_id}</div>
                      {item.version_id && (
                        <div className="text-[10px] text-cyan-400 font-normal">
                          {item.version_id}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-sans">
                      {formatMytDate(item.timestamp_myt || item.timestamp_utc)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-sans">
                        {item.trigger === "scheduled_daily" ? "Daily Cron (02:00)" : item.trigger}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {item.force_retraining ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Forced: Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase bg-slate-800/80 text-slate-400 border border-slate-700/60">
                          Forced: No
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.status === "completed" ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      ) : item.status === "skipped" ? (
                        <span className="inline-flex items-center space-x-1 text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          <Info className="w-3 h-3" />
                          <span>Skipped</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {item.duration_seconds}s
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300 text-xs">
                      <div className="font-medium text-slate-200">
                        {item.action || item.message}
                      </div>

                      {item.status === "skipped" && item.skip_reason && (
                        <div className="text-[11px] text-amber-300/90 mt-1 bg-amber-950/20 p-1.5 rounded border border-amber-900/40 font-mono">
                          {item.skip_reason}
                        </div>
                      )}

                      {item.error && (
                        <div className="text-rose-400 font-mono text-[11px] mt-1 bg-rose-950/20 p-1.5 rounded border border-rose-900/40">
                          {item.error}
                        </div>
                      )}

                      {item.dataset_validation && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                          <span>Rows: {item.record_count ?? item.dataset_validation.row_count ?? 2500}</span>
                          <span>•</span>
                          <span className="text-emerald-400">Leakage Purged: True</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No historical executions match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Functional Pagination Controls Bar (5 Records Per Page) */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
          <div className="text-slate-400">
            {totalHistoryRecords === 0 ? (
              <span>Showing 0 records</span>
            ) : (
              <span>
                Showing <strong className="text-white">{startIdx + 1}–{endIdx}</strong> of{" "}
                <strong className="text-white">{totalHistoryRecords}</strong> records{" "}
                <span className="text-slate-500">(Page {currentHistoryPage} of {totalHistoryPages})</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
            {/* First Page Button */}
            {totalHistoryPages > 5 && (
              <button
                id="audit-first-page-btn"
                onClick={() => setHistoryPage(1)}
                disabled={currentHistoryPage <= 1}
                title="First Page"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-medium transition-all ${
                  currentHistoryPage <= 1
                    ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                }`}
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Previous Page Button */}
            <button
              id="audit-prev-page-btn"
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              disabled={currentHistoryPage <= 1}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                currentHistoryPage <= 1
                  ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Numbered Page Buttons (Limited to 5 Pages) */}
            <div className="flex items-center space-x-1">
              {getPaginationPages(currentHistoryPage, totalHistoryPages, 5).map((pageNum) => {
                const isActive = pageNum === currentHistoryPage;
                return (
                  <button
                    key={pageNum}
                    id={`audit-page-btn-${pageNum}`}
                    onClick={() => setHistoryPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20 border border-blue-500"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              id="audit-next-page-btn"
              onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
              disabled={currentHistoryPage >= totalHistoryPages}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                currentHistoryPage >= totalHistoryPages
                  ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page Button */}
            {totalHistoryPages > 5 && (
              <button
                id="audit-last-page-btn"
                onClick={() => setHistoryPage(totalHistoryPages)}
                disabled={currentHistoryPage >= totalHistoryPages}
                title="Last Page"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-medium transition-all ${
                  currentHistoryPage >= totalHistoryPages
                    ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                }`}
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rollback Confirmation Modal */}
      {rollbackModalVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel-elevated max-w-md w-full rounded-2xl p-6 border border-amber-500/40 bg-[#0B1120] space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-bold text-white">Confirm Model Rollback</h4>
            </div>

            {rollbackModalError && (
              <div
                id="modal-rollback-error"
                className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-start space-x-2.5 animate-in fade-in"
              >
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-mono text-[11px] leading-relaxed break-words">
                  <div className="font-bold text-rose-300 mb-0.5">Rollback Execution Error</div>
                  <div>{rollbackModalError}</div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed break-words">
              Are you sure you want to rollback the active production model to version{" "}
              <span className="font-mono font-bold text-cyan-300">{rollbackModalVersion}</span>?
            </p>

            <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl text-xs text-amber-200 font-sans space-y-1">
              <p className="font-semibold">Safety Measures Enacted:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/80">
                <li>Pre-validates model loading and test prediction before promotion.</li>
                <li>FastAPI memory reload triggered atomically without downtime.</li>
                <li>Current version remains safely archived in history.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="cancel-rollback-btn"
                onClick={() => {
                  setRollbackModalVersion(null);
                  setRollbackModalError(null);
                }}
                disabled={rollbackLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-rollback-btn"
                onClick={handleConfirmRollback}
                disabled={rollbackLoading}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {rollbackLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reverting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Rollback</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Viewport-Anchored Mobile & Desktop Toast Notification */}
      {feedback && (
        <div
          id="viewport-feedback-toast"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[100] animate-in slide-in-from-bottom-5 duration-300"
        >
          <div
            className={`p-4 rounded-2xl border text-xs shadow-2xl backdrop-blur-xl flex items-start space-x-3 transition-all ${
              feedback.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/60"
                : feedback.type === "error"
                ? "bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/60"
                : "bg-slate-900/95 border-cyan-500/60 text-cyan-100 shadow-cyan-950/60"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : feedback.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-mono text-[11px] sm:text-xs leading-relaxed break-words">
              <div className="font-bold uppercase tracking-wider mb-0.5 text-white">
                {feedback.type === "success" ? "Operation Successful" : feedback.type === "error" ? "System Error Alert" : "System Notification"}
              </div>
              <div className="text-slate-200">{feedback.message}</div>
            </div>
            <button
              id="dismiss-viewport-toast"
              onClick={() => setFeedback(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
