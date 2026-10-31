"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
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
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Tag, 
  Wallet, 
  Wrench, 
  Award, 
  Check, 
  Search 
} from "lucide-react";
import { getMetadata, predictPrice } from "@/lib/api";
import { ModelMetadata, PredictRequest, PredictResponse } from "@/types";
import Vehicle3DViewer from "@/components/Vehicle3DViewer";

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
    sellerAsking: Math.min(high, Math.round(est * 1.04)),
    tradeInEstimate: Math.round(est * 0.85),
  };
}

// Helper: Extract brand name from a model string
function extractBrand(modelStr: string): string {
  if (!modelStr) return "Unknown";
  const parts = modelStr.trim().split(" ");
  if (parts.length >= 2 && (parts[0] === "Alfa" || parts[0] === "Mercedes-Benz" || parts[0] === "Land" || parts[0] === "Aston" || parts[0] === "Rolls-Royce")) {
    if (parts[0] === "Alfa" && parts[1] === "Romeo") return "Alfa Romeo";
    if (parts[0] === "Land" && parts[1] === "Rover") return "Land Rover";
    if (parts[0] === "Aston" && parts[1] === "Martin") return "Aston Martin";
    if (parts[0] === "Rolls-Royce") return "Rolls-Royce";
  }
  return parts[0];
}

const POPULAR_BRANDS = ["All Brands", "Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan"];

