import { NextRequest, NextResponse } from "next/server";
import { computeFallbackPrediction } from "@/lib/serverFallback";
import { PredictRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload: PredictRequest = await request.json();

    const backendUrl = process.env.FASTAPI_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

    return NextResponse.json(computeFallbackPrediction(payload));
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Invalid prediction request" }, { status: 400 });
  }
}
