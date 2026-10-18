"""
End-to-end API Integration and Endpoint Tests
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, load_artifacts

# Force artifact loading before tests run
load_artifacts()
client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Gradient Boosting Regressor" in data["models_loaded"]
    assert data["target_leakage_protected"] is True
    assert data["total_records"] >= 2400


def test_metadata_endpoint():
    res = client.get("/api/metadata")
    assert res.status_code == 200
    data = res.json()
    assert "available_models" in data
    assert len(data["available_models"]) > 20
    assert "available_gear_types" in data
    assert "available_states" in data
    assert "Honda Civic" in data["available_models"]


def test_predict_success():
    payload = {
        "model": "Honda Civic",
        "mileage": 75000,
        "gear_type": "Automatic",
        "state": "Penang",
        "year": 2018,
        "engine_size": 1.5,
        "algorithm": "Gradient Boosting Regressor"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["estimated_price"] > 10000
    assert data["fair_price_low"] < data["estimated_price"]
    assert data["fair_price_high"] > data["estimated_price"]
    assert data["algorithm_used"] == "Gradient Boosting Regressor"
    assert "disclaimer" in data


def test_predict_with_default_year_and_engine():
    # Model should auto-infer default year and engine displacement from metadata lookup
    payload = {
        "model": "Perodua Myvi",
        "mileage": 60000,
        "gear_type": "Automatic",
        "state": "Selangor"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["estimated_price"] > 10000
    assert data["input_summary"]["manufacturing_year"] is not None


def test_predict_invalid_input():
    # Negative mileage should fail validation
    payload = {
        "model": "Honda Civic",
        "mileage": -500,
        "gear_type": "Automatic",
        "state": "Penang"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422


def test_analytics_summary():
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_listings"] >= 2400
    assert data["average_price"] > 50000
    assert "gear_type_breakdown" in data


def test_top_cars():
    res = client.get("/api/analytics/top-cars?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 10
    assert data[0]["count"] >= data[1]["count"]
    assert "avg_price" in data[0]


def test_top_regions():
    res = client.get("/api/analytics/top-regions?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
    assert "state" in data[0]
    assert data[0]["percentage"] > 0


def test_price_vs_mileage():
    res = client.get("/api/analytics/price-vs-mileage?limit=50")
    assert res.status_code == 200
    data = res.json()
    assert len(data) <= 50
    assert "price" in data[0]
    assert "mileage" in data[0]


def test_distributions():
    res_price = client.get("/api/analytics/price-distribution")
    assert res_price.status_code == 200
    assert len(res_price.json()) > 5

    res_mileage = client.get("/api/analytics/mileage-distribution")
    assert res_mileage.status_code == 200
    assert len(res_mileage.json()) > 5


def test_model_metrics():
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["selected_model"] == "Gradient Boosting Regressor"
    assert len(data["benchmark"]) == 4
    assert data["target_leakage_audit"]["status"] == "SECURE"


def test_financing_calculate():
    payload = {
        "vehicle_price": 85000.0,
        "down_payment": 8500.0,
        "annual_interest_rate_pct": 3.5,
        "loan_term_years": 7
    }
    res = client.post("/api/financing/calculate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["loan_amount"] == 76500.0
    assert data["loan_term_months"] == 84
    # Monthly installment: (76500 + 76500*0.035*7) / 84 = (76500 + 18742.5) / 84 = 95242.5 / 84 = 1133.84
    assert abs(data["monthly_installment"] - 1133.84) < 1.0
    assert len(data["yearly_schedule"]) == 7


def test_financing_invalid_down_payment():
    payload = {
        "vehicle_price": 50000.0,
        "down_payment": 55000.0,
        "annual_interest_rate_pct": 3.5,
        "loan_term_years": 5
    }
    res = client.post("/api/financing/calculate", json=payload)
    assert res.status_code == 400
