"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { calculateFinancing } from "@/lib/api";
import { FinancingResponse } from "@/types";
import { CHART_COLORS, formatRM, formatPercentShare } from "@/lib/chartTheme";
import AppleChartCard from "@/components/charts/AppleChartCard";

function FinancingCalculatorContent() {
  const searchParams = useSearchParams();
  const initialPriceParam = searchParams.get("price");

  // Inputs
  const [vehiclePrice, setVehiclePrice] = useState<number>(
    initialPriceParam ? Number(initialPriceParam) : 75000
  );
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(10);
  const [annualRate, setAnnualRate] = useState<number>(3.5);
  const [loanYears, setLoanYears] = useState<number>(7);

  // Visualization sub-view toggle: Amortization Curve vs Table
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart");

  // Computed state
  const [result, setResult] = useState<FinancingResponse | null>(null);
  const [, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downPaymentAmount = (vehiclePrice * downPaymentPercent) / 100.0;

  const performCalculation = async () => {
    setError(null);
    if (downPaymentAmount >= vehiclePrice) {
      setError("Down payment cannot equal or exceed the total vehicle purchase price.");
      return;
    }

    try {
      setCalculating(true);
      const res = await calculateFinancing({
        vehicle_price: vehiclePrice,
        down_payment: downPaymentAmount,
        annual_interest_rate_pct: annualRate,
        loan_term_years: loanYears
      });
      setResult(res);
    } catch (err: unknown) {
      console.error("Financing calculation error:", err);
      // Fallback local calculation matching standard Malaysian hire-purchase rules
      const loan = vehiclePrice - downPaymentAmount;
      const totalMonths = loanYears * 12;
      const totalInt = loan * (annualRate / 100.0) * loanYears;
      const totalPay = loan + totalInt;
      const monthly = totalPay / totalMonths;

      const schedule = [];
      const annPrin = loan / loanYears;
      const annInt = totalInt / loanYears;
      let bal = totalPay;
      for (let y = 1; y <= loanYears; y++) {
        bal = Math.max(0, bal - monthly * 12);
        schedule.push({
          year: y,
          annual_payment: Math.round(monthly * 12),
          principal_repaid: Math.round(annPrin * y),
          interest_repaid: Math.round(annInt * y),
          remaining_total_balance: Math.round(bal)
        });
      }

      setResult({
        vehicle_price: vehiclePrice,
        down_payment: downPaymentAmount,
        loan_amount: loan,
        annual_interest_rate_pct: annualRate,
        loan_term_years: loanYears,
        loan_term_months: totalMonths,
        monthly_installment: Math.round(monthly),
        total_interest: Math.round(totalInt),
        total_payable: Math.round(totalPay),
        yearly_schedule: schedule,
        disclaimer: "Estimated using standard Malaysian hire-purchase car financing flat-rate formula."
      });
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      performCalculation();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiclePrice, downPaymentPercent, annualRate, loanYears]);

  // Total cash outlay (Down payment + Total Payable)
  const totalOutlay = useMemo(() => {
    if (!result) return 0;
    return result.down_payment + result.total_payable;
  }, [result]);

  // Capital Allocation Donut Data with unambiguous percentages
  const pieData = useMemo(() => {
    if (!result || totalOutlay <= 0) return [];
    return [
      { 
        name: "Principal Loan Amount", 
        value: result.loan_amount, 
        color: CHART_COLORS.blue,
        pct: (result.loan_amount / totalOutlay) * 100
      },
      { 
        name: "Total Borrowing Interest", 
        value: result.total_interest, 
        color: CHART_COLORS.violet,
        pct: (result.total_interest / totalOutlay) * 100
      },
      { 
        name: "Initial Down Payment", 
        value: result.down_payment, 
        color: CHART_COLORS.green,
        pct: (result.down_payment / totalOutlay) * 100
      }
    ];
  }, [result, totalOutlay]);

  // Amortization Chart Data (Year 0 starting point down to payoff)
  const amortizationChartData = useMemo(() => {
    if (!result) return [];
    const points = [
      {
        yearLabel: "Start",
        year: 0,
        remainingBalance: result.total_payable,
        principalRepaid: 0,
        interestRepaid: 0,
        clearedPct: 0
      }
    ];

    result.yearly_schedule.forEach((item) => {
      const cleared = result.total_payable - item.remaining_total_balance;
      const clearedPct = (cleared / result.total_payable) * 100;
      points.push({
        yearLabel: `Year ${item.year}`,
        year: item.year,
        remainingBalance: item.remaining_total_balance,
        principalRepaid: item.principal_repaid,
        interestRepaid: item.interest_repaid,
        clearedPct: Number(clearedPct.toFixed(1))
      });
    });

    return points;
  }, [result]);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
          <span>Malaysian Hire-Purchase Financing Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Automotive Loan & Monthly Payment Analytics
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Interactive financial telemetry simulating commercial bank hire-purchase financing in Malaysia. 
          <span className="text-slate-300 font-semibold"> Methodological Integrity Note: </span> This tool is strictly separated from the machine-learning price valuation model to ensure research target leakage avoidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-7 space-y-6 border border-slate-800 shadow-xl shadow-black/40">
            <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center space-x-2">
              <span>Loan Parameters & Assumptions</span>
            </h2>

            {/* Vehicle Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="fin-veh-price" className="font-semibold text-slate-300">Vehicle Purchase Price (RM)</label>
                <span className="font-mono text-cyan-400 font-bold">
                  {formatRM(vehiclePrice)}
                </span>
              </div>
              <input
                id="fin-veh-price"
                type="range"
                min={15000}
                max={500000}
                step={2500}
                value={vehiclePrice}
                onChange={(e) => setVehiclePrice(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>RM 15k</span>
                <span>RM 250k</span>
                <span>RM 500k</span>
              </div>
            </div>

            {/* Down Payment Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="fin-down-payment" className="font-semibold text-slate-300">Down Payment Percentage</label>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-bold">{downPaymentPercent}%</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                    ({formatRM(downPaymentAmount)})
                  </span>
                </div>
              </div>
              <input
                id="fin-down-payment"
                type="range"
                min={0}
                max={50}
                step={5}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% (Full Loan)</span>
                <span>10% (Bank Standard)</span>
                <span>50%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="fin-interest-rate" className="font-semibold text-slate-300">Fixed Annual Interest Rate</label>
                <span className="font-mono text-purple-400 font-bold">{annualRate.toFixed(2)}% p.a.</span>
              </div>
              <input
                id="fin-interest-rate"
                type="range"
                min={2.0}
                max={6.0}
                step={0.1}
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>2.0% (Prime New)</span>
                <span>3.5% (Typical Used)</span>
                <span>6.0%</span>
              </div>
            </div>

            {/* Loan Tenure Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Repayment Period</label>
                <span className="font-mono text-slate-300 font-bold">{loanYears} Years ({loanYears * 12} Months)</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[3, 5, 7, 8, 9].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setLoanYears(yr)}
                    className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                      loanYears === yr
                        ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {yr} Yrs
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Separation of ML Model Callout */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Zero Target Leakage Guarantee</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              This financing calculator runs as an independent post-valuation utility. Loan terms, interest percentages, and installment amounts are intentionally excluded from the price prediction regressors.
            </p>
          </div>
        </div>

        {/* Results & Visualizations Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              {/* Payment Hero Banner */}
              <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl shadow-purple-950/20 space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase tracking-wider font-semibold font-mono">Estimated Monthly Instalment</span>
                  <span className="font-mono text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-800/40">
                    {result.loan_term_years} Years ({result.loan_term_months} Months)
                  </span>
                </div>

                <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  RM {Math.round(result.monthly_installment).toLocaleString()}
                  <span className="text-base sm:text-lg font-normal text-slate-400 ml-2">/ month</span>
                </div>

                {/* KPI Breakdown Tiles */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-mono">Loan Principal</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-blue-400">
                      RM {Math.round(result.loan_amount).toLocaleString()}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      {((result.loan_amount / result.vehicle_price) * 100).toFixed(0)}% of price
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-mono">Total Interest</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-purple-400">
                      RM {Math.round(result.total_interest).toLocaleString()}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      {((result.total_interest / result.loan_amount) * 100).toFixed(1)}% of loan
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-mono">Total Repayment</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-white">
                      RM {Math.round(result.total_payable).toLocaleString()}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      Principal + Interest
                    </span>
                  </div>
                </div>
              </div>

              {/* Capital Allocation Donut Chart */}
              <AppleChartCard
                title="Capital Allocation Breakdown"
                subtitle="Distribution of initial cash down payment, principal borrowed, and total financing interest."
                badge="Total Outlay"
                badgeColor="violet"
                footerNotes={
                  <span>
                    Total vehicle commitment: <strong className="text-white">{formatRM(totalOutlay)}</strong> (Down Payment + Total Bank Repayment).
                  </span>
                }
              >
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ payload }) => {
                          if (payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl text-xs space-y-1 shadow-2xl min-w-[190px]">
                                <p className="font-bold text-white">{d.name}</p>
                                <div className="flex justify-between font-mono text-cyan-400">
                                  <span>Amount:</span>
                                  <span className="font-bold">{formatRM(d.value)}</span>
                                </div>
                                <div className="flex justify-between font-mono text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                                  <span>Share of Outlay:</span>
                                  <span className="font-semibold text-emerald-400">{d.pct.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>}
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </AppleChartCard>

              {/* Interactive Amortization Schedule: Area Curve or Detailed Table */}
              <AppleChartCard
                title="Yearly Amortization Progression"
                subtitle="Visualizing remaining loan balance and cumulative equity accumulation over the loan tenure."
                badge="Amortization"
                badgeColor="teal"
                headerControls={
                  <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                    <button
                      onClick={() => setScheduleView("chart")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        scheduleView === "chart"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Balance Curve
                    </button>
                    <button
                      onClick={() => setScheduleView("table")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        scheduleView === "table"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Detailed Table
                    </button>
                  </div>
                }
              >
                {scheduleView === "chart" ? (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={amortizationChartData}
                        margin={{ top: 15, right: 15, bottom: 20, left: 15 }}
                      >
                        <defs>
                          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="repaidGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
                        <XAxis
                          dataKey="yearLabel"
                          stroke={CHART_COLORS.neutral}
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={CHART_COLORS.neutral}
                          fontSize={11}
                          tickFormatter={(v) => `RM ${Math.round(v / 1000)}k`}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ payload }) => {
                            if (!payload || !payload.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 text-xs text-white space-y-2 min-w-[210px]">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                  <span className="font-bold text-white">{d.yearLabel}</span>
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                                    {d.clearedPct}% Paid Off
                                  </span>
                                </div>
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Remaining Balance:</span>
                                  <span className="font-bold text-cyan-300">{formatRM(d.remainingBalance)}</span>
                                </div>
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Principal Repaid:</span>
                                  <span className="text-slate-200">{formatRM(d.principalRepaid)}</span>
                                </div>
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Interest Paid:</span>
                                  <span className="text-purple-400">{formatRM(d.interestRepaid)}</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="remainingBalance"
                          name="Outstanding Balance"
                          stroke={CHART_COLORS.teal}
                          strokeWidth={2.5}
                          fill="url(#balanceGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Tenure Year</th>
                          <th className="py-2.5 px-3 text-right">Annual Payment</th>
                          <th className="py-2.5 px-3 text-right">Principal Repaid</th>
                          <th className="py-2.5 px-3 text-right">Interest Paid</th>
                          <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {result.yearly_schedule.map((item) => (
                          <tr key={item.year} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-medium text-white font-mono">
                              Year {item.year}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                              RM {item.annual_payment.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                              RM {item.principal_repaid.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-purple-400">
                              RM {item.interest_repaid.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-cyan-300">
                              RM {item.remaining_total_balance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AppleChartCard>

              {/* Financing Assumption Disclaimer */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Malaysian Hire-Purchase Methodological Assumptions:</p>
                <p className="leading-relaxed text-[11px]">
                  {result.disclaimer} Calculations use the fixed flat rate method universally applied under the Malaysian Hire-Purchase Act 1967:
                  <code className="text-purple-300 bg-slate-950 px-1.5 py-0.5 rounded ml-1 font-mono">
                    Total Interest = Principal × Rate × Years
                  </code>.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FinancingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FinancingCalculatorContent />
    </Suspense>
  );
}
