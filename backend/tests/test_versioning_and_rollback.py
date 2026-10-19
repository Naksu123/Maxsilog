"""
Automated Test Suite for Model Artifact Versioning and Rollback Tracking
Covers:
1. Unique model artifact version generation and complete metadata recording (manifest, metrics, metadata, joblibs).
2. Model promotion transition recording (previous_version_id, new_version_id).
3. Rollback execution and persistent rollback history recording.
4. Persistent storage across RetrainManager re-initialization.
5. Failure safety and isolation (no phantom version records, active production model remains intact).
6. Invalid/corrupt version rollback prevention.
7. Admin REST API contracts (/api/admin/models, /api/admin/training/history, /api/admin/rollback/history, /api/admin/models/{ver}/rollback).
"""

import os
import sys
import json
import shutil
import tempfile
import pytest
import pandas as pd
from fastapi.testclient import TestClient

backend_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
parent_dir = os.path.normpath(os.path.join(backend_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from backend.ml.retrain_manager import RetrainManager
    from backend.app.main import app
    import backend.app.admin as admin_module
except ImportError:
    from ml.retrain_manager import RetrainManager
    from app.main import app
    import app.admin as admin_module

ADMIN_KEY = "admin123"

@pytest.fixture
def mock_ml_environment(tmp_path):
    """
    Sets up an isolated test environment with a minimal clean dataset
    and models directory for rapid and deterministic test execution.
    """
    data_dir = tmp_path / "data"
    models_dir = tmp_path / "models"
    data_dir.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)

    # Generate synthetic car data that matches the required schema
    records = []
    brands = ["Perodua", "Proton", "Honda", "Toyota"]
    models = ["Myvi", "Saga", "City", "Vios"]
    gear_types = ["Automatic", "Manual"]
    states = ["Selangor", "Kuala Lumpur", "Johor", "Penang"]

    for i in range(120):
        brand = brands[i % len(brands)]
        car_name = models[i % len(models)]
        model = f"{brand} {car_name}"
        year = 2015 + (i % 8)
        engine_size = 1.3 if (i % 2 == 0) else 1.5
        desc = f"{year} {brand} {car_name} {engine_size} VVT-i Automatic"
        mileage = f"{20000 + (i * 1200)} KM"
        list_price = f"RM {int(25000 + (i * 500) + (engine_size * 5000)):,}"
        installment = f"RM {int((25000 + (i * 500)) / 60):,}"
        state = states[i % len(states)]
        loc = f"{state}, City Branch"

        records.append({
            "Description": desc,
            "Mileage": mileage,
            "Model": model,
            "Gear_Type": gear_types[i % len(gear_types)],
            "Location": loc,
            "List_Price": list_price,
            "Monthly_Installment": installment
        })

    df = pd.DataFrame(records)
    csv_path = data_dir / "Resale_car_installment.csv"
    df.to_csv(csv_path, index=False)

    return {
        "base_dir": str(tmp_path),
        "data_path": str(csv_path),
        "models_dir": str(models_dir)
    }


def test_unique_version_and_metadata_persistence(mock_ml_environment):
    """
    Requirement 2 & 4: Ensure every successful retraining run generates a unique model artifact
    version and records relevant metadata (version identifier, training timestamp, model type,
    evaluation metrics, artifact location, and artifacts list) persistently.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])
    result = manager.run_retraining(trigger="test_suite", force=True)

    assert result["success"] is True, f"Retraining failed: {result.get('error')}"
    version_id = result["version_id"]
    assert version_id.startswith("v_")

    version_dir = os.path.join(mock_ml_environment["models_dir"], "versions", version_id)
    assert os.path.isdir(version_dir), "Version archive directory was not created."

    # Verify all expected artifacts are saved
    expected_artifacts = [
        "gbr_model.joblib",
        "rf_model.joblib",
        "ridge_model.joblib",
        "baseline_model.joblib",
        "metrics.json",
        "metadata.json",
        "manifest.json"
    ]
    for artifact in expected_artifacts:
        art_path = os.path.join(version_dir, artifact)
        assert os.path.isfile(art_path), f"Artifact '{artifact}' missing from version directory."
        assert os.path.getsize(art_path) > 0, f"Artifact '{artifact}' is empty."

    # Inspect manifest.json
    manifest_path = os.path.join(version_dir, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest["version_id"] == version_id
    assert "timestamp_utc" in manifest
    assert "timestamp_myt" in manifest
    assert "model_type" in manifest
    assert manifest["artifact_location"] == f"versions/{version_id}"
    assert isinstance(manifest["artifacts"], list)
    assert len(manifest["artifacts"]) >= 7
    assert "evaluation_metrics" in manifest
    eval_m = manifest["evaluation_metrics"]
    for key in ["cv_mae", "cv_r2", "test_mae", "test_rmse", "test_r2"]:
        assert key in eval_m, f"Metric '{key}' missing from manifest evaluation_metrics."

    # Verify production models directory also has active files
    prod_manifest = os.path.join(mock_ml_environment["models_dir"], "manifest.json")
    assert os.path.isfile(prod_manifest)
    with open(prod_manifest, "r", encoding="utf-8") as f:
        p_data = json.load(f)
    assert p_data["version_id"] == version_id
    assert p_data["status"] == "active"


def test_promotion_transition_recording(mock_ml_environment):
    """
    Requirement 3 & 4: Ensure the system records both previous production model version
    and newly deployed model version whenever a model is promoted.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])

    # Run initial training (v1)
    res1 = manager.run_retraining(trigger="test_suite_v1", force=True)
    assert res1["success"] is True
    v1_id = res1["version_id"]

    # Run second training (v2)
    res2 = manager.run_retraining(trigger="test_suite_v2", force=True)
    assert res2["success"] is True
    v2_id = res2["version_id"]
    assert v1_id != v2_id

    # Verify transition in training_history.json
    history = manager.get_history()
    assert len(history) >= 2
    latest_run = history[0]
    assert latest_run["version_id"] == v2_id
    assert latest_run["previous_version_id"] == v1_id
    assert latest_run["new_version_id"] == v2_id
    assert latest_run["status"] == "completed"

    # Verify transition in dedicated rollback_history.json ledger
    rollback_history = manager.get_rollback_history()
    assert len(rollback_history) >= 2
    latest_event = rollback_history[0]
    assert latest_event["event_type"] == "PROMOTION"
    assert latest_event["previous_version_id"] == v1_id
    assert latest_event["new_version_id"] == v2_id
    assert latest_event["deployed_version_id"] == v2_id
    assert latest_event["status"] == "deployed"

    # Verify archive manifest statuses
    v1_manifest_path = os.path.join(mock_ml_environment["models_dir"], "versions", v1_id, "manifest.json")
    with open(v1_manifest_path, "r", encoding="utf-8") as f:
        v1_manifest = json.load(f)
    assert v1_manifest["status"] == "archived"

    v2_manifest_path = os.path.join(mock_ml_environment["models_dir"], "versions", v2_id, "manifest.json")
    with open(v2_manifest_path, "r", encoding="utf-8") as f:
        v2_manifest = json.load(f)
    assert v2_manifest["status"] == "active"


