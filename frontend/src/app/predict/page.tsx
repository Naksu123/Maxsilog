"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Car, 
  Gauge, 
  Settings2, 
  MapPin, 
  Calendar, 
  Flame, 
  Sparkles, 
  ArrowRight, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Cpu,
  Layers,
  ChevronDown,
  Zap,
  ShieldCheck
} from "lucide-react";
import { getMetadata, predictPrice } from "@/lib/api";
import { ModelMetadata, PredictRequest, PredictResponse } from "@/types";

export default function PredictPage() {
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form states
  const [selectedModel, setSelectedModel] = useState<string>("Honda Civic");
  const [mileage, setMileage] = useState<number>(75000);
  const [gearType, setGearType] = useState<string>("Automatic");
  const [state, setState] = useState<string>("Selangor");
  const [year, setYear] = useState<number | "">(2018);
  const [engineSize, setEngineSize] = useState<number | "">(1.5);
  const [algorithm, setAlgorithm] = useState<string>("Gradient Boosting Regressor");

  // Search filter for car model dropdown
  const [modelSearch, setModelSearch] = useState<string>("");

  // Prediction states
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetadata()
      .then((data) => {
        setMetadata(data);
        if (data.available_models && data.available_models.length > 0) {
          // Default to Honda Civic if present, or first model
          const defaultModel = data.available_models.includes("Honda Civic")
            ? "Honda Civic"
            : data.available_models[0];
          setSelectedModel(defaultModel);

          // Autofill defaults for that model
          const info = data.model_lookup[defaultModel];
          if (info) {
            setYear(info.default_year);
            setEngineSize(info.default_engine_size);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load metadata:", err);
      })
      .finally(() => setLoadingMeta(false));
  }, []);

  // When model changes, update default year and engine size
  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    if (metadata && metadata.model_lookup[modelName]) {
      const info = metadata.model_lookup[modelName];
      setYear(info.default_year);
      setEngineSize(info.default_engine_size);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPredicting(true);

    try {
      const payload: PredictRequest = {
        model: selectedModel,
        mileage: Number(mileage),
        gear_type: gearType,
        state: state,
        year: year ? Number(year) : undefined,
        engine_size: engineSize ? Number(engineSize) : undefined,
        algorithm: algorithm,
      };

      const res = await predictPrice(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate valuation. Please verify inputs or API connectivity.");
    } finally {
      setPredicting(false);
    }
  };

  const filteredModels = metadata?.available_models.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Machine Learning Valuation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Used-Car Listing Price Predictor
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Enter observable vehicle characteristics to generate a real-time price prediction.
          Strictly isolated from monthly installment variables to guarantee unbiased regression estimation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handlePredict} 
            className="glass-panel-elevated rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-800"
          >
            {/* Algorithm Selector */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Machine Learning Algorithm</span>
                </span>
                <span className="text-[11px] text-slate-400">Model version: v1.2.0</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: "Gradient Boosting Regressor",
                    title: "Gradient Boosting",
                    tag: "Champion / Lowest CV MAE",
                    highlight: true
                  },
                  {
                    id: "Random Forest Regressor",
                    title: "Random Forest",
                    tag: "Ensemble Trees",
                    highlight: false
                  },
                  {
                    id: "Ridge Regression",
                    title: "Ridge Regression",
                    tag: "L2 Regularized",
                    highlight: false
                  },
                  {
                    id: "Simple Linear Regression (Baseline)",
                    title: "Linear Baseline",
                    tag: "Mileage Only",
                    highlight: false
                  }
                ].map((algo) => (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => setAlgorithm(algo.id)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      algorithm === algo.id
                        ? "bg-blue-600/20 border-cyan-500/60 text-white shadow-md shadow-cyan-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{algo.title}</span>
                      {algo.highlight && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                          BEST
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{algo.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Model */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span>Vehicle Make & Model</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {metadata?.available_models.length || 0} models available
                </span>
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Filter vehicle models (e.g. Civic, Vios, C200)..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />

                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-medium cursor-pointer"
                >
                  {filteredModels.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {metadata?.model_lookup[selectedModel] && (
                <div className="text-[11px] text-slate-400 flex items-center space-x-3 pt-1">
                  <span>Median Market: RM {Math.round(metadata.model_lookup[selectedModel].median_price).toLocaleString()}</span>
                  <span>•</span>
                  <span>{metadata.model_lookup[selectedModel].count} listings in dataset</span>
                </div>
              )}
            </div>

            {/* Mileage Input & Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Odometer Mileage (KM)</span>
                </label>
                <div className="font-mono text-cyan-400 font-bold text-sm">
                  {Number(mileage).toLocaleString()} KM
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="250000"
                step="2500"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {[
                  { label: "15k (Newer)", val: 15000 },
                  { label: "45k (Low)", val: 45000 },
                  { label: "80k (Avg)", val: 80000 },
                  { label: "120k (Mid)", val: 120000 },
                  { label: "180k (High)", val: 180000 }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setMileage(p.val)}
                    className={`flex-1 py-1 rounded text-[10px] font-mono border transition-all ${
                      mileage === p.val
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gear Type & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Settings2 className="w-4 h-4 text-cyan-400" />
                  <span>Transmission Type</span>
                </label>
                <select
                  value={gearType}
                  onChange={(e) => setGearType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="Automatic">Automatic (A)</option>
                  <option value="Manual">Manual (M)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>State / Region</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {metadata?.available_states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )) || (
                    <>
                      <option value="Selangor">Selangor</option>
                      <option value="Kuala Lumpur">Kuala Lumpur</option>
                      <option value="Penang">Penang</option>
                      <option value="Johor">Johor</option>
                      <option value="Perak">Perak</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Optional Engine & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Year of Make</span>
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 2018"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Autofilled default from dataset median
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-slate-400" />
                  <span>Engine Displacement (Liters)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.6"
                  max="6.0"
                  value={engineSize}
                  onChange={(e) => setEngineSize(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 1.8"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Engine size in Liters (e.g. 1.5, 2.0, 3.0)
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={predicting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {predicting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calculating ML Valuation...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate Estimated Price</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Valuation Result Display Column */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-cyan-500/30 space-y-6 glow-blue">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                    Valuation Successful
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {result.algorithm_used}
                </span>
              </div>

              {/* Price Callout */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estimated Resale Listing Price
                </p>
                <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  RM {Math.round(result.estimated_price).toLocaleString()}
                </div>
              </div>

              {/* Confidence Band */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Fair Market Range</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    RM {Math.round(result.fair_price_low).toLocaleString()} – RM {Math.round(result.fair_price_high).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-full rounded-full opacity-80" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Derived from cross-validation mean absolute error bounds for {result.algorithm_used}.
                </p>
              </div>

              {/* Input Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Parameters Evaluated
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Model</span>
                    <span className="font-semibold text-white">{result.input_summary.model}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Mileage</span>
                    <span className="font-mono font-semibold text-white">
                      {result.input_summary.mileage_km.toLocaleString()} KM
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Transmission</span>
                    <span className="font-semibold text-white">{result.input_summary.gear_type}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <span className="font-semibold text-white">{result.input_summary.state}</span>
                  </div>
                </div>
              </div>

              {/* Actions & Financing Jump */}
              <div className="pt-2 space-y-3">
                <Link
                  href={`/financing?price=${Math.round(result.estimated_price)}`}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <Calculator className="w-4 h-4 text-cyan-400" />
                  <span>Calculate Monthly Hire-Purchase Installment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Academic & Market Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300/80 leading-relaxed">
                <div className="font-semibold text-amber-200 mb-0.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Research Valuation Disclaimer</span>
                </div>
                {result.disclaimer}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Car className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Valuation Calculated Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select your vehicle model, odometer reading, and regional attributes in the form to generate a statistical price estimate.
                </p>
              </div>
              <div className="pt-2 inline-flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Powered by Scikit-Learn Pipelines</span>
              </div>
            </div>
          )}

          {/* Target Leakage Banner */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Target Leakage Protection Guarantee</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              AutoValuate strictly removes financing attributes like <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">Monthly_Installment</code> from
              all model inputs. This guarantees that predicted prices reflect genuine observable vehicle wear and depreciation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
