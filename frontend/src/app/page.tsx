"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Car, 
  BarChart3, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Calculator, 
  RefreshCw, 
  Award, 
  MapPin, 
  Gauge, 
  Sliders, 
  Users, 
  Check, 
  Layers,
  Search,
  ExternalLink
} from "lucide-react";

// Sample car presets for interactive preview
interface SamplePreset {
  name: string;
  brand: string;
  year: number;
  mileage: number;
  gear: string;
  location: string;
  estimate: number;
  depreciation: string;
  range: string;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    name: "Perodua Myvi 1.5 AV",
    brand: "Perodua",
    year: 2020,
    mileage: 48000,
    gear: "Automatic",
    location: "Kuala Lumpur",
    estimate: 42500,
    depreciation: "18.2% vs Original",
    range: "RM 39,500 – RM 45,000",
  },
  {
    name: "Honda City 1.5 V",
    brand: "Honda",
    year: 2019,
    mileage: 65000,
    gear: "Automatic",
    location: "Selangor",
    estimate: 58900,
    depreciation: "26.4% vs Original",
    range: "RM 55,000 – RM 62,500",
  },
  {
    name: "Proton X50 1.5 TGDi Flagship",
    brand: "Proton",
    year: 2021,
    mileage: 38000,
    gear: "Automatic",
    location: "Johor",
    estimate: 73800,
    depreciation: "23.1% vs Original",
    range: "RM 69,000 – RM 77,500",
  },
  {
    name: "Toyota Vios 1.5 G",
    brand: "Toyota",
    year: 2018,
    mileage: 82000,
    gear: "Automatic",
    location: "Penang",
    estimate: 53200,
    depreciation: "34.5% vs Original",
    range: "RM 49,800 – RM 56,000",
  },
];