export default function PredictPage() {
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);

  // Form states
  const [selectedBrand, setSelectedBrand] = useState<string>("Honda");
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
  const resultRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMetadata()
      .then((data) => {
        setMetadata(data);
        if (data.available_models && data.available_models.length > 0) {
          const defaultModel = data.available_models.includes("Honda Civic")
            ? "Honda Civic"
            : data.available_models[0];
          setSelectedModel(defaultModel);
          setSelectedBrand(extractBrand(defaultModel));

          const info = data.model_lookup[defaultModel];
          if (info) {
            setYear(info.default_year);
            setEngineSize(info.default_engine_size);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load metadata:", err);
      });
  }, []);

  // Dependent models based on selected brand and search keyword
  const brandFilteredModels = useMemo(() => {
    if (!metadata?.available_models) return [];
    return metadata.available_models.filter((m) => {
      const matchBrand = selectedBrand === "All Brands" || extractBrand(m) === selectedBrand;
      const matchSearch = modelSearch === "" || m.toLowerCase().includes(modelSearch.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [metadata, selectedBrand, modelSearch]);

  // When brand changes, auto-select the first available model in that brand
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setModelSearch("");
    if (!metadata?.available_models) return;

    const availableInBrand = brand === "All Brands"
      ? metadata.available_models
      : metadata.available_models.filter((m) => extractBrand(m) === brand);

    if (availableInBrand.length > 0) {
      const first = availableInBrand[0];
      setSelectedModel(first);
      const info = metadata.model_lookup[first];
      if (info) {
        setYear(info.default_year);
        setEngineSize(info.default_engine_size);
      }
    }
  };

  // When model changes, update default year and engine size
  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    const b = extractBrand(modelName);
    if (selectedBrand !== "All Brands" && selectedBrand !== b) {
      setSelectedBrand(b);
    }
    if (metadata && metadata.model_lookup[modelName]) {
      const info = metadata.model_lookup[modelName];
      setYear(info.default_year);
      setEngineSize(info.default_engine_size);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (predicting) return; // Prevent duplicate concurrent requests
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

      // Smooth scroll to valuation result on mobile devices
      setTimeout(() => {
        if (window.innerWidth < 1024) {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to generate valuation. Please verify inputs or API connectivity.";
      setError(errMsg);
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    } finally {
      setPredicting(false);
    }
  };

  // Computed valuation recommendations
  const pricingStrategy = result ? getPricingStrategy(result.estimated_price, result.fair_price_low, result.fair_price_high) : null;
  const mileageHealth = result ? getMileageHealth(result.input_summary.mileage_km, result.input_summary.vehicle_age_years) : null;
  const financingQuick = result ? calculateInstallment(result.estimated_price) : null;
  const roadTaxEst = result ? getRoadTax(result.input_summary.engine_displacement_liters) : null;

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800/80 pb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Machine Learning Valuation System</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Predict Used-Car Market Value
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Configure vehicle specifications to compute a statistical price estimate derived from supervised regression models trained on authentic Malaysian used-car resale listings.
        </p>
      </div>

      {/* Main Grid: Form + Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ======================================================== */}
        {/* INPUT FORM COLUMN (5 of 12 Cols ~42-45% on LG)           */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20 glass-panel rounded-2xl p-5 sm:p-7 border border-slate-800 space-y-6">
          <form onSubmit={handlePredict} className="space-y-6">
            
            {/* 1. VEHICLE IDENTITY GROUP */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-white">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span>1. Vehicle Identity</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {metadata?.available_models.length || 213} Models
                </span>
              </div>

              {/* Brand Filter Chips */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Make / Manufacturer
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleBrandChange(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        selectedBrand === b
                          ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm"
                          : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Search & Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Vehicle Model Name
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {brandFilteredModels.length} available
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={`Filter ${selectedBrand !== "All Brands" ? selectedBrand : ""} models (e.g. Civic, City, Myvi)...`}
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  {brandFilteredModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Manufacturing Year</span>
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
                  <div className="flex gap-1 pt-0.5">
                    {[2022, 2020, 2018, 2016].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setYear(yr)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          year === yr
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
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
            </div>

            {/* 2. VEHICLE SPECIFICATIONS GROUP */}
            <div className="space-y-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-white pb-1">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>2. Vehicle Specifications</span>
              </div>

              {/* Mileage Slider & Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Odometer Mileage (km)
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
                  aria-label="Odometer mileage slider"
                />

                {/* Quick Presets */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  {[
                    { label: "15k (New)", val: 15000 },
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

              {/* Transmission & Engine Displacement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                    <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Transmission</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Automatic", "Manual"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGearType(g)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          gearType === g
                            ? "bg-blue-600/25 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {g === "Automatic" ? "Automatic (A)" : "Manual (M)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Engine Displacement (L)</span>
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
                </div>
              </div>
            </div>

            {/* 3. MACHINE LEARNING ALGORITHM SELECTOR */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Machine Learning Algorithm</span>
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {algorithm.includes("Gradient") ? "★ Selected Champion" : "Alternative Regressor"}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: "Gradient Boosting Regressor", name: "Gradient Boosting", sub: "Production Champion • CV R² 80.8%" },
                  { id: "Random Forest Regressor", name: "Random Forest", sub: "Ensemble Trees • Non-linear" },
                  { id: "Ridge Regression", name: "Ridge Regression", sub: "L2 Regularized Linear" },
                  { id: "Simple Linear Regression (Baseline)", name: "Simple Linear", sub: "Unregularized Baseline OLS" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAlgorithm(item.id)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
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

            {/* Error Message */}
            {error && (
              <div
                ref={errorRef}
                id="predict-form-error"
                className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs shadow-lg animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="font-mono text-[11px] leading-relaxed break-words">{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={predicting}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {predicting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Real Regression Prediction...</span>
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

        {/* ======================================================== */}
        {/* VALUATION RESULT COLUMN (7 of 12 Cols ~55-58% on LG)     */}
        {/* ======================================================== */}
        <div ref={resultRef} className="lg:col-span-7 xl:col-span-7 min-w-0 space-y-6">
          {result && pricingStrategy && mileageHealth && financingQuick ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              {/* 1. DISTINCTIVE VALUATION PANEL */}
              <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-cyan-500/30 space-y-5 glow-blue">
                
                {/* Result Header & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                      Empirical Model Valuation
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                    Model: {result.algorithm_used.replace("Regressor", "").replace("(Baseline)", "").trim()}
                  </span>
                </div>

                {/* Prominent Price Callout */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Estimated Market Value (RM)
                    </p>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">
                      {result.input_summary.model}
                    </span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight tabular-nums">
                    RM {Math.round(result.estimated_price).toLocaleString()}
                  </div>
                </div>

                {/* Statistically Grounded Fair Market Range Bar */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Model Predicted Fair Range</span>
                    <span className="font-mono text-cyan-300 font-bold tabular-nums">
                      RM {Math.round(result.fair_price_low).toLocaleString()} – RM {Math.round(result.fair_price_high).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                    <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full w-full rounded-full opacity-85" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-sm shadow-white rounded-full -translate-x-1/2" title="Point Estimate" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Buyer Target</span>
                    <span className="text-slate-300">Model Point Estimate</span>
                    <span>Seller Asking</span>
                  </div>
                </div>

                {/* Evaluated Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Year / Age</span>
                    <span className="font-semibold text-white font-mono">{result.input_summary.manufacturing_year} ({Math.round(result.input_summary.vehicle_age_years)}y)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Mileage</span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      {result.input_summary.mileage_km.toLocaleString()} KM
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Engine / Gear</span>
                    <span className="font-semibold text-white truncate block">{result.input_summary.engine_displacement_liters}L • {result.input_summary.gear_type === "Automatic" ? "Auto" : "Manual"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Region</span>
                    <span className="font-semibold text-white truncate block">{result.input_summary.state}</span>
                  </div>
                </div>

                {/* Research Disclaimer */}
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{result.disclaimer}</span>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 2. INTERACTIVE 3D VEHICLE STUDIO DIRECTLY BELOW PRICE    */}
              {/* ======================================================== */}
              <Vehicle3DViewer
                modelName={result.input_summary.model}
                brandName={extractBrand(result.input_summary.model)}
                year={result.input_summary.manufacturing_year}
                gearType={result.input_summary.gear_type}
              />

              {/* ======================================================== */}
              {/* 3. SUPPORTING VALUATION INSIGHTS: BALANCED 2-COL SUBGRID */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* SUBGRID CARD 1: Actionable Pricing Recommendation */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Negotiation Guide</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-medium truncate">Buyer Target</span>
                      <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono tabular-nums truncate">
                        RM {pricingStrategy.buyerTarget.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-500 block truncate">Offer point</span>
                    </div>

                    <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-0.5">
                      <span className="text-[10px] text-cyan-300 block font-medium truncate">Asking Price</span>
                      <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums truncate">
                        RM {pricingStrategy.sellerAsking.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-cyan-400/80 block truncate">With buffer</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-medium truncate">Trade-In</span>
                      <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono tabular-nums truncate">
                        RM {pricingStrategy.tradeInEstimate.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-500 block truncate">Cash offer</span>
                    </div>
                  </div>
                </div>

                {/* SUBGRID CARD 2: Annual Mileage Assessment */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Mileage Health</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold truncate ${mileageHealth.badgeColor}`}>
                      {mileageHealth.badgeText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {mileageHealth.description}
                  </p>
                </div>

                {/* SUBGRID CARD 3: Instant Financing & Road Tax */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Financing & Road Tax</span>
                    </span>
                    <Link
                      href={`/financing?price=${Math.round(result.estimated_price)}`}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-0.5 transition-colors"
                    >
                      <span>Loan Calc</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block truncate">Est. Monthly</span>
                      <span className="text-xs sm:text-sm font-bold text-cyan-300 font-mono tabular-nums truncate block">
                        ~RM {financingQuick.monthly.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-slate-500 block truncate">7y @ 3.2%</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block truncate">10% Deposit</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono tabular-nums truncate block">
                        RM {financingQuick.deposit.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-slate-500 block truncate">Min. cash</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block truncate">Road Tax</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono tabular-nums truncate block">
                        RM {roadTaxEst}
                      </span>
                      <span className="text-[8px] text-slate-500 block truncate">Annual</span>
                    </div>
                  </div>
                </div>

                {/* SUBGRID CARD 4: Multi-Model Consensus */}
                {result.model_comparison && Object.keys(result.model_comparison).length > 0 ? (
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Model Consensus</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">4 Models</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      {Object.entries(result.model_comparison).map(([mName, mPrice]) => (
                        <div
                          key={mName}
                          className={`p-2 rounded-lg border flex flex-col justify-between ${
                            mName === result.algorithm_used
                              ? "bg-blue-950/40 border-cyan-500/50 text-white font-bold"
                              : "bg-slate-900/60 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className="text-[9px] text-slate-400 truncate" title={mName}>
                            {mName.replace("Regressor", "").replace("Simple", "").replace("(Baseline)", "").trim()}
                          </span>
                          <span className="text-cyan-300 text-xs tabular-nums mt-0.5">
                            RM {Math.round(mPrice).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

              </div>

              {/* Inspection Checklist */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200 uppercase tracking-wider">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pre-Purchase & Puspakom Verification Checklist</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Puspakom B5 Transfer Certificate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Chassis rust & structural flood check</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Official manufacturer service logbook</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>JPJ blacklist & police summon clearance</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standby State: Balanced & engaging preview before user clicks Predict */
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Primary Ready Panel */}
              <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-slate-800 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-900/50 via-indigo-900/40 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                  <Car className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Ready to Value Your Vehicle</h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Configure your vehicle parameters on the left and click <span className="text-cyan-400 font-semibold">&ldquo;Generate Estimated Price&rdquo;</span> to compute an empirical valuation and render the interactive 3D studio.
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gradient Boosting Regressor</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-800/40 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Target Leakage Excluded</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 text-xs text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-800/40 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3D Vehicle Studio</span>
                  </span>
                </div>
              </div>

              {/* Subgrid of Baseline References while Standby */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Market Reference Benchmarks</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Perodua Myvi 1.5 AV</span>
                      <span className="text-cyan-300 font-bold">~RM 42,500</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Honda City 1.5 V</span>
                      <span className="text-cyan-300 font-bold">~RM 58,900</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Proton X50 1.5 TGDi</span>
                      <span className="text-cyan-300 font-bold">~RM 73,800</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Toyota Vios 1.5 G</span>
                      <span className="text-cyan-300 font-bold">~RM 53,200</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Empirical Research Integrity</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Trained and benchmarked on 2,483 authentic Malaysian used-car resale listings using 5-fold cross-validation.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Explanatory Power</span>
                      <span className="text-emerald-400 font-bold text-sm">80.8% R²</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Median Resale</span>
                      <span className="text-cyan-300 font-bold text-sm">RM 68.4k</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Target Leakage Protection Banner */}
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
