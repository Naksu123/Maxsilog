"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Car,
  LayoutDashboard,
  BarChart3,
  Calculator,
  Award,
  RefreshCw,
  ShieldCheck,
  Zap,
  Home,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import GithubIcon from "./GithubIcon";
import { getHealth } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Poll or check API health
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

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [drawerOpen]);

  // Navigation Links for Drawer and Desktop
  const navItems = [
    { href: "/", label: "Home", icon: Home, description: "Overview & landing page" },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Operational metrics & statistics" },
    { href: "/predict", label: "Predict Car Price", icon: Car, badge: "AI MODEL", description: "ML resale price valuation" },
    { href: "/analytics", label: "Market Analysis", icon: BarChart3, description: "Trends, distributions & regions" },
    { href: "/benchmark", label: "Model Benchmark", icon: Award, description: "5-Fold CV comparative analysis" },
    { href: "/financing", label: "Hire-Purchase Calculator", icon: Calculator, description: "Malaysian loan amortisation" },
    { href: "/admin", label: "Admin & Retraining", icon: RefreshCw, badge: "SECURE", description: "Autonomous retraining & rollback" },
  ];

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* FAR-LEFT: Hamburger Button + Brand Logo */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Left-Side Hamburger Menu Button */}
              <button
                id="hamburger-btn"
                onClick={() => setDrawerOpen(true)}
                className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                aria-label="Open Left-Side Navigation Menu"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-slate-200" />
              </button>

              {/* Logo / Brand */}
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono">
                      Auto<span className="text-cyan-400">Valuate</span>
                    </span>
                    <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                      MY
                    </span>
                  </div>
                </div>
              </Link>
            </div>



            {/* FAR-RIGHT: Primary CTA + Status Badge + GitHub */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              {/* Primary Header Action: Predict Car Price */}
              <Link
                href="/predict"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Predict Car Price</span>
              </Link>

              {/* API Online Status */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiOnline ? "bg-emerald-400" : apiOnline === false ? "bg-rose-400" : "bg-amber-400"
                      }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? "bg-emerald-500" : apiOnline === false ? "bg-rose-500" : "bg-amber-500"
                      }`}
                  />
                </span>
                <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
                  {apiOnline ? "API Online" : apiOnline === false ? "Backend Offline" : "Connecting"}
                </span>
              </div>

              {/* GitHub Repo Button */}
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Naksu123/autovaluate"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
                aria-label="View on GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* ----------------- LEFT-SIDE NAVIGATION DRAWER ----------------- */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 bottom-0 left-0 w-84 max-w-[85vw] bg-[#0A0F1D] border-r border-slate-800/90 shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out transform ${drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        aria-label="Left Side Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center space-x-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white font-mono">
                Auto<span className="text-cyan-400">Valuate</span>
              </span>
              <span className="ml-1.5 px-1 py-0.2 text-[9px] uppercase font-bold bg-blue-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                MY
              </span>
            </div>
          </Link>

          <button
            id="close-drawer-btn"
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            aria-label="Close Navigation Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Quick CTA Banner in Drawer */}
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 space-y-2">
            <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Price Valuation</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Estimate the fair market value of any Malaysian used vehicle in seconds.
            </p>
            <Link
              href="/predict"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Start Valuation Now</span>
            </Link>
          </div>

          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-3 py-1">
            Application Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${isActive
                    ? "bg-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-400 transition-colors"}`} />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${item.badge === "SECURE"
                            ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700/50"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-300"}`} />
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer / System Context */}
        <div className="p-4 border-t border-slate-800 bg-[#070B14] space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>FastAPI Backend Live</span>
            </span>
            <span className="text-cyan-400 font-mono">Port 8000</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Target Leakage Barred (2,500 listings)</span>
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed font-sans">
            AutoValuate operationalizes empirical research from UNO-R College of Information Technology (2026).
          </div>
        </div>
      </aside>
    </>
  );
}
