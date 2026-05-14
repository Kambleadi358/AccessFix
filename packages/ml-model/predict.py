"""
predict.py
Loads the trained model and predicts severity for a given feature dict.
Usage (CLI): python predict.py '{"missing_alt":1,"missing_label":0,"low_contrast":1,"bad_heading_structure":0,"missing_aria":1,"keyboard_issue":0}'
"""

import sys
import json
import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "decision_tree_model.pkl")

FEATURES = ["missing_alt", "missing_label", "low_contrast",
            "bad_heading_structure", "missing_aria", "keyboard_issue"]


def predict_violation_severity(features: dict) -> dict:
    """
    Predict accessibility violation severity.

    Parameters
    ----------
    features : dict
        Keys must match FEATURES. Values are 0 or 1.

    Returns
    -------
    dict with keys:
        severity    – "Critical" | "Major" | "Minor"
        confidence  – float [0, 1]
        top_features – list of {"feature": str, "value": int} sorted by importance
    """
    model = joblib.load(MODEL_PATH)

    # Build named DataFrame so sklearn doesn't warn about feature names
    vector = pd.DataFrame([{f: features.get(f, 0) for f in FEATURES}])

    severity   = model.predict(vector)[0]
    proba      = model.predict_proba(vector)[0]
    confidence = round(float(proba.max()), 4)

    # Rank active features by model importance
    importances = dict(zip(FEATURES, model.feature_importances_))
    top_features = sorted(
        [{"feature": f, "value": features.get(f, 0), "importance": round(importances[f], 4)}
         for f in FEATURES if features.get(f, 0) == 1],
        key=lambda x: -x["importance"]
    )

    return {
        "severity":     severity,
        "confidence":   confidence,
        "top_features": top_features,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Pass features as a JSON string argument."}))
        sys.exit(1)

    try:
        raw      = json.loads(sys.argv[1])
        result   = predict_violation_severity(raw)
        print(json.dumps(result))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
