"""
AutoValuate Automated Retraining & Model Lifecycle Manager
Handles daily scheduled execution, version management, atomic model promotion,
rollback capabilities, and persistent audit logging.
"""

import os
import sys
import json
import time
import shutil
import threading
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable

import numpy as np
import pandas as pd
import joblib
import pytz
from sklearn.model_selection import train_test_split, KFold, cross_validate
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from .dataset_manager import audit_and_prepare_dataset, compute_file_sha256
from .pipeline import build_preprocessors

MYT_TIMEZONE = pytz.timezone("Asia/Kuala_Lumpur")
RANDOM_STATE = 42

class RetrainManager:
    def __init__(
        self,
        base_dir: Optional[str] = None,
        on_model_promoted: Optional[Callable[[], None]] = None
    ):
        if base_dir is None:
            base_dir = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
        self.base_dir = base_dir
        self.data_path = os.path.join(self.base_dir, "data", "Resale_car_installment.csv")
        self.clean_data_path = os.path.join(self.base_dir, "data", "Resale_car_installment_clean.csv")
        self.models_dir = os.path.join(self.base_dir, "models")
        self.versions_dir = os.path.join(self.models_dir, "versions")
        self.history_file = os.path.join(self.models_dir, "training_history.json")
        self.rollback_file = os.path.join(self.models_dir, "rollback_history.json")
        self.on_model_promoted = on_model_promoted

        os.makedirs(self.versions_dir, exist_ok=True)
        self.lock = threading.Lock()
        self.is_training = False
        self.current_job: Optional[Dict[str, Any]] = None

        self._init_history_if_needed()

    def _init_history_if_needed(self):
        if not os.path.exists(self.history_file):
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
        if not os.path.exists(self.rollback_file):
            with open(self.rollback_file, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def get_history(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] Warning reading training history: {e}")
                return []
        return []

    def _append_history(self, record: Dict[str, Any]):
        history = self.get_history()
        history.insert(0, record)  # Most recent first
        # Keep last 50 runs for audit trail
        history = history[:50]
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            print(f"[!] Error writing training history: {e}")

    def get_rollback_history(self) -> List[Dict[str, Any]]:
        """Return persistent audit ledger of model promotions and rollbacks."""
        if os.path.exists(self.rollback_file):
            try:
                with open(self.rollback_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] Warning reading rollback history: {e}")
                return []
        return []

    def _append_rollback_record(self, record: Dict[str, Any]):
        """Persistently append a promotion or rollback transition record."""
        history = self.get_rollback_history()
        history.insert(0, record)  # Most recent first
        history = history[:100]    # Keep last 100 transition events
        try:
            with open(self.rollback_file, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            print(f"[!] Error writing rollback history: {e}")

    def get_versions(self, model_filter: Optional[str] = None, all_artifacts: bool = False) -> List[Dict[str, Any]]:
        """
        List archived model versions or all individual candidate model artifacts.
        Supports filtering by model name/type, and returning either version bundles
        or a flat register of all candidate model artifacts across all runs.
        """
        versions = []
        if not os.path.exists(self.versions_dir):
            return versions

        active_version = self._get_active_version()
        filename_map = {
            "Gradient Boosting Regressor": "gbr_model.joblib",
            "Random Forest Regressor": "rf_model.joblib",
            "Ridge Regression": "ridge_model.joblib",
            "Simple Linear Regression (Baseline)": "baseline_model.joblib"
        }

        for entry in os.listdir(self.versions_dir):
            v_path = os.path.join(self.versions_dir, entry)
            manifest_file = os.path.join(v_path, "manifest.json")
            if os.path.isdir(v_path) and os.path.exists(manifest_file):
                try:
                    with open(manifest_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        version_id = data.get("version_id", entry)
                        is_active = (version_id == active_version)
                        data["is_active"] = is_active
                        data["status"] = "active" if is_active else "archived"
                        if "model_type" not in data and "selected_algorithm" in data:
                            data["model_type"] = data["selected_algorithm"]
                        if "selected_model" not in data and "selected_algorithm" in data:
                            data["selected_model"] = data["selected_algorithm"]
                        if "artifact_location" not in data:
                            data["artifact_location"] = f"versions/{entry}"
                        if "artifacts" not in data:
                            data["artifacts"] = sorted([f for f in os.listdir(v_path) if os.path.isfile(os.path.join(v_path, f))])
                        # Ensure evaluation_metrics is present
                        if "evaluation_metrics" not in data:
                            data["evaluation_metrics"] = data.get("champion_metrics", {
                                "cv_mae": data.get("cv_mae"),
                                "cv_r2": data.get("cv_r2")
                            })
                        if "champion_metrics" not in data:
                            data["champion_metrics"] = data.get("evaluation_metrics")

                        # Build or sanitize candidate_artifacts for all 4 models
                        candidate_artifacts = data.get("candidate_artifacts", [])
                        if not candidate_artifacts:
                            # Reconstruct candidate_artifacts from metrics.json benchmark
                            metrics_file = os.path.join(v_path, "metrics.json")
                            benchmark_list = []
                            if os.path.exists(metrics_file):
                                try:
                                    with open(metrics_file, "r", encoding="utf-8") as mf:
                                        m_info = json.load(mf)
                                        benchmark_list = m_info.get("benchmark", [])
                                except Exception:
                                    pass

                            if benchmark_list:
                                for b in benchmark_list:
                                    m_name = b.get("model", "Unknown")
                                    f_name = filename_map.get(m_name, f"{m_name.lower().replace(' ', '_')}.joblib")
                                    is_champ = (m_name == data.get("selected_model") or b.get("is_selected", False))
                                    is_act = bool(is_champ and is_active)
                                    short_id = f_name.replace(".joblib", "")
                                    candidate_artifacts.append({
                                        "artifact_id": f"{version_id}_{short_id}",
                                        "version_id": version_id,
                                        "model_name": m_name,
                                        "model_type": m_name,
                                        "algorithm": m_name,
                                        "artifact_filename": f_name,
                                        "artifact_location": f"versions/{entry}/{f_name}",
                                        "cv_mae": b.get("cv_mae"),
                                        "cv_mae_std": b.get("cv_mae_std"),
                                        "cv_rmse": b.get("cv_rmse"),
                                        "cv_rmse_std": b.get("cv_rmse_std"),
                                        "cv_r2": b.get("cv_r2"),
                                        "cv_r2_std": b.get("cv_r2_std"),
                                        "test_mae": b.get("test_mae"),
                                        "test_rmse": b.get("test_rmse"),
                                        "test_r2": b.get("test_r2"),
                                        "generalization_gap": b.get("generalization_gap"),
                                        "fold_mae": b.get("fold_mae", []),
                                        "fold_r2": b.get("fold_r2", []),
                                        "is_champion": is_champ,
                                        "is_active": is_act,
                                        "role": "Champion (Production Active)" if is_act else ("Champion (Archived)" if is_champ else ("Baseline Standby" if "Baseline" in m_name else "Candidate Standby")),
                                        "status": "active" if is_act else ("archived" if is_champ else "standby"),
                                        "timestamp_utc": data.get("timestamp_utc"),
                                        "timestamp_myt": data.get("timestamp_myt"),
                                        "dataset_fingerprint": data.get("dataset_fingerprint"),
                                        "record_count": data.get("record_count")
                                    })
                        else:
                            # Update dynamic active/status flags on existing candidate_artifacts
                            for cand in candidate_artifacts:
                                is_champ = cand.get("is_champion", False)
                                is_act = bool(is_champ and is_active)
                                cand["is_active"] = is_act
                                if is_act:
                                    cand["role"] = "Champion (Production Active)"
                                    cand["status"] = "active"
                                elif is_champ:
                                    cand["role"] = "Champion (Archived)"
                                    cand["status"] = "archived"
                                else:
                                    cand["role"] = "Baseline Standby" if "Baseline" in cand.get("model_name", "") else "Candidate Standby"
                                    cand["status"] = "standby"

                        data["candidate_artifacts"] = candidate_artifacts
                        versions.append(data)
                except Exception as e:
                    print(f"[!] Error reading manifest in {entry}: {e}")

        # Sort newest first
        versions.sort(key=lambda x: x.get("timestamp_utc", ""), reverse=True)

        if all_artifacts:
            flat_artifacts = []
            for v in versions:
                for cand in v.get("candidate_artifacts", []):
                    if not model_filter or model_filter.lower() in cand.get("model_name", "").lower():
                        flat_artifacts.append(cand)
            return flat_artifacts

        if model_filter:
            filtered_versions = []
            for v in versions:
                matching_cands = [
                    c for c in v.get("candidate_artifacts", [])
                    if model_filter.lower() in c.get("model_name", "").lower()
                ]
                if matching_cands:
                    v_copy = dict(v)
                    v_copy["candidate_artifacts"] = matching_cands
                    filtered_versions.append(v_copy)
            return filtered_versions

        return versions

    def _get_active_version(self) -> str:
        manifest_file = os.path.join(self.models_dir, "manifest.json")
        if os.path.exists(manifest_file):
            try:
                with open(manifest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("version_id"):
                        return data["version_id"]
            except Exception:
                pass

        metrics_file = os.path.join(self.models_dir, "metrics.json")
        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("model_version", "v1.2.0-research")
            except Exception:
                pass
        return "v1.2.0-research"

    def _build_metadata_payload(self, df_clean: pd.DataFrame, version_id: str) -> Dict[str, Any]:
        """Compute statistical boundaries, categories, and autofill stats for runtime metadata."""
        unique_models = sorted([str(m) for m in df_clean["Model"].dropna().unique() if str(m) != "Unknown"])
        unique_gear_types = sorted([str(g) for g in df_clean["Gear_Type"].dropna().unique()])
        unique_states = sorted([str(s) for s in df_clean["State"].dropna().unique() if str(s) != "Unknown"])

        model_stats = {}
        for m in unique_models:
            subset = df_clean[df_clean["Model"] == m]
            med_year = float(subset["Year"].median()) if not subset["Year"].dropna().empty else 2017.0
            med_engine = float(subset["Engine_Size"].median()) if not subset["Engine_Size"].dropna().empty else 1.8
            med_price = float(subset["List_Price"].median())
            mean_price = float(subset["List_Price"].mean())
            count = int(len(subset))
            model_stats[m] = {
                "default_year": int(med_year) if not np.isnan(med_year) else 2017,
                "default_engine_size": round(med_engine, 1) if not np.isnan(med_engine) else 1.8,
                "median_price": med_price,
                "mean_price": mean_price,
                "count": count
            }

        return {
            "model_version": version_id,
            "author": "University of Negros Occidental - Recoletos Research Team",
            "target_variable": "List_Price",
            "currency": "MYR (RM)",
            "features": {
                "numerical": [
                    {"name": "Mileage", "description": "Odometer reading in kilometers", "unit": "KM", "min": float(df_clean["Mileage"].min()), "max": float(df_clean["Mileage"].max()), "median": float(df_clean["Mileage"].median())},
                    {"name": "Vehicle_Age", "description": "Vehicle age calculated as 2024 - Year", "unit": "Years", "min": float(df_clean["Vehicle_Age"].min()), "max": float(df_clean["Vehicle_Age"].max()), "median": float(df_clean["Vehicle_Age"].median())},
                    {"name": "Engine_Size", "description": "Engine displacement extracted in Liters", "unit": "L", "min": float(df_clean["Engine_Size"].min()), "max": float(df_clean["Engine_Size"].max()), "median": float(df_clean["Engine_Size"].median())},
                    {"name": "Mileage_Per_Year", "description": "Average annual mileage intensity", "unit": "KM/Yr", "min": float(df_clean["Mileage_Per_Year"].min()), "max": float(df_clean["Mileage_Per_Year"].max()), "median": float(df_clean["Mileage_Per_Year"].median())}
                ],
                "categorical": [
                    {"name": "Brand", "description": "Vehicle manufacturer brand", "total_categories": int(df_clean["Brand"].nunique())},
                    {"name": "Model", "description": "Vehicle brand and model name", "total_categories": len(unique_models)},
                    {"name": "Gear_Type", "description": "Transmission type (e.g. Automatic, Manual)", "categories": unique_gear_types},
                    {"name": "State", "description": "Malaysian state/federal territory extracted from location", "categories": unique_states}
                ]
            },
            "available_models": unique_models,
            "available_gear_types": unique_gear_types,
            "available_states": unique_states,
            "model_lookup": model_stats,
            "summary": {
                "total_listings": int(len(df_clean)),
                "average_price": float(df_clean["List_Price"].mean()),
                "median_price": float(df_clean["List_Price"].median()),
                "min_price": float(df_clean["List_Price"].min()),
                "max_price": float(df_clean["List_Price"].max()),
                "average_mileage": float(df_clean["Mileage"].mean()),
                "median_mileage": float(df_clean["Mileage"].median())
            }
        }

    def get_status(self) -> Dict[str, Any]:
        """Return the current scheduler and training state."""
        now_myt = datetime.now(MYT_TIMEZONE)
        active_version = self._get_active_version()

        # Calculate next 2:00 AM MYT execution
        next_2am = now_myt.replace(hour=2, minute=0, second=0, microsecond=0)
        if now_myt >= next_2am:
            from datetime import timedelta
            next_2am += timedelta(days=1)

        history = self.get_history()
        last_run = history[0] if history else None

        active_metrics = {}
        metrics_file = os.path.join(self.models_dir, "metrics.json")
        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, "r", encoding="utf-8") as f:
                    active_metrics = json.load(f)
            except Exception:
                pass

        fingerprint = None
        if os.path.exists(self.data_path):
            try:
                fingerprint = compute_file_sha256(self.data_path)
            except Exception:
                pass

        return {
            "is_training": self.is_training,
            "current_job": self.current_job,
            "active_version": active_version,
            "active_model_name": active_metrics.get("selected_model", "Gradient Boosting Regressor"),
            "active_metrics": active_metrics.get("benchmark", []),
            "last_training_run": last_run,
            "next_scheduled_run_myt": next_2am.isoformat(),
            "schedule_info": "Daily at 02:00 AM (Asia/Kuala_Lumpur, UTC+8)",
            "dataset_sha256": fingerprint,
            "total_versions_count": len(self.get_versions()),
            "server_time_myt": now_myt.isoformat()
        }

    def run_retraining(self, trigger: str = "manual_admin", force: bool = False) -> Dict[str, Any]:
        """
        Execute the daily model retraining workflow with 5-fold cross-validation,
        model evaluation across all 4 algorithms, atomic promotion, and rollback archives.
        """
        if not self.lock.acquire(blocking=False):
            return {
                "success": False,
                "status": "conflict",
                "message": "A machine-learning training job is already actively running on the server."
            }

        start_time = time.time()
        now_utc = datetime.now(timezone.utc)
        now_myt = now_utc.astimezone(MYT_TIMEZONE)
        run_id = f"run_{now_myt.strftime('%Y%m%d_%H%M%S')}_{now_myt.microsecond // 1000:03d}"

        self.is_training = True
        self.current_job = {
            "run_id": run_id,
            "trigger": trigger,
            "start_time_myt": now_myt.isoformat(),
            "progress": "Validating and auditing dataset..."
        }

        try:
            print(f"[{run_id}] Commencing daily retraining pipeline (Trigger: {trigger}, Force: {force})...")
            
            # 1. Dataset Validation & Audit
            df_clean, audit_info = audit_and_prepare_dataset(self.data_path)
            current_fingerprint = audit_info["sha256_fingerprint"]
            
            # Update clean dataset cache
            df_clean.to_csv(self.clean_data_path, index=False)

            # Check if dataset is unchanged since last run (unless forced)
            history = self.get_history()
            last_successful = next((h for h in history if h.get("status") == "completed"), None)
            if not force and last_successful and last_successful.get("dataset_fingerprint") == current_fingerprint:
                duration = round(time.time() - start_time, 2)
                skip_msg = f"Dataset fingerprint is unchanged since the last successful training (SHA-256: {current_fingerprint[:12]}...). Normal retraining skipped under automated data-change policy. Check 'Force Retraining' to override."
                record = {
                    "run_id": run_id,
                    "timestamp_utc": now_utc.isoformat(),
                    "timestamp_myt": now_myt.isoformat(),
                    "trigger": trigger,
                    "force_retraining": False,
                    "data_changed": False,
                    "status": "skipped",
                    "duration_seconds": duration,
                    "dataset_fingerprint": current_fingerprint,
                    "dataset_validation": {
                        "status": "VALID",
                        "row_count": len(df_clean),
                        "target_leakage_purged": audit_info.get("target_leakage_purged", True)
                    },
                    "record_count": len(df_clean),
                    "action": "Retained active production model",
                    "skip_reason": skip_msg,
                    "message": skip_msg
                }
                self._append_history(record)
                print(f"[{run_id}] {skip_msg}")
                return {
                    "success": True,
                    "status": "skipped",
                    "message": skip_msg,
                    "record": record
                }

            # 2. Features and Target preparation
            self.current_job["progress"] = "Partitioning training and test splits (80/20)..."
            numerical_features = ["Mileage", "Vehicle_Age", "Engine_Size", "Mileage_Per_Year"]
            categorical_features = ["Brand", "Model", "Gear_Type", "State"]
            target_variable = "List_Price"

            X = df_clean[numerical_features + categorical_features].copy()
            y = df_clean[target_variable].copy()

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.20, random_state=RANDOM_STATE
            )

            # 3. Build Preprocessing Pipelines
            linear_preprocessor, tree_preprocessor = build_preprocessors(
                numerical_features=numerical_features,
                categorical_features=categorical_features
            )

            # 4. Initialize All 4 Candidate Model Pipelines
            candidate_pipelines = {
                "Simple Linear Regression (Baseline)": Pipeline([
                    ('prep', ColumnTransformer(
                        transformers=[
                            ('num', Pipeline([
                                ('imputer', SimpleImputer(strategy='median')),
                                ('scaler', StandardScaler())
                            ]), ['Mileage'])
                        ],
                        remainder='drop'
                    )),
                    ('model', LinearRegression())
                ]),
                "Ridge Regression": Pipeline([
                    ('prep', linear_preprocessor),
                    ('model', Ridge(alpha=10.0, random_state=RANDOM_STATE))
                ]),
                "Random Forest Regressor": Pipeline([
                    ('prep', tree_preprocessor),
                    ('model', RandomForestRegressor(
                        n_estimators=100,
                        max_depth=15,
                        min_samples_split=5,
                        min_samples_leaf=2,
                        random_state=RANDOM_STATE,
                        n_jobs=1
                    ))
                ]),
                "Gradient Boosting Regressor": Pipeline([
                    ('prep', tree_preprocessor),
                    ('model', GradientBoostingRegressor(
                        n_estimators=150,
                        learning_rate=0.1,
                        max_depth=5,
                        min_samples_split=5,
                        min_samples_leaf=2,
                        random_state=RANDOM_STATE
                    ))
                ])
            }

            # 5. 5-Fold Cross Validation on Training Split
            kf_5fold = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
            scoring = {
                'mae': 'neg_mean_absolute_error',
                'rmse': 'neg_root_mean_squared_error',
                'r2': 'r2'
            }

            cv_results = {}
            trained_models = {}
            test_results = {}
            test_predictions = {}
            model_errors = {}

            for m_name, pipe in candidate_pipelines.items():
                self.current_job["progress"] = f"Cross-validating and fitting: {m_name}..."
                try:
                    scores = cross_validate(pipe, X_train, y_train, cv=kf_5fold, scoring=scoring, n_jobs=1)
                    cv_mae = float(-scores['test_mae'].mean())
                    cv_mae_std = float(scores['test_mae'].std())
                    cv_rmse = float(-scores['test_rmse'].mean())
                    cv_rmse_std = float(scores['test_rmse'].std())
                    cv_r2 = float(scores['test_r2'].mean())
                    cv_r2_std = float(scores['test_r2'].std())

                    cv_results[m_name] = {
                        "cv_mae": cv_mae,
                        "cv_mae_std": cv_mae_std,
                        "cv_rmse": cv_rmse,
                        "cv_rmse_std": cv_rmse_std,
                        "cv_r2": cv_r2,
                        "cv_r2_std": cv_r2_std,
                        "fold_mae": [float(-s) for s in scores['test_mae']],
                        "fold_r2": [float(s) for s in scores['test_r2']],
                        "fold_rmse": [float(-s) for s in scores['test_rmse']]
                    }

                    # Fit full training set and evaluate holdout test
                    pipe.fit(X_train, y_train)
                    y_pred = pipe.predict(X_test)
                    test_predictions[m_name] = y_pred
                    trained_models[m_name] = pipe

                    test_mae = float(mean_absolute_error(y_test, y_pred))
                    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
                    test_r2 = float(r2_score(y_test, y_pred))

                    test_results[m_name] = {
                        "test_mae": test_mae,
                        "test_rmse": test_rmse,
                        "test_r2": test_r2,
                        "generalization_gap": float(test_mae - cv_mae)
                    }
                    print(f"  [+] {m_name} completed: CV MAE=RM {cv_mae:,.2f}, CV R2={cv_r2:.4f}")
                except Exception as ex:
                    print(f"  [!] Candidate model failure for {m_name}: {ex}")
                    model_errors[m_name] = str(ex)

            if not trained_models:
                raise RuntimeError("All candidate machine learning algorithms failed to train.")

            # 6. Select Champion Model based on Lowest CV Error
            # Filter candidates that trained successfully
            valid_candidates = [m for m in cv_results.keys() if "Baseline" not in m]
            if not valid_candidates:
                valid_candidates = list(cv_results.keys())

            champion_name = min(valid_candidates, key=lambda m: cv_results[m]["cv_mae"])
            champion_pipe = trained_models[champion_name]
            champion_cv_mae = cv_results[champion_name]["cv_mae"]
            champion_cv_r2 = cv_results[champion_name]["cv_r2"]

            # 7. Safety Validation: Verify champion model can infer on sample
            self.current_job["progress"] = "Executing safety validation inference..."
            sample_pred = champion_pipe.predict(X_test.iloc[:2])
            if np.isnan(sample_pred).any() or (sample_pred <= 0).all():
                raise ValueError("Champion model safety validation failed: returned invalid/non-positive predictions.")

            # 8. Outlier Diagnostics
            champion_preds = test_predictions.get(champion_name, y_test)
            residuals = y_test - champion_preds
            top_outlier_indices = np.abs(residuals).sort_values(ascending=False).head(5).index
            outliers_list = []
            for idx in top_outlier_indices:
                outliers_list.append({
                    "index": int(idx),
                    "description": str(df_clean.loc[idx, "Description"]),
                    "model": str(df_clean.loc[idx, "Model"]),
                    "mileage": float(df_clean.loc[idx, "Mileage"]),
                    "actual_price": float(df_clean.loc[idx, "List_Price"]),
                    "predicted_price": float(champion_preds[y_test.index == idx][0]),
                    "residual_error": float(residuals.loc[idx])
                })

            # 9. Version Archiving with Full Metadata and Rollback Tracking
            previous_version_id = self._get_active_version()
            version_id = f"v_{now_myt.strftime('%Y%m%d_%H%M%S')}"
            version_dir = os.path.join(self.versions_dir, version_id)
            os.makedirs(version_dir, exist_ok=True)

            # Save models in version archive
            filename_map = {
                "Gradient Boosting Regressor": "gbr_model.joblib",
                "Random Forest Regressor": "rf_model.joblib",
                "Ridge Regression": "ridge_model.joblib",
                "Simple Linear Regression (Baseline)": "baseline_model.joblib"
            }

            for m_name, pipe in trained_models.items():
                f_name = filename_map.get(m_name, f"{m_name.lower().replace(' ', '_')}.joblib")
                joblib.dump(pipe, os.path.join(version_dir, f_name))

            # Benchmark payload
            benchmark_list = []
            for m_name in candidate_pipelines.keys():
                if m_name in cv_results:
                    benchmark_list.append({
                        "model": m_name,
                        "cv_mae": cv_results[m_name]["cv_mae"],
                        "cv_mae_std": cv_results[m_name]["cv_mae_std"],
                        "cv_rmse": cv_results[m_name]["cv_rmse"],
                        "cv_rmse_std": cv_results[m_name]["cv_rmse_std"],
                        "cv_r2": cv_results[m_name]["cv_r2"],
                        "cv_r2_std": cv_results[m_name]["cv_r2_std"],
                        "test_mae": test_results[m_name]["test_mae"],
                        "test_rmse": test_results[m_name]["test_rmse"],
                        "test_r2": test_results[m_name]["test_r2"],
                        "generalization_gap": test_results[m_name]["generalization_gap"],
                        "is_selected": (m_name == champion_name)
                    })
                else:
                    benchmark_list.append({
                        "model": m_name,
                        "error": model_errors.get(m_name, "Training failed"),
                        "is_selected": False
                    })

            metrics_data = {
                "selected_model": champion_name,
                "model_version": version_id,
                "random_state": RANDOM_STATE,
                "train_size": len(X_train),
                "test_size": len(X_test),
                "k_folds": 5,
                "benchmark": benchmark_list,
                "diagnostic_outliers": outliers_list,
                "target_leakage_audit": {
                    "status": "SECURE",
                    "excluded_variable": "Monthly_Installment",
                    "justification": "Target leakage occurs because monthly installments are directly computed from the list price. Strict purge guarantees genuine generalizability."
                }
            }

            with open(os.path.join(version_dir, "metrics.json"), "w", encoding="utf-8") as f:
                json.dump(metrics_data, f, indent=2)

            # Generate and archive metadata.json (statistical boundaries and UI lookups)
            metadata_payload = self._build_metadata_payload(df_clean, version_id)
            with open(os.path.join(version_dir, "metadata.json"), "w", encoding="utf-8") as f:
                json.dump(metadata_payload, f, indent=2)

            # Comprehensive evaluation metrics for champion model
            champion_eval_metrics = {
                "cv_mae": champion_cv_mae,
                "cv_mae_std": cv_results[champion_name]["cv_mae_std"],
                "cv_rmse": cv_results[champion_name]["cv_rmse"],
                "cv_rmse_std": cv_results[champion_name]["cv_rmse_std"],
                "cv_r2": champion_cv_r2,
                "cv_r2_std": cv_results[champion_name]["cv_r2_std"],
                "test_mae": test_results[champion_name]["test_mae"],
                "test_rmse": test_results[champion_name]["test_rmse"],
                "test_r2": test_results[champion_name]["test_r2"],
                "generalization_gap": test_results[champion_name]["generalization_gap"]
            }

            saved_artifacts = [filename_map.get(m, f"{m.lower().replace(' ', '_')}.joblib") for m in trained_models.keys()]
            saved_artifacts.extend(["metrics.json", "metadata.json", "manifest.json"])

            # 9b. Register all 4 Candidate Model Artifacts with unique persistent identifiers
            candidate_artifacts = []
            for m_name in candidate_pipelines.keys():
                f_name = filename_map.get(m_name, f"{m_name.lower().replace(' ', '_')}.joblib")
                is_champion = (m_name == champion_name)
                m_cv = cv_results.get(m_name, {})
                m_test = test_results.get(m_name, {})
                short_id = f_name.replace(".joblib", "")
                candidate_artifacts.append({
                    "artifact_id": f"{version_id}_{short_id}",
                    "version_id": version_id,
                    "run_id": run_id,
                    "model_name": m_name,
                    "model_type": m_name,
                    "algorithm": m_name,
                    "artifact_filename": f_name,
                    "artifact_location": f"versions/{version_id}/{f_name}",
                    "cv_mae": m_cv.get("cv_mae"),
                    "cv_mae_std": m_cv.get("cv_mae_std"),
                    "cv_rmse": m_cv.get("cv_rmse"),
                    "cv_rmse_std": m_cv.get("cv_rmse_std"),
                    "cv_r2": m_cv.get("cv_r2"),
                    "cv_r2_std": m_cv.get("cv_r2_std"),
                    "test_mae": m_test.get("test_mae"),
                    "test_rmse": m_test.get("test_rmse"),
                    "test_r2": m_test.get("test_r2"),
                    "generalization_gap": m_test.get("generalization_gap"),
                    "fold_mae": m_cv.get("fold_mae", []),
                    "fold_r2": m_cv.get("fold_r2", []),
                    "is_champion": is_champion,
                    "is_active": is_champion,
                    "role": "Champion (Production Active)" if is_champion else ("Baseline Standby" if "Baseline" in m_name else "Candidate Standby"),
                    "status": "active" if is_champion else "candidate",
                    "timestamp_utc": now_utc.isoformat(),
                    "timestamp_myt": now_myt.isoformat(),
                    "dataset_fingerprint": current_fingerprint,
                    "record_count": len(df_clean)
                })

            # Save comprehensive version manifest
            manifest = {
                "version_id": version_id,
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_myt": now_myt.isoformat(),
                "model_type": champion_name,
                "selected_algorithm": champion_name,
                "selected_model": champion_name,
                "previous_version_id": previous_version_id,
                "artifact_location": f"versions/{version_id}",
                "artifacts": saved_artifacts,
                "candidate_artifacts": candidate_artifacts,
                "dataset_fingerprint": current_fingerprint,
                "record_count": len(df_clean),
                "cv_mae": champion_cv_mae,
                "cv_r2": champion_cv_r2,
                "evaluation_metrics": champion_eval_metrics,
                "champion_metrics": champion_eval_metrics,
                "models_trained": list(trained_models.keys()),
                "status": "active"
            }
            with open(os.path.join(version_dir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)

            # 10. Atomic Model Promotion to Production with Staging Backup
            self.current_job["progress"] = "Promoting new candidate to active production model..."
            staging_backup = os.path.join(self.models_dir, ".staging_promotion_backup")
            if os.path.exists(staging_backup):
                shutil.rmtree(staging_backup, ignore_errors=True)
            os.makedirs(staging_backup, exist_ok=True)

            try:
                # Stage backup of current active production files
                for f_name in os.listdir(self.models_dir):
                    src_f = os.path.join(self.models_dir, f_name)
                    if os.path.isfile(src_f):
                        shutil.copy2(src_f, os.path.join(staging_backup, f_name))

                # Copy version artifacts to active production models directory
                for f_name in os.listdir(version_dir):
                    src = os.path.join(version_dir, f_name)
                    dst = os.path.join(self.models_dir, f_name)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)

                # Set older versions in archive to 'archived' status
                for entry in os.listdir(self.versions_dir):
                    if entry != version_id:
                        old_manifest = os.path.join(self.versions_dir, entry, "manifest.json")
                        if os.path.exists(old_manifest):
                            try:
                                with open(old_manifest, "r", encoding="utf-8") as mf:
                                    m_data = json.load(mf)
                                m_data["status"] = "archived"
                                with open(old_manifest, "w", encoding="utf-8") as mf:
                                    json.dump(m_data, mf, indent=2)
                            except Exception:
                                pass

                # Clean staging backup
                shutil.rmtree(staging_backup, ignore_errors=True)

            except Exception as promo_err:
                print(f"[!] Promotion failed: {promo_err}. Restoring production files from backup...")
                for b_file in os.listdir(staging_backup):
                    shutil.copy2(os.path.join(staging_backup, b_file), os.path.join(self.models_dir, b_file))
                shutil.rmtree(staging_backup, ignore_errors=True)
                # Purge incomplete version dir so no corrupt version is listed
                if os.path.exists(version_dir):
                    shutil.rmtree(version_dir, ignore_errors=True)
                raise RuntimeError(f"Atomic promotion failed: {promo_err}")

            # Trigger FastAPI in-memory model reload callback
            if self.on_model_promoted:
                try:
                    self.on_model_promoted()
                except Exception as e:
                    print(f"[!] Warning reloading active FastAPI models: {e}")

            duration = round(time.time() - start_time, 2)
            action_msg = f"Promoted new model version '{version_id}' ({champion_name}) replacing '{previous_version_id}' with CV MAE RM {champion_cv_mae:,.2f}"

            # Persistent Audit Log Record
            record = {
                "run_id": run_id,
                "version_id": version_id,
                "previous_version_id": previous_version_id,
                "new_version_id": version_id,
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_myt": now_myt.isoformat(),
                "trigger": trigger,
                "force_retraining": bool(force),
                "data_changed": (not last_successful or last_successful.get("dataset_fingerprint") != current_fingerprint),
                "status": "completed",
                "duration_seconds": duration,
                "selected_model": champion_name,
                "model_type": champion_name,
                "champion_cv_mae": champion_cv_mae,
                "champion_cv_r2": champion_cv_r2,
                "evaluation_metrics": champion_eval_metrics,
                "artifact_location": f"versions/{version_id}",
                "dataset_fingerprint": current_fingerprint,
                "dataset_validation": {
                    "status": "VALID",
                    "row_count": len(df_clean),
                    "target_leakage_purged": audit_info.get("target_leakage_purged", True)
                },
                "record_count": len(df_clean),
                "action": action_msg,
                "message": "Model retraining and champion evaluation completed successfully."
            }
            self._append_history(record)

            # Persistent Rollback & Deployment Ledger Record
            rollback_entry = {
                "event_id": f"evt_promote_{now_myt.strftime('%Y%m%d_%H%M%S')}_{now_myt.microsecond // 1000:03d}",
                "event_type": "PROMOTION",
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_myt": now_myt.isoformat(),
                "previous_version_id": previous_version_id,
                "new_version_id": version_id,
                "deployed_version_id": version_id,
                "model_type": champion_name,
                "cv_mae": champion_cv_mae,
                "cv_r2": champion_cv_r2,
                "evaluation_metrics": champion_eval_metrics,
                "artifact_location": f"versions/{version_id}",
                "trigger": trigger,
                "status": "deployed",
                "message": f"Successfully promoted new model version '{version_id}' ({champion_name}) replacing '{previous_version_id}'"
            }
            self._append_rollback_record(rollback_entry)

            print(f"[{run_id}] Retraining completed in {duration}s: {action_msg}")

            return {
                "success": True,
                "status": "completed",
                "version_id": version_id,
                "previous_version_id": previous_version_id,
                "selected_model": champion_name,
                "model_type": champion_name,
                "cv_mae": champion_cv_mae,
                "cv_r2": champion_cv_r2,
                "evaluation_metrics": champion_eval_metrics,
                "artifact_location": f"versions/{version_id}",
                "duration_seconds": duration,
                "message": action_msg,
                "record": record
            }

        except Exception as e:
            duration = round(time.time() - start_time, 2)
            err_msg = str(e)
            print(f"[{run_id}] Retraining failed: {err_msg}")

            # Clean up version directory if it was created during this failed run
            if 'version_dir' in locals() and os.path.exists(version_dir):
                shutil.rmtree(version_dir, ignore_errors=True)

            fail_record = {
                "run_id": run_id,
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_myt": now_myt.isoformat(),
                "trigger": trigger,
                "force_retraining": bool(force),
                "data_changed": False,
                "status": "failed",
                "duration_seconds": duration,
                "previous_version_id": self._get_active_version(),
                "action": "Retained active production model due to error",
                "error": err_msg,
                "message": f"Retraining failed: {err_msg}"
            }
            self._append_history(fail_record)
            return {
                "success": False,
                "status": "failed",
                "error": err_msg,
                "duration_seconds": duration,
                "record": fail_record
            }

        finally:
            self.is_training = False
            self.current_job = None
            self.lock.release()

    def rollback_to_version(self, target_version_id: str) -> Dict[str, Any]:
        """
        Rollback active production model to a previously archived version.
        Validates artifact presence and sanity before atomic activation,
        and persistently records the rollback transition.
        """
        if not self.lock.acquire(blocking=False):
            return {
                "success": False,
                "status": "conflict",
                "message": "Cannot rollback while a training operation is in progress."
            }

        try:
            previous_version_id = self._get_active_version()
            if target_version_id == previous_version_id:
                return {
                    "success": True,
                    "status": "already_active",
                    "version": target_version_id,
                    "active_version": target_version_id,
                    "previous_version_id": previous_version_id,
                    "message": f"Model version '{target_version_id}' is already the currently active production model."
                }

            target_dir = os.path.join(self.versions_dir, target_version_id)
            if not os.path.exists(target_dir):
                return {
                    "success": False,
                    "status": "not_found",
                    "message": f"Archived version '{target_version_id}' does not exist."
                }

            manifest_path = os.path.join(target_dir, "manifest.json")
            if not os.path.exists(manifest_path):
                return {
                    "success": False,
                    "status": "invalid_version",
                    "message": f"Version '{target_version_id}' is missing manifest metadata."
                }

            with open(manifest_path, "r", encoding="utf-8") as f:
                target_manifest = json.load(f)

            # Verify that at least one model exists and can be loaded
            test_pipe = None
            for fname in ["gbr_model.joblib", "rf_model.joblib", "ridge_model.joblib", "baseline_model.joblib"]:
                candidate_file = os.path.join(target_dir, fname)
                if os.path.exists(candidate_file):
                    try:
                        test_pipe = joblib.load(candidate_file)
                        break
                    except Exception as load_ex:
                        print(f"[!] Warning testing artifact {fname}: {load_ex}")

            if test_pipe is None:
                return {
                    "success": False,
                    "status": "corrupt_version",
                    "message": f"Version '{target_version_id}' has no valid model joblib artifacts."
                }

            # Atomic copy to active models directory using staging backup
            staging_backup = os.path.join(self.models_dir, ".staging_rollback_backup")
            if os.path.exists(staging_backup):
                shutil.rmtree(staging_backup, ignore_errors=True)
            os.makedirs(staging_backup, exist_ok=True)

            now_utc = datetime.now(timezone.utc)
            now_myt = now_utc.astimezone(MYT_TIMEZONE)

            try:
                # Stage backup of current active production files
                for fname in os.listdir(self.models_dir):
                    fpath = os.path.join(self.models_dir, fname)
                    if os.path.isfile(fpath):
                        shutil.copy2(fpath, os.path.join(staging_backup, fname))

                # Copy all artifacts from target_dir to active models directory
                for f_name in os.listdir(target_dir):
                    src = os.path.join(target_dir, f_name)
                    dst = os.path.join(self.models_dir, f_name)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)

                # Ensure metadata.json exists in active models directory
                prod_meta = os.path.join(self.models_dir, "metadata.json")
                if not os.path.exists(prod_meta):
                    backup_meta = os.path.join(staging_backup, "metadata.json")
                    if os.path.exists(backup_meta):
                        shutil.copy2(backup_meta, prod_meta)

                # Update manifests across version archive
                for entry in os.listdir(self.versions_dir):
                    v_manifest = os.path.join(self.versions_dir, entry, "manifest.json")
                    if os.path.exists(v_manifest):
                        try:
                            with open(v_manifest, "r", encoding="utf-8") as vf:
                                v_data = json.load(vf)
                            v_data["status"] = "active" if entry == target_version_id else "archived"
                            if "candidate_artifacts" in v_data:
                                for cand in v_data["candidate_artifacts"]:
                                    is_champ = cand.get("is_champion", False)
                                    is_act = bool(is_champ and entry == target_version_id)
                                    cand["is_active"] = is_act
                                    cand["status"] = "active" if is_act else ("archived" if is_champ else "candidate")
                            with open(v_manifest, "w", encoding="utf-8") as vf:
                                json.dump(v_data, vf, indent=2)
                        except Exception:
                            pass

                # Update active manifest in self.models_dir
                prod_manifest_path = os.path.join(self.models_dir, "manifest.json")
                if os.path.exists(prod_manifest_path):
                    try:
                        with open(prod_manifest_path, "r", encoding="utf-8") as mf:
                            prod_manifest = json.load(mf)
                        prod_manifest["status"] = "active"
                        prod_manifest["previous_version_id"] = previous_version_id
                        prod_manifest["restored_at_utc"] = now_utc.isoformat()
                        prod_manifest["restored_at_myt"] = now_myt.isoformat()
                        with open(prod_manifest_path, "w", encoding="utf-8") as mf:
                            json.dump(prod_manifest, mf, indent=2)
                    except Exception:
                        pass

                # Clean up staging backup
                shutil.rmtree(staging_backup, ignore_errors=True)

            except Exception as copy_err:
                # Restore production from backup
                for b_file in os.listdir(staging_backup):
                    shutil.copy2(os.path.join(staging_backup, b_file), os.path.join(self.models_dir, b_file))
                shutil.rmtree(staging_backup, ignore_errors=True)
                return {
                    "success": False,
                    "status": "error",
                    "message": f"Rollback failed during artifact copying: {copy_err}. Production model remained intact."
                }

            # Reload FastAPI in-memory models
            if self.on_model_promoted:
                try:
                    self.on_model_promoted()
                except Exception as e:
                    print(f"[!] Warning reloading models during rollback: {e}")

            selected_model_name = (
                target_manifest.get("model_type")
                or target_manifest.get("selected_model")
                or target_manifest.get("selected_algorithm", "Unknown")
            )

            rollback_record = {
                "run_id": f"rollback_{now_myt.strftime('%Y%m%d_%H%M%S')}_{now_myt.microsecond // 1000:03d}",
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_myt": now_myt.isoformat(),
                "trigger": "admin_rollback",
                "status": "completed",
                "action": f"Rolled back active model from '{previous_version_id}' to '{target_version_id}'",
                "version_id": target_version_id,
                "previous_version_id": previous_version_id,
                "new_version_id": target_version_id,
                "selected_model": selected_model_name,
                "model_type": selected_model_name,
                "duration_seconds": 0.5,
                "message": f"Successfully restored model version {target_version_id} (reverted from {previous_version_id})"
            }
            self._append_history(rollback_record)

            rollback_entry = {
                "event_id": f"evt_rollback_{now_myt.strftime('%Y%m%d_%H%M%S')}_{now_myt.microsecond // 1000:03d}",
                "event_type": "ROLLBACK",
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_myt": now_myt.isoformat(),
                "previous_version_id": previous_version_id,
                "new_version_id": target_version_id,
                "deployed_version_id": target_version_id,
                "model_type": selected_model_name,
                "cv_mae": target_manifest.get("cv_mae"),
                "cv_r2": target_manifest.get("cv_r2"),
                "artifact_location": f"versions/{target_version_id}",
                "trigger": "admin_rollback",
                "status": "restored",
                "message": f"Successfully rolled back production model from '{previous_version_id}' to '{target_version_id}'"
            }
            self._append_rollback_record(rollback_entry)

            return {
                "success": True,
                "status": "rolled_back",
                "version": target_version_id,
                "active_version": target_version_id,
                "previous_version_id": previous_version_id,
                "selected_model": selected_model_name,
                "message": f"Production model successfully restored to version {target_version_id} (reverted from {previous_version_id})"
            }

        finally:
            self.lock.release()
