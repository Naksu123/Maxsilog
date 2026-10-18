import React from "react";
import Link from "next/link";
import { 
  Car, 
  ShieldCheck, 
  ExternalLink,
  FileCode2
} from "lucide-react";
import GithubIcon from "./GithubIcon";

export default function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Naksu123/autovaluate";

  return (
    <footer className="bg-[#050811] border-t border-slate-800/80 mt-14 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Brand & Mission */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Car className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-white font-mono">
                Auto<span className="text-cyan-400">Valuate</span>
              </span>
              <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider bg-blue-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                MY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              AI-driven used-car resale price prediction & market intelligence in Malaysia.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300">
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
            <Link href="/admin" className="hover:text-cyan-400 transition-colors flex items-center space-x-1">
              <span>Admin</span>
              <span className="text-[8px] px-1 bg-cyan-900/60 text-cyan-300 rounded border border-cyan-700/50">SECURE</span>
            </Link>
          </nav>

          {/* External Links: GitHub & Swagger */}
          <div className="flex items-center space-x-2.5">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all text-[11px]"
              title="FastAPI Swagger Documentation"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>API Docs</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
            </a>

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all text-[11px]"
              aria-label="View Project on GitHub"
            >
              <GithubIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>GitHub</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
            </a>
          </div>

        </div>

        {/* Minimal Bottom Bar */}
        <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>© 2026 AutoValuate</span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-emerald-400/90">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Target Leakage Barred (2,500 listings)</span>
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline text-slate-400">UNO-R College of Information Technology (COPE0683X)</span>
          </div>

          <span className="text-slate-400 text-center sm:text-right">
            Statistical estimates for the Malaysian automotive resale market.
          </span>
        </div>

      </div>
    </footer>
  );
}
