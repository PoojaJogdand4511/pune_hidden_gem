import os
import logging
from typing import List, Dict, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd


APP_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILENAME = "mental_detox_dataset.csv"
CSV_PATH = os.path.join(APP_DIR, CSV_FILENAME)
REQUIRED_COLUMNS = [
    "issue",
    "quote",
    "reference",
    "video_title",
    "video_link",
    "tip",
]


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Configure logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    app.logger.setLevel(logging.INFO)

    dataset: Optional[pd.DataFrame] = None
    unique_issues: List[str] = []

    def load_dataset() -> Optional[pd.DataFrame]:
        nonlocal unique_issues
        try:
            df = pd.read_csv(CSV_PATH)
        except FileNotFoundError:
            app.logger.error("CSV file not found at %s. Ensure %s is present next to flask_app.py.", CSV_PATH, CSV_FILENAME)
            return None
        except Exception as exc:
            app.logger.exception("Failed to read CSV: %s", exc)
            return None

        # Normalize columns: ensure required columns exist
        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            app.logger.error("CSV is missing required columns: %s", ", ".join(missing))
            return None

        # Clean and normalize
        for col in REQUIRED_COLUMNS:
            # Convert to string where appropriate; keep NaN as NaN
            if col in ["issue", "quote", "reference", "video_title", "video_link", "tip"]:
                df[col] = df[col].astype("string")

        # Drop rows without an issue value
        df = df.dropna(subset=["issue"]).copy()
        df["issue"] = df["issue"].str.strip()
        df = df[df["issue"] != ""]

        # Precompute unique issues (case-sensitive display, case-insensitive matching)
        # We'll use the first occurrence capitalization for display
        # But for matching, we compare using .str.lower()
        display_map: Dict[str, str] = {}
        for val in df["issue"].dropna():
            lower = str(val).strip().lower()
            display_map.setdefault(lower, str(val).strip())
        unique_issues = sorted(display_map.values(), key=lambda x: x.lower())

        return df

    dataset = load_dataset()

    def get_issues() -> List[str]:
        return unique_issues if unique_issues else []

    def filter_by_issue(issue_value: str) -> Optional[pd.DataFrame]:
        nonlocal dataset
        if dataset is None or dataset.empty:
            return None
        normalized = str(issue_value).strip().lower()
        subset = dataset[dataset["issue"].str.strip().str.lower() == normalized]
        if subset.empty:
            return None
        return subset

    @app.route("/health", methods=["GET"])
    def health():
        status = {
            "status": "ok" if dataset is not None else "error",
            "dataset_loaded": dataset is not None,
            "issues_count": len(get_issues()),
        }
        return jsonify(status), 200 if dataset is not None else 500

    @app.route("/issues", methods=["GET"])
    def issues_endpoint():
        issues = get_issues()
        if not issues:
            return jsonify({
                "issues": [],
                "error": f"Dataset not available or missing required columns. Ensure {CSV_FILENAME} is present and valid."
            }), 500
        return jsonify({"issues": issues})

    @app.route("/get_data", methods=["GET"])
    def get_data_endpoint():
        issue = request.args.get("issue", type=str, default=None)
        if not issue:
            return jsonify({"error": "Query parameter 'issue' is required."}), 400

        subset = filter_by_issue(issue)
        if subset is None:
            return jsonify({"error": f"No data found for issue '{issue}'."}), 404

        # Randomly sample one row
        try:
            sampled = subset.sample(n=1)
        except ValueError:
            return jsonify({"error": f"No data found for issue '{issue}'."}), 404

        row = sampled.iloc[0]

        def safe_get(value: Optional[pd.Series]) -> Optional[str]:
            if pd.isna(value):
                return None
            text = str(value).strip()
            return text if text else None

        payload = {
            "issue": safe_get(row.get("issue")),
            "quote": safe_get(row.get("quote")),
            "reference": safe_get(row.get("reference")),
            "video_title": safe_get(row.get("video_title")),
            "video_link": safe_get(row.get("video_link")),
            "tip": safe_get(row.get("tip")),
        }

        return jsonify(payload)

    return app


app = create_app()


if __name__ == "__main__":
    # Bind to 0.0.0.0 for access from other containers/hosts
    app.run(host="0.0.0.0", port=5000, debug=False)