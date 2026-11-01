"use client";

import React from "react";
import { formatRM, formatPercent } from "@/lib/chartTheme";

interface AppleChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  title?: string;
  unit?: "RM" | "km" | "%" | "count" | string;
  showShare?: boolean;
  totalDenominator?: number;
  comparisonBaseline?: {
    label: string;
    value: number;
  };
  sampleSize?: number;
  formatter?: (value: number) => string;
}

export default function AppleChartTooltip({
  active,
  payload,
  label,
  title,
  unit = "RM",
  showShare,
  totalDenominator,
  comparisonBaseline,
  sampleSize,
  formatter,
}: AppleChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const rawVal = typeof item.value === "number" ? item.value : parseFloat(String(item.value || 0));
  const displayLabel = title || label || item.name || "Value";

  // Calculate percentage share if totalDenominator provided
  const sharePct =
    showShare && totalDenominator && totalDenominator > 0
      ? ((rawVal / totalDenominator) * 100).toFixed(1)
      : null;

  // Calculate comparison against reference baseline
  const diffPct =
    comparisonBaseline && comparisonBaseline.value > 0
      ? ((rawVal - comparisonBaseline.value) / comparisonBaseline.value) * 100
      : null;
  const absDiff = comparisonBaseline ? rawVal - comparisonBaseline.value : null;

  const formatValue = (val: number) => {
    if (formatter) return formatter(val);
    if (unit === "RM") return formatRM(val);
    if (unit === "km") return `${Math.round(val).toLocaleString()} km`;
    if (unit === "%") return `${val.toFixed(1)}%`;
    if (unit === "count") return `${Math.round(val).toLocaleString()} listings`;
    return `${val.toLocaleString()} ${unit}`;
  };

  return (
    <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 text-xs text-white space-y-2 min-w-[200px] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
      {/* Tooltip Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <span className="font-semibold text-slate-200 tracking-tight truncate max-w-[170px]">
          {displayLabel}
        </span>
        {sampleSize !== undefined && (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
            n = {sampleSize.toLocaleString()}
          </span>
        )}
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color || "#3b82f6" }}
          />
          <span className="text-slate-400 text-[11px] capitalize">{item.name || "Value"}</span>
        </div>
        <span className="text-sm font-bold font-mono text-white tracking-tight">
          {formatValue(rawVal)}
        </span>
      </div>

      {/* Share of Total */}
      {sharePct !== null && (
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 font-mono">
          <span className="text-slate-400">Share of Filtered:</span>
          <span className="font-semibold text-cyan-300">{sharePct}% of sample</span>
        </div>
      )}

      {/* Baseline Comparison */}
      {diffPct !== null && comparisonBaseline && (
        <div className="pt-1.5 border-t border-slate-800/60 space-y-1 font-mono text-[10px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>vs. {comparisonBaseline.label}:</span>
            <span
              className={`font-bold ${
                diffPct > 0 ? "text-emerald-400" : diffPct < 0 ? "text-rose-400" : "text-slate-300"
              }`}
            >
              {formatPercent(diffPct)}
            </span>
          </div>
          {absDiff !== null && unit === "RM" && (
            <div className="flex items-center justify-between text-slate-500 text-[9px]">
              <span>Absolute Diff:</span>
              <span>
                {absDiff >= 0 ? `+RM ${Math.round(absDiff).toLocaleString()}` : `-RM ${Math.round(Math.abs(absDiff)).toLocaleString()}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

