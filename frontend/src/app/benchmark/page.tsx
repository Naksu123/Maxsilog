"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell,
  ReferenceLine
} from "recharts";
import { getModelMetrics } from "@/lib/api";
import { ModelMetricsResponse, BenchmarkModel } from "@/types";
import { 
  CHART_COLORS, 
  MODEL_COLORS, 
  formatRM, 
  formatPercent, 
  calculateErrorReduction 
} from "@/lib/chartTheme";
import AppleChartCard from "@/components/charts/AppleChartCard";
import ChartDefs from "@/components/charts/ChartDefs";

export default function BenchmarkPage() {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // User interactive comparison controls
  const [evalMode, setEvalMode] = useState<"cv" | "test">("cv");
  const [baselineModelName, setBaselineModelName] = useState<string>("Simple Linear Regression (Baseline)");
  const [hoveredMaeIdx, setHoveredMaeIdx] = useState<number | null>(null);
  const [hoveredR2Idx, setHoveredR2Idx] = useState<number | null>(null);

  useEffect(() => {
    getModelMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Error loading benchmark metrics:", err))
      .finally(() => setLoading(false));
  }, []);

  const benchmarkData = useMemo(() => metrics?.benchmark || [], [metrics]);

  // Identify selected champion model
  const selectedModel = useMemo(
    () => benchmarkData.find((m) => m.is_selected) || benchmarkData[3] || benchmarkData[0],
    [benchmarkData]
  );

  // Identify user selected baseline model
  const baselineModel = useMemo(() => {
    return benchmarkData.find((m) => m.model === baselineModelName) || benchmarkData[0];
  }, [benchmarkData, baselineModelName]);

  // Process chart data with exact percentage error reductions relative to baseline
  const processedMetrics = useMemo(() => {
    if (!baselineModel) return [];

    const baselineMae = evalMode === "cv" ? baselineModel.cv_mae : baselineModel.test_mae;
    const baselineRmse = evalMode === "cv" ? baselineModel.cv_rmse : baselineModel.test_rmse;

    return benchmarkData.map((m) => {
      const mae = evalMode === "cv" ? m.cv_mae : m.test_mae;
      const rmse = evalMode === "cv" ? m.cv_rmse : m.test_rmse;
      const r2 = evalMode === "cv" ? m.cv_r2 : m.test_r2;
      const r2Pct = r2 * 100;

      const maeReduction = calculateErrorReduction(baselineMae, mae);
      const rmseReduction = calculateErrorReduction(baselineRmse, rmse);

      const shortName = m.model
        .replace(" (Baseline)", "")
        .replace(" Regressor", "");

      const color = MODEL_COLORS[m.model] || CHART_COLORS.blue;

      return {
        ...m,
        shortName,
        mae: Math.round(mae),
        rmse: Math.round(rmse),
        r2Pct: Number(r2Pct.toFixed(2)),
        maeReduction: maeReduction !== null ? Number(maeReduction.toFixed(1)) : 0,
        rmseReduction: rmseReduction !== null ? Number(rmseReduction.toFixed(1)) : 0,
        color,
        isBaseline: m.model === baselineModel.model,
      };
    });
  }, [benchmarkData, baselineModel, evalMode]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-mono tracking-tight">
          Loading cross-validation & benchmark telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
          <span>Comparative Algorithm Benchmark</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Supervised Machine Learning Regression Evaluation
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Standardized empirical comparison of four candidate regression algorithms on the Malaysian automotive listings dataset.
          Model selection is determined by 5-fold cross-validation performance on the 80% training set to protect against test set overfitting.
        </p>
      </div>

      {/* Champion Model Summary Banner */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl shadow-purple-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Production Champion Model
              </span>
              <span className="text-xs font-mono text-slate-400">
                Version: {metrics?.model_version || "v_20261018"}
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                K-Folds: {metrics?.k_folds || 5} • Random State: 42
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>{metrics?.selected_model || "Gradient Boosting Regressor"}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Selected objectively based on achieving the lowest 5-fold cross-validation error 
              (<span className="text-purple-300 font-semibold font-mono">CV MAE = RM {selectedModel ? Math.round(selectedModel.cv_mae).toLocaleString() : "22,072"}</span>) and the strongest explanatory power 
              (<span className="text-purple-300 font-semibold font-mono">CV R² = {selectedModel ? (selectedModel.cv_r2 * 100).toFixed(2) + "%" : "80.79%"}</span>), reducing mean prediction error by{" "}
              <span className="text-emerald-400 font-semibold font-mono">
                {baselineModel && selectedModel
                  ? calculateErrorReduction(baselineModel.cv_mae, selectedModel.cv_mae)?.toFixed(1) + "%"
                  : "66.1%"}
              </span>{" "}
              relative to simple linear baseline.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center shrink-0">
            <div className="p-2 space-y-0.5">
              <span className="block text-[10px] uppercase font-mono text-slate-400">CV MAE</span>
              <span className="text-base sm:text-lg font-bold font-mono text-purple-400">
                RM {selectedModel ? Math.round(selectedModel.cv_mae).toLocaleString() : "22,072"}
              </span>
              <span className="block text-[9px] font-mono text-slate-500">±RM {selectedModel ? Math.round(selectedModel.cv_mae_std).toLocaleString() : "2,209"}</span>
            </div>
            <div className="p-2 space-y-0.5">
              <span className="block text-[10px] uppercase font-mono text-slate-400">CV RMSE</span>
              <span className="text-base sm:text-lg font-bold font-mono text-blue-400">
                RM {selectedModel ? Math.round(selectedModel.cv_rmse).toLocaleString() : "42,744"}
              </span>
              <span className="block text-[9px] font-mono text-slate-500">±RM {selectedModel ? Math.round(selectedModel.cv_rmse_std).toLocaleString() : "10,567"}</span>
            </div>
            <div className="p-2 space-y-0.5">
              <span className="block text-[10px] uppercase font-mono text-slate-400">CV R² (%)</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                {selectedModel ? (selectedModel.cv_r2 * 100).toFixed(2) + "%" : "80.79%"}
              </span>
              <span className="block text-[9px] font-mono text-slate-500">Goodness of Fit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Interactive Benchmark Controls */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Evaluation Dataset Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
            Evaluation Split:
          </span>
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setEvalMode("cv")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                evalMode === "cv"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              5-Fold Cross-Validation (80% Train)
            </button>
            <button
              onClick={() => setEvalMode("test")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                evalMode === "test"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Holdout Test Set (20% Untouched)
            </button>
          </div>
        </div>

        {/* Baseline Model Comparison Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="baseline-select" className="text-xs font-medium text-slate-400 font-mono">
            Comparison Baseline:
          </label>
          <select
            id="baseline-select"
            value={baselineModelName}
            onChange={(e) => setBaselineModelName(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
          >
            {benchmarkData.map((m) => (
              <option key={m.model} value={m.model}>
                {m.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Error Reduction Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {processedMetrics.map((item) => {
          const isBaseline = item.isBaseline;
          const isBest = item.model === selectedModel?.model;

          return (
            <div
              key={item.model}
              className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all ${
                isBest
                  ? "border-purple-500/50 bg-purple-950/10 shadow-lg shadow-purple-950/20"
                  : isBaseline
                  ? "border-amber-500/40 bg-amber-950/10"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white truncate max-w-[170px]">
                  {item.shortName}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div className="pt-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {evalMode === "cv" ? "CV MAE" : "Test MAE"}:
                  </span>
                  <span className="text-sm font-bold font-mono text-white">
                    RM {item.mae.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Error Reduction:</span>
                  {isBaseline ? (
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      [Reference Baseline]
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-mono font-bold ${
                        item.maeReduction > 0
                          ? "text-emerald-400"
                          : item.maeReduction < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {item.maeReduction > 0 ? `+${item.maeReduction}% lower error` : `${item.maeReduction}%`}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 font-mono">R² Score:</span>
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {item.r2Pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benchmark Visualizations: Two-Column Proportional Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Mean Absolute Error (MAE) with Dynamic Reduction */}
        <AppleChartCard
          title="Mean Absolute Error (MAE) Comparison"
          subtitle={`Evaluated on ${evalMode === "cv" ? "5-Fold Cross-Validation (80% Train)" : "Holdout Test Set (20% Holdout)"}. Lower RM values represent superior prediction accuracy.`}
          badge="Error Metric (RM)"
          badgeColor="teal"
          footerNotes={
            <span>
              Baseline Reference: <strong className="text-amber-400">{baselineModel?.model}</strong>. Error reduction formula:{" "}
              <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">
                ((Baseline - Candidate) / Baseline) × 100
              </code>
            </span>
          }
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedMetrics}
                margin={{ top: 20, right: 20, bottom: 25, left: 15 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredMaeIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredMaeIdx(null)}
              >
                <ChartDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke={CHART_COLORS.neutral}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={CHART_COLORS.neutral}
                  fontSize={11}
                  tickFormatter={(v) => `RM ${Math.round(v / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 text-xs text-white space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white">{d.model}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400">
                            {evalMode === "cv" ? "CV MAE" : "Test MAE"}:
                          </span>
                          <span className="font-bold text-white">RM {d.mae.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400">vs Baseline:</span>
                          <span
                            className={`font-bold ${
                              d.maeReduction > 0
                                ? "text-emerald-400"
                                : d.maeReduction < 0
                                ? "text-rose-400"
                                : "text-amber-400"
                            }`}
                          >
                            {d.isBaseline ? "Reference" : `${d.maeReduction > 0 ? "+" : ""}${d.maeReduction}% reduction`}
                          </span>
                        </div>
                        {evalMode === "cv" && (
                          <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                            Standard Deviation: ±RM {Math.round(d.cv_mae_std).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={evalMode === "cv" ? baselineModel?.cv_mae : baselineModel?.test_mae}
                  stroke={CHART_COLORS.amber}
                  strokeDasharray="4 4"
                  label={{
                    value: "Baseline Error",
                    fill: CHART_COLORS.amber,
                    fontSize: 10,
                    position: "top",
                  }}
                />
                <Bar 
                  dataKey="mae" 
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedMetrics.map((entry, index) => {
                    const isHovered = hoveredMaeIdx === index;
                    const isAnyHovered = hoveredMaeIdx !== null;
                    const fill = entry.model.includes("Gradient")
                      ? (isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)")
                      : entry.model.includes("Random")
                      ? (isHovered ? "url(#blueBarGradActive)" : "url(#blueBarGrad)")
                      : entry.model.includes("Ridge")
                      ? (isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)")
                      : (isHovered ? "url(#amberBarGradActive)" : "url(#amberBarGrad)");
                    return (
                      <Cell
                        key={`cell-${entry.model}`}
                        fill={fill}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.85)" : "transparent"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppleChartCard>

        {/* Chart 2: Coefficient of Determination (R²) Goodness of Fit */}
        <AppleChartCard
          title="Coefficient of Determination [R² (%)]"
          subtitle={`Proportion of listing price variance explained by predictors on ${evalMode === "cv" ? "5-Fold CV" : "Holdout Test"}. Higher values indicate superior explanatory fit.`}
          badge="Explanatory Fit (%)"
          badgeColor="green"
          footerNotes={
            <span>
              Academic Disclosure: R² represents the <strong className="text-white">coefficient of determination</strong> (1 − SS_res / SS_tot), NOT prediction accuracy. Negative R² reflects severe underfitting.
            </span>
          }
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedMetrics}
                margin={{ top: 20, right: 20, bottom: 25, left: 10 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredR2Idx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredR2Idx(null)}
              >
                <ChartDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke={CHART_COLORS.neutral}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={CHART_COLORS.neutral}
                  fontSize={11}
                  domain={[-10, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 text-xs text-white space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white">{d.model}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400">Coefficient of Determination:</span>
                          <span className="font-bold text-emerald-400">{d.r2Pct}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                          {evalMode === "cv"
                            ? `Fold Fold Variance: ±${(d.cv_r2_std * 100).toFixed(2)}%`
                            : `Holdout Generalization Gap: ${Math.round(d.generalization_gap).toLocaleString()} RM`}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="#64748b" />
                <Bar 
                  dataKey="r2Pct" 
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedMetrics.map((entry, index) => {
                    const isHovered = hoveredR2Idx === index;
                    const isAnyHovered = hoveredR2Idx !== null;
                    const fill = entry.r2Pct < 0
                      ? "url(#redBarGrad)"
                      : entry.model.includes("Gradient")
                      ? (isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)")
                      : entry.model.includes("Random")
                      ? (isHovered ? "url(#blueBarGradActive)" : "url(#blueBarGrad)")
                      : entry.model.includes("Ridge")
                      ? (isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)")
                      : (isHovered ? "url(#amberBarGradActive)" : "url(#amberBarGrad)");
                    return (
                      <Cell
                        key={`cell-r2-${entry.model}`}
                        fill={fill}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.85)" : "transparent"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppleChartCard>
      </div>

      {/* Benchmark Comparison Master Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">Algorithm Benchmark Comparison Master Table</h2>
            <p className="text-xs text-slate-400">
              Evaluated under a consistent 80/20 train-test split with 5-fold cross-validation applied strictly to the training partition.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl w-fit">
            Random State: 42 • Holdout Samples: {metrics?.test_size || 497}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-3">Algorithm</th>
                <th className="py-3 px-3 text-right">5-Fold CV MAE</th>
                <th className="py-3 px-3 text-right">5-Fold CV RMSE</th>
                <th className="py-3 px-3 text-right">5-Fold CV R² (%)</th>
                <th className="py-3 px-3 text-right">Holdout Test MAE</th>
                <th className="py-3 px-3 text-right">Holdout Test RMSE</th>
                <th className="py-3 px-3 text-right">Holdout Test R² (%)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {benchmarkData.map((row) => (
                <tr 
                  key={row.model} 
                  className={`transition-colors ${
                    row.is_selected 
                      ? "bg-purple-950/20 font-medium border-l-2 border-purple-500" 
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  <td className="py-3 px-3 text-white font-semibold flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: MODEL_COLORS[row.model] || "#3b82f6" }}
                    />
                    <span>{row.model}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-purple-400">
                    RM {Math.round(row.cv_mae).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    RM {Math.round(row.cv_rmse).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                    {(row.cv_r2 * 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    RM {Math.round(row.test_mae).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    RM {Math.round(row.test_rmse).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {(row.test_r2 * 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.is_selected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        CHAMPION
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                        CANDIDATE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Residual Diagnostics & Outlier Integrity Audit */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-900/40 space-y-5 bg-gradient-to-b from-[#0F172A] to-[#121324]">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <span className="font-mono font-bold text-xs">!</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Residual Error Analysis & Empirical Outlier Audit
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Transparent reporting of model limitations and marketplace anomalies. 
              The holdout test set contains extreme seller data-entry anomalies (e.g. economy hatchbacks mistakenly listed for over RM 1 Million by classifieds advertisers), 
              which cause quadratic error inflation in holdout RMSE and test R² while cross-validation remains robust.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Vehicle Description</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3 text-right">Mileage</th>
                <th className="py-2.5 px-3 text-right">Actual Listed Price</th>
                <th className="py-2.5 px-3 text-right">Model Prediction</th>
                <th className="py-2.5 px-3 text-right">Residual Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {metrics?.diagnostic_outliers?.map((item) => (
                <tr key={item.index} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-white max-w-xs truncate">{item.description}</td>
                  <td className="py-2.5 px-3 text-purple-300 font-medium">{item.model}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {item.mileage.toLocaleString()} KM
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                    RM {Math.round(item.actual_price).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                    RM {Math.round(item.predicted_price).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">
                    +RM {Math.round(item.residual_error).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
