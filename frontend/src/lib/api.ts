import {
  HealthResponse,
  ModelMetadata,
  PredictRequest,
  PredictResponse,
  MarketSummary,
  TopCarStat,
  TopRegionStat,
  PriceMileagePoint,
  DistributionBin,
  ModelMetricsResponse,
  FinancingRequest,
  FinancingResponse
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/api/health");
}

export async function getMetadata(): Promise<ModelMetadata> {
  return fetchJson<ModelMetadata>("/api/metadata");
}

export async function predictPrice(payload: PredictRequest): Promise<PredictResponse> {
  return fetchJson<PredictResponse>("/api/predict", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getAnalyticsSummary(): Promise<MarketSummary> {
  return fetchJson<MarketSummary>("/api/analytics/summary");
}

export async function getTopCars(limit: number = 20): Promise<TopCarStat[]> {
  return fetchJson<TopCarStat[]>(`/api/analytics/top-cars?limit=${limit}`);
}

export async function getTopRegions(limit: number = 10): Promise<TopRegionStat[]> {
  return fetchJson<TopRegionStat[]>(`/api/analytics/top-regions?limit=${limit}`);
}

export async function getPriceVsMileage(params?: {
  model?: string;
  state?: string;
  gear_type?: string;
  limit?: number;
}): Promise<PriceMileagePoint[]> {
  const query = new URLSearchParams();
  if (params?.model && params.model !== "All") query.append("model", params.model);
  if (params?.state && params.state !== "All") query.append("state", params.state);
  if (params?.gear_type && params.gear_type !== "All") query.append("gear_type", params.gear_type);
  if (params?.limit) query.append("limit", params.limit.toString());

  const qs = query.toString() ? `?${query.toString()}` : "";
  return fetchJson<PriceMileagePoint[]>(`/api/analytics/price-vs-mileage${qs}`);
}

export async function getPriceDistribution(): Promise<DistributionBin[]> {
  return fetchJson<DistributionBin[]>("/api/analytics/price-distribution");
}

export async function getMileageDistribution(): Promise<DistributionBin[]> {
  return fetchJson<DistributionBin[]>("/api/analytics/mileage-distribution");
}

export async function getModelMetrics(): Promise<ModelMetricsResponse> {
  return fetchJson<ModelMetricsResponse>("/api/model/metrics");
}

export async function calculateFinancing(payload: FinancingRequest): Promise<FinancingResponse> {
  return fetchJson<FinancingResponse>("/api/financing/calculate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ----------------- Administrator & Retraining API Endpoints -----------------

export async function getTrainingStatus(adminKey: string): Promise<import("../types").TrainingStatusResponse> {
  return fetchJson<import("../types").TrainingStatusResponse>("/api/admin/training/status", {
    headers: { "X-Admin-Key": adminKey }
  });
}

export async function getTrainingHistory(
  adminKey: string,
  options?: { page?: number; pageSize?: number; status?: string; trigger?: string }
): Promise<import("../types").PaginatedTrainingHistoryResponse | import("../types").TrainingHistoryItem[]> {
  const query = new URLSearchParams();
  if (options?.page) query.set("page", options.page.toString());
  if (options?.pageSize) query.set("page_size", options.pageSize.toString());
  if (options?.status && options.status !== "all") query.set("status", options.status);
  if (options?.trigger && options.trigger !== "all") query.set("trigger", options.trigger);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return fetchJson<import("../types").PaginatedTrainingHistoryResponse | import("../types").TrainingHistoryItem[]>(
    `/api/admin/training/history${qs}`,
    {
      headers: { "X-Admin-Key": adminKey }
    }
  );
}

export async function getArchivedModels(adminKey: string): Promise<import("../types").ModelVersionItem[]> {
  return fetchJson<import("../types").ModelVersionItem[]>("/api/admin/models", {
    headers: { "X-Admin-Key": adminKey }
  });
}

export async function triggerManualTraining(
  adminKey: string,
  force: boolean = false
): Promise<import("../types").TriggerTrainingResponse> {
  return fetchJson<import("../types").TriggerTrainingResponse>("/api/admin/training/run", {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    body: JSON.stringify({ force: Boolean(force), force_retraining: Boolean(force) })
  });
}

export async function rollbackModelVersion(adminKey: string, version: string): Promise<import("../types").RollbackResponse> {
  return fetchJson<import("../types").RollbackResponse>(`/api/admin/models/${encodeURIComponent(version)}/rollback`, {
    method: "POST",
    headers: { "X-Admin-Key": adminKey }
  });
}

export interface AdminLoginPayload {
  username?: string;
  password?: string;
  admin_key?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    username: string;
    role: string;
  };
}

export async function adminLogin(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
  return fetchJson<AdminLoginResponse>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