def test_rollback_execution_and_history_persistence(mock_ml_environment):
    """
    Requirement 3, 4 & 8: Rollback to previous version, verify production model is restored,
    and verify rollback history records previous and restored versions persistently.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])

    res1 = manager.run_retraining(trigger="test_run_1", force=True)
    v1_id = res1["version_id"]

    res2 = manager.run_retraining(trigger="test_run_2", force=True)
    v2_id = res2["version_id"]

    assert manager._get_active_version() == v2_id

    # Execute rollback to v1
    rollback_res = manager.rollback_to_version(v1_id)
    assert rollback_res["success"] is True
    assert rollback_res["status"] == "rolled_back"
    assert rollback_res["active_version"] == v1_id
    assert rollback_res["previous_version_id"] == v2_id

    # Active production version must now be v1
    assert manager._get_active_version() == v1_id

    # Verify rollback history ledger
    rollback_ledger = manager.get_rollback_history()
    assert len(rollback_ledger) >= 3
    latest_event = rollback_ledger[0]
    assert latest_event["event_type"] == "ROLLBACK"
    assert latest_event["previous_version_id"] == v2_id
    assert latest_event["new_version_id"] == v1_id
    assert latest_event["deployed_version_id"] == v1_id
    assert latest_event["status"] == "restored"

    # Verify versions manifest status
    versions = manager.get_versions()
    v1_item = next(v for v in versions if v["version_id"] == v1_id)
    v2_item = next(v for v in versions if v["version_id"] == v2_id)
    assert v1_item["is_active"] is True
    assert v1_item["status"] == "active"
    assert v2_item["is_active"] is False
    assert v2_item["status"] == "archived"


def test_persistence_across_manager_restarts(mock_ml_environment):
    """
    Requirement 4 & 8: Verify that version manifests, rollback records, and audit logs
    persist across manager re-initializations (server restarts).
    """
    manager1 = RetrainManager(base_dir=mock_ml_environment["base_dir"])
    res = manager1.run_retraining(trigger="restart_test", force=True)
    v_id = res["version_id"]

    # Re-instantiate a fresh manager pointing to the same models directory
    manager2 = RetrainManager(base_dir=mock_ml_environment["base_dir"])

    assert manager2._get_active_version() == v_id
    history = manager2.get_history()
    assert len(history) >= 1
    assert history[0]["version_id"] == v_id

    rollback_history = manager2.get_rollback_history()
    assert len(rollback_history) >= 1
    assert rollback_history[0]["new_version_id"] == v_id

    versions = manager2.get_versions()
    assert any(v["version_id"] == v_id and v["is_active"] for v in versions)


def test_failure_handling_and_no_phantom_version(mock_ml_environment, monkeypatch):
    """
    Requirement 5: If retraining or deployment fails, prevent inconsistent version records,
    ensure currently active model remains usable, and do NOT create a successful version record.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])
    res1 = manager.run_retraining(trigger="baseline", force=True)
    assert res1["success"] is True
    initial_version = res1["version_id"]

    initial_version_count = len(manager.get_versions())
    initial_rollback_count = len(manager.get_rollback_history())

    # Simulate an error during model fitting/evaluation
    def fail_training(*args, **kwargs):
        raise RuntimeError("Simulated GPU/Compute Out-Of-Memory failure")

    try:
        monkeypatch.setattr("backend.ml.retrain_manager.cross_validate", fail_training)
    except Exception:
        pass
    try:
        monkeypatch.setattr("ml.retrain_manager.cross_validate", fail_training)
    except Exception:
        pass

    fail_res = manager.run_retraining(trigger="failing_run", force=True)
    assert fail_res["success"] is False
    assert fail_res["status"] == "failed"
    assert "failed to train" in fail_res["error"]

    # Active production model must remain intact and usable
    assert manager._get_active_version() == initial_version

    # No phantom version directory or manifest should have been added
    current_versions = manager.get_versions()
    assert len(current_versions) == initial_version_count

    # No deployment or rollback record should have been added for the failed run
    current_rollback = manager.get_rollback_history()
    assert len(current_rollback) == initial_rollback_count

    # Training history should record the failure status with previous_version_id
    history = manager.get_history()
    assert history[0]["status"] == "failed"
    assert history[0]["previous_version_id"] == initial_version


