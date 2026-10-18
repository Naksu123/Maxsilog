"""
Automated Daily Retraining & Administration Tests
Tests authentication, scheduling status, manual retraining triggers, conflict locking, and rollback.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, load_artifacts, RETRAIN_MANAGER
from backend.ml.dataset_manager import compute_file_sha256, audit_and_prepare_dataset

load_artifacts()
client = TestClient(app)

ADMIN_KEY = "admin123"
HEADERS = {"X-Admin-Key": ADMIN_KEY}


def test_admin_auth_required():
    # Without header -> 401
    res = client.get("/api/admin/training/status")
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]

    # With wrong key -> 401
    res = client.get("/api/admin/training/status", headers={"X-Admin-Key": "wrong-secret"})
    assert res.status_code == 401


def test_admin_training_status():
    res = client.get("/api/admin/training/status", headers=HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "is_training" in data
    assert "active_version" in data
    assert "next_scheduled_run_myt" in data
    assert "Asia/Kuala_Lumpur" in data["schedule_info"]
    assert "dataset_sha256" in data


def test_admin_training_history():
    res = client.get("/api/admin/training/history", headers=HEADERS)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_admin_models_list():
    res = client.get("/api/admin/models", headers=HEADERS)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_admin_trigger_training_conflict_handling():
    # Trigger training
    res = client.post("/api/admin/training/run", json={"force": False}, headers=HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "initiated"

    # If training is currently flagged as running, immediate subsequent call must return 409 Conflict
    if RETRAIN_MANAGER and RETRAIN_MANAGER.is_training:
        res2 = client.post("/api/admin/training/run", json={"force": False}, headers=HEADERS)
        assert res2.status_code == 409
        assert "already actively running" in res2.json()["detail"]


def test_admin_rollback_invalid_version():
    res = client.post("/api/admin/models/v_non_existent_9999/rollback", headers=HEADERS)
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"]


def test_dataset_sha256_computation():
    data_path = "backend/data/Resale_car_installment.csv"
    h = compute_file_sha256(data_path)
    assert isinstance(h, str)
    assert len(h) == 64  # standard SHA-256 length


def test_dataset_auditing():
    data_path = "backend/data/Resale_car_installment.csv"
    df, audit = audit_and_prepare_dataset(data_path)
    assert len(df) == 2500
    assert audit["target_leakage_purged"] is True
    assert "Monthly_Installment" not in df.columns


def test_admin_login_success():
    # Valid password
    res = client.post("/api/admin/login", json={"username": "admin", "password": ADMIN_KEY})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["token"] == ADMIN_KEY
    assert data["user"]["username"] == "admin"

    # Valid admin_key field
    res2 = client.post("/api/admin/login", json={"admin_key": ADMIN_KEY})
    assert res2.status_code == 200
    assert res2.json()["token"] == ADMIN_KEY


def test_admin_login_failure():
    res = client.post("/api/admin/login", json={"username": "admin", "password": "wrong-password"})
    assert res.status_code == 401
    assert "Invalid" in res.json()["detail"]


def test_admin_verify_session():
    # Valid token
    res = client.get("/api/admin/verify", headers=HEADERS)
    assert res.status_code == 200
    assert res.json()["valid"] is True

    # Invalid token
    res_bad = client.get("/api/admin/verify", headers={"X-Admin-Key": "bad"})
    assert res_bad.status_code == 401