export default function LandingPage() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const activePreset = SAMPLE_PRESETS[selectedPresetIndex];

  return (
    <div className="space-y-20 pb-16">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden pt-6 sm:pt-12">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Top Tagline / Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
                <span>Malaysian Used-Car Machine Learning Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Know Your Car&apos;s{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
                  True Market Value.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Predict used-car prices in Malaysia using machine learning and explore market insights to make more informed automotive decisions.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/predict"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Car className="w-4 h-4 text-white" />
                  <span>Predict Car Price</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm border border-slate-700/80 shadow-md transition-all hover:border-slate-600"
                >
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Explore Market Insights</span>
                </Link>
              </div>

              {/* Trust Statement */}
              <div className="pt-2 flex items-start space-x-2.5 text-left text-xs text-slate-400 bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 max-w-xl mx-auto lg:mx-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong className="text-slate-200">Empirical Research Integrity:</strong> Predictions are estimates generated from AutoValuate&apos;s machine-learning model trained on real Malaysian used-car market data (2,500 listings) with strict target leakage isolation.
                </p>
              </div>

            </div>

            {/* Right Automotive Hero Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600/30 to-cyan-500/30 blur-xl opacity-75" />

                {/* Card Container */}
                <div className="relative rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden shadow-2xl">
                  
                  {/* Hero Vehicle Image */}
                  <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden">
                    <Image
                      src="/hero-car.jpg"
                      alt="Modern Malaysian automotive valuation showcase"
                      fill
                      priority
                      className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/30" />

                    {/* Floating Badge: Verified Model */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>5-Fold CV R² 0.897</span>
                    </div>

                    {/* Floating Badge: Target Leakage Barred */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Leakage Barred</span>
                    </div>
                  </div>

                  {/* Valuation Preview Snapshot */}
                  <div className="p-5 space-y-3 bg-[#0F172A]">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Representative Valuation</span>
                      <span className="text-cyan-400 font-mono">Real ML Ensemble</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-lg font-bold text-white">2020 Perodua Myvi 1.5 AV</div>
                        <div className="text-xs text-slate-400">48,000 km • Automatic • Kuala Lumpur</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Predicted Resale</div>
                        <div className="text-xl font-bold font-mono text-cyan-400">RM 42,500</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Gauge className="w-3 h-3 text-blue-400" />
                        <span>Low Depreciation Rate</span>
                      </span>
                      <Link 
                        href="/predict" 
                        className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center space-x-1"
                      >
                        <span>Calculate Yours</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. LIVE MARKET SNAPSHOT / KPI BAR                        */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0F172A]/80 border border-slate-800/90 shadow-xl backdrop-blur-sm">
          
          <div className="space-y-1 p-3">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <Car className="w-4 h-4 text-blue-400" />
              <span>Dataset Scale</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">2,500</div>
            <p className="text-xs text-slate-400">Verified Malaysian listings</p>
          </div>

          <div className="space-y-1 p-3 border-l border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Median Market Price</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">RM 68.7k</div>
            <p className="text-xs text-slate-400">Across all vehicle segments</p>
          </div>

          <div className="space-y-1 p-3 border-l border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Model Accuracy</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">0.897 R²</div>
            <p className="text-xs text-slate-400">5-Fold cross-validated score</p>
          </div>

          <div className="space-y-1 p-3 border-l border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Target Leakage</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">0.00%</div>
            <p className="text-xs text-slate-400">Installment terms strictly barred</p>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HOW IT WORKS (3-STEP PROCESS)                         */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Seamless Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How AutoValuate Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Get an objective, machine-learning-powered valuation in three simple steps without navigating complex dealership formulas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Step 1 */}
          <div className="relative rounded-2xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg group-hover:scale-105 transition-transform">
              01
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              Enter Vehicle Details
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Provide the vehicle&apos;s make, model, manufacturing year, mileage, transmission, and regional location in Malaysia.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>Standardized Malaysian specs</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg group-hover:scale-105 transition-transform">
              02
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              Generate a Prediction
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Submit your input to our verified machine-learning ensemble (Random Forest and XGBoost) executing in under 100 milliseconds.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>5-Fold Cross-Validation accuracy</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg group-hover:scale-105 transition-transform">
              03
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              Explore the Results
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Review the estimated price in Malaysian Ringgit (RM), depreciation rate, market price band, and hire-purchase financing breakdown.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bank loan estimates included</span>
            </div>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 4. INTERACTIVE SAMPLE VALUATION PREVIEW                   */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Model Demonstration</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Explore Sample Market Valuations
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Select popular Malaysian used models to inspect instant benchmark estimates derived from our trained regression pipeline.
              </p>
            </div>

            <Link
              href="/predict"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all w-fit"
            >
              <span>Custom Valuation Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Model Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_PRESETS.map((car, idx) => (
              <button
                key={car.name}
                onClick={() => setSelectedPresetIndex(idx)}
                className={`p-3 rounded-xl text-left border text-xs transition-all ${
                  selectedPresetIndex === idx
                    ? "bg-blue-600/20 border-cyan-500 text-white shadow-md shadow-blue-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="font-semibold truncate">{car.brand}</div>
                <div className="text-[11px] opacity-75 truncate">{car.name}</div>
              </button>
            ))}
          </div>

          {/* Active Preview Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#070C16] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
            
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Model Specification</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{activePreset.name}</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Year of Manufacture</div>
                  <div className="text-sm font-semibold text-white font-mono">{activePreset.year}</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Recorded Mileage</div>
                  <div className="text-sm font-semibold text-white font-mono">{activePreset.mileage.toLocaleString()} km</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Transmission</div>
                  <div className="text-sm font-semibold text-white">{activePreset.gear}</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Regional Market</div>
                  <div className="text-sm font-semibold text-white">{activePreset.location}</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Depreciation Metric</div>
                  <div className="text-sm font-semibold text-amber-400">{activePreset.depreciation}</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Dataset Support</div>
                  <div className="text-sm font-semibold text-emerald-400">High Density</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-[#0F172A] border border-blue-900/40 rounded-xl p-5 sm:p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Estimated Market Value</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 font-mono mt-1">
                  RM {activePreset.estimate.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Expected window: <span className="text-slate-200 font-mono font-medium">{activePreset.range}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href={`/predict?model=${encodeURIComponent(activePreset.name)}&year=${activePreset.year}&mileage=${activePreset.mileage}`}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Configure Full Vehicle Specs</span>
                </Link>
                <p className="text-[10px] text-slate-400 text-center">
                  Trained on 2,500 Malaysian listings. Estimates exclude loan interest and insurance.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CORE FEATURES & CAPABILITIES                          */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <span>Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Automotive Precision
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every feature is backed by real Malaysian market empirical data and research-grade supervised learning architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Machine-Learning Price Prediction</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Nonlinear regression ensemble (Random Forest & XGBoost) accounting for vehicle age, mileage curves, and brand depreciation.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Malaysian Market Analysis</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Interactive geographic and segment price analytics across Selangor, Kuala Lumpur, Johor, Penang, and East Malaysia.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero Target Leakage Guarantee</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Installment columns are strictly barred from the prediction feature vector, preventing the artificial accuracy inflation present in naive models.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Model Benchmarking & CV</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Transparent 5-fold cross-validation metrics comparing Simple Linear Regression, Ridge, Random Forest, and XGBoost.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Hire-Purchase Amortisation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Integrated Malaysian fixed-rate car loan calculator conforming to standard Hire-Purchase Act financing formulas.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Automated Retraining & Rollback</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Autonomous MLOps pipeline monitoring model drift with instant single-click checkpoint rollback for administrator security.
            </p>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 6. BENEFITS SECTION: BUYERS VS SELLERS                   */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Market Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for Buyers and Sellers Alike
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Eliminate guesswork and navigate Malaysian car classifieds with data-backed confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* For Car Buyers */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0A101D] border border-blue-900/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">For Used-Car Buyers</h3>
                <p className="text-xs text-slate-400">Negotiate with empirical market intelligence</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span><strong>Avoid Overpaying:</strong> Check whether an asking price sits above or below fair statistical valuation.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span><strong>Mileage vs. Age Benchmarking:</strong> Understand how excessive mileage discounts price compared to vehicle age.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span><strong>Realistic Financing Forecasts:</strong> Estimate monthly installments and total loan commitment before visiting a showroom.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span><strong>Objective Market Distribution:</strong> See where your target vehicle stands relative to 2,500 active Malaysian listings.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/predict"
                className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
              >
                <span>Check a vehicle asking price</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* For Car Sellers */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0A101D] border border-cyan-900/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">For Private Sellers & Dealers</h3>
                <p className="text-xs text-slate-400">Price competitively and close sales faster</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Sell Faster Without Underselling:</strong> Price listings within the optimal transaction window to attract serious inquiries.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Defend Your Valuation:</strong> Use empirical machine-learning estimates to counter unreasonable low-ball offers.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Regional Location Premium:</strong> Account for price differentials between Selangor, Kuala Lumpur, and other states.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Historical Depreciation Insight:</strong> Identify the ideal trade-in window before sharp depreciation inflection points.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-xs font-semibold"
              >
                <span>View current market dynamics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 7. FINAL CALL-TO-ACTION SECTION                          */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-[#0B1528] border border-blue-900/50 p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Discover Your Car&apos;s True Value?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Run an instant, research-grade valuation using AutoValuate&apos;s machine learning model trained specifically on Malaysian market dynamics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                href="/predict"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Car className="w-4 h-4 text-white" />
                <span>Predict Car Price Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm border border-slate-700/80 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Explore Full Dashboard</span>
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center space-x-6 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instant ML inference</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero registration needed</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>2,500 Malaysian listings</span>
              </span>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