def test_rollback_validation_and_safety(mock_ml_environment):
    """
    Requirement 5: Test rollback failure conditions: non-existent version, corrupt version,
    or already active version.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])
    res = manager.run_retraining(trigger="safety_check", force=True)
    active_v = res["version_id"]

    # 1. Rollback to non-existent version
    res_nonexistent = manager.rollback_to_version("v_non_existent_999999")
    assert res_nonexistent["success"] is False
    assert res_nonexistent["status"] == "not_found"
    assert manager._get_active_version() == active_v

    # 2. Rollback to already active version
    res_already_active = manager.rollback_to_version(active_v)
    assert res_already_active["success"] is True
    assert res_already_active["status"] == "already_active"
    assert manager._get_active_version() == active_v

    # 3. Rollback to corrupt version missing joblib models
    corrupt_v_id = "v_corrupt_test"
    corrupt_dir = os.path.join(mock_ml_environment["models_dir"], "versions", corrupt_v_id)
    os.makedirs(corrupt_dir, exist_ok=True)
    with open(os.path.join(corrupt_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"version_id": corrupt_v_id}, f)

    res_corrupt = manager.rollback_to_version(corrupt_v_id)
    assert res_corrupt["success"] is False
    assert res_corrupt["status"] == "corrupt_version"
    assert manager._get_active_version() == active_v


def test_admin_api_versioning_and_rollback_endpoints(mock_ml_environment, monkeypatch):
    """
    Requirement 6 & 7: Verify Admin REST endpoints for models list, rollback ledger,
    and rollback execution, ensuring contracts and authentication are respected.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])
    res1 = manager.run_retraining(trigger="api_run_1", force=True)
    res2 = manager.run_retraining(trigger="api_run_2", force=True)
    v1_id = res1["version_id"]
    v2_id = res2["version_id"]

    # Inject manager into FastAPI app main module
    try:
        import backend.app.main as b_main
        monkeypatch.setattr(b_main, "RETRAIN_MANAGER", manager)
    except Exception:
        pass
    try:
        import app.main as a_main
        monkeypatch.setattr(a_main, "RETRAIN_MANAGER", manager)
    except Exception:
        pass

    client = TestClient(app)

    # 1. Unauthorized request
    unauth = client.get("/api/admin/models")
    assert unauth.status_code == 401

    # 2. Authorized GET /api/admin/models
    models_res = client.get("/api/admin/models", headers={"X-Admin-Key": ADMIN_KEY})
    assert models_res.status_code == 200
    models_data = models_res.json()
    assert isinstance(models_data, list)
    assert len(models_data) >= 2
    v_ids = [m["version_id"] for m in models_data]
    assert v1_id in v_ids
    assert v2_id in v_ids

    # 3. Authorized GET /api/admin/rollback/history
    rb_res = client.get("/api/admin/rollback/history", headers={"X-Admin-Key": ADMIN_KEY})
    assert rb_res.status_code == 200
    rb_data = rb_res.json()
    assert isinstance(rb_data, list)
    assert len(rb_data) >= 2
    assert rb_data[0]["event_type"] in ["PROMOTION", "ROLLBACK"]

    # 4. Authorized POST /api/admin/models/{version}/rollback
    rb_exec = client.post(f"/api/admin/models/{v1_id}/rollback", headers={"X-Admin-Key": ADMIN_KEY})
    assert rb_exec.status_code == 200
    exec_data = rb_exec.json()
    assert exec_data["success"] is True
    assert exec_data["status"] == "rolled_back"
    assert exec_data["active_version"] == v1_id
    assert exec_data["previous_version_id"] == v2_id


