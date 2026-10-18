import { NextRequest, NextResponse } from "next/server";
import { getFallbackPriceVsMileage } from "@/lib/serverFallback";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") || undefined;
  const state = searchParams.get("state") || undefined;
  const gear_type = searchParams.get("gear_type") || undefined;
  const limit = parseInt(searchParams.get("limit") || "600", 10);

  const backendUrl = process.env.FASTAPI_BACKEND_URL;
  if (backendUrl) {
    try {
      const query = new URLSearchParams();
      if (model && model !== "All") query.append("model", model);
      if (state && state !== "All") query.append("state", state);
      if (gear_type && gear_type !== "All") query.append("gear_type", gear_type);
      query.append("limit", limit.toString());

      const res = await fetch(`${backendUrl}/api/analytics/price-vs-mileage?${query.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json(
    getFallbackPriceVsMileage({
      model,
      state,
      gear_type,
      limit,
    })
  );
}
