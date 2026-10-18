import { NextRequest, NextResponse } from "next/server";
import { getFallbackTopRegions } from "@/lib/serverFallback";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const backendUrl = process.env.FASTAPI_BACKEND_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/analytics/top-regions?limit=${limit}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json(getFallbackTopRegions(limit));
}
