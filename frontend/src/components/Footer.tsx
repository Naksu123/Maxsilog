import React from "react";
import Link from "next/link";

export default function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Naksu123/autovaluate";
  const apiDocsUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/docs` 
    : "http://localhost:8000/docs";

  return (
    <footer className="bg-[#050811] border-t border-slate-800/80 mt-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        
        {/* Top Minimal Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Brand & Slogan */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="h-7 w-auto overflow-hidden rounded bg-black/60 border border-slate-800 p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.jpg"
                alt="AutoValue Logo"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="text-sm font-bold text-white font-mono tracking-tight">
              Auto<span className="text-purple-400">Value</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded">
              MY
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Machine Learning Used-Car Valuation & Market Analytics
            </span>
          </div>

          {/* Quick Navigation & External Links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-300">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/predict" className="hover:text-cyan-400 transition-colors">
              Predict
            </Link>
            <Link href="/analytics" className="hover:text-cyan-400 transition-colors">
              Analytics
            </Link>
            <Link href="/benchmark" className="hover:text-cyan-400 transition-colors">
              Benchmark
            </Link>
            <Link href="/financing" className="hover:text-cyan-400 transition-colors">
              Financing
            </Link>
            <Link href="/admin" className="hover:text-cyan-400 transition-colors inline-flex items-center space-x-1">
              <span>Admin</span>
              <span className="text-[8px] px-1 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-800/80 font-mono">
                SECURE
              </span>
            </Link>

            <span className="text-slate-800 hidden sm:inline">|</span>

            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-cyan-400 transition-colors text-[11px]"
              title="FastAPI Swagger Documentation"
            >
              <span>API Docs &rarr;</span>
            </a>

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-cyan-400 transition-colors text-[11px]"
              aria-label="View on GitHub"
            >
              <span>GitHub &rarr;</span>
            </a>
          </div>

        </div>

        {/* Bottom Academic Attribution & Integrity Row */}
        <div className="border-t border-slate-900/90 pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-slate-300">© 2026 AutoValuate</span>
            <span className="text-slate-700">•</span>
            <span>UNO-R College of Information Technology (COPE0683X)</span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-400">
              Researchers: L. Ballaran, K. J. Dela Serna, R. F. Montaner III
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Advisor: M. S. Urocay</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0 text-[11px] text-emerald-400/90 self-start md:self-auto">
            <span>2,500 Malaysian Listings (Target Leakage Barred)</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
