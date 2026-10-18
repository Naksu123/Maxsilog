"use client";

import React, { useEffect, useState } from "react";
import { 
  Award, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  BookOpen, 
  Cpu, 
  BarChart2, 
  Activity, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell 
} from "recharts";
import { getModelMetrics } from "@/lib/api";
import { ModelMetricsResponse, BenchmarkModel, DiagnosticOutlier } from "@/types";

export default function BenchmarkPage() {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Error loading benchmark metrics:", err))
      .finally(() => setLoading(false));
  }, []);

  const benchmarkData = metrics?.benchmark || [];

  // Chart data formatting
  const chartMaeData = benchmarkData.map((m) => ({
    name: m.model.replace(" (Baseline)", "").replace(" Regressor", ""),
    "CV MAE": Math.round(m.cv_mae),
    "Test MAE": Math.round(m.test_mae)
  }));

  const chartR2Data = benchmarkData.map((m) => ({
    name: m.model.replace(" (Baseline)", "").replace(" Regressor", ""),
    "CV R²": Number(m.cv_r2.toFixed(3)),
    "Test R²": Number(m.test_r2.toFixed(3))
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Comparative Algorithm Benchmark</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Supervised Machine Learning Regression Evaluation
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Standardized empirical comparison of four regression algorithms on the Malaysian automotive listings dataset.
          Model selection is determined strictly by 5-fold cross-validation performance on the 80% training set.
        </p>
      </div>

      {/* Model Selection Champion Banner */}
      <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-emerald-500/30 glow-blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Selected Final Model
              </span>
              <span className="text-xs font-mono text-slate-400">Version: {metrics?.model_version || "v1.2.0-research"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>{metrics?.selected_model || "Gradient Boosting Regressor"}</span>
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Selected objectively based on achieving the lowest 5-fold cross-validation error 
              (<span className="text-cyan-300 font-semibold font-mono">CV MAE = RM 18,345.57</span>) and the strongest explanatory power 
              (<span className="text-cyan-300 font-semibold font-mono">CV R² = 0.8972</span>) during controlled model validation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center">
            <div>
              <span className="block text-[10px] uppercase font-mono text-slate-400">CV MAE</span>
              <span className="text-lg font-bold font-mono text-cyan-400">RM 18,346</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-slate-400">CV RMSE</span>
              <span className="text-lg font-bold font-mono text-blue-400">RM 33,832</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-slate-400">CV R²</span>
              <span className="text-lg font-bold font-mono text-emerald-400">0.8972</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Master Table */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">Algorithm Benchmark Comparison Master Table</h2>
            <p className="text-xs text-slate-400">
              Evaluated under a consistent 80/20 split with 5-fold cross-validation applied strictly to the training set.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg w-fit">
            Random State: 42
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-3">Algorithm</th>
                <th className="py-3 px-3 text-right">5-Fold CV MAE</th>
                <th className="py-3 px-3 text-right">5-Fold CV RMSE</th>
                <th className="py-3 px-3 text-right">5-Fold CV R²</th>
                <th className="py-3 px-3 text-right">Holdout Test MAE</th>
                <th className="py-3 px-3 text-right">Holdout Test RMSE</th>
                <th className="py-3 px-3 text-right">Holdout Test R²</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {benchmarkData.map((row) => (
                <tr 
                  key={row.model} 
                  className={`transition-colors ${
                    row.is_selected 
                      ? "bg-emerald-950/20 font-medium border-l-2 border-emerald-500" 
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  <td className="py-3 px-3 text-white font-semibold flex items-center space-x-2">
                    {row.is_selected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    <span>{row.model}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400">
                    RM {Math.round(row.cv_mae).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    RM {Math.round(row.cv_rmse).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                    {row.cv_r2.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    RM {Math.round(row.test_mae).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    RM {Math.round(row.test_rmse).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {row.test_r2.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.is_selected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
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

      {/* Benchmark Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MAE Comparison Chart */}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Mean Absolute Error (MAE) Comparison</h3>
              <p className="text-xs text-slate-400">Lower values indicate superior predictive accuracy (in RM)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Error (RM)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMaeData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `RM ${Math.round(v/1000)}k`} />
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1">
                          <p className="font-bold text-white">{payload[0].payload.name}</p>
                          <p className="text-cyan-400">CV MAE: RM {payload[0].payload["CV MAE"].toLocaleString()}</p>
                          <p className="text-slate-400">Test MAE: RM {payload[0].payload["Test MAE"].toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                <Bar dataKey="CV MAE" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Test MAE" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* R² Explanatory Power Comparison */}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Coefficient of Determination (R²)</h3>
              <p className="text-xs text-slate-400">Proportion of listing price variance explained by predictors</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              Goodness of Fit
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartR2Data} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[-0.2, 1.0]} />
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1">
                          <p className="font-bold text-white">{payload[0].payload.name}</p>
                          <p className="text-emerald-400">CV R²: {payload[0].payload["CV R²"]}</p>
                          <p className="text-slate-400">Test R²: {payload[0].payload["Test R²"]}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                <Bar dataKey="CV R²" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Test R²" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Residual Diagnostics & Outlier Integrity Audit */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-900/40 space-y-5 bg-gradient-to-b from-[#0F172A] to-[#121324]">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Residual Error Analysis & Empirical Outlier Audit
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Transparent reporting of model limitations and marketplace anomalies. 
              The holdout test set contains extreme data-entry outliers (e.g. economy hatchbacks mistakenly listed for over RM 1 Million by sellers), 
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
                  <td className="py-2.5 px-3 text-cyan-300 font-medium">{item.model}</td>
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

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-200">Key Research Takeaway:</p>
          <p className="leading-relaxed">
            The machine learning model predicted rational market prices (~RM 52k - RM 72k) for the MG ZS and Chevrolet Cruze listings, 
            resisting the erroneous RM 1,172,000 asking price entered by sellers. This demonstrates genuine learned feature representations 
            rather than rote memorization.
          </p>
        </div>
      </div>

      {/* Research Methodology Synthesis Section (UNO-R Alignment) */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Research Methodology & Theoretical Foundation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          {/* Section 1 */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-1.5">
              <span>1. Input-Process-Output (IPO) Framework</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              The research employs an Input-Process-Output paradigm. The <span className="text-slate-200 font-medium">Input</span> consists of 2,500 Malaysian automotive listings.
              The <span className="text-slate-200 font-medium">Process</span> encompasses rigorous data cleansing, target leakage isolation, feature engineering, 80/20 partitioning, and 5-fold cross-validation.
              The <span className="text-slate-200 font-medium">Output</span> delivers evidence-based resale valuation estimates and empirical benchmark metrics.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-1.5">
              <span>2. Target Leakage Prevention</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              The attribute <code className="text-cyan-300">Monthly_Installment</code> was formally excluded prior to training. 
              Because monthly payments are calculated as an amortization function of asking price by automotive lenders, 
              incorporating them would introduce acute target leakage and artificially inflate R² to 1.0, destroying generalizability.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-1.5">
              <span>3. Scikit-Learn Preprocessing Pipelines</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              Preprocessing utilizes scikit-learn <code className="text-cyan-300">ColumnTransformer</code>. Numerical features (Mileage, Vehicle_Age, Engine_Size) are imputed via median strategy and scaled using StandardScaler for linear and Ridge models. Categorical features (Model, Gear_Type, State) are encoded via OneHotEncoder with unknown category handling.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-1.5">
              <span>4. Evaluation Metrics (MAE, RMSE, R²)</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              Performance is measured using <span className="text-slate-200 font-medium">Mean Absolute Error (MAE)</span> for direct interpretability in Ringgit, 
              <span className="text-slate-200 font-medium"> Root Mean Squared Error (RMSE)</span> to penalize disproportionately large errors, and the 
              <span className="text-slate-200 font-medium"> Coefficient of Determination (R²)</span> to measure the proportion of explained variance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
