import vehicleRegistryJson from "./vehicle-image-registry.json";

export type VerificationStatus =
  | "verified-exact"
  | "verified-model"
  | "compatible-platform"
  | "segment-fallback"
  | "placeholder";

export type MatchTier = "exact" | "verified-model" | "compatible" | "segment-fallback" | "placeholder";

export interface VehicleDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  wheelbaseMm: number;
}

export interface VehicleColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface VehicleViews {
  front?: string;
  side?: string;
  rear?: string;
  threeQuarter?: string;
}

export interface VehicleRegistryEntry {
  id: string;
  canonicalBrand: string;
  datasetModel: string;
  brand: string;
  model: string;
  generation: string;
  yearRange: [number, number];
  bodyStyle: "Hatchback" | "Sedan" | "SUV" | "Coupe" | "Truck" | "MPV";
  segment?: string;
  availability: "3d-interactive" | "verified-exact-photo" | "representative-photo";
  matchTier: MatchTier;
  verificationStatus: VerificationStatus;
  badgeLabel: string;
  badgeTone: "emerald" | "blue" | "amber" | "slate";
  isFallback: boolean;
  fallbackReason?: string;
  photoUrl: string;
  previewImage: string;
  views?: VehicleViews;
  has3DModel?: boolean;
  model3DUrl?: string;
  dimensions: VehicleDimensions;
  attribution: {
    author: string;
    source: string;
    license: string;
    licenseUrl: string;
  };
  curatorNotes: string;
  colorOptions?: VehicleColorOption[];
}

export const STANDARD_MALAYSIAN_COLORS: VehicleColorOption[] = [
  { id: "pearl_white", name: "Glacier Pearl White", hex: "#F8FAFC" },
  { id: "graphite_grey", name: "Modern Steel Metallic", hex: "#475569" },
  { id: "midnight_black", name: "Crystal Black Pearl", hex: "#0F172A" },
  { id: "sapphire_blue", name: "Cosmic Blue Metallic", hex: "#1E3A8A" },
  { id: "crimson_red", name: "Ignition Red Mica", hex: "#991B1B" },
  { id: "liquid_silver", name: "Lunar Silver Metallic", hex: "#CBD5E1" },
];

/**
 * 3D CAD Vehicle Model - Ferrari 458 Italia
 */
