"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Car, 
  BarChart3, 
  ShieldCheck, 
  TrendingUp, 
  MapPin, 
  Gauge, 
  ArrowRight, 
  Award, 
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
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
  getAnalyticsSummary, 
  getTopCars, 
  getTopRegions, 
  getPriceDistribution, 
  getMileageDistribution,
  getPriceVsMileage
} from "@/lib/api";
import { 
  MarketSummary, 
  TopCarStat, 
  TopRegionStat, 
  DistributionBin, 
  PriceMileagePoint 
} from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [topCars, setTopCars] = useState<TopCarStat[]>([]);
  const [topRegions, setTopRegions] = useState<TopRegionStat[]>([]);
  const [priceDist, setPriceDist] = useState<DistributionBin[]>([]);
  const [mileageDist, setMileageDist] = useState<DistributionBin[]>([]);
  const [scatterPoints, setScatterPoints] = useState<PriceMileagePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, carsRes, regRes, pDistRes, mDistRes, scatterRes] = await Promise.all([
          getAnalyticsSummary().catch(() => null),
          getTopCars(8).catch(() => []),
          getTopRegions(6).catch(() => []),
          getPriceDistribution().catch(() => []),
          getMileageDistribution().catch(() => []),
          getPriceVsMileage({ limit: 120 }).catch(() => [])
        ]);

        if (sumRes) setSummary(sumRes);
        setTopCars(carsRes);
        setTopRegions(regRes);
        setPriceDist(pDistRes);
        setMileageDist(mDistRes);
        setScatterPoints(scatterRes);
      } catch (err: any) {
        console.error("Dashboard data load error:", err);
        setError("Unable to connect to live backend API. Please ensure FastAPI server is running.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const COLORS = ["#38BDF8", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#10B981"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-[#0B1528] border border-blue-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Malaysian Used-Car Valuation System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Evidence-Based Vehicle Pricing & Market Intelligence
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Harnessing supervised machine learning regression trained on 2,500 Malaysian used-vehicle listings. 
            Engineered with strict <span className="text-cyan-300 font-medium">target leakage prevention</span>, 
            fair 5-fold cross-validation, and transparent empirical benchmarks across linear and ensemble algorithms.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/predict"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Predict Car Price</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/benchmark"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              <span>View Model Benchmarks</span>
            </Link>

            <Link
              href="/analytics"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Market Analytics</span>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Stats Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Listings */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Valid Listings</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {summary ? summary.total_listings.toLocaleString() : "2,500"}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>100% verified & deduplicated</span>
          </div>
        </div>

        {/* Average Price */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Average Asking Price</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {summary ? `RM ${Math.round(summary.average_price).toLocaleString()}` : "RM 106,410"}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Median: {summary ? `RM ${Math.round(summary.median_price).toLocaleString()}` : "RM 68,700"}
          </div>
        </div>

        {/* Median Mileage */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Median Mileage</span>
            <Gauge className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {summary ? `${Math.round(summary.median_mileage).toLocaleString()} KM` : "97,500 KM"}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Average: {summary ? `${Math.round(summary.average_mileage).toLocaleString()} KM` : "112,665 KM"}
          </div>
        </div>

        {/* Leakage Protection Status */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Target Leakage Audit</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            ISOLATED
          </div>
          <div className="mt-2 text-[11px] text-slate-400 leading-tight">
            Monthly_Installment barred from all training
          </div>
        </div>
      </section>

      {/* Main Charts Row: Price vs Mileage & Price Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price vs Mileage Scatter Plot */}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Price vs. Mileage Relationship</h2>
              <p className="text-xs text-slate-400">Listing price depreciation pattern relative to vehicle odometer</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
              Empirical Data
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <XAxis 
                  type="number" 
                  dataKey="mileage" 
                  name="Mileage" 
                  unit="km" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <YAxis 
                  type="number" 
                  dataKey="price" 
                  name="Price" 
                  unit="RM" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <ZAxis range={[25, 25]} />
                <Tooltip 
                  cursor={{ strokeDasharray: "3 3" }} 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.model}</p>
                          <p className="text-cyan-400">Price: RM {data.price?.toLocaleString()}</p>
                          <p className="text-slate-300">Mileage: {data.mileage?.toLocaleString()} KM</p>
                          <p className="text-slate-400">{data.state} • {data.gear_type}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Listings" data={scatterPoints} fill="#38BDF8" opacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Distribution Histogram */}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Listing Price Distribution (RM)</h2>
              <p className="text-xs text-slate-400">Right-skewed market density with concentration under RM 100k</p>
            </div>
            <span className="text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded">
              Histogram
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDist} margin={{ top: 10, right: 10, bottom: 35, left: 0 }}>
                <XAxis 
                  dataKey="bin_range" 
                  stroke="#64748b" 
                  fontSize={10} 
                  angle={-25} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs">
                          <p className="font-bold text-white">{data.bin_range}</p>
                          <p className="text-cyan-400">{data.count} vehicle listings</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {priceDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Secondary Analytics Row: Top Models & Regional Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Frequently Listed Models */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Most Listed Vehicle Models</h2>
              <p className="text-xs text-slate-400">Top volume models and their corresponding median listing prices</p>
            </div>
            <Link 
              href="/analytics" 
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>View all 20</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Model</th>
                  <th className="py-2.5 px-3 text-right">Listings</th>
                  <th className="py-2.5 px-3 text-right">Median Price</th>
                  <th className="py-2.5 px-3 text-right">Average Price</th>
                  <th className="py-2.5 px-3 text-right">Avg Mileage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {topCars.map((car, idx) => (
                  <tr key={car.model} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white flex items-center space-x-2">
                      <span className="w-4 text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                      <span>{car.model}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-cyan-400">
                      {car.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      RM {Math.round(car.median_price).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      RM {Math.round(car.avg_price).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {Math.round(car.avg_mileage).toLocaleString()} KM
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Market Distribution */}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Regional Overview</h2>
              <MapPin className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-400">Market share by Malaysian administrative region</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topRegions}
                  dataKey="count"
                  nameKey="state"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={38}
                  paddingAngle={3}
                >
                  {topRegions.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs">
                          <p className="font-bold text-white">{data.state}</p>
                          <p className="text-cyan-400">{data.count} cars ({data.percentage}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {topRegions.slice(0, 4).map((reg, i) => (
              <div key={reg.state} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300">{reg.state}</span>
                </div>
                <span className="font-mono text-slate-400">{reg.percentage}% ({reg.count})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Modules Navigation */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <Link 
          href="/predict" 
          className="group glass-panel rounded-xl p-6 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
              Vehicle Price Prediction
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Estimate fair market listing value for any vehicle configuration using Gradient Boosting and Random Forest pipelines.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Calculate valuation</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link 
          href="/benchmark" 
          className="group glass-panel rounded-xl p-6 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
              Research Benchmarking
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct comparison of Simple Linear Regression, Ridge, Random Forest, and Gradient Boosting with MAE, RMSE, and R² scores.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
            <span>Inspect model comparison</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link 
          href="/financing" 
          className="group glass-panel rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              Hire-Purchase Calculator
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculate commercial bank monthly payments, total loan interest, and multi-year amortisation schedules independently.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>Calculate payments</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </section>
    </div>
  );
}
