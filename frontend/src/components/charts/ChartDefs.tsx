"use client";

import React from "react";

export default function ChartDefs() {
  return (
    <defs>
      {/* 1. Vertical Luminous Purple / Violet (AutoValue Primary Brand) */}
      <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c084fc" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#8b5cf6" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#3b0764" stopOpacity={0.25} />
      </linearGradient>

      {/* Active / Hovered Purple (Brighter with inner glow) */}
      <linearGradient id="purpleBarGradActive" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f3e8ff" stopOpacity={1} />
        <stop offset="45%" stopColor="#c084fc" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
      </linearGradient>

      {/* 2. Vertical Luminous Blue (Price & Valuations) */}
      <linearGradient id="blueBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#3b82f6" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.25} />
      </linearGradient>

      <linearGradient id="blueBarGradActive" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#eff6ff" stopOpacity={1} />
        <stop offset="45%" stopColor="#60a5fa" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.55} />
      </linearGradient>

      {/* 3. Vertical Luminous Teal / Cyan (Odometer & Regional) */}
      <linearGradient id="tealBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#0d9488" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#134e4a" stopOpacity={0.25} />
      </linearGradient>

      <linearGradient id="tealBarGradActive" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0fdfa" stopOpacity={1} />
        <stop offset="45%" stopColor="#2dd4bf" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#0f766e" stopOpacity={0.55} />
      </linearGradient>

      {/* 4. Vertical Luminous Amber / Gold (Baseline & Attention) */}
      <linearGradient id="amberBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#d97706" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#78350f" stopOpacity={0.25} />
      </linearGradient>

      <linearGradient id="amberBarGradActive" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity={1} />
        <stop offset="45%" stopColor="#fbbf24" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#b45309" stopOpacity={0.55} />
      </linearGradient>

      {/* 5. Vertical Luminous Emerald / Green (Goodness of Fit & Positive) */}
      <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#059669" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#064e3b" stopOpacity={0.25} />
      </linearGradient>

      {/* 6. Vertical Rose / Red (Outliers & Degradation) */}
      <linearGradient id="redBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#dc2626" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.25} />
      </linearGradient>

      {/* ----------------- HORIZONTAL BAR GRADIENTS (X-AXIS) ----------------- */}
      {/* Horizontal Purple (Left-to-Right) */}
      <linearGradient id="purpleHorizGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3b0764" stopOpacity={0.35} />
        <stop offset="65%" stopColor="#8b5cf6" stopOpacity={0.85} />
        <stop offset="100%" stopColor="#c084fc" stopOpacity={1} />
      </linearGradient>

      <linearGradient id="purpleHorizGradActive" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#581c87" stopOpacity={0.6} />
        <stop offset="65%" stopColor="#a855f7" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#f3e8ff" stopOpacity={1} />
      </linearGradient>

      {/* Horizontal Amber (Benchmark Reference) */}
      <linearGradient id="amberHorizGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#78350f" stopOpacity={0.35} />
        <stop offset="65%" stopColor="#d97706" stopOpacity={0.85} />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
      </linearGradient>

      <linearGradient id="amberHorizGradActive" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#92400e" stopOpacity={0.6} />
        <stop offset="65%" stopColor="#f59e0b" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#fef3c7" stopOpacity={1} />
      </linearGradient>
    </defs>
  );
}

