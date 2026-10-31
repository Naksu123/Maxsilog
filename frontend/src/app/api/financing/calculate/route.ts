import { NextRequest, NextResponse } from "next/server";
import { computeFallbackFinancing } from "@/lib/serverFallback";
import { FinancingRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload: FinancingRequest = await request.json();

    const backendUrl = process.env.FASTAPI_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/financing/calculate`, {
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

    return NextResponse.json(computeFallbackFinancing(payload));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid financing calculation request";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
