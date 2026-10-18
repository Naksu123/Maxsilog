"""
AutoValuate Market Analytics Engine
Calculates research-aligned market metrics and distributions from the real cleaned dataset.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional


class MarketAnalytics:
    def __init__(self, data_path: Optional[str] = None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            data_path = os.path.normpath(os.path.join(base_dir, "..", "data", "Resale_car_installment_clean.csv"))
        
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Cleaned dataset not found at {data_path}")

        self.df = pd.read_csv(data_path)
        # Ensure correct types
        self.df["List_Price"] = pd.to_numeric(self.df["List_Price"], errors="coerce")
        self.df["Mileage"] = pd.to_numeric(self.df["Mileage"], errors="coerce")
        self.df = self.df.dropna(subset=["List_Price", "Mileage"]).reset_index(drop=True)

    def get_summary(self) -> Dict[str, Any]:
        target = self.df["List_Price"]
        mileage = self.df["Mileage"]
        gear_counts = self.df["Gear_Type"].value_counts().to_dict()
        total = len(self.df)

        gear_breakdown = {
            k: {
                "count": int(v),
                "percentage": round(float(v / total * 100), 2)
            }
            for k, v in gear_counts.items()
        }

        return {
            "total_listings": total,
            "average_price": round(float(target.mean()), 2),
            "median_price": round(float(target.median()), 2),
            "std_price": round(float(target.std()), 2),
            "min_price": round(float(target.min()), 2),
            "max_price": round(float(target.max()), 2),
            "average_mileage": round(float(mileage.mean()), 1),
            "median_mileage": round(float(mileage.median()), 1),
            "min_mileage": round(float(mileage.min()), 1),
            "max_mileage": round(float(mileage.max()), 1),
            "unique_models_count": int(self.df["Model"].nunique()),
            "unique_states_count": int(self.df["State"].nunique()),
            "gear_type_breakdown": gear_breakdown
        }

    def get_top_cars(self, limit: int = 20) -> List[Dict[str, Any]]:
        grouped = self.df.groupby("Model").agg(
            count=("List_Price", "count"),
            avg_price=("List_Price", "mean"),
            median_price=("List_Price", "median"),
            min_price=("List_Price", "min"),
            max_price=("List_Price", "max"),
            avg_mileage=("Mileage", "mean")
        ).reset_index()

        # Sort strictly by listing frequency
        top = grouped.sort_values(by="count", ascending=False).head(limit)
        
        result = []
        for _, row in top.iterrows():
            result.append({
                "model": str(row["Model"]),
                "count": int(row["count"]),
                "avg_price": round(float(row["avg_price"]), 2),
                "median_price": round(float(row["median_price"]), 2),
                "min_price": round(float(row["min_price"]), 2),
                "max_price": round(float(row["max_price"]), 2),
                "avg_mileage": round(float(row["avg_mileage"]), 1)
            })
        return result

    def get_top_regions(self, limit: int = 10) -> List[Dict[str, Any]]:
        grouped = self.df.groupby("State").agg(
            count=("List_Price", "count"),
            avg_price=("List_Price", "mean"),
            median_price=("List_Price", "median")
        ).reset_index()

        total = len(self.df)
        top = grouped.sort_values(by="count", ascending=False).head(limit)

        result = []
        for _, row in top.iterrows():
            result.append({
                "state": str(row["State"]),
                "count": int(row["count"]),
                "percentage": round(float(row["count"] / total * 100), 2),
                "avg_price": round(float(row["avg_price"]), 2),
                "median_price": round(float(row["median_price"]), 2)
            })
        return result

    def get_price_vs_mileage(
        self,
        model: Optional[str] = None,
        state: Optional[str] = None,
        gear_type: Optional[str] = None,
        limit: int = 600
    ) -> List[Dict[str, Any]]:
        sub = self.df.copy()
        if model and model != "All":
            sub = sub[sub["Model"] == model]
        if state and state != "All":
            sub = sub[sub["State"] == state]
        if gear_type and gear_type != "All":
            sub = sub[sub["Gear_Type"] == gear_type]

        if len(sub) > limit:
            sub = sub.sample(n=limit, random_state=42)

        result = []
        for _, row in sub.iterrows():
            result.append({
                "model": str(row["Model"]),
                "mileage": float(row["Mileage"]),
                "price": float(row["List_Price"]),
                "gear_type": str(row.get("Gear_Type", "Automatic")),
                "state": str(row.get("State", "Unknown")),
                "year": int(row["Year"]) if "Year" in row and pd.notna(row["Year"]) else None
            })
        return result

    def get_price_distribution(self) -> List[Dict[str, Any]]:
        # Segment price ranges specifically customized for Malaysian used car market
        bins = [
            (0, 30000, "Under RM 30k"),
            (30000, 50000, "RM 30k - 50k"),
            (50000, 75000, "RM 50k - 75k"),
            (75000, 100000, "RM 75k - 100k"),
            (100000, 150000, "RM 100k - 150k"),
            (150000, 200000, "RM 150k - 200k"),
            (200000, 300000, "RM 200k - 300k"),
            (300000, 500000, "RM 300k - 500k"),
            (500000, 1500000, "RM 500k+")
        ]
        prices = self.df["List_Price"].values
        results = []
        for start, end, label in bins:
            if end >= 1500000:
                count = int(np.sum(prices >= start))
            else:
                count = int(np.sum((prices >= start) & (prices < end)))
            results.append({
                "bin_range": label,
                "bin_start": float(start),
                "bin_end": float(end),
                "count": count
            })
        return results

    def get_mileage_distribution(self) -> List[Dict[str, Any]]:
        bins = [
            (0, 25000, "0 - 25k KM"),
            (25000, 50000, "25k - 50k KM"),
            (50000, 75000, "50k - 75k KM"),
            (75000, 100000, "75k - 100k KM"),
            (100000, 125000, "100k - 125k KM"),
            (125000, 150000, "125k - 150k KM"),
            (150000, 200000, "150k - 200k KM"),
            (200000, 300000, "200k+ KM")
        ]
        mileages = self.df["Mileage"].values
        results = []
        for start, end, label in bins:
            if end >= 300000:
                count = int(np.sum(mileages >= start))
            else:
                count = int(np.sum((mileages >= start) & (mileages < end)))
            results.append({
                "bin_range": label,
                "bin_start": float(start),
                "bin_end": float(end),
                "count": count
            })
        return results
