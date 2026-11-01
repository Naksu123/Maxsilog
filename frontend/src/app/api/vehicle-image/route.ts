import { NextRequest, NextResponse } from "next/server";
import { lookupVehicleAsset, VehicleRegistryEntry } from "@/data/vehicleRegistry";

// In-memory cache for vehicle image resolution
const imageCache = new Map<string, { entry: VehicleRegistryEntry; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand") || "";
    const model = searchParams.get("model") || "";
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : undefined;

    if (!model) {
      return NextResponse.json({ error: "Missing model parameter" }, { status: 400 });
    }

    const cacheKey = `${brand.toLowerCase()}:::${model.toLowerCase()}:::${year || "all"}`;
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.entry);
    }

    // 1. Check Commercial Vehicle Imagery API if API Key is configured
    const vehicleImageryApiKey = process.env.VEHICLE_IMAGERY_API_KEY;
    if (vehicleImageryApiKey && !model.toLowerCase().includes("perodua") && !model.toLowerCase().includes("proton")) {
      try {
        const timeoutMs = parseInt(process.env.VEHICLE_IMAGERY_TIMEOUT_MS || "3000", 10);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const queryParams = new URLSearchParams({
          make: brand,
          model: model.replace(brand, "").trim(),
          ...(year ? { year: year.toString() } : {}),
        });

        const extRes = await fetch(`https://api.vehicleimagery.com/v1/image?${queryParams.toString()}`, {
          headers: {
            "x-api-key": vehicleImageryApiKey,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (extRes.ok) {
          const extData = await extRes.json();
          if (extData.imageUrl) {
            const externalEntry: VehicleRegistryEntry = {
              id: `ext_${model.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
              canonicalBrand: brand,
              datasetModel: model,
              brand: brand,
              model: model,
              generation: extData.generation || "Verified Studio Imagery",
              yearRange: [year || 2015, year || 2023],
              bodyStyle: extData.bodyStyle || "Sedan",
              availability: "verified-exact-photo",
              matchTier: "exact",
              verificationStatus: "verified-exact",
              badgeLabel: "Verified Studio Imagery (Vehicle Imagery API)",
              badgeTone: "emerald",
              isFallback: false,
              photoUrl: extData.imageUrl,
              previewImage: extData.imageUrl,
              dimensions: extData.dimensions || { lengthMm: 4500, widthMm: 1800, heightMm: 1450, wheelbaseMm: 2650 },
              attribution: {
                author: "Vehicle Imagery Studio",
                source: "Vehicle Imagery API",
                license: "Commercial Developer License",
                licenseUrl: "https://vehicleimagery.com",
              },
              curatorNotes: "High-resolution automotive studio asset resolved via commercial Vehicle Imagery API.",
            };

            imageCache.set(cacheKey, { entry: externalEntry, timestamp: Date.now() });
            return NextResponse.json(externalEntry);
          }
        }
      } catch {
        // Fall back cleanly to AutoValuate Verified Local Registry
      }
    }

    // 2. Resolve via AutoValuate Strict 5-Tier Registry
    const asset = lookupVehicleAsset(model, brand, year);
    imageCache.set(cacheKey, { entry: asset, timestamp: Date.now() });

    return NextResponse.json(asset);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error resolving vehicle image";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

