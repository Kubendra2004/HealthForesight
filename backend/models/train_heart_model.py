"""Train the exploratory heart model with stratified model selection."""
import json
import os

import joblib
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    roc_auc_score,
    brier_score_loss,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, train_test_split

DATA_PATH = "data/Heart_disease_cleveland_new.csv"
ARTIFACTS_DIR = "artifacts"
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "heart_model.joblib")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "heart_model_metrics.json")
RANDOM_STATE = 42


def _load_data():
    paths = [DATA_PATH, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "Heart_disease_cleveland_new.csv")]
    for path in paths:
        if os.path.exists(path):
            return pd.read_csv(path)
    raise FileNotFoundError("Heart dataset not found: Heart_disease_cleveland_new.csv")


def train_model():
    df = _load_data()
    if "target" not in df:
        raise ValueError("Heart dataset must contain a 'target' column")
    df = df.dropna(subset=["target"]).copy()
    features = [column for column in df.columns if column != "target"]
    X = df[features].copy()
    y = df["target"].astype(int)
    for column in X.select_dtypes(include="object").columns:
        X[column] = pd.to_numeric(X[column], errors="raise")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    search = RandomizedSearchCV(
        RandomForestClassifier(random_state=RANDOM_STATE, class_weight="balanced"),
        param_distributions={
            "n_estimators": [100, 200, 300],
            "max_depth": [None, 4, 6, 8, 12],
            "min_samples_split": [2, 4, 8, 12],
            "min_samples_leaf": [1, 2, 4, 6],
            "max_features": ["sqrt", 0.6, 0.8],
        },
        n_iter=12,
        scoring="balanced_accuracy",
        cv=cv,
        refit=True,
        random_state=RANDOM_STATE,
        n_jobs=1,
    )
    search.fit(X_train, y_train)
    model = search.best_estimator_

    probabilities = model.predict_proba(X_test)[:, list(model.classes_).index(1)]
    predictions = model.predict(X_test)
    baseline = DummyClassifier(strategy="prior").fit(X_train, y_train)
    baseline_predictions = baseline.predict(X_test)
    baseline_probabilities = baseline.predict_proba(X_test)[:, list(baseline.classes_).index(1)]
    sex_values = X_test["sex"].to_numpy()
    sex_subgroups = {}
    for sex_code in sorted(pd.Series(sex_values).unique()):
        subset = sex_values == sex_code
        sex_subgroups[str(int(sex_code))] = {
            "label": {0: "female", 1: "male"}.get(int(sex_code), "unknown"),
            "sample_count": int(subset.sum()),
            "balanced_accuracy": float(balanced_accuracy_score(y_test.to_numpy()[subset], predictions[subset])),
            "classification_report": classification_report(y_test.to_numpy()[subset], predictions[subset], output_dict=True, zero_division=0),
        }
    metrics = {
        "validation_status": "development_holdout_only",
        "dataset_rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "holdout_rows": int(len(X_test)),
        "random_state": RANDOM_STATE,
        "selection_metric": "5-fold stratified balanced accuracy",
        "cv_balanced_accuracy_mean": float(search.best_score_),
        "holdout_accuracy": float(accuracy_score(y_test, predictions)),
        "holdout_balanced_accuracy": float(balanced_accuracy_score(y_test, predictions)),
        "holdout_roc_auc": float(roc_auc_score(y_test, probabilities)),
        "holdout_brier_score": float(brier_score_loss(y_test, probabilities)),
        "baseline_holdout_balanced_accuracy": float(balanced_accuracy_score(y_test, baseline_predictions)),
        "baseline_holdout_brier_score": float(brier_score_loss(y_test, baseline_probabilities)),
        "best_parameters": search.best_params_,
        "classification_report": classification_report(y_test, predictions, output_dict=True, zero_division=0),
        "sex_subgroups": sex_subgroups,
    }
    deployment_model = clone(model).fit(X, y)
    print(f"Selected 5-fold CV balanced accuracy: {search.best_score_:.3f}")
    print(classification_report(y_test, predictions, zero_division=0))
    print("Holdout metrics:", {key: value for key, value in metrics.items() if key.startswith("holdout_")})

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(deployment_model, MODEL_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as metrics_file:
        json.dump(metrics, metrics_file, indent=2)
    print(f"Saved exploratory model to {MODEL_PATH}")
    print(f"Saved development metrics to {METRICS_PATH}")


if __name__ == "__main__":
    train_model()
