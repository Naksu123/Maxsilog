"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  PieChart as PieIcon
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis 
} from "recharts";
import { calculateFinancing } from "@/lib/api";
import { FinancingResponse } from "@/types";

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

  // Computed state
  const [result, setResult] = useState<FinancingResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downPaymentAmount = (vehiclePrice * downPaymentPercent) / 100.0;

  const performCalculation = async () => {
    setError(null);
    if (downPaymentAmount >= vehiclePrice) {
      setError("Down payment cannot equal or exceed the total vehicle price.");
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
    } catch (err: any) {
      console.error("Financing calculation error:", err);
      // Fallback local calculation if backend is unreachable
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
    performCalculation();
  }, [vehiclePrice, downPaymentPercent, annualRate, loanYears]);

  const pieData = result
    ? [
        { name: "Principal Loan Amount", value: result.loan_amount, color: "#38BDF8" },
        { name: "Total Borrowing Interest", value: result.total_interest, color: "#6366F1" },
        { name: "Initial Down Payment", value: result.down_payment, color: "#10B981" }
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          <Calculator className="w-3.5 h-3.5" />
          <span>Malaysian Hire-Purchase Financing Tool</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Used-Car Loan & Monthly Payment Calculator
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Estimate commercial bank hire-purchase financing installments. 
          <span className="text-slate-300 font-semibold"> Note: </span> This tool is strictly separated from the machine-learning price valuation model to ensure research target leakage avoidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 space-y-6 border border-slate-800">
            <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Loan Parameters</span>
            </h2>

            {/* Vehicle Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Vehicle Purchase Price (RM)</label>
                <span className="font-mono text-cyan-400 font-bold">
                  RM {Number(vehiclePrice).toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="5000"
                max="1000000"
                step="1000"
                value={vehiclePrice}
                onChange={(e) => setVehiclePrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Down Payment % and Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Down Payment ({downPaymentPercent}%)</label>
                <span className="font-mono text-slate-300">
                  RM {Math.round(downPaymentAmount).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Full Loan)</span>
                <span>10% (Typical)</span>
                <span>20%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Annual Interest Rate (Flat Rate)</label>
                <span className="font-mono text-cyan-400 font-bold">{annualRate}% p.a.</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.0"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2.5% (Promo)</span>
                <span>3.5% (Avg Used)</span>
                <span>5.0% (Subprime)</span>
              </div>
            </div>

            {/* Loan Tenure */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Loan Tenure</label>
                <span className="font-mono text-slate-300 font-bold">{loanYears} Years ({loanYears * 12} Months)</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[3, 5, 7, 8, 9].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setLoanYears(yr)}
                    className={`py-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      loanYears === yr
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {yr} Yrs
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Separation of ML Model Callout */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Independence</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              This financing module operates as an independent post-prediction financial utility. 
              Installment amounts and interest formulas do not enter the feature space of the valuation regressors.
            </p>
          </div>
        </div>

        {/* Results & Schedule Column */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              {/* Payment Hero Banner */}
              <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-cyan-500/30 glow-blue space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase tracking-wider font-semibold">Estimated Monthly Payment</span>
                  <span className="font-mono">{result.loan_term_years} Years ({result.loan_term_months} Months)</span>
                </div>

                <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  RM {Math.round(result.monthly_installment).toLocaleString()}
                  <span className="text-lg font-normal text-slate-400 ml-2">/ month</span>
                </div>

                {/* KPI Breakdown Tiles */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-mono">Loan Principal</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-cyan-400">
                      RM {Math.round(result.loan_amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-mono">Total Interest</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-indigo-400">
                      RM {Math.round(result.total_interest).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-mono">Total Repayment</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-white">
                      RM {Math.round(result.total_payable).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Breakdown Chart */}
              <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-base font-semibold text-white">Capital Allocation Breakdown</h3>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={3}
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
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs space-y-0.5">
                                <p className="font-bold text-white">{d.name}</p>
                                <p className="text-cyan-400 font-mono">RM {Math.round(d.value).toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Amortization Schedule Table */}
              <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">Yearly Amortization Schedule</h3>
                    <p className="text-xs text-slate-400">Cumulative principal and interest payment progress</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Flat Rate Method
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Tenure Year</th>
                        <th className="py-2.5 px-3 text-right">Annual Payment</th>
                        <th className="py-2.5 px-3 text-right">Principal Repaid</th>
                        <th className="py-2.5 px-3 text-right">Interest Paid</th>
                        <th className="py-2.5 px-3 text-right">Balance Outstanding</th>
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
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                            RM {item.principal_repaid.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-indigo-400">
                            RM {item.interest_repaid.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                            RM {item.remaining_total_balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financing Assumption Disclaimer */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Malaysian Hire-Purchase Assumptions:</p>
                <p className="leading-relaxed text-[11px]">
                  {result.disclaimer} Calculations use the fixed flat rate method universally applied in Malaysian vehicle loans:
                  <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded ml-1 font-mono">
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
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading calculator...</div>}>
      <FinancingCalculatorContent />
    </Suspense>
  );
}
