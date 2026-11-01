"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  // Grouped Navigation Sections (Clean typographic hierarchy)
  const navCategories = [
    {
      title: "Valuation & Analytics",
      items: [
        { href: "/", label: "Home", desc: "Executive summary & market snapshot" },
        { href: "/predict", label: "Predict Car Price", badge: "AI Champion", desc: "Interactive 3D vehicle & ML ensemble valuation" },
        { href: "/analytics", label: "Market Analytics", desc: "2,483 listings & price distribution telemetry" },
        { href: "/benchmark", label: "Model Benchmark", desc: "Comparative 5-fold cross-validation metrics" },
      ],
    },
    {
      title: "Advisory & Tools",
      items: [
        { href: "/financing", label: "Financing Calculator", desc: "Hire-Purchase amortization & installment breakdown" },
        { href: "/dashboard", label: "Telemetry Dashboard", desc: "Operational market aggregates & scatter plots" },
        { href: "/admin", label: "Admin & Retraining", badge: "SECURE", desc: "Daily retraining scheduler & version rollback" },
      ],
    },
  ];

  return (
    <>
      {/* Sticky Header with Clean Typographic & Hamburger Navigation */}
      <header className="sticky top-0 z-40 bg-[#060913]/90 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LEFT: Brand Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="relative h-9 w-auto flex items-center overflow-hidden rounded-lg bg-black/60 border border-slate-800/80 p-0.5 shadow-md shadow-purple-500/10 group-hover:border-purple-500/40 group-hover:shadow-purple-500/25 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/logo.jpg"
                    alt="AutoValue Logo"
                    className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-white font-mono">
                      Auto<span className="text-purple-400">Value</span>
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded">
                      MY
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* RIGHT: Quick Action + Live Status Badge + GitHub + Hamburger Menu Button */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Primary Header Action: Predict Car Price */}
              <Link
                href="/predict"
                className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 border border-purple-400/20 transition-all cursor-pointer"
              >
                <span>Predict Price</span>
              </Link>

              {/* API Online Status */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      apiOnline ? "bg-emerald-400" : apiOnline === false ? "bg-rose-400" : "bg-amber-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      apiOnline ? "bg-emerald-500" : apiOnline === false ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                </span>
                <span className="text-slate-300 font-mono text-[11px] hidden md:inline">
                  {apiOnline ? "API Online" : apiOnline === false ? "Backend Offline" : "Connecting"}
                </span>
              </div>

              {/* GitHub Repo Button */}
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Naksu123/autovaluate"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors text-xs font-mono font-medium"
                aria-label="View GitHub Repository"
              >
                GitHub
              </a>

              {/* HAMBURGER MENU BUTTON (Pure CSS bars, always visible across all screen sizes) */}
              <button
                id="hamburger-menu-btn"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-purple-500/40 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer active:scale-95 group"
                aria-label="Open Navigation Menu"
                title="Open Navigation Menu"
              >
                <div className="flex flex-col justify-center space-y-1 w-4 h-3.5" aria-hidden="true">
                  <span className="block w-4 h-0.5 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors" />
                  <span className="block w-4 h-0.5 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors" />
                  <span className="block w-3 h-0.5 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors" />
                </div>
                <span className="text-xs font-semibold tracking-wide">Menu</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ----------------- SLIDE-OVER NAVIGATION DRAWER ----------------- */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel (Slides in from the right edge) */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 bottom-0 right-0 w-88 sm:w-96 max-w-[88vw] bg-[#0A0F1D]/98 backdrop-blur-2xl border-l border-slate-800/90 shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Application Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center space-x-2.5"
          >
            <div className="relative h-8 w-auto flex items-center overflow-hidden rounded-lg bg-black/60 border border-slate-800 p-0.5 shadow-sm shadow-purple-500/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.jpg"
                alt="AutoValue Logo"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-base font-bold text-white font-mono">
                Auto<span className="text-purple-400">Value</span>
              </span>
              <span className="ml-1.5 px-1 py-0.2 text-[9px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                MY
              </span>
            </div>
          </Link>

          <button
            id="close-drawer-btn"
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer text-lg leading-none font-bold"
            aria-label="Close Navigation Drawer"
          >
            {"×"}
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick CTA Banner in Drawer */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white font-medium">Market Valuation & 3D Studio</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-500/20">
                AI STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Estimate fair market value with real-time 3D vehicle inspection and 4-model consensus.
            </p>
            <Link
              href="/predict"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span>Start Valuation Now</span>
            </Link>
          </div>

          {/* Grouped Category Navigation */}
          {navCategories.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-3">
                {group.title}
              </div>

              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-cyan-400 shadow-sm shadow-cyan-400/50" : "bg-slate-600 group-hover:bg-cyan-400/70"}`} />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold">{item.label}</span>
                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              item.badge === "SECURE"
                                ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700/50"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
                      </div>
                    </div>

                    <span className={`text-xs transition-transform group-hover:translate-x-0.5 ${isActive ? "text-cyan-400 font-bold" : "text-slate-600 group-hover:text-slate-300"}`}>
                      {"→"}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#070B14] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>FastAPI Backend Live</span>
            </span>
            <span className="text-cyan-400 font-mono">Port 8000</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            <span>Target Leakage Barred (2,483 listings)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
