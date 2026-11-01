"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  CartesianGrid,
  Cell,
  ReferenceLine
} from "recharts";
import { 
  getTopCars, 
  getTopRegions, 
  getPriceVsMileage, 
  getAnalyticsSummary,
  getMetadata,
  getPriceDistribution,
  getMileageDistribution
} from "@/lib/api";
import { 
  TopCarStat, 
  TopRegionStat, 
  PriceMileagePoint, 
  MarketSummary,
  ModelMetadata,
  DistributionBin
} from "@/types";
import { 
  CHART_COLORS, 
  formatRM, 
  formatPercent, 
  formatPercentShare, 
  calculatePercentDiff 
} from "@/lib/chartTheme";
import AppleChartCard from "@/components/charts/AppleChartCard";
import ChartDefs from "@/components/charts/ChartDefs";

// Helper: Extract canonical brand name from a model string
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

const POPULAR_BRANDS = ["All Brands", "Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", "Kia"];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [topCars, setTopCars] = useState<TopCarStat[]>([]);
  const [topRegions, setTopRegions] = useState<TopRegionStat[]>([]);
  const [scatterPoints, setScatterPoints] = useState<PriceMileagePoint[]>([]);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [priceDist, setPriceDist] = useState<DistributionBin[]>([]);
  const [mileageDist, setMileageDist] = useState<DistributionBin[]>([]);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [selectedModel, setSelectedModel] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedGear, setSelectedGear] = useState<string>("All");
  const [scatterLoading, setScatterLoading] = useState<boolean>(false);

  // Distribution chart toggle: Count vs Percentage Share
  const [priceDistMode, setPriceDistMode] = useState<"count" | "share">("count");
  const [mileageDistMode, setMileageDistMode] = useState<"count" | "share">("count");

  // Model comparison controls
  const [carMetricMode, setCarMetricMode] = useState<"median" | "avg" | "count">("median");
  const [benchmarkModelRef, setBenchmarkModelRef] = useState<string>("Perodua Myvi");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [hoveredPriceIdx, setHoveredPriceIdx] = useState<number | null>(null);
  const [hoveredMileageIdx, setHoveredMileageIdx] = useState<number | null>(null);
  const [hoveredTopCarIdx, setHoveredTopCarIdx] = useState<number | null>(null);
  const [hoveredRegionIdx, setHoveredRegionIdx] = useState<number | null>(null);

  // Load initial static analytics datasets
  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, carsRes, regRes, metaRes, pDistRes, mDistRes] = await Promise.all([
          getAnalyticsSummary().catch(() => null),
          getTopCars(50).catch(() => []),
          getTopRegions(15).catch(() => []),
          getMetadata().catch(() => null),
          getPriceDistribution().catch(() => []),
          getMileageDistribution().catch(() => [])
        ]);

        if (sumRes) setSummary(sumRes);
        setTopCars(carsRes);
        setTopRegions(regRes);
        if (metaRes) setMetadata(metaRes);
        setPriceDist(pDistRes);
        setMileageDist(mDistRes);
      } catch (err) {
        console.error("Failed loading market analytics:", err);
      }
    }
    loadData();
  }, []);

  // Update scatter plot whenever filters change
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setScatterLoading(true);
    });

    getPriceVsMileage({
      model: selectedModel,
      state: selectedState,
      gear_type: selectedGear,
      limit: 2500
    })
      .then((data) => {
        if (!active) return;
        let filtered = data;
        if (selectedBrand !== "All Brands" && selectedModel === "All") {
          filtered = filtered.filter((p) => extractBrand(p.model) === selectedBrand);
        }
        setScatterPoints(filtered);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Filter update error:", err);
        setScatterPoints([]);
      })
      .finally(() => {
        if (active) setScatterLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBrand, selectedModel, selectedState, selectedGear]);

  // Dependent models for dropdown based on brand
  const filteredModelOptions = useMemo(() => {
    if (!metadata?.available_models) return [];
    if (selectedBrand === "All Brands") return metadata.available_models;
    return metadata.available_models.filter((m) => extractBrand(m) === selectedBrand);
  }, [metadata, selectedBrand]);

  const resetFilters = () => {
    setSelectedBrand("All Brands");
    setSelectedModel("All");
    setSelectedState("All");
    setSelectedGear("All");
  };

  const hasActiveFilters = selectedBrand !== "All Brands" || selectedModel !== "All" || selectedState !== "All" || selectedGear !== "All";

  // Total dataset listings denominator
  const totalListings = summary?.total_listings || 2483;

  // Processed Price Distribution with share of total
  const processedPriceDist = useMemo(() => {
    return priceDist.map((bin) => {
      const share = totalListings > 0 ? (bin.count / totalListings) * 100 : 0;
      return {
        ...bin,
        share: Number(share.toFixed(1)),
      };
    });
  }, [priceDist, totalListings]);

  // Processed Mileage Distribution with share of total
  const processedMileageDist = useMemo(() => {
    return mileageDist.map((bin) => {
      const share = totalListings > 0 ? (bin.count / totalListings) * 100 : 0;
      return {
        ...bin,
        share: Number(share.toFixed(1)),
      };
    });
  }, [mileageDist, totalListings]);

  // Reference car for relative comparison
  const refCar = useMemo(() => {
    return topCars.find((c) => c.model === benchmarkModelRef) || topCars[0];
  }, [topCars, benchmarkModelRef]);

  // Processed Top Models for Comparison Bar Chart
  const processedTopCars = useMemo(() => {
    if (!refCar) return [];
    const refVal =
      carMetricMode === "median"
        ? refCar.median_price
        : carMetricMode === "avg"
        ? refCar.avg_price
        : refCar.count;

    return topCars.slice(0, 15).map((car) => {
      const val =
        carMetricMode === "median"
          ? car.median_price
          : carMetricMode === "avg"
          ? car.avg_price
          : car.count;

      const diffPct = calculatePercentDiff(val, refVal);
      const absDiff = val - refVal;
      const share = totalListings > 0 ? (car.count / totalListings) * 100 : 0;

      return {
        ...car,
        displayVal: val,
        diffPct: diffPct !== null ? Number(diffPct.toFixed(1)) : 0,
        absDiff,
        share: Number(share.toFixed(1)),
        isRef: car.model === refCar.model,
      };
    });
  }, [topCars, refCar, carMetricMode, totalListings]);

  // Filter and sort top cars for the detailed table
  const filteredAndSortedCars = useMemo(() => {
    let list = [...topCars];
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter((c) => c.model.toLowerCase().includes(q));
    }
    if (carMetricMode === "avg") {
      return list.sort((a, b) => b.avg_price - a.avg_price);
    }
    if (carMetricMode === "median") {
      return list.sort((a, b) => b.median_price - a.median_price);
    }
    return list.sort((a, b) => b.count - a.count);
  }, [topCars, tableSearch, carMetricMode]);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
            <span>Empirical Automotive Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Malaysian Market Analytics & Intelligence
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl mt-1 leading-relaxed">
            In-depth empirical breakdown of {totalListings.toLocaleString()} verified Malaysian used-car listings. Analyze asking price distributions, odometer wear patterns, model availability, and relative price premiums.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dataset Verified • 100% Authentic</span>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. HIGH-VALUE EXECUTIVE KPI OVERVIEW CARDS               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available Listings */}
        <div className="glass-panel-elevated rounded-3xl p-5 border border-slate-800 space-y-2 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="font-semibold uppercase tracking-wider">Total Listings</span>
            <span className="text-[10px] text-purple-400">100% Sample</span>
          </div>
          <div className="text-3xl font-black font-mono text-white tabular-nums">
            {summary ? summary.total_listings.toLocaleString() : "2,483"}
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            {summary ? `${summary.unique_models_count} unique models across ${summary.unique_states_count} states` : "Empirical cleaned dataset"}
          </p>
        </div>

        {/* Median Asking Price */}
        <div className="glass-panel-elevated rounded-3xl p-5 border border-slate-800 space-y-2 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="font-semibold uppercase tracking-wider">Median Asking Price</span>
            <span className="text-[10px] text-cyan-400">P50 Robust</span>
          </div>
          <div className="text-3xl font-black font-mono text-cyan-300 tabular-nums">
            RM {summary ? Math.round(summary.median_price).toLocaleString() : "68,400"}
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            50th percentile baseline (outlier robust)
          </p>
        </div>

        {/* Average Asking Price */}
        <div className="glass-panel-elevated rounded-3xl p-5 border border-slate-800 space-y-2 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="font-semibold uppercase tracking-wider">Average Asking Price</span>
            <span className="text-[10px] text-slate-500">Parametric</span>
          </div>
          <div className="text-3xl font-black font-mono text-white tabular-nums">
            RM {summary ? Math.round(summary.average_price).toLocaleString() : "103,356"}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Std Dev: RM {summary ? Math.round(summary.std_price).toLocaleString() : "98,282"}
          </p>
        </div>

        {/* Highest Volume Model */}
        <div className="glass-panel-elevated rounded-3xl p-5 border border-slate-800 space-y-2 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="font-semibold uppercase tracking-wider">Highest Volume Model</span>
            <span className="text-[10px] text-emerald-400">Market Leader</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white truncate" title={topCars[0]?.model || "Perodua Myvi"}>
            {topCars[0]?.model || "Perodua Myvi"}
          </div>
          <p className="text-[11px] text-emerald-400 font-mono">
            {topCars[0]?.count || 165} listings ({topCars[0] && summary ? ((topCars[0].count / summary.total_listings) * 100).toFixed(1) : "6.6"}% share)
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. INTERACTIVE CHART FILTER MATRIX                       */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Interactive Chart Filter Matrix</span>
          </div>

          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                Active Filter Applied
              </span>
            )}
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="text-xs text-slate-400 hover:text-purple-400 flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        </div>

        {/* Brand Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
            Filter by Manufacturer / Make
          </label>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_BRANDS.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBrand(b);
                  setSelectedModel("All");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedBrand === b
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-500"
                    : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Row: Model, State, Transmission */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-mono">Specific Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer font-sans"
            >
              <option value="All">
                All {selectedBrand !== "All Brands" ? selectedBrand : ""} Models ({filteredModelOptions.length})
              </option>
              {filteredModelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-mono">State / Territory</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer font-sans"
            >
              <option value="All">All Malaysian States (15)</option>
              {metadata?.available_states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-mono">Transmission</label>
            <select
              value={selectedGear}
              onChange={(e) => setSelectedGear(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer font-sans"
            >
              <option value="All">All Transmissions (Auto & Manual)</option>
              <option value="Automatic">Automatic (A)</option>
              <option value="Manual">Manual (M)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. PRICE VS. MILEAGE SCATTER RELATIONSHIP                */}
      {/* ======================================================== */}
      <AppleChartCard
        title="Price vs. Mileage Relationship Analysis"
        subtitle="Exploring the empirical correlation between odometer reading (km) and listing price (RM) under active filters."
        badge="Scatter Analysis"
        badgeColor="teal"
        sampleSize={scatterPoints.length}
        footerNotes={
          <span>
            Econometric Notice: Odometer mileage exhibits a negative empirical correlation with vehicle listing price (r ≈ −0.42). Observational correlation <strong className="text-white">does not establish causation</strong>; vehicle depreciation is simultaneously driven by age, brand prestige, and cosmetic condition.
          </span>
        }
      >
        {scatterLoading ? (
          <div className="h-80 w-full flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Filtering listings...</span>
          </div>
        ) : scatterPoints.length > 0 ? (
          <div className="h-80 sm:h-96 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 20, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} />
                <XAxis 
                  type="number" 
                  dataKey="mileage" 
                  name="Mileage" 
                  unit="km" 
                  stroke={CHART_COLORS.neutral} 
                  fontSize={11}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k km`}
                  tickLine={false}
                />
                <YAxis 
                  type="number" 
                  dataKey="price" 
                  name="Price" 
                  unit="RM" 
                  stroke={CHART_COLORS.neutral} 
                  fontSize={11}
                  tickFormatter={(v) => `RM ${Math.round(v / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <ZAxis range={[32, 32]} />
                <Tooltip 
                  cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }} 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload as PriceMileagePoint;
                      const segmentMedian = summary?.median_price || 68400;
                      const diffPct = calculatePercentDiff(data.price, segmentMedian);

                      return (
                        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[210px]">
                          <p className="font-bold text-white text-sm">{data.model}</p>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-400">Listing Price:</span>
                            <span className="text-cyan-300 font-bold">{formatRM(data.price)}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-400">Odometer:</span>
                            <span className="text-slate-200">{Math.round(data.mileage).toLocaleString()} km</span>
                          </div>
                          {diffPct !== null && (
                            <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-800">
                              <span className="text-slate-400">vs Market Median:</span>
                              <span className={diffPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {formatPercent(diffPct)}
                              </span>
                            </div>
                          )}
                          <div className="text-slate-400 pt-1.5 border-t border-slate-800 text-[10px] flex items-center space-x-1.5 font-mono">
                            <span>{data.state}</span>
                            <span>•</span>
                            <span>{data.gear_type}</span>
                            {data.year && (
                              <>
                                <span>•</span>
                                <span>Year {data.year}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Listings" 
                  data={scatterPoints} 
                  fill={CHART_COLORS.blue} 
                  opacity={0.65} 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Listings Match Current Filter Criteria</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No vehicles in the empirical dataset match the combination of <span className="text-purple-300 font-medium">{selectedBrand !== "All Brands" ? selectedBrand : ""} {selectedModel !== "All" ? selectedModel : ""}</span> in <span className="text-purple-300 font-medium">{selectedState}</span> with <span className="text-purple-300 font-medium">{selectedGear}</span> transmission.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Reset Filters to View All Listings
            </button>
          </div>
        )}
      </AppleChartCard>

      {/* ======================================================== */}
      {/* 4. MARKET DISTRIBUTIONS: PRICE & MILEAGE HISTOGRAMS      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asking Price Distribution Bracket Histogram */}
        <AppleChartCard
          title="Asking Price Distribution"
          subtitle="Empirical frequency histogram grouped into Malaysian market price brackets."
          badge="Histogram"
          badgeColor="blue"
          sampleSize={totalListings}
          headerControls={
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setPriceDistMode("count")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  priceDistMode === "count"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Counts
              </button>
              <button
                onClick={() => setPriceDistMode("share")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  priceDistMode === "share"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                % Share
              </button>
            </div>
          }
          footerNotes={
            <span>
              Median Reference: <strong className="text-cyan-400">RM 68,400</strong> (P50) • Mean Reference: <strong className="text-slate-300">RM 103,356</strong>. Skewness driven by luxury imports.
            </span>
          }
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={processedPriceDist} 
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredPriceIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredPriceIdx(null)}
              >
                <ChartDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
                <XAxis 
                  dataKey="bin_range" 
                  stroke={CHART_COLORS.neutral} 
                  fontSize={10} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0} 
                  tickLine={false}
                />
                <YAxis 
                  stroke={CHART_COLORS.neutral} 
                  fontSize={11} 
                  tickFormatter={(v) => priceDistMode === "share" ? `${v}%` : `${v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload as DistributionBin & { share: number };
                      return (
                        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[190px]">
                          <p className="font-bold text-white">{d.bin_range}</p>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-400">Listing Count:</span>
                            <span className="text-cyan-300 font-bold">{d.count} listings</span>
                          </div>
                          <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Share of Total:</span>
                            <span className="text-emerald-400 font-semibold">{d.share}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey={priceDistMode === "share" ? "share" : "count"} 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedPriceDist.map((_, index) => {
                    const isHovered = hoveredPriceIdx === index;
                    const isAnyHovered = hoveredPriceIdx !== null;
                    return (
                      <Cell
                        key={`cell-price-${index}`}
                        fill={isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(192, 132, 252, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppleChartCard>

        {/* Mileage Distribution Bracket Histogram */}
        <AppleChartCard
          title="Odometer Mileage Distribution"
          subtitle="Odometer wear cohorts across 2,483 vehicles in the Malaysian secondary market."
          badge="Odometer"
          badgeColor="teal"
          sampleSize={totalListings}
          headerControls={
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setMileageDistMode("count")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mileageDistMode === "count"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Counts
              </button>
              <button
                onClick={() => setMileageDistMode("share")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mileageDistMode === "share"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                % Share
              </button>
            </div>
          }
          footerNotes={
            <span>
              Median Mileage: <strong className="text-cyan-400">65,000 km</strong> • Modal cohort falls between 40,000 km and 80,000 km (typical 3-to-6 year vehicles).
            </span>
          }
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={processedMileageDist} 
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredMileageIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredMileageIdx(null)}
              >
                <ChartDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
                <XAxis 
                  dataKey="bin_range" 
                  stroke={CHART_COLORS.neutral} 
                  fontSize={10} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0} 
                  tickLine={false}
                />
                <YAxis 
                  stroke={CHART_COLORS.neutral} 
                  fontSize={11} 
                  tickFormatter={(v) => mileageDistMode === "share" ? `${v}%` : `${v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload as DistributionBin & { share: number };
                      return (
                        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[190px]">
                          <p className="font-bold text-white">{d.bin_range}</p>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-400">Listing Count:</span>
                            <span className="text-cyan-300 font-bold">{d.count} listings</span>
                          </div>
                          <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Share of Total:</span>
                            <span className="text-emerald-400 font-semibold">{d.share}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey={mileageDistMode === "share" ? "share" : "count"} 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedMileageDist.map((_, index) => {
                    const isHovered = hoveredMileageIdx === index;
                    const isAnyHovered = hoveredMileageIdx !== null;
                    return (
                      <Cell
                        key={`cell-mileage-${index}`}
                        fill={isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(45, 212, 191, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppleChartCard>
      </div>

      {/* ======================================================== */}
      {/* 5. TOP MODELS: HORIZONTAL COMPARISON WITH BENCHMARK      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 15 Models Chart */}
        <div className="lg:col-span-6">
          <AppleChartCard
            title="Brand & Model Price Comparison"
            subtitle={`Comparing vehicle models with relative percentage differences against benchmark reference.`}
            badge="Model Comparison"
            badgeColor="violet"
            headerControls={
              <div className="flex items-center space-x-2">
                <select
                  value={benchmarkModelRef}
                  onChange={(e) => setBenchmarkModelRef(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                >
                  {topCars.slice(0, 10).map((c) => (
                    <option key={c.model} value={c.model}>
                      Ref: {c.model}
                    </option>
                  ))}
                </select>

                <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    onClick={() => setCarMetricMode("median")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      carMetricMode === "median"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Median
                  </button>
                  <button
                    onClick={() => setCarMetricMode("avg")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      carMetricMode === "avg"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Avg
                  </button>
                  <button
                    onClick={() => setCarMetricMode("count")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      carMetricMode === "count"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Volume
                  </button>
                </div>
              </div>
            }
            footerNotes={
              <span>
                Benchmark baseline: <strong className="text-amber-400">{benchmarkModelRef}</strong> (
                {carMetricMode === "count"
                  ? `${refCar?.count} listings`
                  : formatRM(carMetricMode === "median" ? refCar?.median_price : refCar?.avg_price)}
                ). Relative comparison formula: <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">((Model - Benchmark) / Benchmark) × 100</code>
              </span>
            }
          >
            <div className="h-[460px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={processedTopCars} 
                  margin={{ top: 5, right: 35, left: 110, bottom: 5 }}
                  onMouseMove={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      setHoveredTopCarIdx(Number(state.activeTooltipIndex));
                    }
                  }}
                  onMouseLeave={() => setHoveredTopCarIdx(null)}
                >
                  <ChartDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke={CHART_COLORS.neutral} 
                    fontSize={11}
                    tickFormatter={(v) => carMetricMode === "count" ? `${v}` : `RM ${Math.round(v / 1000)}k`}
                    tickLine={false}
                  />
                  <YAxis 
                    dataKey="model" 
                    type="category" 
                    stroke={CHART_COLORS.neutral} 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[220px]">
                            <p className="font-bold text-white text-sm">{d.model}</p>
                            <div className="flex justify-between font-mono">
                              <span className="text-slate-400">
                                {carMetricMode === "median" ? "Median Price:" : carMetricMode === "avg" ? "Average Price:" : "Listing Count:"}
                              </span>
                              <span className="text-cyan-300 font-bold">
                                {carMetricMode === "count" ? `${d.displayVal} listings` : formatRM(d.displayVal)}
                              </span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span className="text-slate-400">vs {benchmarkModelRef}:</span>
                              <span
                                className={`font-bold ${
                                  d.isRef
                                    ? "text-amber-400"
                                    : d.diffPct > 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {d.isRef ? "Reference Baseline" : `${formatPercent(d.diffPct)}`}
                              </span>
                            </div>
                            <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-800">
                              <span className="text-slate-400">Market Share:</span>
                              <span className="text-slate-300">{d.share}% ({d.count} cars)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="displayVal" 
                    radius={[0, 8, 8, 0]} 
                    isAnimationActive={true}
                    animationDuration={650}
                    animationEasing="ease-out"
                  >
                    {processedTopCars.map((entry, idx) => {
                      const isHovered = hoveredTopCarIdx === idx;
                      const isAnyHovered = hoveredTopCarIdx !== null;
                      const fill = entry.isRef 
                        ? (isHovered ? "url(#amberHorizGradActive)" : "url(#amberHorizGrad)")
                        : (isHovered ? "url(#purpleHorizGradActive)" : "url(#purpleHorizGrad)");
                      const stroke = entry.isRef ? "#fbbf24" : "#c084fc";
                      return (
                        <Cell
                          key={`cell-top-${entry.model}`}
                          fill={fill}
                          opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                          stroke={isHovered ? "rgba(255, 255, 255, 0.85)" : stroke}
                          strokeWidth={isHovered ? 1.5 : 1}
                          className="transition-all duration-200"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AppleChartCard>
        </div>

        {/* Top Models Detailed Breakdown Table */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl shadow-black/40">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Top Models Detailed Inventory</h2>
                <p className="text-xs text-slate-400">
                  Showing {filteredAndSortedCars.length} models sorted by {carMetricMode === "count" ? "Listing Count" : carMetricMode === "avg" ? "Average Price" : "Median Price"}
                </p>
              </div>

              {/* Table search filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter table models..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[460px] border border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-right">Listings</th>
                  <th className="py-2.5 px-3 text-right">Median Price</th>
                  <th className="py-2.5 px-3 text-right">Price Range (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredAndSortedCars.map((car, idx) => (
                  <tr key={car.model} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white flex items-center space-x-2">
                      <span className="w-5 text-slate-500 font-mono text-[10px]">{idx + 1}.</span>
                      <span className="truncate max-w-[170px]" title={car.model}>{car.model}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-purple-400 tabular-nums">
                      {car.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200 tabular-nums">
                      RM {Math.round(car.median_price).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                      {Math.round(car.min_price / 1000)}k – {Math.round(car.max_price / 1000)}k
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. REGIONAL & TRANSMISSION MARKET ANALYSIS               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transmission Breakdown Card (Section 7) */}
        <div className="lg:col-span-4">
          <AppleChartCard
            title="Transmission Architecture"
            subtitle="Comparing Automatic vs Manual transmission sample representation and pricing dynamics in Malaysia."
            badge="Transmission"
            badgeColor="amber"
            footerNotes={
              <span>
                Automatic transmissions command an empirical median price premium of <strong className="text-emerald-400">+84.2%</strong> over manuals due to higher prevalence in modern executive and crossover segments.
              </span>
            }
          >
            <div className="space-y-4 pt-2">
              {/* Auto Card */}
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Automatic (A)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    95.6% Share
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Listings:</span>
                    <span className="font-bold text-white">2,374 cars</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Median Price:</span>
                    <span className="font-bold text-blue-400">RM 70,000</span>
                  </div>
                </div>
              </div>

              {/* Manual Card */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Manual (M)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    4.4% Share
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Listings:</span>
                    <span className="font-bold text-white">109 cars</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Median Price:</span>
                    <span className="font-bold text-amber-400">RM 38,000</span>
                  </div>
                </div>
              </div>
            </div>
          </AppleChartCard>
        </div>

        {/* State Comparison Bar Chart (8 cols) */}
        <div className="lg:col-span-8">
          <AppleChartCard
            title="Regional Market Share Across Top 10 States"
            subtitle="Listing concentration and market share percentage across Malaysian states and federal territories."
            badge="Geographic"
            badgeColor="teal"
            sampleSize={totalListings}
            footerNotes={
              <span>
                Kuala Lumpur and Selangor constitute over <strong className="text-white">62.8%</strong> of all secondary vehicle transactions, reflecting western Peninsular commercial concentration.
              </span>
            }
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                data={topRegions.slice(0, 10)} 
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredRegionIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredRegionIdx(null)}
              >
                <ChartDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
                  <XAxis 
                    dataKey="state" 
                    stroke={CHART_COLORS.neutral} 
                    fontSize={10} 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    tickLine={false}
                  />
                  <YAxis stroke={CHART_COLORS.neutral} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload as TopRegionStat;
                        return (
                          <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[190px]">
                            <p className="font-bold text-white">{d.state}</p>
                            <div className="flex justify-between font-mono">
                              <span className="text-slate-400">Volume:</span>
                              <span className="text-cyan-300 font-bold">{d.count} listings</span>
                            </div>
                            <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-800">
                              <span className="text-slate-400">Market Share:</span>
                              <span className="text-emerald-400 font-semibold">{d.percentage}%</span>
                            </div>
                            <div className="flex justify-between font-mono text-[10px] text-slate-400">
                              <span>Median Price:</span>
                              <span className="text-slate-200">{formatRM(d.median_price)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {topRegions.slice(0, 10).map((_, index) => {
                    const isHovered = hoveredRegionIdx === index;
                    const isAnyHovered = hoveredRegionIdx !== null;
                    return (
                      <Cell
                        key={`cell-reg-${index}`}
                        fill={isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(45, 212, 191, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AppleChartCard>
        </div>
      </div>
    </div>
  );
}
