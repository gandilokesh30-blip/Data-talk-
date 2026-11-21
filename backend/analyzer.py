"""
analyzer.py
Dataset profiling, smart type cleaning, and KPI generation utilities for the AI Data Analysis Chatbot & Dashboard.
"""

import re
from typing import Any, Dict, List, Union
import numpy as np
import pandas as pd


def sanitize_for_json(val: Any) -> Any:
    """
    Recursively sanitize objects so they are fully JSON-compliant.
    Converts NaNs and Infs to None, timestamps to strings, and numpy types to native Python.
    """
    if isinstance(val, dict):
        return {str(k): sanitize_for_json(v) for k, v in val.items()}
    elif isinstance(val, (list, tuple)):
        return [sanitize_for_json(v) for v in val]
    elif isinstance(val, (float, np.floating)):
        if np.isnan(val) or np.isinf(val):
            return None
        return float(val)
    elif isinstance(val, (int, np.integer)):
        return int(val)
    elif isinstance(val, (bool, np.bool_)):
        return bool(val)
    elif isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    elif pd.isna(val):
        return None
    return val


def format_number(val: Union[int, float]) -> str:
    """Format large numbers into human-readable strings (e.g., 1.2M, 4.5K)."""
    if val is None or pd.isna(val):
        return "N/A"
    abs_val = abs(val)
    if abs_val >= 1_000_000_000:
        return f"{val / 1_000_000_000:.2f}B"
    if abs_val >= 1_000_000:
        return f"{val / 1_000_000:.2f}M"
    if abs_val >= 1_000:
        return f"{val / 1_000:.1f}K"
    if isinstance(val, float):
        return f"{val:.2f}"
    return f"{val:,}"


def clean_and_coerce_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Smart Type Cleaning:
    Automatically attempts pd.to_numeric(df[col], errors='coerce') on string/object
    columns where >70% of non-null values are numbers (e.g., handling '..', 'N/A', spaces, '-').
    This ensures columns like 'average_rain_fall_mm_per_year' become proper numeric columns.
    Also strips whitespace from column names and string cells.
    """
    df = df.copy()

    # Clean column names (strip whitespace)
    df.columns = [str(c).strip() for c in df.columns]

    # Common non-numeric placeholders in tabular data
    placeholder_pattern = r"^(\.\.|\.{3,}|-+|n/?a|none|null|\?|undefined)$"

    for col in df.columns:
        if not pd.api.types.is_numeric_dtype(df[col]) or str(df[col].dtype).lower() in ("object", "string", "category", "str"):
            # Strip string values and normalize placeholders
            cleaned_series = df[col].astype(str).str.strip()
            # Replace placeholder patterns with NaN
            cleaned_series = cleaned_series.replace(to_replace=placeholder_pattern, value=np.nan, regex=True)

            non_null_original = cleaned_series.dropna()
            if len(non_null_original) > 0:
                # Attempt coercion to numeric
                numeric_attempt = pd.to_numeric(cleaned_series, errors="coerce")
                valid_num_count = numeric_attempt.notna().sum()
                ratio = valid_num_count / len(non_null_original)

                # If >70% of non-null values can be converted to numbers, convert column
                if ratio >= 0.70:
                    df[col] = numeric_attempt

    return df


def is_meaningful_numeric_column(col_name: str, series: pd.Series) -> bool:
    """
    Checks if a numeric column is meaningful for aggregate sums and averages,
    filtering out years, IDs, indices, postal codes, and coordinates.
    """
    col_lower = str(col_name).lower().strip()

    # Skip columns containing index, id, year, zip, code, lat, lon
    skip_keywords = ["year", "id", "index", "zip", "postal", "code", "phone", "lat", "lon", "latitude", "longitude"]
    for kw in skip_keywords:
        # Match as substring or separated word (e.g. 'year', 'record_id', 'zipcode')
        if kw in col_lower:
            return False

    # Check if the values represent calendar years (e.g., integer values between 1700 and 2150)
    valid_vals = series.dropna()
    if len(valid_vals) > 0 and pd.api.types.is_numeric_dtype(series):
        min_v = valid_vals.min()
        max_v = valid_vals.max()
        if 1700 <= min_v and max_v <= 2150:
            # Check if majority of values are integers
            if (valid_vals % 1 == 0).sum() / len(valid_vals) > 0.95:
                return False

    # Avoid columns where all values are identical
    if series.nunique() <= 1:
        return False

    return True


def extract_dataset_profile(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Extracts a comprehensive dataset profile from a pandas DataFrame.
    Returns:
        - total_rows: int
        - total_columns: int
        - column_names: list of column name strings
        - data_types: dict of column name to dtype string
        - missing_values: dict of column name to count of missing values
        - numerical_summary: dict of df.describe() for numeric columns
        - sample_rows: first 3 sample rows as a list of dictionaries
    """
    # Ensure DataFrame is cleanly coerced
    df = clean_and_coerce_dataframe(df)

    total_rows = int(len(df))
    total_columns = int(len(df.columns))
    column_names = [str(c) for c in df.columns]
    data_types = {str(col): str(dtype) for col, dtype in df.dtypes.items()}
    missing_values = {str(col): int(df[col].isna().sum()) for col in df.columns}

    # Numerical summary (df.describe() for numeric columns)
    numeric_df = df.select_dtypes(include=[np.number])
    if not numeric_df.empty:
        numerical_summary = numeric_df.describe().to_dict()
    else:
        numerical_summary = {}

    # Sample rows (first 3 rows)
    sample_records = df.head(3).to_dict(orient="records")

    profile = {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "column_names": column_names,
        "data_types": data_types,
        "missing_values": missing_values,
        "numerical_summary": sanitize_for_json(numerical_summary),
        "sample_rows": sanitize_for_json(sample_records),
    }

    return profile


