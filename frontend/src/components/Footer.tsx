import React from "react";
import Link from "next/link";
import { 
  Car, 
  ShieldCheck, 
  GraduationCap, 
  Database, 
  Cpu, 
  ExternalLink,
  BookOpen,
  FileCode2,
  GitBranch
} from "lucide-react";
import GithubIcon from "./GithubIcon";

export default function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Naksu123/autovaluate";

  return (
    <footer className="bg-[#050811] border-t border-slate-900 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & GitHub Link */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white font-mono">
                Auto<span className="text-cyan-400">Valuate</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Supervised Machine Learning Regression Framework for Malaysian Used-Vehicle Resale Valuation.
            </p>

            {/* Target Leakage Status Badge */}
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Leakage Barred</span>
            </div>

            {/* GitHub Repository Button */}
            <div className="pt-1">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-medium transition-all group"
                aria-label="View Project on GitHub"
              >
                <GithubIcon className="w-4 h-4 text-slate-300 group-hover:text-white" />
                <span>Source Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Application Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Market Dashboard
                </Link>
              </li>
              <li>
                <Link href="/predict" className="hover:text-cyan-400 transition-colors">
                  AI Price Prediction
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-cyan-400 transition-colors">
                  Interactive Analytics
                </Link>
              </li>
              <li>
                <Link href="/benchmark" className="hover:text-cyan-400 transition-colors">
                  Model Benchmarking
                </Link>
              </li>
              <li>
                <Link href="/financing" className="hover:text-cyan-400 transition-colors">
                  Hire-Purchase Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Research Architecture & API */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Research Pipeline & API
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>2,500 Malaysian Listings</span>
              </li>
              <li className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>80/20 Split & 5-Fold CV</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Leakage-Aware Preprocessing</span>
              </li>
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 pt-1"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>FastAPI Swagger Docs (/docs)</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Academic Attribution */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>Academic Context</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              University of Negros Occidental – Recoletos (UNO-R)
              <br />
              College of Information Technology
              <br />
              Course: COPE0683X (Data Science)
            </p>
            <div className="text-[11px] text-slate-400 mt-2 space-y-0.5 border-t border-slate-900 pt-2">
              <p className="text-slate-300 font-medium">Researchers:</p>
              <p>Lemuel A. Ballaran, Kent Jason Dele Serna, Ricarte Florez Montaner III</p>
              <p className="pt-1 text-slate-400">Advisor: Mr. Maxil S. Urocay, MSCS candidate</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 AutoValuate. Built for Malaysian automotive analytics and production deployment.</p>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span className="text-[11px] text-slate-400">
              Valuations are statistical estimates and do not guarantee market purchase offers.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
