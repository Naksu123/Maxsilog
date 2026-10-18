"""
Target Leakage Prevention Verification Tests
Ensures Monthly_Installment is strictly barred from dataset, preprocessors, and feature matrices.
"""

import os
import json
import joblib
import pandas as pd
import pytest

from backend.ml.pipeline import clean_dataset


def test_target_leakage_exclusion_in_cleaning():
    sample_raw = pd.DataFrame({
        "Description": ["2018 Honda Civic 1.5 TC VTEC Sedan"],
        "Monthly_Installment": ["RM 1,145 / month"],
        "List_Price": ["RM 90,100"],
        "Model": ["Honda Civic"],
        "Milleage": ["75 - 80K KM"],
        "Gear_Type": ["Automatic"],
        "Location": ["Penang, Simpang Ampat"]
    })

    df_clean, audit = clean_dataset(sample_raw)

    # 1. Monthly_Installment must be completely dropped
    assert "Monthly_Installment" not in df_clean.columns
    assert audit["target_leakage_purged"] is True

    # 2. List_Price must be positive continuous float
    assert df_clean["List_Price"].iloc[0] == 90100.0


def test_no_leakage_in_saved_clean_dataset():
    clean_csv_path = "backend/data/Resale_car_installment_clean.csv"
    if os.path.exists(clean_csv_path):
        df = pd.read_csv(clean_csv_path)
        assert "Monthly_Installment" not in df.columns
        for col in df.columns:
            assert "installment" not in col.lower()


def test_no_leakage_in_models_and_preprocessors():
    models_dir = "backend/models"
    for fname in ["gbr_model.joblib", "rf_model.joblib", "ridge_model.joblib", "baseline_model.joblib"]:
        fpath = os.path.join(models_dir, fname)
        if os.path.exists(fpath):
            pipe = joblib.load(fpath)
            # Verify feature names if available in column transformer
            if hasattr(pipe, 'named_steps') and 'prep' in pipe.named_steps:
                prep = pipe.named_steps['prep']
                if hasattr(prep, 'transformers'):
                    for trans in prep.transformers:
                        cols = trans[2]
                        assert "Monthly_Installment" not in cols
                        for c in cols:
                            assert "installment" not in c.lower()
