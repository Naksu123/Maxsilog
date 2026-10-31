export type AssetAvailability = "verified-3d" | "verified-photo" | "representative-photo";

export interface VehicleDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  wheelbaseMm: number;
}

export interface VehicleAttribution {
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
}

export interface VehicleColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface VehicleRegistryEntry {
  id: string;
  brand: string;
  model: string;
  generation: string;
  yearRange: [number, number];
  bodyStyle: "Hatchback" | "Sedan" | "SUV" | "Coupe" | "Truck" | "MPV";
  segment: string;
  availability: AssetAvailability;
  model3dUrl?: string; // Path to verified .glb asset
  photoUrl: string; // Path to verified high-definition photograph
  previewImage: string;
  dimensions: VehicleDimensions;
  attribution: VehicleAttribution;
  curatorNotes: string;
  colorOptions: VehicleColorOption[];
}

// Verified Manufacturer Color Palettes
const STANDARD_MALAYSIAN_COLORS: VehicleColorOption[] = [
  { id: "pearl_white", name: "Platinum White Pearl", hex: "#F8FAFC" },
  { id: "obsidian_black", name: "Midnight Obsidian", hex: "#0F172A" },
  { id: "granite_grey", name: "Meteoroid Granite Grey", hex: "#475569" },
  { id: "electric_blue", name: "Cosmic Electric Blue", hex: "#0284C7" },
  { id: "crimson_red", name: "Passion Crimson Red", hex: "#DC2626" },
];

