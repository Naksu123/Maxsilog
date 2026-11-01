"use client";

import React from "react";
import { MarketValidationResult } from "@/app/api/market-validation/route";
import { formatRM, formatPercent } from "@/lib/chartTheme";

interface MarketValidationCardProps {
  data: MarketValidationResult | null;
  loading: boolean;
  predictedPrice: number;
}

export default function MarketValidationCard({
  data,
  loading,
  predictedPrice,
}: MarketValidationCardProps) {
  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4 animate-pulse shadow-xl shadow-black/40">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 rounded-2xl border border-slate-800/80" />
          ))}
        </div>
        <div className="h-3 w-3/4 bg-slate-800/50 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const diffPct =
    data.externalMarketMedian && predictedPrice
      ? ((predictedPrice - data.externalMarketMedian) / data.externalMarketMedian) * 100
      : null;
  const absDiff =
    data.externalMarketMedian && predictedPrice
      ? predictedPrice - data.externalMarketMedian
      : null;

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800/90 space-y-5 shadow-xl shadow-black/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              External Malaysian Market Validation
            </h4>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase border ${
                data.status === "available"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : data.status === "partial"
                  ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}
            >
              {data.confidenceLevel === "high"
                ? "High Confidence"
                : data.confidenceLevel === "medium"
                ? "Moderate Sample"
                : "Baseline Reference"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {data.brand} {data.model} ({data.year}) {data.matchedVariant ? `• Variant: ${data.matchedVariant}` : ""}
          </p>
        </div>

        {/* Data Source Badge */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <a
            href={data.dataSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono font-medium px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-purple-200 border border-slate-700/80 transition-colors"
          >
            Source: {data.dataSource.includes("Paqar") ? "Paqar.my Live API" : "AutoValuate Empirical Baseline"} &rarr;
          </a>
        </div>
      </div>

      {/* Primary Metrics Comparison Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: AutoValuate ML Estimate */}
        <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-1">
          <span className="text-[10px] text-purple-300 block font-medium font-mono">AutoValuate Predicted</span>
          <div className="text-sm sm:text-base font-bold text-white font-mono tabular-nums">
            {formatRM(predictedPrice)}
          </div>
          <span className="text-[9px] text-slate-400 block font-mono">Gradient Boosting ML</span>
        </div>

        {/* Metric 2: External Market Median */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium font-mono">External Market Median</span>
          <div className="text-sm sm:text-base font-bold text-indigo-300 font-mono tabular-nums">
            {data.externalMarketMedian ? formatRM(data.externalMarketMedian) : "Pending Indexing"}
          </div>
          <span className="text-[9px] text-slate-500 block font-mono">
            {diffPct !== null
              ? `${formatPercent(diffPct)} vs external median`
              : "Market asking benchmark"}
          </span>
        </div>

        {/* Metric 3: Price Range & Absolute Delta */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium font-mono">Market Price Range</span>
          <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono tabular-nums truncate">
            {data.externalPriceRange
              ? `${formatRM(data.externalPriceRange.min)} - ${formatRM(data.externalPriceRange.max)}`
              : "N/A"}
          </div>
          <span className="text-[9px] text-slate-500 block font-mono">
            {absDiff !== null
              ? absDiff >= 0
                ? `+RM ${Math.round(absDiff).toLocaleString()} vs median`
                : `-RM ${Math.round(Math.abs(absDiff)).toLocaleString()} vs median`
              : "Market bounds (min - max)"}
          </span>
        </div>

        {/* Metric 4: Comparable Listings Count */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium font-mono">Comparable Listings</span>
          <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono tabular-nums">
            {data.comparableListingsCount > 0 ? `${data.comparableListingsCount} vehicles` : "Sample building"}
          </div>
          <span className="text-[9px] text-slate-500 block font-mono">
            {data.externalNewPriceMSRP
              ? `New MSRP: ${formatRM(data.externalNewPriceMSRP)}`
              : "Market sample size"}
          </span>
        </div>
      </div>

      {/* Variant Inspection Spot Checks (When provided by Paqar) */}
      {data.inspectionSpotChecks && data.inspectionSpotChecks.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-300 font-mono">Pre-Purchase Variant Verification Checks (Paqar Guide)</span>
            {data.variantVerdict && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Verdict: {data.variantVerdict}
              </span>
            )}
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-mono">
            {data.inspectionSpotChecks.map((check, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-purple-400 text-xs leading-none shrink-0">•</span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Academic Methodology & Integrity Note */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/[0.06] flex items-start space-x-3 text-[11px] text-slate-400 leading-relaxed">
        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/20 text-purple-300 font-semibold font-mono text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
          Academic Note
        </span>
        <span className="text-slate-400 font-normal">{data.academicNote}</span>
      </div>
    </div>
  );
}
