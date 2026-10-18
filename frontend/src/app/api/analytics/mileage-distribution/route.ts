import { NextResponse } from "next/server";
import { getFallbackMileageDistribution } from "@/lib/serverFallback";

export async function GET() {
  const backendUrl = process.env.FASTAPI_BACKEND_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/analytics/mileage-distribution`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json(getFallbackMileageDistribution());
}
