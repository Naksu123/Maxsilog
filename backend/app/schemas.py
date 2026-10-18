"""
Pydantic Schemas for AutoValuate API
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    model_version: str = Field(..., examples=["v1.2.0-research"])
    models_loaded: List[str]
    total_records: int
    target_leakage_protected: bool = True
    server_time: str


class PredictRequest(BaseModel):
    model: str = Field(..., min_length=1, description="Vehicle Model name, e.g. 'Honda Civic'", examples=["Honda Civic"])
    mileage: float = Field(..., ge=0, le=1000000, description="Odometer reading in KM", examples=[75000.0])
    gear_type: str = Field(default="Automatic", description="Transmission type ('Automatic' or 'Manual')", examples=["Automatic"])
    state: str = Field(default="Selangor", description="Malaysian state or territory", examples=["Selangor"])
    year: Optional[int] = Field(default=None, ge=1990, le=2026, description="Manufacturing year (optional; defaults to model median)", examples=[2018])
    engine_size: Optional[float] = Field(default=None, ge=0.5, le=8.0, description="Engine displacement in Liters (optional; defaults to model median)", examples=[1.5])
    algorithm: Optional[str] = Field(default="Gradient Boosting Regressor", description="ML Algorithm to use for prediction")


class PredictResponse(BaseModel):
    estimated_price: float = Field(..., description="Estimated listing price in MYR (RM)")
    fair_price_low: float = Field(..., description="Estimated lower bound (MYR)")
    fair_price_high: float = Field(..., description="Estimated upper bound (MYR)")
    model_version: str
    algorithm_used: str
    input_summary: Dict[str, Any]
    disclaimer: str


class CarModelStat(BaseModel):
    model: str
    count: int
    avg_price: float
    median_price: float
    min_price: float
    max_price: float
    avg_mileage: float


class RegionStat(BaseModel):
    state: str
    count: int
    percentage: float
    avg_price: float
    median_price: float


class PriceMileagePoint(BaseModel):
    model: str
    mileage: float
    price: float
    gear_type: str
    state: str
    year: Optional[int] = None


class DistributionBin(BaseModel):
    bin_range: str
    bin_start: float
    bin_end: float
    count: int


class BenchmarkItem(BaseModel):
    model: str
    cv_mae: float
    cv_mae_std: float
    cv_rmse: float
    cv_rmse_std: float
    cv_r2: float
    cv_r2_std: float
    test_mae: float
    test_rmse: float
    test_r2: float
    generalization_gap: float
    is_selected: bool


class DiagnosticOutlier(BaseModel):
    index: int
    description: str
    model: str
    mileage: float
    actual_price: float
    predicted_price: float
    residual_error: float


class ModelMetricsResponse(BaseModel):
    selected_model: str
    model_version: str
    random_state: int
    train_size: int
    test_size: int
    k_folds: int
    benchmark: List[BenchmarkItem]
    diagnostic_outliers: List[DiagnosticOutlier]
    target_leakage_audit: Dict[str, Any]


class FinancingCalculateRequest(BaseModel):
    vehicle_price: float = Field(..., gt=0, description="Vehicle asking price in RM", examples=[85000.0])
    down_payment: float = Field(default=8500.0, ge=0, description="Down payment amount in RM", examples=[8500.0])
    annual_interest_rate_pct: float = Field(default=3.5, ge=0.1, le=20.0, description="Annual car loan interest rate in %", examples=[3.5])
    loan_term_years: int = Field(default=7, ge=1, le=9, description="Loan term duration in years", examples=[7])


class FinancingCalculateResponse(BaseModel):
    vehicle_price: float
    down_payment: float
    loan_amount: float
    annual_interest_rate_pct: float
    loan_term_years: int
    loan_term_months: int
    monthly_installment: float
    total_interest: float
    total_payable: float
    yearly_schedule: List[Dict[str, Any]]
    disclaimer: str
