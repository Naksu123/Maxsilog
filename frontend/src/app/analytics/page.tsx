"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart3, 
  Filter, 
  MapPin, 
  Car, 
  Settings2, 
  TrendingUp, 
  Gauge, 
  RefreshCw,
  PieChart as PieIcon,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
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
  Cell, 
  PieChart, 
  Pie,
  Legend
} from "recharts";
import { 
  getTopCars, 
  getTopRegions, 
  getPriceVsMileage, 
  getAnalyticsSummary,
  getMetadata
} from "@/lib/api";
import { 
  TopCarStat, 
  TopRegionStat, 
  PriceMileagePoint, 
  MarketSummary,
  ModelMetadata
} from "@/types";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [topCars, setTopCars] = useState<TopCarStat[]>([]);
  const [topRegions, setTopRegions] = useState<TopRegionStat[]>([]);
  const [scatterPoints, setScatterPoints] = useState<PriceMileagePoint[]>([]);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);

  // Filters
  const [selectedModel, setSelectedModel] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedGear, setSelectedGear] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  // Sorting mode for Top Cars Table: "count" (Listing Frequency) vs "price" (Median Price)
  const [carSortBy, setCarSortBy] = useState<"count" | "price">("count");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, carsRes, regRes, metaRes] = await Promise.all([
          getAnalyticsSummary().catch(() => null),
          getTopCars(20).catch(() => []),
          getTopRegions(10).catch(() => []),
          getMetadata().catch(() => null)
        ]);

        if (sumRes) setSummary(sumRes);
        setTopCars(carsRes);
        setTopRegions(regRes);
        if (metaRes) setMetadata(metaRes);
      } catch (err) {
        console.error("Failed loading market analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update scatter plot whenever filters change
  useEffect(() => {
    getPriceVsMileage({
      model: selectedModel,
      state: selectedState,
      gear_type: selectedGear,
      limit: 300
    })
      .then((data) => setScatterPoints(data))
      .catch((err) => console.error("Filter update error:", err));
  }, [selectedModel, selectedState, selectedGear]);

  const COLORS = ["#38BDF8", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#F43F5E"];

  // Sort top cars based on user choice
  const sortedCars = [...topCars].sort((a, b) => {
    if (carSortBy === "price") {
      return b.median_price - a.median_price;
    }
    return b.count - a.count;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Empirical Market Insights</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Malaysian Automotive Market Analytics
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            In-depth empirical breakdown of 2,500 Malaysian used-vehicle listings. Analyze pricing distributions, model popularity, and regional asking patterns.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
          <span className="text-slate-400 pl-2">Rank by:</span>
          <button
            onClick={() => setCarSortBy("count")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              carSortBy === "count"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Listing Count (Volume)
          </button>
          <button
            onClick={() => setCarSortBy("price")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              carSortBy === "price"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Median Price (Value)
          </button>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Interactive Chart Filter Matrix</span>
          </span>
          <button
            onClick={() => {
              setSelectedModel("All");
              setSelectedState("All");
              setSelectedGear("All");
            }}
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Model Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Filter by Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Vehicle Models ({metadata?.available_models.length || 0})</option>
              {metadata?.available_models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Filter by State / Region</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Malaysian States</option>
              {metadata?.available_states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Gear Type Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Filter by Transmission</label>
            <select
              value={selectedGear}
              onChange={(e) => setSelectedGear(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Transmissions</option>
              <option value="Automatic">Automatic (A)</option>
              <option value="Manual">Manual (M)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Price vs Mileage Scatter Chart */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Price vs. Mileage Scatter Analysis</h2>
            <p className="text-xs text-slate-400">
              Interactive relationship between vehicle odometer (KM) and listing price (RM) based on current filter selection.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded w-fit">
            Showing {scatterPoints.length} listings
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 15, bottom: 25, left: 10 }}>
              <XAxis 
                type="number" 
                dataKey="mileage" 
                name="Mileage" 
                unit="km" 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(v) => `${Math.round(v / 1000)}k KM`}
              />
              <YAxis 
                type="number" 
                dataKey="price" 
                name="Price" 
                unit="RM" 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(v) => `RM ${Math.round(v / 1000)}k`}
              />
              <ZAxis range={[30, 30]} />
              <Tooltip 
                cursor={{ strokeDasharray: "3 3" }} 
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white text-sm">{data.model}</p>
                        <p className="text-cyan-400 font-mono font-semibold">
                          Listing Price: RM {data.price?.toLocaleString()}
                        </p>
                        <p className="text-slate-300 font-mono">
                          Mileage: {data.mileage?.toLocaleString()} KM
                        </p>
                        <p className="text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                          Location: {data.state} • Transmission: {data.gear_type}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Listings" 
                data={scatterPoints} 
                fill="#38BDF8" 
                opacity={0.7} 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 20 Vehicle Models Table & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 20 Models Chart */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Top 15 Models by Listing Frequency</h2>
              <p className="text-xs text-slate-400">Comparing market availability across distinct car models</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Volume
            </span>
          </div>

          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={topCars.slice(0, 15)} 
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis 
                  dataKey="model" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                />
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1">
                          <p className="font-bold text-white">{data.model}</p>
                          <p className="text-cyan-400">{data.count} vehicle listings</p>
                          <p className="text-slate-300">Median Price: RM {Math.round(data.median_price).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Models Detailed Breakdown Table */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-white">Top Models Detailed Summary</h2>
              <span className="text-xs font-mono text-slate-400">
                Sorted by {carSortBy === "count" ? "Listing Count" : "Median Price"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Listing frequency vs price metrics (distinguishing availability from valuation)
            </p>
          </div>

          <div className="overflow-y-auto max-h-[440px] border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2 px-3">Model</th>
                  <th className="py-2 px-3 text-right">Listings</th>
                  <th className="py-2 px-3 text-right">Median Price</th>
                  <th className="py-2 px-3 text-right">Price Range (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {sortedCars.map((car, idx) => (
                  <tr key={car.model} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-medium text-white flex items-center space-x-2">
                      <span className="w-4 text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                      <span className="truncate max-w-[150px]">{car.model}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-cyan-400">
                      {car.count}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">
                      RM {Math.round(car.median_price).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-400">
                      {Math.round(car.min_price / 1000)}k – {Math.round(car.max_price / 1000)}k
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Regional Analytics Section */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Top 5 Malaysian Regions by Market Volume</h2>
          <p className="text-xs text-slate-400">Comparing listing share, average prices, and median asking prices across states</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topRegions.slice(0, 5).map((reg, index) => (
            <div key={reg.state} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="truncate">{reg.state}</span>
                <span className="text-cyan-400 font-mono">{reg.percentage}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {reg.count} <span className="text-xs font-normal text-slate-400">listings</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 space-y-1">
                <div>Median: <span className="text-slate-200 font-mono">RM {Math.round(reg.median_price).toLocaleString()}</span></div>
                <div>Avg: <span className="text-slate-400 font-mono">RM {Math.round(reg.avg_price).toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
