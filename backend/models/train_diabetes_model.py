"""Train the exploratory diabetes model on all represented genders."""
import json
import os

import joblib
import lightgbm as lgb
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    brier_score_loss,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, train_test_split
from sklearn.preprocessing import LabelEncoder

DATA_PATH = "data/diabetes_data_upload.csv"
ARTIFACTS_DIR = "artifacts"
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "diabetes_model.joblib")
ENCODER_PATH = os.path.join(ARTIFACTS_DIR, "diabetes_encoders.joblib")
TARGET_ENCODER_PATH = os.path.join(ARTIFACTS_DIR, "diabetes_target_encoder.joblib")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "diabetes_model_metrics.json")
RANDOM_STATE = 42

FEATURES = [
    "Age", "Gender", "Polyuria", "Polydipsia", "sudden weight loss",
    "weakness", "Polyphagia", "Genital thrush", "visual blurring",
    "Itching", "Irritability", "delayed healing", "partial paresis",
    "muscle stiffness", "Alopecia", "Obesity",
]
TARGET = "class"


def _load_data():
    paths = [DATA_PATH, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "diabetes_data_upload.csv")]
    for path in paths:
        if os.path.exists(path):
            return pd.read_csv(path)
    raise FileNotFoundError("Diabetes dataset not found: diabetes_data_upload.csv")


def train_model():
    df = _load_data()
    missing = [column for column in FEATURES + [TARGET] if column not in df]
    if missing:
        raise ValueError(f"Diabetes dataset is missing columns: {missing}")
    df = df[FEATURES + [TARGET]].dropna().copy()
    if df["Gender"].nunique() < 2:
        raise ValueError("Training data must contain multiple gender categories")
    print("Dataset rows:", len(df))
    print("Gender counts:", df["Gender"].value_counts().to_dict())

    # Fixed encodings are used by the API. Fit on the source categories; no
    # target statistics are learned by these encoders.
    encoders = {}
    X = df[FEATURES].copy()
    for column in FEATURES:
        if X[column].dtype == object:
            encoder = LabelEncoder()
            X[column] = encoder.fit_transform(X[column].astype(str))
            encoders[column] = encoder

    target_encoder = LabelEncoder()
    y = target_encoder.fit_transform(df[TARGET].astype(str))
    if len(target_encoder.classes_) != 2:
        raise ValueError("Diabetes model training expects exactly two outcome classes")

    X_train, X_test, y_train, y_test, gender_train, gender_test = train_test_split(
        X, y, df["Gender"], test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    search = RandomizedSearchCV(
        lgb.LGBMClassifier(random_state=RANDOM_STATE, verbosity=-1, class_weight="balanced", n_jobs=1),
        param_distributions={
            "n_estimators": [80, 150, 250, 400],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "num_leaves": [7, 15, 23, 31],
            "max_depth": [-1, 3, 5, 7],
            "min_child_samples": [8, 12, 20, 30],
            "reg_lambda": [0.0, 0.1, 1.0, 5.0],
        },
        n_iter=32,
        scoring="balanced_accuracy",
        cv=cv,
        refit=True,
        random_state=RANDOM_STATE,
        n_jobs=1,
    )
    search.fit(X_train, y_train)
    model = search.best_estimator_
    positive_index = list(model.classes_).index(int(target_encoder.transform(["Positive"])[0])) if "Positive" in target_encoder.classes_ else 1
    probabilities = model.predict_proba(X_test)[:, positive_index]
    predictions = model.predict(X_test)
    positive_label = int(target_encoder.transform(["Positive"])[0]) if "Positive" in target_encoder.classes_ else int(target_encoder.transform([target_encoder.classes_[-1]])[0])
    y_test_positive = (y_test == positive_label).astype(int)
    baseline = DummyClassifier(strategy="prior").fit(X_train, y_train)
    baseline_probabilities = baseline.predict_proba(X_test)[:, list(baseline.classes_).index(positive_label)]
    baseline_predictions = baseline.predict(X_test)

    subgroup_metrics = {}
    for gender in sorted(gender_test.astype(str).unique()):
        subset = gender_test.astype(str).to_numpy() == gender
        subgroup_metrics[gender] = {
            "sample_count": int(subset.sum()),
            "balanced_accuracy": float(balanced_accuracy_score(y_test[subset], predictions[subset])),
            "classification_report": classification_report(y_test[subset], predictions[subset], output_dict=True, zero_division=0),
        }

    metrics = {
        "validation_status": "development_holdout_only",
        "dataset_rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "holdout_rows": int(len(X_test)),
        "gender_counts": {str(key): int(value) for key, value in df["Gender"].value_counts().items()},
        "holdout_gender_counts": {str(key): int(value) for key, value in gender_test.value_counts().items()},
        "random_state": RANDOM_STATE,
        "selection_metric": "5-fold stratified balanced accuracy",
        "cv_balanced_accuracy_mean": float(search.best_score_),
        "holdout_accuracy": float(accuracy_score(y_test, predictions)),
        "holdout_balanced_accuracy": float(balanced_accuracy_score(y_test, predictions)),
        "holdout_roc_auc": float(roc_auc_score(y_test_positive, probabilities)),
        "holdout_brier_score": float(brier_score_loss(y_test_positive, probabilities)),
        "baseline_holdout_balanced_accuracy": float(balanced_accuracy_score(y_test, baseline_predictions)),
        "baseline_holdout_brier_score": float(brier_score_loss(y_test_positive, baseline_probabilities)),
        "best_parameters": search.best_params_,
        "classification_report": classification_report(y_test, predictions, output_dict=True, zero_division=0),
        "gender_subgroups": subgroup_metrics,
    }
    deployment_model = clone(model).fit(X, y)
    print(f"Selected 5-fold CV balanced accuracy: {search.best_score_:.3f}")
    print(classification_report(y_test, predictions, zero_division=0))
    print("Gender subgroup metrics:", {key: value["balanced_accuracy"] for key, value in subgroup_metrics.items()})

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(deployment_model, MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)
    joblib.dump(target_encoder, TARGET_ENCODER_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as metrics_file:
        json.dump(metrics, metrics_file, indent=2)
    print(f"Saved exploratory model and encoders to {ARTIFACTS_DIR}")


if __name__ == "__main__":
    train_model()
