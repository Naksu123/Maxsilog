/**
 * AutoValue Design System - Chart Theme Tokens & Utilities
 * Apple-inspired data visualization palette, semantic tokens, and statistical helpers.
 */

// 1. Semantic Color Tokens
export const CHART_COLORS = {
  // Primary & Valuation
  blue: "#3b82f6",        // Vehicle prices, primary series, valuations
  blueLight: "#60a5fa",
  blueDark: "#1d4ed8",

  // Secondary & Supporting
  teal: "#06b6d4",        // Secondary metrics, volume shares, comparisons
  tealLight: "#22d3ee",
  tealDark: "#0e7490",

  // ML Models & Analytical Categories (Matches AutoValue violet brand accent)
  violet: "#8b5cf6",      // Champion model (Gradient Boosting), primary analytics
  violetLight: "#a78bfa",
  violetDark: "#6d28d9",

  // Highlights & Attention
  amber: "#f59e0b",       // Selected highlights, manual transmission, warnings
  amberLight: "#fbbf24",
  amberDark: "#b45309",

  // Performance & Comparisons
  green: "#10b981",       // Genuine error reduction, positive improvements, top tier
  greenLight: "#34d399",
  greenDark: "#047857",

  // Deterioration & Warnings
  red: "#ef4444",         // Negative changes, higher error, degradation
  redLight: "#f87171",
  redDark: "#b91c1c",

  // Neutral & Grid
  neutral: "#64748b",     // Reference lines, inactive series, baselines
  neutralLight: "#94a3b8",
  neutralDark: "#334155",
  gridLine: "rgba(51, 65, 85, 0.4)",
  gridLineDashed: "rgba(51, 65, 85, 0.6)",
  axisText: "#94a3b8",
  tooltipBg: "rgba(10, 15, 30, 0.95)",
  tooltipBorder: "rgba(51, 65, 85, 0.8)",
} as const;

// 2. Stable Machine Learning Model Color Map
export const MODEL_COLORS: Record<string, string> = {
  "Gradient Boosting Regressor": CHART_COLORS.violet,
  "Gradient Boosting": CHART_COLORS.violet,
  "Random Forest Regressor": CHART_COLORS.blue,
  "Random Forest": CHART_COLORS.blue,
  "Ridge Regression": CHART_COLORS.teal,
  "Simple Linear Regression (Baseline)": CHART_COLORS.amber,
  "Simple Linear Regression": CHART_COLORS.amber,
  "Linear Regression": CHART_COLORS.amber,
};

// 3. Stable Vehicle Category & Transmission Color Map
export const CATEGORY_COLORS: Record<string, string> = {
  Sedan: CHART_COLORS.blue,
  SUV: CHART_COLORS.teal,
  Hatchback: CHART_COLORS.green,
  MPV: CHART_COLORS.violet,
  Pickup: CHART_COLORS.amber,
  Truck: CHART_COLORS.amber,
  Coupe: "#ec4899", // Rose pink for rare sports coupe
  Automatic: CHART_COLORS.blue,
  Manual: CHART_COLORS.amber,
};

// 4. Formatting Utilities
export function formatRM(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "RM 0";
  return `RM ${Math.round(value).toLocaleString()}`;
}

export function formatPercent(value: number | null | undefined, decimals = 1, showSign = true): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatPercentShare(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  return `${value.toFixed(decimals)}%`;
}

export function formatPercentPoint(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0 pp";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)} pp`;
}

export function formatMileage(km: number | null | undefined): string {
  if (km === null || km === undefined || isNaN(km)) return "0 km";
  return `${Math.round(km).toLocaleString()} km`;
}

// 5. Mathematical Comparison Helpers
export function calculatePercentDiff(selected: number, reference: number): number | null {
  if (!reference || isNaN(reference) || isNaN(selected)) return null;
  return ((selected - reference) / Math.abs(reference)) * 100;
}

export function calculateErrorReduction(baselineError: number, candidateError: number): number | null {
  if (!baselineError || isNaN(baselineError) || isNaN(candidateError)) return null;
  // Positive value indicates genuine error reduction (improvement)
  return ((baselineError - candidateError) / baselineError) * 100;
}

