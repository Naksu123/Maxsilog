"""
AutoValuate Dataset Management & Validation Engine
Handles dataset validation, SHA-256 fingerprinting, record auditing, and change detection.
"""

import os
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional

from .pipeline import clean_dataset

REQUIRED_RAW_COLUMNS = [
    "Description",
    "List_Price",
    "Model",
    "Gear_Type",
    "Location"
]


def compute_file_sha256(filepath: str) -> str:
    """Compute SHA-256 checksum of dataset file for change detection."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found: {filepath}")
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def audit_and_prepare_dataset(raw_csv_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Validates CSV file, audits missing/duplicate rows, cleans features,
    strictly removes target leakage, and returns the cleaned DataFrame and audit metadata.
    """
    if not os.path.exists(raw_csv_path):
        raise FileNotFoundError(f"Primary dataset file does not exist: {raw_csv_path}")

    file_size_bytes = os.path.getsize(raw_csv_path)
    if file_size_bytes == 0:
        raise ValueError(f"Dataset file is empty (0 bytes): {raw_csv_path}")

    fingerprint = compute_file_sha256(raw_csv_path)
    df_raw = pd.read_csv(raw_csv_path)
    initial_rows = len(df_raw)

    # Check for presence of required raw columns
    raw_cols = [c.strip() for c in df_raw.columns]
    df_raw.columns = raw_cols

    # Normalize mileage column header
    if "Milleage" in df_raw.columns and "Mileage" not in df_raw.columns:
        df_raw.rename(columns={"Milleage": "Mileage"}, inplace=True)

    missing_cols = [c for c in REQUIRED_RAW_COLUMNS if c not in df_raw.columns and (c != "Mileage" or "Mileage" not in df_raw.columns)]
    if missing_cols:
        raise ValueError(f"Dataset missing required schema columns: {missing_cols}")

    # Clean dataset with target leakage barred
    df_clean, clean_audit = clean_dataset(df_raw)
    final_rows = len(df_clean)
    rejected_rows = initial_rows - final_rows

    audit_report = {
        "dataset_path": raw_csv_path,
        "file_size_bytes": file_size_bytes,
        "sha256_fingerprint": fingerprint,
        "raw_record_count": initial_rows,
        "valid_record_count": final_rows,
        "rejected_record_count": rejected_rows,
        "duplicates_removed": clean_audit.get("duplicates_removed", 0),
        "target_leakage_purged": clean_audit.get("target_leakage_purged", True),
        "columns_verified": list(df_clean.columns),
        "price_min": float(df_clean["List_Price"].min()),
        "price_max": float(df_clean["List_Price"].max()),
        "price_median": float(df_clean["List_Price"].median()),
        "mileage_median": float(df_clean["Mileage"].median()),
        "unique_models_count": int(df_clean["Model"].nunique()),
        "unique_states_count": int(df_clean["State"].nunique())
    }

    return df_clean, audit_report
