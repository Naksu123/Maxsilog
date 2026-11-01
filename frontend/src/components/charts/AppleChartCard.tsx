"use client";

import React, { ReactNode } from "react";

interface AppleChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "blue" | "teal" | "violet" | "green" | "amber";
  sampleSize?: number;
  headerControls?: ReactNode;
  footerNotes?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function AppleChartCard({
  title,
  subtitle,
  badge,
  badgeColor = "blue",
  sampleSize,
  headerControls,
  footerNotes,
  className = "",
  children,
}: AppleChartCardProps) {
  const badgeClasses = {
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    teal: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    violet: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  }[badgeColor];

  return (
    <div
      className={`glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800/80 shadow-xl shadow-black/40 flex flex-col justify-between transition-all hover:border-slate-700/80 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            {badge && (
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
            {sampleSize !== undefined && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800">
                n = {sampleSize.toLocaleString()} listings
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{subtitle}</p>
          )}
        </div>

        {/* Controls Toolbar (Segmented buttons, selectors) */}
        {headerControls && (
          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            {headerControls}
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full min-h-[260px]">{children}</div>

      {/* Optional Academic / Methodology Footer */}
      {footerNotes && (
        <div className="pt-3.5 mt-3.5 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
          {footerNotes}
        </div>
      )}
    </div>
  );
}

