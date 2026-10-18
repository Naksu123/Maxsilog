"""
AutoValuate Machine Learning Preprocessing and Feature Engineering Pipeline
Research-aligned with Malaysian used-vehicle resale valuation study.
"""

import re
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer


def clean_currency_to_float(val: Any) -> float:
    """Extract numeric value in Malaysian Ringgit (RM) from formatted string."""
    if pd.isna(val):
        return np.nan
    cleaned = re.sub(r"[^\d.]", "", str(val))
    try:
        return float(cleaned) if cleaned else np.nan
    except ValueError:
        return np.nan


def parse_mileage_to_numeric(val: Any) -> float:
    """
    Parse odometer mileage string to continuous float in kilometers.
    Handles ranges like '70 - 75K KM' -> midpoint (72,500 KM)
    and point observations like '88300 KM' -> 88,300 KM.
    """
    if pd.isna(val):
        return np.nan
    s = str(val).strip().upper().replace("KM", "").strip()

    # Match interval ranges (e.g. '70 - 75K')
    m_range = re.match(r"^([\d.]+)\s*-\s*([\d.]+)\s*K?$", s)
    if m_range:
        low = float(m_range.group(1))
        high = float(m_range.group(2))
        mid = (low + high) / 2.0
        if high <= 500:
            mid *= 1000.0
        return mid

    # Match direct mileage number (e.g. '88300')
    m_single = re.match(r"^([\d.]+)$", s)
    if m_single:
        num = float(m_single.group(1))
        if num <= 500:
            num *= 1000.0
        return num

    return np.nan


def extract_manufacturing_year(desc: Any) -> float:
    """Extract 4-digit manufacturing year from listing title. If dual (2012/2013), use registration year."""
    if not isinstance(desc, str):
        return np.nan
    m = re.match(r"^(\d{4})(?:/(\d{4}))?", desc.strip())
    if m:
        return float(m.group(2)) if m.group(2) else float(m.group(1))
    return np.nan


def extract_engine_displacement(desc: Any) -> float:
    """Derive engine displacement in Liters (e.g. 1.8, 2.0) from description text."""
    if not isinstance(desc, str):
        return np.nan
    m = re.search(r"\b([0-5]\.[0-9])\b", desc)
    return float(m.group(1)) if m else np.nan


def extract_state_from_location(loc: Any) -> str:
    """Derive Malaysian administrative state/territory from Location column."""
    if not isinstance(loc, str) or not loc.strip():
        return "Unknown"
    return loc.split(",")[0].strip()


def extract_brand_from_description_or_model(val: Any) -> str:
    """
    Extract automotive manufacturer / brand from model or description text.
    Handles compound names in Malaysia (e.g. Mercedes-Benz, Land Rover, Alfa Romeo).
    """
    if not isinstance(val, str) or not val.strip():
        return "Unknown"
    s = val.strip()
    if re.search(r"\bMercedes(?:-Benz)?\b", s, re.IGNORECASE):
        return "Mercedes-Benz"
    if re.search(r"\bLand\s+Rover\b", s, re.IGNORECASE):
        return "Land Rover"
    if re.search(r"\bAlfa\s+Romeo\b", s, re.IGNORECASE):
        return "Alfa Romeo"
    tokens = s.split()
    return tokens[0] if tokens else "Unknown"


