"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Car, 
  BarChart3, 
  Calculator, 
  Gauge, 
  Award, 
  ShieldCheck, 
  Menu, 
  X,
  Activity,
  RefreshCw
} from "lucide-react";
import GithubIcon from "./GithubIcon";
import { getHealth } from "../lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHealth()
      .then((data) => {
        if (isMounted) setApiOnline(data.status === "healthy");
      })
      .catch(() => {
        if (isMounted) setApiOnline(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Gauge },
    { href: "/predict", label: "Price Prediction", icon: Car },
    { href: "/analytics", label: "Market Analytics", icon: BarChart3 },
    { href: "/benchmark", label: "Model Benchmark", icon: Award },
    { href: "/financing", label: "Financing Calculator", icon: Calculator },
    { href: "/admin", label: "Admin & Retraining", icon: RefreshCw },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  Auto<span className="text-cyan-400">Valuate</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                  MY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Malaysian Used-Car AI Valuation
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  apiOnline ? "bg-emerald-400" : apiOnline === false ? "bg-rose-400" : "bg-amber-400"
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  apiOnline ? "bg-emerald-500" : apiOnline === false ? "bg-rose-500" : "bg-amber-500"
                }`} />
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                {apiOnline ? "API Online" : apiOnline === false ? "Backend Offline" : "Connecting..."}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-medium">Leakage-Protected</span>
            </div>

            {/* GitHub Repo Button */}
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Naksu123/autovaluate"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
              aria-label="View on GitHub"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F172A] border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-blue-600/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5 text-cyan-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{apiOnline ? "Backend Live (FastAPI)" : "Connecting API"}</span>
            </div>
            <div className="flex items-center space-x-1 text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Leakage-Protected</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
