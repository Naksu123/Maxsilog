export interface HealthResponse {
  status: string;
  model_version: string;
  models_loaded: string[];
  total_records: number;
  target_leakage_protected: boolean;
  server_time: string;
}

export interface ModelMetadata {
  model_version: string;
  author: string;
  target_variable: string;
  currency: string;
  features: {
    numerical: Array<{
      name: string;
      description: string;
      unit: string;
      min: number;
      max: number;
      median: number;
    }>;
    categorical: Array<{
      name: string;
      description: string;
      categories?: string[];
      total_categories?: number;
    }>;
  };
  available_models: string[];
  available_gear_types: string[];
  available_states: string[];
  model_lookup: Record<string, {
    default_year: number;
    default_engine_size: number;
    median_price: number;
    mean_price: number;
    count: number;
  }>;
  summary: {
    total_listings: number;
    average_price: number;
    median_price: number;
    min_price: number;
    max_price: number;
    average_mileage: number;
    median_mileage: number;
  };
}

export interface PredictRequest {
  model: string;
  mileage: number;
  gear_type: string;
  state: string;
  year?: number;
  engine_size?: number;
  algorithm?: string;
}

export interface PredictResponse {
  estimated_price: number;
  fair_price_low: number;
  fair_price_high: number;
  model_version: string;
  algorithm_used: string;
  input_summary: {
    model: string;
    mileage_km: number;
    gear_type: string;
    state: string;
    manufacturing_year: number;
    vehicle_age_years: number;
    engine_displacement_liters: number;
  };
  disclaimer: string;
  model_comparison?: Record<string, number>;
}

export interface MarketSummary {
  total_listings: number;
  average_price: number;
  median_price: number;
  std_price: number;
  min_price: number;
  max_price: number;
  average_mileage: number;
  median_mileage: number;
  min_mileage: number;
  max_mileage: number;
  unique_models_count: number;
  unique_states_count: number;
  gear_type_breakdown: Record<string, {
    count: number;
    percentage: number;
  }>;
}

export interface TopCarStat {
  model: string;
  count: number;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  avg_mileage: number;
}

export interface TopRegionStat {
  state: string;
  count: number;
  percentage: number;
  avg_price: number;
  median_price: number;
}

export interface PriceMileagePoint {
  model: string;
  mileage: number;
  price: number;
  gear_type: string;
  state: string;
  year?: number;
}

export interface DistributionBin {
  bin_range: string;
  bin_start: number;
  bin_end: number;
  count: number;
}

export interface BenchmarkModel {
  model: string;
  cv_mae: number;
  cv_mae_std: number;
  cv_rmse: number;
  cv_rmse_std: number;
  cv_r2: number;
  cv_r2_std: number;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  generalization_gap: number;
  is_selected: boolean;
}

export interface DiagnosticOutlier {
  index: number;
  description: string;
  model: string;
  mileage: number;
  actual_price: number;
  predicted_price: number;
  residual_error: number;
}

export interface ModelMetricsResponse {
  selected_model: string;
  model_version: string;
  random_state: number;
  train_size: number;
  test_size: number;
  k_folds: number;
  benchmark: BenchmarkModel[];
  diagnostic_outliers: DiagnosticOutlier[];
  target_leakage_audit: {
    status: string;
    excluded_variable: string;
    justification: string;
  };
}

export interface FinancingRequest {
  vehicle_price: number;
  down_payment: number;
  annual_interest_rate_pct: number;
  loan_term_years: number;
}

export interface YearlyScheduleItem {
  year: number;
  annual_payment: number;
  principal_repaid: number;
  interest_repaid: number;
  remaining_total_balance: number;
}

export interface FinancingResponse {
  vehicle_price: number;
  down_payment: number;
  loan_amount: number;
  annual_interest_rate_pct: number;
  loan_term_years: number;
  loan_term_months: number;
  monthly_installment: number;
  total_interest: number;
  total_payable: number;
  yearly_schedule: YearlyScheduleItem[];
  disclaimer: string;
}

export interface TrainingJobProgress {
  run_id: string;
  trigger: string;
  started_at: string;
  progress: string;
}

export interface TrainingHistoryItem {
  run_id: string;
  version_id?: string;
  timestamp_utc: string;
  timestamp_myt: string;
  trigger: string;
  status: "completed" | "skipped" | "failed";
  duration_seconds: number;
  force_retraining?: boolean;
  data_changed?: boolean;
  selected_model?: string;
  champion_cv_mae?: number;
  champion_cv_r2?: number;
  dataset_fingerprint?: string;
  dataset_validation?: {
    status: string;
    row_count?: number;
    target_leakage_purged?: boolean;
  };
  record_count?: number;
  action: string;
  skip_reason?: string;
  message?: string;
  error?: string;
}

export interface PaginatedTrainingHistoryResponse {
  items: TrainingHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ModelVersionItem {
  version_id: string;
  timestamp_utc: string;
  timestamp_myt: string;
  dataset_fingerprint: string;
  record_count: number;
  selected_algorithm?: string;
  selected_model?: string;
  cv_mae?: number;
  cv_r2?: number;
  champion_metrics?: {
    cv_mae: number;
    cv_rmse: number;
    cv_r2: number;
    test_mae: number;
    test_rmse: number;
    test_r2: number;
  };
  benchmark?: BenchmarkModel[];
  artifacts?: string[];
  status?: string;
  is_active: boolean;
}

export interface TrainingStatusResponse {
  is_training: boolean;
  current_job: TrainingJobProgress | null;
  active_version: string;
  active_model_name: string;
  active_metrics: BenchmarkModel[];
  last_training_run: TrainingHistoryItem | null;
  next_scheduled_run_myt: string;
  schedule_info: string;
  dataset_sha256: string | null;
  total_versions_count: number;
  server_time_myt: string;
}

export interface TriggerTrainingResponse {
  success: boolean;
  status: string;
  message: string;
}

export interface RollbackResponse {
  success: boolean;
  status: string;
  message: string;
  version?: string;
  active_version?: string;
  selected_model?: string;
}