def test_all_four_candidate_models_registered_and_retrieved(mock_ml_environment, monkeypatch):
    """
    Diagnose & Verify: All 4 models (Simple Linear, Ridge, Random Forest, Gradient Boosting)
    must be trained, evaluated, saved as distinct .joblib files, registered in candidate_artifacts,
    and retrievable through the RetrainManager and Admin API endpoints.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])
    res = manager.run_retraining(trigger="test_4_models", force=True)
    assert res["success"] is True
    v_id = res["version_id"]

    v_dir = os.path.join(mock_ml_environment["models_dir"], "versions", v_id)
    manifest_path = os.path.join(v_dir, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # 1. Verify candidate_artifacts array contains all 4 models
    cands = manifest.get("candidate_artifacts", [])
    assert len(cands) == 4, f"Expected 4 candidate model artifacts, got {len(cands)}"

    expected_models = [
        "Gradient Boosting Regressor",
        "Random Forest Regressor",
        "Ridge Regression",
        "Simple Linear Regression (Baseline)"
    ]
    registered_names = [c["model_name"] for c in cands]
    for expected in expected_models:
        assert expected in registered_names, f"Missing registered model artifact: {expected}"

    # 2. Verify all 4 joblib files physically exist in version archive
    expected_files = [
        "gbr_model.joblib",
        "rf_model.joblib",
        "ridge_model.joblib",
        "baseline_model.joblib"
    ]
    for ef in expected_files:
        assert os.path.isfile(os.path.join(v_dir, ef)), f"Missing artifact file on disk: {ef}"

    # 3. Verify model-specific metrics and fold-level scores
    champions = [c for c in cands if c.get("is_champion")]
    assert len(champions) == 1, "Exactly one champion model must be selected"
    assert champions[0]["is_active"] is True
    assert champions[0]["status"] == "active"

    for c in cands:
        assert c["cv_mae"] is not None and c["cv_mae"] > 0
        assert c["cv_r2"] is not None
        assert "fold_mae" in c and len(c["fold_mae"]) == 5
        assert "fold_r2" in c and len(c["fold_r2"]) == 5

    # 4. Verify RetrainManager retrieval methods
    # A. Flattened artifacts list
    flat_artifacts = manager.get_versions(all_artifacts=True)
    assert len(flat_artifacts) >= 4
    flat_names = [a["model_name"] for a in flat_artifacts]
    for expected in expected_models:
        assert expected in flat_names

    # B. Filter by model
    ridge_only = manager.get_versions(model_filter="Ridge", all_artifacts=True)
    assert len(ridge_only) >= 1
    assert all("Ridge" in r["model_name"] for r in ridge_only)

    # 5. Verify Admin REST API query support
    try:
        import backend.app.main as b_main
        monkeypatch.setattr(b_main, "RETRAIN_MANAGER", manager)
    except Exception:
        pass
    try:
        import app.main as a_main
        monkeypatch.setattr(a_main, "RETRAIN_MANAGER", manager)
    except Exception:
        pass

    client = TestClient(app)
    api_flat = client.get("/api/admin/models?all_artifacts=true", headers={"X-Admin-Key": ADMIN_KEY})
    assert api_flat.status_code == 200
    api_flat_data = api_flat.json()
    assert len(api_flat_data) >= 4
    api_models = [m["model_name"] for m in api_flat_data]
    for expected in expected_models:
        assert expected in api_models

    api_rf = client.get("/api/admin/models?all_artifacts=true&model=Random+Forest", headers={"X-Admin-Key": ADMIN_KEY})
    assert api_rf.status_code == 200
    rf_data = api_rf.json()
    assert len(rf_data) >= 1
    assert all("Random Forest" in r["model_name"] for r in rf_data)


def test_consecutive_retraining_deterministic_metrics_and_distinct_runs(mock_ml_environment):
    """
    Diagnose & Verify:
    1. Consecutive runs on identical data produce distinct run_id and version_id.
    2. Deterministic 5-fold CV correctly produces identical metrics across runs when data is unchanged.
    3. When dataset is updated with new listings, recalculated metrics reflect the data change.
    """
    manager = RetrainManager(base_dir=mock_ml_environment["base_dir"])

    # Run 1
    res1 = manager.run_retraining(trigger="test_run_1", force=True)
    assert res1["success"] is True
    v1_id = res1["version_id"]
    cv_mae_1 = res1["cv_mae"]
    cv_r2_1 = res1["cv_r2"]

    # Run 2 on unchanged dataset with force=True
    res2 = manager.run_retraining(trigger="test_run_2", force=True)
    assert res2["success"] is True
    v2_id = res2["version_id"]
    cv_mae_2 = res2["cv_mae"]
    cv_r2_2 = res2["cv_r2"]

    # Verify distinct identifiers
    assert v1_id != v2_id
    assert res1["record"]["run_id"] != res2["record"]["run_id"]

    # Verify deterministic calculation produces identical CV metrics when data/seeds are identical
    assert abs(cv_mae_1 - cv_mae_2) < 1e-4
    assert abs(cv_r2_1 - cv_r2_2) < 1e-4

    # Run 3: Introduce new distinct data to the CSV dataset
    df = pd.read_csv(mock_ml_environment["data_path"])
    # Append 40 premium luxury vehicle listings with higher prices
    extra_records = []
    for i in range(40):
        extra_records.append({
            "Description": f"2023 Mercedes-Benz C200 2.0 AMG Line Automatic",
            "Mileage": f"{10000 + (i * 500)} KM",
            "Model": "Mercedes-Benz C200",
            "Gear_Type": "Automatic",
            "Location": "Kuala Lumpur, Premium Branch",
            "List_Price": f"RM {int(240000 + (i * 2000)):,}",
            "Monthly_Installment": f"RM {int(3500 + i * 50):,}"
        })
    df_updated = pd.concat([df, pd.DataFrame(extra_records)], ignore_index=True)
    df_updated.to_csv(mock_ml_environment["data_path"], index=False)

    # Run retraining on the new dataset
    res3 = manager.run_retraining(trigger="test_run_3_new_data", force=True)
    assert res3["success"] is True
    v3_id = res3["version_id"]
    cv_mae_3 = res3["cv_mae"]

    assert v3_id != v2_id
    # Metrics must legitimately recalculate and differ due to the new data distribution
    assert cv_mae_3 != cv_mae_2
    assert res3["record"]["dataset_fingerprint"] != res2["record"]["dataset_fingerprint"]

