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
  ShieldCheck,
  TrendingUp,
  Tag,
  DollarSign,
  Wallet,
  Wrench,
  Award,
  Check
} from "lucide-react";
import { getMetadata, predictPrice } from "@/lib/api";
import { ModelMetadata, PredictRequest, PredictResponse } from "@/types";

// Helper: Calculate estimated Malaysian Hire-Purchase installment (10% down, 7 years, 3.2% fixed interest)
function calculateInstallment(price: number) {
  const deposit = price * 0.10;
  const principal = price * 0.90;
  const totalInterest = principal * 0.032 * 7;
  const monthly = Math.round((principal + totalInterest) / 84);
  return { deposit: Math.round(deposit), monthly };
}

// Helper: Malaysian annual road tax estimate by engine displacement
function getRoadTax(liters: number): number {
  if (liters <= 1.0) return 20;
  if (liters <= 1.2) return 55;
  if (liters <= 1.5) return 90;
  if (liters <= 1.6) return 120;
  if (liters <= 1.8) return 280;
  if (liters <= 2.0) return 437;
  if (liters <= 2.5) return 880;
  return 1600;
}

// Helper: Mileage health assessment based on Malaysian standard benchmark (18,000–20,000 km/yr)
function getMileageHealth(mileage: number, ageYears: number) {
  const effectiveAge = Math.max(1, ageYears || 1);
  const annualMileage = Math.round(mileage / effectiveAge);
  if (annualMileage < 14000) {
    return {
      status: "Low Mileage",
      annualMileage,
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      badgeText: "High Value Retention",
      description: `~${annualMileage.toLocaleString()} km/year. Well below Malaysian standard (18,000–20,000 km/yr). Engine and transmission wear is minimal, commanding a resale price premium.`
    };
  } else if (annualMileage <= 22000) {
    return {
      status: "Standard Mileage",
      annualMileage,
      badgeColor: "bg-blue-500/20 text-cyan-300 border-cyan-500/40",
      badgeText: "Normal Market Wear",
      description: `~${annualMileage.toLocaleString()} km/year. Standard daily Malaysian commuting usage. Aligns closely with empirical training distributions.`
    };
  } else {
    return {
      status: "High Mileage",
      annualMileage,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      badgeText: "Heavy Usage Advisory",
      description: `~${annualMileage.toLocaleString()} km/year. Above average highway/commercial use. Recommend inspecting transmission fluid, timing belt, and suspension bushings.`
    };
  }
}

