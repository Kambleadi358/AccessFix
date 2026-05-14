# AccessFix — ML Severity Predictor

Predicts accessibility violation severity (**Critical / Major / Minor**) from
binary WCAG feature flags using a trained Decision Tree.

---

## Why Decision Tree?

| Property | Benefit for this problem |
|---|---|
| **Interpretable** | Each prediction follows a readable decision path — auditors can explain *why* a violation is Critical |
| **Handles binary features natively** | No scaling or encoding needed for 0/1 flags |
| **No training data assumptions** | Works without Gaussian or linearity assumptions |
| **Fast inference** | Sub-millisecond prediction — suitable for real-time scanning |
| **Feature importances built-in** | Directly surfaces which WCAG rule matters most |

---

## How Severity Is Predicted

The tree splits on weighted combinations of six binary features:

```
missing_alt + keyboard_issue  →  weighted x2  (high impact on user access)
missing_label, low_contrast,
bad_heading_structure, missing_aria  →  weighted x1
```

**Decision path example:**

```
missing_alt = 1
  └─ keyboard_issue = 1  →  Critical  (confidence: 0.94)
  └─ keyboard_issue = 0
       └─ missing_aria = 1  →  Major  (confidence: 0.87)
       └─ missing_aria = 0  →  Minor  (confidence: 0.81)
```

---

## How This Improves Over Static WCAG Rules

| Static rules | ML model |
|---|---|
| Binary pass/fail only | Graded severity with confidence score |
| No prioritisation | Ranks violations by learned impact |
| Fixed thresholds | Adapts to real-world violation co-occurrence patterns |
| No uncertainty signal | Confidence score flags ambiguous cases for manual review |

---

## Project Structure

```
packages/ml-model/
├── data/
│   ├── generate_dataset.py      # Synthetic dataset generator
│   └── accessibility_dataset.csv
├── model/
│   └── decision_tree_model.pkl  # Trained model artifact
├── bridge/
│   └── ml_bridge.ts             # Node.js ↔ Python bridge (TypeScript)
├── train_model.py               # Training + evaluation script
├── predict.py                   # CLI prediction (used by ml_bridge.ts)
├── requirements.txt
└── README.md
```

---

## Setup & Usage

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate the dataset
python data/generate_dataset.py

# 3. Train the model (prints accuracy, confusion matrix, feature importances)
python train_model.py

# 4. Run a prediction
python predict.py '{"missing_alt":1,"missing_label":0,"low_contrast":1,"bad_heading_structure":0,"missing_aria":1,"keyboard_issue":0}'
```

**Expected output:**
```json
{
  "severity": "Critical",
  "confidence": 0.92,
  "top_features": [
    { "feature": "missing_alt",  "value": 1, "importance": 0.412 },
    { "feature": "missing_aria", "value": 1, "importance": 0.198 },
    { "feature": "low_contrast", "value": 1, "importance": 0.141 }
  ]
}
```

---

## Node.js Integration (TypeScript)

```typescript
import { predictSeverity } from './bridge/ml_bridge';

const result = await predictSeverity({
  missing_alt:   1,
  keyboard_issue: 1,
});
// result.severity    → "Critical"
// result.confidence  → 0.94
// result.source      → "ml-model" | "rule-based"
```

> If Python is unavailable or the model has not been trained yet, `ml_bridge.ts`
> automatically falls back to a deterministic rule-based scorer so the backend
> never hard-fails.

---

## Feature Reference

| Feature | WCAG Criterion |
|---|---|
| `missing_alt` | 1.1.1 Non-text Content |
| `missing_label` | 1.3.1 Info and Relationships |
| `low_contrast` | 1.4.3 Contrast (Minimum) |
| `bad_heading_structure` | 1.3.1 / 2.4.6 |
| `missing_aria` | 4.1.2 Name, Role, Value |
| `keyboard_issue` | 2.1.1 Keyboard |