def generate_initial_kpis(df: pd.DataFrame) -> List[Dict[str, str]]:
    """
    Calculates 3-4 smart summary metrics to display as dashboard KPI cards.
    Skips non-aggregatable columns like 'year', 'id', 'index', or 'zip'
    so it doesn't show metrics like 'Total Year'.
    """
    # Clean and coerce types first
    df = clean_and_coerce_dataframe(df)

    kpis: List[Dict[str, str]] = []
    total_rows = int(len(df))
    total_cols = int(len(df.columns))

    # KPI 1: Total Records
    kpis.append({
        "label": "Total Records",
        "value": f"{total_rows:,}",
        "description": f"Dataset contains {total_cols} columns",
    })

    # KPI 2 & 3: Smart Numeric Metrics (excluding year, id, index, zip, etc.)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Filter out year, id, index, zip, etc.
    meaningful_cols = [c for c in numeric_cols if is_meaningful_numeric_column(c, df[c])]

    if meaningful_cols:
        primary_col = meaningful_cols[0]
        col_sum = df[primary_col].sum()
        col_mean = df[primary_col].mean()

        kpis.append({
            "label": f"Total {primary_col}",
            "value": format_number(col_sum),
            "description": f"Sum across all {total_rows:,} records",
        })

        if len(meaningful_cols) > 1:
            second_col = meaningful_cols[1]
            sec_mean = df[second_col].mean()
            kpis.append({
                "label": f"Avg {second_col}",
                "value": format_number(sec_mean),
                "description": f"Mean value per record",
            })
        else:
            kpis.append({
                "label": f"Avg {primary_col}",
                "value": format_number(col_mean),
                "description": f"Mean value per record",
            })
    else:
        # Fallback to categorical distribution if no meaningful numeric columns
        cat_cols = df.select_dtypes(include=["object", "category", "string", "str"]).columns.tolist()
        meaningful_cat = [c for c in cat_cols if "id" not in c.lower() and "index" not in c.lower()]
        candidate_cat = meaningful_cat if meaningful_cat else cat_cols

        if candidate_cat:
            top_cat = candidate_cat[0]
            unique_count = df[top_cat].nunique()
            kpis.append({
                "label": f"Distinct {top_cat}",
                "value": f"{unique_count:,}",
                "description": f"Unique categories in {top_cat}",
            })

    # KPI 4: Data Completeness / Quality
    total_cells = total_rows * total_cols
    total_missing = int(df.isna().sum().sum())
    if total_cells > 0:
        completeness = ((total_cells - total_missing) / total_cells) * 100.0
    else:
        completeness = 100.0

    kpis.append({
        "label": "Data Completeness",
        "value": f"{completeness:.1f}%",
        "description": f"{total_missing:,} missing values across table",
    })

    return kpis


def format_schema_info_for_prompt(df: pd.DataFrame, profile: Dict[str, Any] = None) -> str:
    """
    Generates a concise, informative text summary of the dataset schema,
    sample values, and column statistics for Gemini.
    """
    if profile is None:
        profile = extract_dataset_profile(df)

    lines = [
        f"Dataset Shape: {profile['total_rows']} rows x {profile['total_columns']} columns",
        "Columns & Data Types:",
    ]

    for col in profile["column_names"]:
        dtype = profile["data_types"].get(col, "unknown")
        missing = profile["missing_values"].get(col, 0)
        # sample non-null values
        non_null_samples = df[col].dropna().head(3).tolist()
        samples_str = ", ".join(repr(s) for s in non_null_samples)
        lines.append(f"  - `{col}` ({dtype}): missing={missing}, samples=[{samples_str}]")

    num_summary = profile.get("numerical_summary", {})
    if num_summary:
        lines.append("\nKey Numeric Ranges (min / mean / max):")
        for col, stats in num_summary.items():
            min_val = stats.get("min")
            mean_val = stats.get("mean")
            max_val = stats.get("max")
            lines.append(f"  - `{col}`: min={min_val}, mean={mean_val}, max={max_val}")

    return "\n".join(lines)
