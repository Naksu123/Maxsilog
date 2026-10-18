"""
AutoValuate FastAPI Application
Production-ready backend for Malaysian Used-Car Price Prediction & Market Analytics.
"""

import os
import sys
import json
import joblib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root, backend, and ml directory to sys.path so unpickled pipelines find custom functions
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.normpath(os.path.join(base_dir, ".."))
project_root = os.path.normpath(os.path.join(base_dir, "..", ".."))
ml_dir = os.path.normpath(os.path.join(backend_dir, "ml"))

for p in [project_root, backend_dir, ml_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Register 'pipeline' alias in sys.modules to guarantee joblib unpickling across all runtime environments
try:
    import backend.ml.pipeline as pipeline_mod
    sys.modules.setdefault("pipeline", pipeline_mod)
except ImportError:
    try:
        import pipeline as pipeline_mod
        sys.modules.setdefault("backend.ml.pipeline", pipeline_mod)
    except ImportError:
        pass

from .schemas import (
    HealthResponse,
    PredictRequest,
    PredictResponse,
    ModelMetricsResponse,
    FinancingCalculateRequest,
    FinancingCalculateResponse
)
from .analytics import MarketAnalytics

# Global in-memory storage for models and metadata
MODELS: Dict[str, Any] = {}
METRICS: Dict[str, Any] = {}
METADATA: Dict[str, Any] = {}
ANALYTICS: Optional[MarketAnalytics] = None

MODELS_DIR = os.path.normpath(os.path.join(base_dir, "..", "models"))
CLEAN_DATA_PATH = os.path.normpath(os.path.join(base_dir, "..", "data", "Resale_car_installment_clean.csv"))


def load_artifacts():
    global MODELS, METRICS, METADATA, ANALYTICS
    
    # 1. Load Analytics
    try:
        ANALYTICS = MarketAnalytics(CLEAN_DATA_PATH)
        print("[+] Analytics dataset loaded successfully.")
    except Exception as e:
        print(f"[!] Warning: Could not load analytics dataset: {e}")

    # 2. Load Metrics & Metadata JSON
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            METRICS = json.load(f)
            print("[+] Metrics JSON loaded.")

    metadata_path = os.path.join(MODELS_DIR, "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, "r", encoding="utf-8") as f:
            METADATA = json.load(f)
            print("[+] Metadata JSON loaded.")

    # 3. Load Trained Model Pipelines
    model_files = {
        "Gradient Boosting Regressor": "gbr_model.joblib",
        "Random Forest Regressor": "rf_model.joblib",
        "Ridge Regression": "ridge_model.joblib",
        "Simple Linear Regression (Baseline)": "baseline_model.joblib"
    }

    for name, filename in model_files.items():
        file_path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(file_path):
            try:
                MODELS[name] = joblib.load(file_path)
                print(f"[+] Loaded model pipeline: '{name}'")
            except Exception as e:
                print(f"[!] Error loading model '{name}': {e}")
        else:
            print(f"[!] Model artifact not found: {file_path}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield


app = FastAPI(
    title="AutoValuate API — Malaysian Used-Car Valuation System",
    description="Full-stack AI valuation and market analytics service based on supervised machine learning regression.",
    version="1.2.0-research",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend and external consumption
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def root():
    return {
        "name": "AutoValuate API",
        "status": "online",
        "version": "1.2.0-research",
        "endpoints": {
            "health": "/api/health",
            "metadata": "/api/metadata",
            "predict": "/api/predict",
            "analytics_summary": "/api/analytics/summary",
            "top_cars": "/api/analytics/top-cars",
            "top_regions": "/api/analytics/top-regions",
            "price_vs_mileage": "/api/analytics/price-vs-mileage",
            "price_distribution": "/api/analytics/price-distribution",
            "mileage_distribution": "/api/analytics/mileage-distribution",
            "model_metrics": "/api/model/metrics",
            "financing_calculator": "/api/financing/calculate",
            "docs": "/docs"
        }
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Diagnostics"])
def get_health():
    return HealthResponse(
        status="healthy" if len(MODELS) > 0 else "degraded",
        model_version=METRICS.get("model_version", "v1.2.0-research"),
        models_loaded=list(MODELS.keys()),
        total_records=METADATA.get("summary", {}).get("total_listings", 0),
        target_leakage_protected=True,
        server_time=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/metadata", tags=["Metadata"])
def get_metadata():
    if not METADATA:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model metadata is not loaded."
        )
    return METADATA


@app.post("/api/predict", response_model=PredictResponse, tags=["Valuation"])
def predict_price(req: PredictRequest):
    if not MODELS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Valuation models are not available on the server."
        )

    # 1. Resolve Algorithm
    algo_name = req.algorithm or "Gradient Boosting Regressor"
    if algo_name not in MODELS:
        # Fallback to selected champion
        algo_name = "Gradient Boosting Regressor" if "Gradient Boosting Regressor" in MODELS else list(MODELS.keys())[0]

    model_pipeline = MODELS[algo_name]

    # 2. Smart Autofill for Optional Features using Model Lookup
    model_lookup = METADATA.get("model_lookup", {}).get(req.model, {})
    default_year = model_lookup.get("default_year", 2017)
    default_engine = model_lookup.get("default_engine_size", 1.8)

    resolved_year = req.year if req.year is not None else default_year
    resolved_engine = req.engine_size if req.engine_size is not None else default_engine
    vehicle_age = 2024.0 - resolved_year

    # 3. Build Input Row
    input_data = pd.DataFrame([{
        "Mileage": float(req.mileage),
        "Vehicle_Age": float(vehicle_age),
        "Engine_Size": float(resolved_engine),
        "Model": str(req.model),
        "Gear_Type": str(req.gear_type),
        "State": str(req.state)
    }])

    # 4. Generate Prediction
    try:
        raw_pred = model_pipeline.predict(input_data)[0]
        # Ground floor market price floor: car cannot be < RM 5,000
        predicted_price = max(5000.0, float(raw_pred))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during valuation: {str(e)}"
        )

    # 5. Calculate Confidence Range based on algorithm's CV MAE
    cv_mae = 18345.57  # fallback
    for bench in METRICS.get("benchmark", []):
        if bench.get("model") == algo_name:
            cv_mae = bench.get("cv_mae", cv_mae)
            break

    fair_low = max(5000.0, predicted_price - (cv_mae * 0.75))
    fair_high = predicted_price + (cv_mae * 0.75)

    return PredictResponse(
        estimated_price=round(predicted_price, 2),
        fair_price_low=round(fair_low, 2),
        fair_price_high=round(fair_high, 2),
        model_version=METRICS.get("model_version", "v1.2.0-research"),
        algorithm_used=algo_name,
        input_summary={
            "model": req.model,
            "mileage_km": req.mileage,
            "gear_type": req.gear_type,
            "state": req.state,
            "manufacturing_year": resolved_year,
            "vehicle_age_years": vehicle_age,
            "engine_displacement_liters": resolved_engine
        },
        disclaimer="Valuation result is a statistical estimate derived from supervised regression on historical Malaysian listing data. It does not constitute a guaranteed trade-in offer, loan approval amount, or formal certified appraisal."
    )


@app.get("/api/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    if not ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics engine not initialized.")
    return ANALYTICS.get_summary()


@app.get("/api/analytics/top-cars", tags=["Analytics"])
def get_top_cars(limit: int = Query(20, ge=5, le=50)):
    if not ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics engine not initialized.")
    return ANALYTICS.get_top_cars(limit=limit)


@app.get("/api/analytics/top-regions", tags=["Analytics"])
def get_top_regions(limit: int = Query(10, ge=3, le=20)):
    if not ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics engine not initialized.")
    return ANALYTICS.get_top_regions(limit=limit)


@app.get("/api/analytics/price-vs-mileage", tags=["Analytics"])
def get_price_vs_mileage(
    model: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    gear_type: Optional[str] = Query(None),
    limit: int = Query(600, ge=50, le=2500)
):
    if not ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics engine not initialized.")
    return ANALYTICS.get_price_vs_mileage(
        model=model,
        state=state,
        gear_type=gear_type,
        limit=limit
    )


@app.get("/api/analytics/price-distribution", tags=["Analytics"])
def get_price_distribution():
    if not ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics engine not initialized.")
    return ANALYTICS.get_price_distribution()


@app.get("/api/analytics/mileage-distribution", tags=["Analytics"])
def get_mileage_distribution():
    if not ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics engine not initialized.")
    return ANALYTICS.get_mileage_distribution()


@app.get("/api/model/metrics", response_model=ModelMetricsResponse, tags=["Benchmarking"])
def get_model_metrics():
    if not METRICS:
        raise HTTPException(status_code=503, detail="Model metrics are not available.")
    return METRICS


@app.post("/api/financing/calculate", response_model=FinancingCalculateResponse, tags=["Financing"])
def calculate_financing(req: FinancingCalculateRequest):
    if req.down_payment >= req.vehicle_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Down payment cannot equal or exceed vehicle listing price."
        )

    loan_amount = req.vehicle_price - req.down_payment
    total_months = req.loan_term_years * 12

    # Malaysian Hire-Purchase Car Financing Formula (Flat Rate)
    # Total Interest = Principal * (Annual Rate / 100) * Loan Tenure Years
    total_interest = loan_amount * (req.annual_interest_rate_pct / 100.0) * req.loan_term_years
    total_payable = loan_amount + total_interest
    monthly_installment = total_payable / total_months

    # Yearly amortization schedule
    yearly_schedule = []
    annual_principal = loan_amount / req.loan_term_years
    annual_interest = total_interest / req.loan_term_years
    remaining_balance = total_payable

    for yr in range(1, req.loan_term_years + 1):
        paid_this_year = monthly_installment * 12
        remaining_balance = max(0.0, remaining_balance - paid_this_year)
        yearly_schedule.append({
            "year": yr,
            "annual_payment": round(paid_this_year, 2),
            "principal_repaid": round(annual_principal * yr, 2),
            "interest_repaid": round(annual_interest * yr, 2),
            "remaining_total_balance": round(remaining_balance, 2)
        })

    return FinancingCalculateResponse(
        vehicle_price=round(req.vehicle_price, 2),
        down_payment=round(req.down_payment, 2),
        loan_amount=round(loan_amount, 2),
        annual_interest_rate_pct=req.annual_interest_rate_pct,
        loan_term_years=req.loan_term_years,
        loan_term_months=total_months,
        monthly_installment=round(monthly_installment, 2),
        total_interest=round(total_interest, 2),
        total_payable=round(total_payable, 2),
        yearly_schedule=yearly_schedule,
        disclaimer="Financing estimations utilize standard Malaysian hire-purchase car loan flat rate amortisation. Final terms, interest rates, and loan approvals are determined at the sole discretion of the lending commercial bank."
    )