export const VEHICLE_REGISTRY: Record<string, VehicleRegistryEntry> = {
  "perodua_myvi": {
    id: "perodua_myvi",
    brand: "Perodua",
    model: "Myvi",
    generation: "3rd Generation (D20N Facelift)",
    yearRange: [2017, 2024],
    bodyStyle: "Hatchback",
    segment: "B-Segment Hatchback (Malaysia #1 Volume)",
    availability: "verified-photo",
    photoUrl: "/vehicles/perodua_myvi.jpg",
    previewImage: "/vehicles/perodua_myvi.jpg",
    dimensions: {
      lengthMm: 3895,
      widthMm: 1735,
      heightMm: 1515,
      wheelbaseMm: 2500,
    },
    attribution: {
      author: "RL GNZNZ",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Malaysia's flagship best-seller (1.5 AV Facelift). Exact body styling, dual-tone alloys, and LED headlamp assembly.",
    colorOptions: [
      { id: "cranberry_red", name: "Cranberry Red Metallic", hex: "#991B1B" },
      { id: "electric_blue", name: "Electric Blue", hex: "#0284C7" },
      { id: "glittering_silver", name: "Glittering Silver", hex: "#94A3B8" },
      { id: "ivory_white", name: "Ivory White Solid", hex: "#F8FAFC" },
      { id: "granite_grey", name: "Granite Grey", hex: "#334155" },
    ],
  },

  "honda_city": {
    id: "honda_city",
    brand: "Honda",
    model: "City",
    generation: "7th Generation (GN2)",
    yearRange: [2020, 2024],
    bodyStyle: "Sedan",
    segment: "B-Segment Executive Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/honda_city.jpg",
    previewImage: "/vehicles/honda_city.jpg",
    dimensions: {
      lengthMm: 4553,
      widthMm: 1748,
      heightMm: 1467,
      wheelbaseMm: 2600,
    },
    attribution: {
      author: "Chanokchon",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of 7th-gen Honda City 1.5 i-VTEC / e:HEV RS. Distinctive solid wing front face and sculpted aerodynamic character lines.",
    colorOptions: [
      { id: "ignite_red", name: "Ignite Red Metallic", hex: "#B91C1C" },
      { id: "platinum_white", name: "Platinum White Pearl", hex: "#F8FAFC" },
      { id: "meteoroid_gray", name: "Meteoroid Gray Metallic", hex: "#475569" },
      { id: "lunar_silver", name: "Lunar Silver Metallic", hex: "#CBD5E1" },
      { id: "crystal_black", name: "Crystal Black Pearl", hex: "#0F172A" },
    ],
  },

  "honda_civic": {
    id: "honda_civic",
    brand: "Honda",
    model: "Civic",
    generation: "11th Generation (FE) / 10th Gen (FC)",
    yearRange: [2016, 2024],
    bodyStyle: "Sedan",
    segment: "C-Segment Performance Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/honda_civic.jpg",
    previewImage: "/vehicles/honda_civic.jpg",
    dimensions: {
      lengthMm: 4678,
      widthMm: 1802,
      heightMm: 1415,
      wheelbaseMm: 2735,
    },
    attribution: {
      author: "Mr.choppers",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
    curatorNotes: "Authentic media of Honda Civic RS (VTEC Turbo). Fastback silhouette with dual exhaust and full LED matrix light array.",
    colorOptions: [
      { id: "ignite_red", name: "Ignite Red Metallic", hex: "#B91C1C" },
      { id: "morning_mist", name: "Morning Mist Blue", hex: "#64748B" },
      { id: "platinum_white", name: "Platinum White Pearl", hex: "#F8FAFC" },
      { id: "meteoroid_gray", name: "Meteoroid Gray", hex: "#334155" },
    ],
  },

  "toyota_vios": {
    id: "toyota_vios",
    brand: "Toyota",
    model: "Vios",
    generation: "3rd Generation Facelift (XP150) / 4th Gen (AC100)",
    yearRange: [2017, 2024],
    bodyStyle: "Sedan",
    segment: "B-Segment Compact Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/toyota_vios.jpg",
    previewImage: "/vehicles/toyota_vios.jpg",
    dimensions: {
      lengthMm: 4425,
      widthMm: 1730,
      heightMm: 1475,
      wheelbaseMm: 2550,
    },
    attribution: {
      author: "Chanokchon",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Toyota Vios 1.5 G. Keen Look aerodynamic grille, integrated DRLs, and multi-spoke diamond cut rims.",
    colorOptions: [
      { id: "red_mica", name: "Red Mica Metallic", hex: "#991B1B" },
      { id: "platinum_white", name: "Platinum White Pearl", hex: "#F8FAFC" },
      { id: "silver_metallic", name: "Silver Metallic", hex: "#94A3B8" },
      { id: "attitude_black", name: "Attitude Black", hex: "#0F172A" },
    ],
  },

  "proton_x50": {
    id: "proton_x50",
    brand: "Proton",
    model: "X50",
    generation: "1st Generation",
    yearRange: [2020, 2024],
    bodyStyle: "SUV",
    segment: "B-Segment Turbo Crossover SUV",
    availability: "verified-photo",
    photoUrl: "/vehicles/proton_x50.jpg",
    previewImage: "/vehicles/proton_x50.jpg",
    dimensions: {
      lengthMm: 4330,
      widthMm: 1800,
      heightMm: 1609,
      wheelbaseMm: 2600,
    },
    attribution: {
      author: "RL GNZNZ",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Proton X50 1.5 TGDi Flagship. Infinite Weave front grille with Ethereal Bow red highlight and quad exhaust pipes.",
    colorOptions: [
      { id: "passion_red", name: "Passion Red", hex: "#B91C1C" },
      { id: "ocean_blue", name: "Ocean Blue", hex: "#0369A1" },
      { id: "citric_orange", name: "Citric Orange", hex: "#EA580C" },
      { id: "jet_grey", name: "Jet Grey", hex: "#475569" },
      { id: "snow_white", name: "Snow White", hex: "#F8FAFC" },
    ],
  },

  "proton_saga": {
    id: "proton_saga",
    brand: "Proton",
    model: "Saga",
    generation: "3rd Generation (MC2)",
    yearRange: [2016, 2024],
    bodyStyle: "Sedan",
    segment: "A-Segment National Value Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/proton_saga.jpg",
    previewImage: "/vehicles/proton_saga.jpg",
    dimensions: {
      lengthMm: 4331,
      widthMm: 1689,
      heightMm: 1491,
      wheelbaseMm: 2465,
    },
    attribution: {
      author: "RL GNZNZ",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Proton Saga 1.3 Premium S. Infinite Weave styling with red grille accent and twin five-spoke alloys.",
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  },

  "proton_persona": {
    id: "proton_persona",
    brand: "Proton",
    model: "Persona",
    generation: "2nd Generation Facelift",
    yearRange: [2016, 2024],
    bodyStyle: "Sedan",
    segment: "B-Segment Practical Family Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/proton_persona.jpg",
    previewImage: "/vehicles/proton_persona.jpg",
    dimensions: {
      lengthMm: 4366,
      widthMm: 1722,
      heightMm: 1555,
      wheelbaseMm: 2555,
    },
    attribution: {
      author: "Chanokchon",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Proton Persona 1.6 Premium. High-roof family sedan profile with 510-litre boot capacity.",
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  },

  "perodua_bezza": {
    id: "perodua_bezza",
    brand: "Perodua",
    model: "Bezza",
    generation: "1st Generation Facelift",
    yearRange: [2016, 2024],
    bodyStyle: "Sedan",
    segment: "A-Segment Energy Efficient Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/perodua_bezza.jpg",
    previewImage: "/vehicles/perodua_bezza.jpg",
    dimensions: {
      lengthMm: 4170,
      widthMm: 1620,
      heightMm: 1525,
      wheelbaseMm: 2525,
    },
    attribution: {
      author: "RL GNZNZ",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Perodua Bezza 1.3 AV. Malaysia's top EEV sedan with prominent 508-litre cargo trunk and LED headlamps.",
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  },

  "perodua_axia": {
    id: "perodua_axia",
    brand: "Perodua",
    model: "Axia",
    generation: "2nd Generation (DNGA) / 1st Gen",
    yearRange: [2014, 2024],
    bodyStyle: "Hatchback",
    segment: "A-Segment Urban Commuter Hatchback",
    availability: "verified-photo",
    photoUrl: "/vehicles/perodua_axia.jpg",
    previewImage: "/vehicles/perodua_axia.jpg",
    dimensions: {
      lengthMm: 3760,
      widthMm: 1665,
      heightMm: 1505,
      wheelbaseMm: 2525,
    },
    attribution: {
      author: "RL GNZNZ",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Perodua Axia 1.0 AV. Ultra-compact dimensions engineered for tight Malaysian urban commutes and fuel economy.",
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  },

  "toyota_hilux": {
    id: "toyota_hilux",
    brand: "Toyota",
    model: "Hilux",
    generation: "8th Generation (AN120)",
    yearRange: [2015, 2024],
    bodyStyle: "Truck",
    segment: "Heavy-Duty 4x4 Double Cab Pick-up",
    availability: "verified-photo",
    photoUrl: "/vehicles/toyota_hilux.jpg",
    previewImage: "/vehicles/toyota_hilux.jpg",
    dimensions: {
      lengthMm: 5325,
      widthMm: 1855,
      heightMm: 1815,
      wheelbaseMm: 3085,
    },
    attribution: {
      author: "Vauxford",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Toyota Hilux 2.8 Rogue / 2.4 V. High-riding ladder-chassis pickup with trapezoidal grille and overfenders.",
    colorOptions: STANDARD_MALAYSIAN_COLORS,
  },

  "bmw_3series": {
    id: "bmw_3series",
    brand: "BMW",
    model: "3 Series",
    generation: "7th Generation (G20)",
    yearRange: [2018, 2024],
    bodyStyle: "Sedan",
    segment: "D-Segment Executive Luxury Sports Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/bmw_3series.jpg",
    previewImage: "/vehicles/bmw_3series.jpg",
    dimensions: {
      lengthMm: 4709,
      widthMm: 1827,
      heightMm: 1435,
      wheelbaseMm: 2851,
    },
    attribution: {
      author: "Alexander Migl",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of BMW 320i / 330i M Sport (G20). Signature kidney grille, Hofmeister kink, and 50:50 weight distribution athletic stance.",
    colorOptions: [
      { id: "portimao_blue", name: "M Portimao Blue Metallic", hex: "#1D4ED8" },
      { id: "alpine_white", name: "Alpine White Non-Metallic", hex: "#F8FAFC" },
      { id: "black_sapphire", name: "Black Sapphire Metallic", hex: "#0F172A" },
      { id: "mineral_grey", name: "Mineral Grey Metallic", hex: "#475569" },
    ],
  },

  "mercedes_cclass": {
    id: "mercedes_cclass",
    brand: "Mercedes-Benz",
    model: "C-Class",
    generation: "5th Gen (W205 / W206)",
    yearRange: [2014, 2024],
    bodyStyle: "Sedan",
    segment: "D-Segment Luxury Executive Sedan",
    availability: "verified-photo",
    photoUrl: "/vehicles/mercedes_cclass.jpg",
    previewImage: "/vehicles/mercedes_cclass.jpg",
    dimensions: {
      lengthMm: 4686,
      widthMm: 1810,
      heightMm: 1442,
      wheelbaseMm: 2840,
    },
    attribution: {
      author: "M93",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 3.0 DE",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
    },
    curatorNotes: "Authentic media of Mercedes-Benz C200 / C300 AMG Line. Diamond grille, sweeping beltline, and aerodynamic luxury proportion.",
    colorOptions: [
      { id: "polar_white", name: "Polar White Solid", hex: "#F8FAFC" },
      { id: "obsidian_black", name: "Obsidian Black Metallic", hex: "#0F172A" },
      { id: "selenite_grey", name: "Selenite Grey Metallic", hex: "#475569" },
      { id: "spectral_blue", name: "Spectral Blue Metallic", hex: "#1E40AF" },
    ],
  },

  "mazda_cx5": {
    id: "mazda_cx5",
    brand: "Mazda",
    model: "CX-5",
    generation: "2nd Generation (KF)",
    yearRange: [2017, 2024],
    bodyStyle: "SUV",
    segment: "C-Segment KODO Design Crossover",
    availability: "verified-photo",
    photoUrl: "/vehicles/mazda_cx5.jpg",
    previewImage: "/vehicles/mazda_cx5.jpg",
    dimensions: {
      lengthMm: 4575,
      widthMm: 1845,
      heightMm: 1680,
      wheelbaseMm: 2700,
    },
    attribution: {
      author: "Vauxford",
      source: "Wikimedia Automotive Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    curatorNotes: "Authentic media of Mazda CX-5 2.0 / 2.5 High. Signature Soul Red Crystal KODO design language and sculpted aerodynamic silhouette.",
    colorOptions: [
      { id: "soul_red", name: "Soul Red Crystal Metallic", hex: "#991B1B" },
      { id: "machine_grey", name: "Machine Grey Metallic", hex: "#334155" },
      { id: "snowflake_white", name: "Snowflake White Pearl", hex: "#F8FAFC" },
      { id: "deep_crystal_blue", name: "Deep Crystal Blue", hex: "#1E3A8A" },
    ],
  },

  "ferrari_458": {
    id: "ferrari_458",
    brand: "Ferrari",
    model: "458 Italia",
    generation: "Tipo F142",
    yearRange: [2009, 2015],
    bodyStyle: "Coupe",
    segment: "Exotic Mid-Rear V8 Supercar",
    availability: "verified-3d",
    model3dUrl: "/models/ferrari.glb",
    photoUrl: "/models/ferrari.glb",
    previewImage: "/hero-car.jpg",
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
  },
};

/**
 * Smart lookup function to resolve any brand/model combination to the best authentic vehicle asset.
 */
export function lookupVehicleAsset(modelName: string, brandName?: string, year?: number): VehicleRegistryEntry {
  const normModel = (modelName || "").toLowerCase().trim();
  const normBrand = (brandName || "").toLowerCase().trim();

  // 1. Direct registry lookup
  if (normModel.includes("myvi")) {
    const base = VEHICLE_REGISTRY["perodua_myvi"];
    if (year && year < 2017) {
      return { ...base, generation: "2nd Generation (M600)" };
    }
    return base;
  }
  if (normModel.includes("city")) return VEHICLE_REGISTRY["honda_city"];
  if (normModel.includes("civic")) return VEHICLE_REGISTRY["honda_civic"];
  if (normModel.includes("vios")) return VEHICLE_REGISTRY["toyota_vios"];
  if (normModel.includes("x50") || normModel.includes("x70")) return VEHICLE_REGISTRY["proton_x50"];
  if (normModel.includes("saga")) return VEHICLE_REGISTRY["proton_saga"];
  if (normModel.includes("persona")) return VEHICLE_REGISTRY["proton_persona"];
  if (normModel.includes("bezza")) return VEHICLE_REGISTRY["perodua_bezza"];
  if (normModel.includes("axia")) return VEHICLE_REGISTRY["perodua_axia"];
  if (normModel.includes("hilux")) return VEHICLE_REGISTRY["toyota_hilux"];
  if (normModel.includes("3 series") || normModel.includes("320") || normModel.includes("330")) return VEHICLE_REGISTRY["bmw_3series"];
  if (normModel.includes("c-class") || normModel.includes("c200") || normModel.includes("c300")) return VEHICLE_REGISTRY["mercedes_cclass"];
  if (normModel.includes("cx-5") || normModel.includes("cx-3") || normModel.includes("cx-30")) return VEHICLE_REGISTRY["mazda_cx5"];
  if (normBrand.includes("ferrari") || normModel.includes("458") || normModel.includes("f430")) return VEHICLE_REGISTRY["ferrari_458"];

  // 2. Brand-level fallback matching
  if (normBrand.includes("perodua") || normModel.includes("ativa") || normModel.includes("alza") || normModel.includes("aruz")) {
    return VEHICLE_REGISTRY["perodua_myvi"];
  }
  if (normBrand.includes("proton") || normModel.includes("iriz") || normModel.includes("exora") || normModel.includes("s70")) {
    return VEHICLE_REGISTRY["proton_saga"];
  }
  if (normBrand.includes("honda") || normModel.includes("accord") || normModel.includes("cr-v") || normModel.includes("hr-v") || normModel.includes("jazz")) {
    return normModel.includes("cr-v") || normModel.includes("hr-v") ? VEHICLE_REGISTRY["proton_x50"] : VEHICLE_REGISTRY["honda_city"];
  }
  if (normBrand.includes("toyota") || normModel.includes("camry") || normModel.includes("corolla") || normModel.includes("cross") || normModel.includes("yaris")) {
    return VEHICLE_REGISTRY["toyota_vios"];
  }
  if (normBrand.includes("bmw") || normModel.includes("5 series") || normModel.includes("x3") || normModel.includes("x5")) {
    return VEHICLE_REGISTRY["bmw_3series"];
  }
  if (normBrand.includes("mercedes") || normModel.includes("e-class") || normModel.includes("a-class") || normModel.includes("glc")) {
    return VEHICLE_REGISTRY["mercedes_cclass"];
  }
  if (normBrand.includes("mazda") || normModel.includes("mazda 3") || normModel.includes("mazda 2")) {
    return VEHICLE_REGISTRY["mazda_cx5"];
  }

  // 3. Fallback to Honda City as national benchmark
  return VEHICLE_REGISTRY["honda_city"];
}
