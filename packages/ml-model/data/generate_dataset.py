"""
generate_dataset.py
Generates a synthetic accessibility violations dataset (300 rows).
Run: python generate_dataset.py
"""

import csv
import random
import os

random.seed(42)

FEATURES = ["missing_alt", "missing_label", "low_contrast",
            "bad_heading_structure", "missing_aria", "keyboard_issue"]

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "accessibility_dataset.csv")

def severity_label(row: dict) -> str:
    """Assign severity based on total issue count with realistic thresholds."""
    score = sum(row[f] for f in FEATURES)
    # Weighted: critical issues count double
    weighted = row["missing_alt"] * 2 + row["keyboard_issue"] * 2 + score
    if weighted >= 6:
        return "Critical"
    elif weighted >= 3:
        return "Major"
    else:
        return "Minor"


def generate_row(target_severity: str) -> dict:
    """Generate a feature row biased toward the target severity."""
    while True:
        row = {f: random.randint(0, 1) for f in FEATURES}
        if severity_label(row) == target_severity:
            return row


def generate_dataset(n: int = 300) -> list[dict]:
    # ~30% Critical, ~40% Major, ~30% Minor
    targets = (
        ["Critical"] * 90 +
        ["Major"]    * 120 +
        ["Minor"]    * 90
    )
    random.shuffle(targets)
    rows = []
    for sev in targets:
        row = generate_row(sev)
        row["severity"] = sev
        rows.append(row)
    return rows


def save_csv(rows: list[dict], path: str) -> None:
    fieldnames = FEATURES + ["severity"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    rows = generate_dataset()
    save_csv(rows, OUTPUT_PATH)

    # Quick distribution check
    from collections import Counter
    counts = Counter(r["severity"] for r in rows)
    print(f"Dataset saved -> {OUTPUT_PATH}")
    print(f"Distribution: {dict(counts)}")
