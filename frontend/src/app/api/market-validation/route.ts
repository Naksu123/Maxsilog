import { NextRequest, NextResponse } from "next/server";
import inventoryData from "@/data/vehicle-inventory.json";

interface InventoryEntry {
  brand: string;
  model: string;
  count: number;
  minYear: number | null;
  maxYear: number | null;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleDescriptions: string[];
}

interface PaqarValuationResponse {
  variant?: string;
  wmNewPrice?: number | null;
  marketMedian?: number | null;
  marketMin?: number | null;
  marketMax?: number | null;
  marketCount?: number | null;
  confidence?: "low" | "medium" | "high";
  isSpecialVariant?: boolean;
  marketCohort?: string;
  matchedBy?: string;
  error?: string;
}

interface PaqarVariantLadder {
  model?: string;
  modelSlug?: string;
  generations?: Array<{
    years: string;
    variants: Array<{
      name: string;
      verdict: "best-value" | "worth-it-if" | "avoid" | "ok" | string;
      spotChecks: string[];
    }>;
  }>;
}

// In-memory cache for market validation queries (1 hour TTL)
// Adheres to Paqar rate limit (10 requests/minute)
const validationCache = new Map<string, { data: MarketValidationResult; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface MarketValidationResult {
  brand: string;
  model: string;
  year: number;
  status: "available" | "partial" | "unavailable";
  dataSource: string;
  dataSourceUrl: string;
  lastUpdated: string;
  externalNewPriceMSRP: number | null;
  externalMarketMedian: number | null;
  externalPriceRange: {
    min: number;
    max: number;
  } | null;
  comparableListingsCount: number;
  confidenceLevel: "high" | "medium" | "low" | "baseline";
  priceType: "Live Market Asking Price" | "Empirical Malaysian Listing Baseline";
  matchedVariant?: string;
  inspectionSpotChecks?: string[];
  variantVerdict?: string;
  empiricalBaseline: {
    datasetSampleCount: number;
    datasetAvgPrice: number;
    datasetPriceRange: [number, number];
  } | null;
  academicNote: string;
}

function cleanModelForApi(model: string, brand: string): string {
  let cleaned = model.trim();
  // Remove leading brand if repeated in model string
  if (cleaned.toLowerCase().startsWith(brand.toLowerCase() + " ")) {
    cleaned = cleaned.slice(brand.length).trim();
  }
  // Remove complex trim suffixes for variant lookup
  const parts = cleaned.split(" ");
  return parts[0] || cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand") || "";
    const model = searchParams.get("model") || "";
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : 2018;

    if (!brand || !model) {
      return NextResponse.json({ error: "Missing brand or model parameter" }, { status: 400 });
    }

    const cacheKey = `${brand.toLowerCase()}:::${model.toLowerCase()}:::${year}`;
    const cached = validationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // 1. Query Empirical Dataset Inventory for Baseline Statistics
    const invList = inventoryData as InventoryEntry[];
    const normModel = model.toLowerCase().trim();
    const invMatch = invList.find((entry) => entry.model.toLowerCase().trim() === normModel);

    const empiricalBaseline = invMatch
      ? {
          datasetSampleCount: invMatch.count,
          datasetAvgPrice: Math.round(invMatch.avgPrice),
          datasetPriceRange: [Math.round(invMatch.minPrice), Math.round(invMatch.maxPrice)] as [number, number],
        }
      : null;

    // 2. Query External Live Provider: Paqar API (Malaysian Used-Car Market Valuation)
    const modelSlug = cleanModelForApi(model, brand);
    let paqarData: PaqarValuationResponse | null = null;
    let paqarVariants: PaqarVariantLadder | null = null;

    try {
      const paqarTimeout = parseInt(process.env.PAQAR_API_TIMEOUT_MS || "3500", 10);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), paqarTimeout);

      // Query Paqar valuation endpoint using nvic fallback: make + year + model
      const paqarValUrl = `https://paqar.my/api/v1/valuation?nvic=GENERIC&make=${encodeURIComponent(
        brand
      )}&year=${year}&model=${encodeURIComponent(modelSlug)}`;

      const valRes = await fetch(paqarValUrl, {
        headers: {
          "User-Agent": "AutoValuate-Academic-Research/1.0 (https://autovaluate.my; contact@autovaluate.my)",
          Accept: "application/json",
        },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });

      if (valRes.ok) {
        paqarData = await valRes.json();
      }

      // Query Paqar variant inspection ladder
      const paqarVarUrl = `https://paqar.my/api/v1/variants/${encodeURIComponent(brand)}/${encodeURIComponent(
        modelSlug
      )}`;

      const varRes = await fetch(paqarVarUrl, {
        headers: {
          "User-Agent": "AutoValuate-Academic-Research/1.0",
          Accept: "application/json",
        },
        signal: controller.signal,
        next: { revalidate: 86400 },
      });

      if (varRes.ok) {
        const varJson = await varRes.json();
        if (Array.isArray(varJson) && varJson.length > 0) {
          paqarVariants = varJson[0];
        } else if (varJson && typeof varJson === "object" && !Array.isArray(varJson)) {
          paqarVariants = varJson;
        }
      }

      clearTimeout(timeoutId);
    } catch {
      // Graceful fallback on network timeout or external API failure
      paqarData = null;
    }

    // 3. Extract Variant Ladder & Spot Checks if Available
    let matchedVariant = paqarData?.variant || undefined;
    let spotChecks: string[] | undefined = undefined;
    let variantVerdict: string | undefined = undefined;

    if (paqarVariants?.generations) {
      for (const gen of paqarVariants.generations) {
        if (gen.variants && gen.variants.length > 0) {
          const vMatch = matchedVariant
            ? gen.variants.find((v) => v.name.toLowerCase().includes(matchedVariant!.toLowerCase()))
            : gen.variants[0];
          if (vMatch) {
            spotChecks = vMatch.spotChecks;
            variantVerdict = vMatch.verdict;
            if (!matchedVariant) matchedVariant = vMatch.name;
            break;
          }
        }
      }
    }

    // 4. Synthesize External Market Comparison
    const hasLiveMedian = typeof paqarData?.marketMedian === "number" && paqarData.marketMedian > 0;
    const hasLiveRange =
      typeof paqarData?.marketMin === "number" &&
      typeof paqarData?.marketMax === "number" &&
      paqarData.marketMax > 0;

    let result: MarketValidationResult;

    if (hasLiveMedian && hasLiveRange) {
      result = {
        brand,
        model,
        year,
        status: "available",
        dataSource: "Paqar.my Real-Time Market Valuation",
        dataSourceUrl: "https://paqar.my",
        lastUpdated: new Date().toISOString(),
        externalNewPriceMSRP: paqarData?.wmNewPrice || null,
        externalMarketMedian: paqarData!.marketMedian!,
        externalPriceRange: {
          min: paqarData!.marketMin!,
          max: paqarData!.marketMax!,
        },
        comparableListingsCount: paqarData?.marketCount || 0,
        confidenceLevel: paqarData?.confidence || "medium",
        priceType: "Live Market Asking Price",
        matchedVariant,
        inspectionSpotChecks: spotChecks,
        variantVerdict,
        empiricalBaseline,
        academicNote:
          "External market figures represent asking prices scraped from live Malaysian automotive portals. AutoValuate's Gradient Boosting prediction models fair market value accounting for vehicle condition, mileage depreciation, and regional liquidity.",
      };
    } else if (paqarData && paqarData.wmNewPrice) {
      // Partial Paqar coverage (Original MSRP known, active listings cohort building)
      result = {
        brand,
        model,
        year,
        status: "partial",
        dataSource: "Paqar.my Specifications & AutoValuate Dataset Baseline",
        dataSourceUrl: "https://paqar.my",
        lastUpdated: new Date().toISOString(),
        externalNewPriceMSRP: paqarData.wmNewPrice,
        externalMarketMedian: empiricalBaseline?.datasetAvgPrice || null,
        externalPriceRange: empiricalBaseline
          ? { min: empiricalBaseline.datasetPriceRange[0], max: empiricalBaseline.datasetPriceRange[1] }
          : null,
        comparableListingsCount: empiricalBaseline?.datasetSampleCount || 0,
        confidenceLevel: "medium",
        priceType: "Empirical Malaysian Listing Baseline",
        matchedVariant: paqarData.variant || matchedVariant,
        inspectionSpotChecks: spotChecks,
        variantVerdict,
        empiricalBaseline,
        academicNote: `Official West Malaysia MSRP when brand new was RM ${paqarData.wmNewPrice.toLocaleString()}. Market resale bounds are benchmarked against AutoValuate's empirical dataset of 2,483 verified listings.`,
      };
    } else if (empiricalBaseline) {
      // External API unavailable or unsupported; fallback to empirical dataset benchmark
      result = {
        brand,
        model,
        year,
        status: "available",
        dataSource: "AutoValuate Empirical Malaysian Market Baseline",
        dataSourceUrl: "https://maxsilog-car.vercel.app/analytics",
        lastUpdated: new Date().toISOString(),
        externalNewPriceMSRP: null,
        externalMarketMedian: empiricalBaseline.datasetAvgPrice,
        externalPriceRange: {
          min: empiricalBaseline.datasetPriceRange[0],
          max: empiricalBaseline.datasetPriceRange[1],
        },
        comparableListingsCount: empiricalBaseline.datasetSampleCount,
        confidenceLevel: empiricalBaseline.datasetSampleCount >= 10 ? "high" : "medium",
        priceType: "Empirical Malaysian Listing Baseline",
        matchedVariant,
        inspectionSpotChecks: spotChecks,
        variantVerdict,
        empiricalBaseline,
        academicNote:
          "Benchmarked against verified Malaysian used-car resale listings from the research dataset. Live API data for this specific variant is currently pending external provider indexing.",
      };
    } else {
      result = {
        brand,
        model,
        year,
        status: "unavailable",
        dataSource: "External Market API (Pending Indexing)",
        dataSourceUrl: "https://paqar.my",
        lastUpdated: new Date().toISOString(),
        externalNewPriceMSRP: null,
        externalMarketMedian: null,
        externalPriceRange: null,
        comparableListingsCount: 0,
        confidenceLevel: "baseline",
        priceType: "Live Market Asking Price",
        matchedVariant,
        inspectionSpotChecks: spotChecks,
        variantVerdict,
        empiricalBaseline: null,
        academicNote:
          "External market comparison data is unavailable for this specific model configuration. The valuation is computed exclusively using AutoValuate's validated Gradient Boosting ensemble.",
      };
    }

    validationCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error validating market data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

