import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AutoValuate — AI Malaysian Used-Car Valuation & Market Analytics",
  description:
    "Supervised machine learning valuation system comparing Linear Regression, Ridge, Random Forest, and Gradient Boosting on 2,500 Malaysian used-vehicle listings.",
  keywords: [
    "Used Car Valuation",
    "Malaysia Used Car Prices",
    "Car Price Prediction",
    "Machine Learning Regression",
    "AutoValuate",
    "FastAPI Next.js"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080D1A] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Background glow effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
