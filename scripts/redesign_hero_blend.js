const fs = require('fs');

let page = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// Target the Hero section in page.tsx
const oldHeroRegex = /{\/\* =+\s*\*\/}\s*{\/\* 1\. HERO SECTION[\s\S]*?{\/\* 2\. HOW IT WORKS/m;

const newHero = `{/* ======================================================== */}
        {/* 1. HERO SECTION                                          */}
        {/* ======================================================== */}
        <section className="relative min-h-[85vh] sm:min-h-[88vh] lg:min-h-[90vh] flex items-center justify-center pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
            
            {/* Top Tagline / Frosted Apple Badge */}
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-950/60 border border-white/10 backdrop-blur-2xl shadow-xl shadow-black/50 text-xs font-mono text-slate-300 transition-all hover:border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-300 font-semibold font-mono">AutoValue AI</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-sans">Malaysian Automotive Machine Learning</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-purple-300/90 hidden sm:inline font-mono">2,483 Verified Listings</span>
            </div>

            {/* Main Hero Headline: Luminous Silver & AutoValue Violet Gradient */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto font-sans drop-shadow-2xl">
              Predict Smarter.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-white">
                Value Better.
              </span>
            </h1>

            {/* Concise Supporting Description */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed font-normal font-sans drop-shadow">
              AutoValue uses supervised machine learning to estimate used-car prices and provide empirical market insights across Malaysia—delivering objective empirical valuations backed by rigorous statistical cross-validation.
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/predict"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-900/30 border border-purple-400/30 backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
              >
                <span>Predict Car Price</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </Link>

              <Link
                href="/analytics"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 text-slate-200 hover:text-white font-medium text-sm border border-white/10 backdrop-blur-2xl shadow-xl transition-all hover:border-purple-500/30 cursor-pointer"
              >
                <span>Explore Market Analytics</span>
              </Link>
            </div>

            {/* Frosted Glass Floating Dock: Verified Backend Market Snapshot */}
            <div className="max-w-4xl mx-auto mt-12 rounded-3xl bg-slate-950/50 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/80 p-6 sm:p-7 grid grid-cols-2 lg:grid-cols-4 gap-4 text-left transition-all hover:border-purple-500/20">
              
              <div className="space-y-1.5 p-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Dataset Scale
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                  2,483
                </div>
                <p className="text-[11px] text-slate-400/90 font-sans">Verified Malaysian listings</p>
              </div>

              <div className="space-y-1.5 p-2 border-l border-white/[0.08]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Median Resale
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono tabular-nums">
                  RM 68.4k
                </div>
                <p className="text-[11px] text-slate-400/90 font-sans">Across all market segments</p>
              </div>

              <div className="space-y-1.5 p-2 border-l border-white/[0.08]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Model Explanatory Power
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 font-mono tabular-nums">
                  80.8% R²
                </div>
                <p className="text-[11px] text-slate-400/90 font-sans">5-Fold cross-validated score</p>
              </div>

              <div className="space-y-1.5 p-2 border-l border-white/[0.08]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Target Leakage
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400/90 font-mono tabular-nums">
                  0.00%
                </div>
                <p className="text-[11px] text-slate-400/90 font-sans">Installment terms barred</p>
              </div>

            </div>

            {/* Research & Data Integrity Footer Line */}
            <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-slate-400/80 font-sans">
              <span>Empirical research integrity • Trained on real Malaysian market listings with strict feature vector isolation</span>
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. HOW IT WORKS`;

if (oldHeroRegex.test(page)) {
  page = page.replace(oldHeroRegex, newHero);
  fs.writeFileSync('frontend/src/app/page.tsx', page, 'utf8');
  console.log('Successfully redesigned hero section to blend seamlessly on UI');
} else {
  console.log('Regex did not match hero section directly');
}