const FERRARI_458_ENTRY: VehicleRegistryEntry = {
  id: "ferrari_458",
  canonicalBrand: "Ferrari",
  datasetModel: "Ferrari 458 Italia",
  brand: "Ferrari",
  model: "458 Italia",
  generation: "Type F142 (2009-2015)",
  yearRange: [2009, 2015],
  bodyStyle: "Coupe",
  segment: "Mid-Rear V8 Supercar",
  availability: "3d-interactive",
  matchTier: "exact",
  verificationStatus: "verified-exact",
  badgeLabel: "Verified 3D CAD Geometry",
  badgeTone: "emerald",
  isFallback: false,
  has3DModel: true,
  model3DUrl: "/models/ferrari_458.glb",
  photoUrl: "/models/ferrari_458_preview.jpg",
  previewImage: "/models/ferrari_458_preview.jpg",
  dimensions: {
    lengthMm: 4527,
    widthMm: 1937,
    heightMm: 1213,
    wheelbaseMm: 2650,
  },
  attribution: {
    author: "vicent091036 / Three.js Official Repository",
    source: "Khronos glTF Sample Assets & Three.js",
    license: "Creative Commons Attribution (CC-BY)",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  curatorNotes: "Authentic 3D GLB CAD geometry model featuring interior, brake calipers, rims, physical clearcoat paint shaders, and aerodynamic air intakes.",
  colorOptions: [
    { id: "rosso_corsa", name: "Rosso Corsa Classic", hex: "#DC2626" },
    { id: "giallo_modena", name: "Giallo Modena Racing Yellow", hex: "#FACC15" },
    { id: "nero_daytona", name: "Nero Daytona Metallic Black", hex: "#0F172A" },
    { id: "bianco_avus", name: "Bianco Avus Pure White", hex: "#F8FAFC" },
    { id: "blu_tour_de_france", name: "Blu Tour de France Metallic", hex: "#1D4ED8" },
  ],
};

/**
 * Classifies an automotive model name into its primary body style.
 */
export function classifyBodyStyle(model: string): "Hatchback" | "Sedan" | "SUV" | "Coupe" | "Truck" | "MPV" {
  const m = (model || "").toLowerCase();
  if (["hilux", "ranger", "triton", "d-max", "navara", "colorado", "bt-50"].some(k => m.includes(k))) {
    return "Truck";
  }
  if (["alphard", "vellfire", "estima", "alza", "exora", "ertiga", "serena", "livina", "starex", "sienta", "innova", "g10", "picasso", "biante", "stavic", "granace", "carnival", "noah"].some(k => m.includes(k))) {
    return "MPV";
  }
  if (["x50", "x70", "cr-v", "hr-v", "br-v", "cx-3", "cx-5", "cx-8", "aruz", "ativa", "x1", "x3", "x4", "x5", "x6", "glc", "gla", "gle", "g350", "q3", "q5", "q7", "rav4", "harrier", "fortuner", "c-hr", "rush", "land cruiser", "prado", "fj cruiser", "forester", "xv", "jimny", "vitara", "tiguan", "xc40", "xc60", "xc90", "macan", "cayenne", "f-pace", "compass", "cherokee", "wrangler", "omoda", "tiggo", "h1", "h2", "asx", "outlander", "kuga", "ecosport", "tucson", "santa fe", "sportage", "sorento", "range", "evoque", "hs", "zs", "atto 3", "2008", "3008", "captur", "cross", "nx300", "rx200t", "rx300", "rx350", "rx450h", "lx570", "stelvio"].some(k => m.includes(k))) {
    return "SUV";
  }
  if (["myvi", "axia", "jazz", "yaris", "iriz", "golf", "polo", "clio", "megane", "208", "rio", "ct200h", "116i", "118i", "a180", "a200", "a250", "a45", "b200", "cooper", "3 door", "5 door", "clubman", "countryman", "dolphin", "prius c", "beetle", "fiesta", "v40", "mazda 2"].some(k => m.includes(k))) {
    return "Hatchback";
  }
  if (["supra", "gr86", "mustang", "718", "458", "220i", "428i", "840i"].some(k => m.includes(k))) {
    return "Coupe";
  }
  return "Sedan";
}

/**
 * Priority 4: Verified Labeled Segment Fallback Assets
 */
export function createSegmentFallbackEntry(
  brand: string,
  model: string,
  bodyStyle: "Hatchback" | "Sedan" | "SUV" | "Coupe" | "Truck" | "MPV"
): VehicleRegistryEntry {
  const fallbackMap: Record<string, { photoUrl: string; segment: string; dims: VehicleDimensions }> = {
    SUV: {
      photoUrl: "/vehicles/fallback_suv.jpg",
      segment: "Representative Crossover / SUV Specification",
      dims: { lengthMm: 4575, widthMm: 1845, heightMm: 1675, wheelbaseMm: 2700 }
    },
    Sedan: {
      photoUrl: "/vehicles/fallback_sedan.jpg",
      segment: "Representative Executive Sedan Specification",
      dims: { lengthMm: 4425, widthMm: 1740, heightMm: 1480, wheelbaseMm: 2620 }
    },
    Hatchback: {
      photoUrl: "/vehicles/fallback_hatchback.jpg",
      segment: "Representative Compact Hatchback Specification",
      dims: { lengthMm: 3895, widthMm: 1735, heightMm: 1515, wheelbaseMm: 2500 }
    },
    Truck: {
      photoUrl: "/vehicles/fallback_truck.jpg",
      segment: "Representative Utility Pickup Truck Specification",
      dims: { lengthMm: 5325, widthMm: 1855, heightMm: 1815, wheelbaseMm: 3085 }
    },
    MPV: {
      photoUrl: "/vehicles/fallback_mpv.jpg",
      segment: "Representative Multi-Purpose Vehicle Specification",
      dims: { lengthMm: 4170, widthMm: 1620, heightMm: 1525, wheelbaseMm: 2525 }
    },
    Coupe: {
      photoUrl: "/vehicles/fallback_coupe.jpg",
      segment: "Representative Sports Coupe Specification",
      dims: { lengthMm: 4527, widthMm: 1937, heightMm: 1213, wheelbaseMm: 2650 }
    }
  };

  const info = fallbackMap[bodyStyle] || fallbackMap["Sedan"];

  return {
    id: `fallback_${bodyStyle.toLowerCase()}`,
    canonicalBrand: brand || "Automotive",
    datasetModel: model,
    brand: brand || "Automotive",
    model: model,
    generation: "Market Segment Reference",
    yearRange: [2010, 2024],
    bodyStyle: bodyStyle,
    segment: info.segment,
    availability: "representative-photo",
    matchTier: "segment-fallback",
    verificationStatus: "segment-fallback",
    badgeLabel: `Segment Reference: ${bodyStyle}`,
    badgeTone: "amber",
    isFallback: true,
    fallbackReason: `Showing representative ${bodyStyle} reference asset. Verified photoshoot for ${brand || ""} ${model} is pending curation.`,
    photoUrl: info.photoUrl,
    previewImage: info.photoUrl,
    dimensions: info.dims,
    attribution: {
      author: "AutoValuate Automotive Media Registry",
      source: "Verified Segment Reference Collection",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: `Representative vehicle imagery reflecting the ${bodyStyle} form factor and dimensional stance.`,
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  };
}

/**
 * Priority 5: Neutral Vector Silhouette Placeholder
 */
export function createNeutralPlaceholderEntry(brand: string, model: string): VehicleRegistryEntry {
  return {
    id: "neutral_placeholder",
    canonicalBrand: brand || "Automotive",
    datasetModel: model || "Vehicle",
    brand: brand || "Automotive",
    model: model || "Vehicle",
    generation: "Empirical Specification",
    yearRange: [2010, 2024],
    bodyStyle: "Sedan",
    segment: "Automotive Specification Reference",
    availability: "representative-photo",
    matchTier: "placeholder",
    verificationStatus: "placeholder",
    badgeLabel: "Neutral Specification Reference",
    badgeTone: "slate",
    isFallback: true,
    fallbackReason: `Neutral automotive vector graphic. Verified photoshoot for ${brand || ""} ${model} is pending curation.`,
    photoUrl: "/vehicles/placeholder_car.svg",
    previewImage: "/vehicles/placeholder_car.svg",
    dimensions: {
      lengthMm: 4500,
      widthMm: 1800,
      heightMm: 1450,
      wheelbaseMm: 2650,
    },
    attribution: {
      author: "AutoValuate Vector Intelligence",
      source: "AutoValuate CAD Studio",
      license: "Proprietary SVG Asset",
      licenseUrl: "#",
    },
    curatorNotes: "Neutral vector silhouette representation avoiding inaccurate vehicle attribution.",
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  };
}

// Convert JSON registry to typed lookup map
const REGISTRY_MAP: Record<string, VehicleRegistryEntry> = {};

for (const raw of (vehicleRegistryJson as unknown as VehicleRegistryEntry[])) {
  const entry: VehicleRegistryEntry = {
    ...raw,
    id: raw.id || raw.datasetModel.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    brand: raw.canonicalBrand,
    model: raw.datasetModel,
    availability: raw.availability || (raw.verificationStatus === "verified-exact" ? "verified-exact-photo" : "representative-photo"),
    colorOptions: raw.colorOptions || STANDARD_MALAYSIAN_COLORS,
  };
  REGISTRY_MAP[raw.datasetModel.toLowerCase().trim()] = entry;
}

/**
 * Resolves any selected brand, model, and year combination to the best authentic vehicle asset
 * adhering strictly to the 5-tier matching priority:
 * 1. Exact brand, model, and compatible manufacturing year or generation.
 * 2. Exact canonical brand and model with a verified model-level image.
 * 3. A verified image from a different generation or compatible platform family within the SAME brand.
 * 4. A clearly labeled generic vehicle-category fallback (by body style).
 * 5. A neutral placeholder if no suitable image exists.
 *
 * NOTE: The resolver will NEVER substitute an unrelated brand (e.g. Kia will NEVER return Honda or BMW).
 */
export function lookupVehicleAsset(modelName: string, brandName?: string, year?: number): VehicleRegistryEntry {
  const normModel = (modelName || "").toLowerCase().trim();
  const normBrand = (brandName || "").toLowerCase().trim();

  // Priority 5: Missing or empty input
  if (!normModel) {
    return createNeutralPlaceholderEntry(brandName || "", modelName || "");
  }

  // Check 3D CAD Supercar
  if (normBrand.includes("ferrari") || normModel.includes("458") || normModel.includes("italia")) {
    return FERRARI_458_ENTRY;
  }

  // Priority 1 & 2: Direct lookup in verified dataset registry
  const directMatch = REGISTRY_MAP[normModel];
  if (directMatch) {
    // If user provided a specific older year for Myvi (e.g. < 2017 is 2nd Gen M600)
    if (normModel.includes("myvi") && year && year < 2017) {
      return {
        ...directMatch,
        generation: "2nd Generation (M600)",
        matchTier: "compatible",
        verificationStatus: "compatible-platform",
        badgeLabel: "Compatible Generation (2nd Gen M600)",
        badgeTone: "blue",
        isFallback: false,
        curatorNotes: "Displaying 3rd-Gen verified media with a clearly disclosed generation difference from selected 2nd-Gen M600."
      };
    }
    return directMatch;
  }

  // Fuzzy match on full model name if dataset contains variant suffixes
  // e.g. "BMW X1 sDrive" -> matches "BMW X1"
  for (const [key, entry] of Object.entries(REGISTRY_MAP)) {
    if (entry.verificationStatus !== "segment-fallback") {
      // Must match brand first to prevent cross-brand leakage!
      if (entry.canonicalBrand.toLowerCase() === normBrand || normModel.includes(entry.canonicalBrand.toLowerCase())) {
        if (normModel === key || normModel.startsWith(key + " ") || key.startsWith(normModel + " ")) {
          return entry;
        }
      }
    }
  }

  // Priority 4: Verified Labeled Segment Fallback by Body Style
  // Strictly preserving the vehicle's true make and model in labels and fallbacks
  const bodyStyle = classifyBodyStyle(modelName);
  return createSegmentFallbackEntry(brandName || "", modelName, bodyStyle);
}
