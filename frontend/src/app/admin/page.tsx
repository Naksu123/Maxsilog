"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  FileCheck
} from "lucide-react";
import {
  getTrainingStatus,
  getTrainingHistory,
  getArchivedModels,
  triggerManualTraining,
  rollbackModelVersion
} from "@/lib/api";
import {
  TrainingStatusResponse,
  TrainingHistoryItem,
  ModelVersionItem,
  BenchmarkModel
} from "@/types";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>("autovaluate-admin-2026");
  const [inputKey, setInputKey] = useState<string>("autovaluate-admin-2026");
  const [keySaved, setKeySaved] = useState<boolean>(true);

  const [status, setStatus] = useState<TrainingStatusResponse | null>(null);
  const [history, setHistory] = useState<TrainingHistoryItem[]>([]);
  const [versions, setVersions] = useState<ModelVersionItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [forceRetrain, setForceRetrain] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Rollback confirmation modal state
  const [rollbackModalVersion, setRollbackModalVersion] = useState<string | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState<boolean>(false);

  // Load saved admin key from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("autovaluate_admin_key");
      if (stored) {
        setAdminKey(stored);
        setInputKey(stored);
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
      setHistory(historyRes);
      setVersions(versionsRes);
      setFeedback(null);
    } catch (err: any) {
      console.error("Error loading admin data:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to authenticate or fetch admin status."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(adminKey);
  }, [adminKey, fetchData]);

  // Polling when training is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status?.is_training) {
      interval = setInterval(() => {
        getTrainingStatus(adminKey)
          .then((newStatus) => {
            setStatus(newStatus);
            if (!newStatus.is_training) {
              // Training just completed, refresh history and versions
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

  const handleSaveKey = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    setAdminKey(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("autovaluate_admin_key", trimmed);
    }
    setKeySaved(true);
    fetchData(trimmed);
  };

  const handleTriggerTraining = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await triggerManualTraining(adminKey, forceRetrain);
      setFeedback({
        type: "success",
        message: res.message || "Training job successfully dispatched to background worker."
      });
      // Immediately refresh status to pick up is_training = true
      const newStatus = await getTrainingStatus(adminKey);
      setStatus(newStatus);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to trigger training."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRollback = async () => {
    if (!rollbackModalVersion) return;
    setRollbackLoading(true);
    try {
      const res = await rollbackModelVersion(adminKey, rollbackModalVersion);
      setFeedback({
        type: "success",
        message: res.message || `Successfully rolled back active model to ${rollbackModalVersion}`
      });
      setRollbackModalVersion(null);
      await fetchData(adminKey);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to perform model rollback."
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Global Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(adminKey)}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="Refresh All Dashboard Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Admin Key & Security Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 bg-[#0B1120]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Administrator Credentials</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                X-Admin-Key Auth
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Administrative retraining and rollback endpoints are strictly protected by server token verification.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full lg:w-auto">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => {
              setInputKey(e.target.value);
              setKeySaved(false);
            }}
            placeholder="Enter Admin API Key"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
          />
          <button
            onClick={handleSaveKey}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shrink-0 shadow-sm shadow-blue-500/30"
          >
            Apply Key
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
              onClick={handleTriggerTraining}
              disabled={actionLoading || status?.is_training}
              className={`flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
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
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Model Artifact Versions & Rollback</span>
            </h3>
            <p className="text-xs text-slate-400">
              Every daily run preserves versioned model artifacts and manifests under backend/models/versions/.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-blue-950/40 border border-blue-800/40 px-2.5 py-1 rounded">
            Total Archives: {versions.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Version ID</th>
                <th className="py-3 px-3">Date (MYT)</th>
                <th className="py-3 px-3">Selected Model</th>
                <th className="py-3 px-3">Validation CV MAE</th>
                <th className="py-3 px-3">Validation CV R²</th>
                <th className="py-3 px-3">Records</th>
                <th className="py-3 px-3">Deployment Status</th>
                <th className="py-3 px-4 text-right">Rollback Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {versions.length > 0 ? (
                versions.map((ver, idx) => (
                  <tr key={idx} className={ver.is_active ? "bg-blue-950/20" : "hover:bg-slate-900/40"}>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <span>{ver.version_id}</span>
                      {ver.is_active && (
                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] rounded font-bold uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-sans">
                      {formatMytDate(ver.timestamp_myt || ver.timestamp_utc)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-200 font-sans">
                      {ver.selected_algorithm || ver.selected_model || "Gradient Boosting Regressor"}
                    </td>
                    <td className="py-3.5 px-3 text-cyan-400 font-semibold">
                      RM {(ver.cv_mae ?? ver.champion_metrics?.cv_mae)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "N/A"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {(ver.cv_r2 ?? ver.champion_metrics?.cv_r2)?.toFixed(4) || "N/A"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {ver.record_count}
                    </td>
                    <td className="py-3.5 px-3">
                      {ver.is_active ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Production Active</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Archived Standby</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ver.is_active ? (
                        <span className="text-[11px] text-slate-500 italic font-sans">Current Model</span>
                      ) : (
                        <button
                          id={`rollback-btn-${ver.version_id}`}
                          onClick={() => setRollbackModalVersion(ver.version_id)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-sans transition-colors cursor-pointer"
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
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    No versioned model archives detected. Retraining runs will automatically generate version manifests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retraining Execution Audit History */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Training Execution History (Audit Log)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit trail of successful runs, skipped runs (fingerprint unchanged), and failures.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Log entries: {history.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-3">Date (MYT)</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-4">Decision & Action Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      {item.run_id}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-sans">
                      {formatMytDate(item.timestamp_myt || item.timestamp_utc)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {item.trigger === "scheduled_daily" ? "Daily Cron (02:00)" : item.trigger}
                      </span>
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
                      <div>{item.action || item.message}</div>
                      {item.error && (
                        <div className="text-rose-400 font-mono text-[11px] mt-1 bg-rose-950/20 p-1.5 rounded border border-rose-900/40">
                          {item.error}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No historical executions logged yet. Scheduled daily runs and manual runs will record here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

            <p className="text-xs text-slate-300 leading-relaxed">
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
                onClick={() => setRollbackModalVersion(null)}
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
    </div>
  );
}