// Helper: Pricing strategy breakdown (Buyer target, Seller asking, Dealer trade-in)
function getPricingStrategy(est: number, low: number, high: number) {
  return {
    buyerTarget: Math.round(low + (est - low) * 0.35),
    sellerAsking: Math.round(est * 1.04),
    tradeInEstimate: Math.round(est * 0.85),
  };
}

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

  // Computed valuation recommendations
  const pricingStrategy = result ? getPricingStrategy(result.estimated_price, result.fair_price_low, result.fair_price_high) : null;
  const mileageHealth = result ? getMileageHealth(result.input_summary.mileage_km, result.input_summary.vehicle_age_years) : null;
  const financingQuick = result ? calculateInstallment(result.estimated_price) : null;
  const roadTaxEst = result ? getRoadTax(result.input_summary.engine_displacement_liters) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Machine Learning Valuation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Predict Used-Car Market Value
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Enter vehicle attributes to compute an empirical price estimate derived from supervised regression models trained on real Malaysian used-car resale listings.
        </p>
      </div>

      {/* Main Grid: Form + Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <form onSubmit={handlePredict} className="space-y-6">
            
            {/* Algorithm Selector */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Machine Learning Algorithm</span>
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {algorithm.includes("Gradient") ? "★ Selected Champion" : "Alternative Model"}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: "Gradient Boosting Regressor", name: "Gradient Boosting", sub: "Production Champion • CV MAE RM 18,345" },
                  { id: "Random Forest Regressor", name: "Random Forest", sub: "Ensemble Trees • Non-linear" },
                  { id: "Ridge Regression", name: "Ridge Regression", sub: "L2 Regularized Linear" },
                  { id: "Simple Linear Regression (Baseline)", name: "Simple Linear", sub: "Unregularized Baseline OLS" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAlgorithm(item.id)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs ${
                      algorithm === item.id
                        ? "bg-blue-600/20 border-cyan-500 text-white shadow-md shadow-blue-500/10 font-medium"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{item.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Search & Select */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span>Vehicle Model</span>
                </span>
                {metadata && (
                  <span className="text-[11px] text-slate-400">
                    {metadata.available_models.length} Malaysian models available
                  </span>
                )}
              </label>

              {/* Filter search bar */}
              <input
                type="text"
                placeholder="Search model name (e.g. Civic, Myvi, City, Vios)..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />

              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {filteredModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Mileage Slider & Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Odometer Mileage (km)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="500000"
                    step="1000"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-sm text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-400">km</span>
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
                    className={`flex-1 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
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
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          {result && pricingStrategy && mileageHealth && financingQuick ? (
            <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-cyan-500/30 space-y-6 glow-blue">
              
              {/* Result Header & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                    Valuation Successful
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Fair Market Deal
                  </span>
                </div>
              </div>

              {/* Price Callout */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Estimated Resale Value
                  </p>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {result.algorithm_used.replace("Regressor", "").trim()}
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  RM {Math.round(result.estimated_price).toLocaleString()}
                </div>
              </div>

              {/* Confidence Band Bar */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Fair Market Range</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    RM {Math.round(result.fair_price_low).toLocaleString()} – RM {Math.round(result.fair_price_high).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                  <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full w-full rounded-full opacity-85" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-sm shadow-white rounded-full -translate-x-1/2" title="Median Estimate" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Buyer Advantage</span>
                  <span className="text-slate-400">Market Consensus</span>
                  <span>Seller Advantage</span>
                </div>
              </div>

              {/* 1. RECOMMENDATION: ACTIONABLE PRICING STRATEGY */}
              <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Market Pricing Recommendation</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Buyer Target */}
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Buyer Target</span>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      RM {pricingStrategy.buyerTarget.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-slate-500 block">Negotiation aim</span>
                  </div>

                  {/* Seller Asking */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1">
                    <span className="text-[10px] text-cyan-300 block font-medium">List Asking Price</span>
                    <div className="text-sm font-bold text-white font-mono">
                      RM {pricingStrategy.sellerAsking.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-cyan-400/80 block">Includes buffer</span>
                  </div>

                  {/* Dealer Trade-in */}
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Dealer Trade-In</span>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      RM {pricingStrategy.tradeInEstimate.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-slate-500 block">Cash wholesale</span>
                  </div>
                </div>
              </div>

              {/* 2. RECOMMENDATION: MILEAGE & WEAR HEALTH CHECK */}
              <div className="p-3.5 rounded-xl bg-slate-900/75 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Annual Mileage Assessment</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${mileageHealth.badgeColor}`}>
                    {mileageHealth.badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {mileageHealth.description}
                </p>
              </div>

              {/* 3. RECOMMENDATION: INSTANT FINANCING & ROAD TAX QUICK BREAKDOWN */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/30 via-slate-900/80 to-[#0F172A] border border-blue-900/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Monthly Installment & Ownership Cost</span>
                  </span>
                  <Link
                    href={`/financing?price=${Math.round(result.estimated_price)}`}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
                  >
                    <span>Full Loan Table</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Est. Monthly</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">
                      ~RM {financingQuick.monthly.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">7 yrs @ 3.2%</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">10% Deposit</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      RM {financingQuick.deposit.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Min. cash</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Annual Road Tax</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      RM {roadTaxEst}
                    </span>
                    <span className="text-[9px] text-slate-500 block">{result.input_summary.engine_displacement_liters}L engine</span>
                  </div>
                </div>
              </div>

              {/* 4. RECOMMENDATION: MULTI-MODEL CONSENSUS (IF AVAILABLE) */}
              {result.model_comparison && Object.keys(result.model_comparison).length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>4-Model AI Consensus</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">High Generalization</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(result.model_comparison).map(([mName, mPrice]) => (
                      <div
                        key={mName}
                        className={`p-2 rounded-lg border flex items-center justify-between ${
                          mName === result.algorithm_used
                            ? "bg-blue-950/40 border-cyan-500/50 text-white font-bold"
                            : "bg-slate-900/60 border-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="text-[10px] truncate max-w-[110px]" title={mName}>
                          {mName.replace("Regressor", "").replace("Simple", "").replace("(Baseline)", "").trim()}
                        </span>
                        <span className="text-cyan-300">
                          RM {Math.round(mPrice).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. RECOMMENDATION: PUSPAKOM & INSPECTION CHECKLIST */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pre-Purchase & Puspakom Checklist</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Puspakom B5 Test certificate</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Flood & chassis rust verification</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Manufacturer service logbook</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>JPJ blacklist & summon clearance</span>
                  </div>
                </div>
              </div>

              {/* Evaluated Parameters */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Parameters Evaluated
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Model</span>
                    <span className="font-semibold text-white truncate block">{result.input_summary.model}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Mileage</span>
                    <span className="font-mono font-semibold text-white">
                      {result.input_summary.mileage_km.toLocaleString()} KM
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Transmission</span>
                    <span className="font-semibold text-white">{result.input_summary.gear_type}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <span className="font-semibold text-white">{result.input_summary.state}</span>
                  </div>
                </div>
              </div>

              {/* Research Disclaimer */}
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
