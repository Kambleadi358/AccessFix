"""
train_model.py
Trains a DecisionTreeClassifier on the accessibility dataset.
Run: python train_model.py
"""

import os
import joblib
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

# ── Paths ────────────────────────────────────────────────────────────────────
DATA_PATH  = os.path.join("data", "accessibility_dataset.csv")
MODEL_DIR  = "model"
MODEL_PATH = os.path.join(MODEL_DIR, "decision_tree_model.pkl")

FEATURES = ["missing_alt", "missing_label", "low_contrast",
            "bad_heading_structure", "missing_aria", "keyboard_issue"]

# ── Load ─────────────────────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
X  = df[FEATURES]
y  = df["severity"]

# ── Split ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Train ─────────────────────────────────────────────────────────────────────
model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)

print("=" * 50)
print(f"Accuracy : {accuracy_score(y_test, y_pred):.4f}")
print()
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred, labels=["Critical", "Major", "Minor"]))
print()
print("Classification Report:")
print(classification_report(y_test, y_pred))
print("Feature Importances:")
for feat, imp in sorted(zip(FEATURES, model.feature_importances_),
                        key=lambda x: -x[1]):
    print(f"  {feat:<26} {imp:.4f}")
print("=" * 50)

# ── Save ──────────────────────────────────────────────────────────────────────
os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(model, MODEL_PATH)
print(f"\nModel saved -> {MODEL_PATH}")
