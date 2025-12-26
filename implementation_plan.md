# Implementation Plan - Heart Disease Prediction Model

## Goal
Train and test a Heart Disease prediction model using the `Heart_disease_cleveland_new.csv` dataset.

## Proposed Changes

### [NEW] [train_heart_model.py](file:///k:/Project Programs/healths/backend/models/train_heart_model.py)
-   Load data from `backend/models/data/Heart_disease_cleveland_new.csv`.
-   Features: `age`, `sex`, `cp`, `trestbps`, `chol`, `fbs`, `restecg`, `thalach`, `exang`, `oldpeak`, `slope`, `ca`, `thal`.
-   Target: `target`.
-   Algorithm: LightGBM (consistent with Diabetes model).
-   Save artifacts: `heart_model.joblib`, `heart_encoders.joblib` (if any categorical encoding needed, though most look numerical/ordinal).

### [NEW] [test_heart_model.py](file:///k:/Project Programs/healths/backend/models/test_heart_model.py)
-   Load `heart_model.joblib`.
-   Accept input dictionary with all features.
-   Predict and return result with confidence score.

## Verification Plan

### Automated Tests
-   Run `train_heart_model.py` to generate artifacts.
-   Run `test_heart_model.py` with sample data to verify prediction.

## Resource Forecast Model (Prophet)

### [NEW] [train_resource_model.py](file:///k:/Project Programs/healths/backend/models/train_resource_model.py)
-   Load `backend/models/data/resources_ai.csv`.
-   Use `prophet` library.
-   Target: `beds` (Primary), can be extended to `icu`, `oxygen`.
-   Features: `date` (ds), `holiday` (regressor), `temp` (regressor), `humidity` (regressor).
-   Save model: `resource_model_beds.joblib` (Prophet models are picklable).

### [NEW] [test_resource_model.py](file:///k:/Project Programs/healths/backend/models/test_resource_model.py)
-   Load saved Prophet model.
-   Generate future dataframe.
-   Predict future resource usage.
-   Output forecast.
