"""Train resource forecasts and compare them with a last-observation baseline."""
import json
import os

import joblib
import numpy as np
import pandas as pd
from prophet import Prophet
from prophet.diagnostics import cross_validation
from sklearn.metrics import mean_absolute_error, mean_squared_error

DATA_PATH = "data/resources_ai.csv"
ARTIFACTS_DIR = "artifacts"
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "resource_model_metrics.json")
TARGETS = ["beds", "icu", "oxygen", "er_visits", "occupancy_rate"]


def _load_data():
    paths = [DATA_PATH, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "resources_ai.csv")]
    for path in paths:
        if os.path.exists(path):
            return pd.read_csv(path)
    raise FileNotFoundError("Resource dataset not found: resources_ai.csv")


def _error_metrics(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    nonzero = np.abs(actual) > 1e-8
    mape = float(np.mean(np.abs((actual[nonzero] - predicted[nonzero]) / actual[nonzero]))) if nonzero.any() else None
    denominator = np.abs(actual) + np.abs(predicted)
    valid = denominator > 1e-8
    smape = float(np.mean(2 * np.abs(actual[valid] - predicted[valid]) / denominator[valid])) if valid.any() else None
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(np.sqrt(mean_squared_error(actual, predicted))),
        "mape_nonzero_actual": mape,
        "smape": smape,
    }


def train_model():
    df = _load_data()
    required = {"date", "temp", "humidity", "holiday", *TARGETS}
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"Resource dataset is missing columns: {missing}")
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", *TARGETS, "temp", "humidity", "holiday"]).sort_values("date")
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    metrics = {}

    for target in TARGETS:
        prophet_data = df[["date", target, "temp", "humidity", "holiday"]].rename(columns={"date": "ds", target: "y"})
        model = Prophet(daily_seasonality=True, interval_width=0.95)
        for regressor in ("temp", "humidity", "holiday"):
            model.add_regressor(regressor)
        model.fit(prophet_data)

        try:
            cv = cross_validation(model, initial="450 days", period="30 days", horizon="7 days", parallel=None)
            if cv.empty:
                raise ValueError("time-series cross-validation returned no predictions")
            baseline_by_cutoff = {}
            for cutoff in pd.to_datetime(cv["cutoff"].unique()):
                observed = prophet_data.loc[prophet_data["ds"] <= cutoff, "y"]
                if observed.empty:
                    continue
                baseline_by_cutoff[cutoff] = float(observed.iloc[-1])
            cv["naive_yhat"] = pd.to_datetime(cv["cutoff"]).map(baseline_by_cutoff)
            cv = cv.dropna(subset=["naive_yhat"])
            if cv.empty:
                raise ValueError("no valid last-observation baseline could be calculated")

            prophet_errors = _error_metrics(cv["y"], cv["yhat"])
            baseline_errors = _error_metrics(cv["y"], cv["naive_yhat"])
            model_mae, baseline_mae = prophet_errors["mae"], baseline_errors["mae"]
            metrics[target] = {
                "validation_status": "rolling_origin_development_cv",
                "observations": int(len(prophet_data)),
                "cv_predictions": int(len(cv)),
                "initial_window": "450 days",
                "horizon": "7 days",
                "prophet": prophet_errors,
                "last_observation_baseline": baseline_errors,
                "mae_improvement_over_baseline": float(1 - model_mae / baseline_mae) if baseline_mae > 0 else None,
            }
            print(f"{target}: Prophet MAE {model_mae:.3f}; last-observation baseline MAE {baseline_mae:.3f}")
        except Exception as exc:
            metrics[target] = {
                "validation_status": "unavailable",
                "observations": int(len(prophet_data)),
                "reason": str(exc),
            }
            print(f"{target}: time-series validation unavailable: {exc}")

        joblib.dump(model, os.path.join(ARTIFACTS_DIR, f"resource_model_{target}.joblib"))

    with open(METRICS_PATH, "w", encoding="utf-8") as metrics_file:
        json.dump(metrics, metrics_file, indent=2)
    print(f"Saved development metrics to {METRICS_PATH}")


if __name__ == "__main__":
    train_model()