def clean_dataset(df_raw: pd.DataFrame, filter_typos: bool = True) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Execute full leakage-free data cleansing and feature extraction on the Malaysian car dataset.
    Strictly removes 'Monthly_Installment' to prevent target leakage.
    Filters extreme data-entry typographical errors (e.g., non-luxury sedans priced over RM 300,000).
    """
    df = df_raw.copy()
    initial_rows = len(df)
    audit: Dict[str, Any] = {
        "initial_rows": initial_rows,
        "raw_columns": list(df.columns)
    }

    # Standardize column header spacing and naming
    df.columns = [c.strip() for c in df.columns]
    if "Milleage" in df.columns and "Mileage" not in df.columns:
        df.rename(columns={"Milleage": "Mileage"}, inplace=True)

    # 1. Target Variable Cleaning
    df["List_Price"] = df["List_Price"].apply(clean_currency_to_float)

    # 2. Mileage Parsing
    df["Mileage"] = df["Mileage"].apply(parse_mileage_to_numeric)

    # 3. Model Imputation for missing records via Description
    extracted_model = df["Description"].str.extract(
        r"^\d{4}(?:/\d{4})?\s+([A-Za-z0-9-]+(?:\s+[A-Za-z0-9.-]+){1,2})"
    )[0]
    df["Model"] = df["Model"].fillna(extracted_model).fillna("Unknown").astype(str).str.strip()

    # 4. Standardize Categorical Columns
    for col in ["Gear_Type", "Location"]:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown").astype(str).str.strip()

    # 5. Feature Engineering
    df["Year"] = df["Description"].apply(extract_manufacturing_year)
    # Reference year 2024 as per baseline study
    df["Vehicle_Age"] = 2024.0 - df["Year"]
    df["Engine_Size"] = df["Description"].apply(extract_engine_displacement)
    df["State"] = df["Location"].apply(extract_state_from_location)
    df["Brand"] = df["Model"].apply(extract_brand_from_description_or_model)
    df["Mileage_Per_Year"] = df["Mileage"] / np.maximum(1.0, df["Vehicle_Age"].fillna(5.0))

    # 6. Target Leakage Prevention: STRICT PURGE of Monthly_Installment
    if "Monthly_Installment" in df.columns:
        df.drop(columns=["Monthly_Installment"], inplace=True)
        audit["target_leakage_purged"] = True
    else:
        audit["target_leakage_purged"] = False

    # 7. Deduplication & Validity check
    df = df.dropna(subset=["List_Price", "Mileage"])
    df = df[df["List_Price"] > 0]
    dedup_subset = [c for c in ["Description", "List_Price", "Mileage", "Model", "Location"] if c in df.columns]
    before_dedup = len(df)
    df = df.drop_duplicates(subset=dedup_subset).reset_index(drop=True)
    audit["duplicates_removed"] = before_dedup - len(df)

    # 8. Anomaly & Data-Entry Typo Purge (Research Data Quality)
    if filter_typos:
        luxury_brands = {
            "Porsche", "Land Rover", "Lexus", "BMW", "Mercedes-Benz",
            "Audi", "Jaguar", "Alfa Romeo", "Ford"
        }
        is_luxury_toyota = (df["Brand"] == "Toyota") & df["Model"].str.contains(
            r"Alphard|Vellfire|Land Cruiser|Supra|Granace|Century", case=False, na=False
        )
        is_legit_high_tier = df["Brand"].isin(luxury_brands) | is_luxury_toyota
        typo_mask = (df["List_Price"] > 300000.0) & (~is_legit_high_tier)
        typos_count = int(typo_mask.sum())
        df = df[~typo_mask].reset_index(drop=True)
        audit["typos_removed"] = typos_count
    else:
        audit["typos_removed"] = 0

    audit["final_rows"] = len(df)
    audit["final_columns"] = list(df.columns)

    return df, audit


def build_preprocessors(
    numerical_features: List[str] = ["Mileage", "Vehicle_Age", "Engine_Size", "Mileage_Per_Year"],
    categorical_features: List[str] = ["Brand", "Model", "Gear_Type", "State"]
) -> Tuple[ColumnTransformer, ColumnTransformer]:
    """
    Construct scikit-learn ColumnTransformers for:
    - linear models (with StandardScaler on numeric features)
    - tree ensemble models (without scaling to preserve natural split thresholds)
    """
    # Linear Preprocessor (StandardScaler)
    num_pipeline_scaled = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Tree Preprocessor (No scaling)
    num_pipeline_unscaled = Pipeline([
        ('imputer', SimpleImputer(strategy='median'))
    ])

    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    linear_preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline_scaled, numerical_features),
            ('cat', cat_pipeline, categorical_features)
        ],
        remainder='drop'
    )

    tree_preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline_unscaled, numerical_features),
            ('cat', cat_pipeline, categorical_features)
        ],
        remainder='drop'
    )

    return linear_preprocessor, tree_preprocessor

