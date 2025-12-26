# Health Prediction Models Implementation

I have successfully implemented the Diabetes and Heart Disease Prediction systems.

## 1. Diabetes Risk Prediction (Male-Specific)

### Components
-   **Training Script**: `backend/models/train_diabetes_model.py`
-   **Dataset**: `backend/models/data/diabetes_data_upload.csv` (Filtered for **Male** only)
-   **Features**: `Age`, `Gender`, `Polyuria`, `Polydipsia`, `sudden weight loss`, `weakness`, `Polyphagia`, `Genital thrush`, `visual blurring`, `Itching`, `Irritability`, `delayed healing`, `partial paresis`, `muscle stiffness`, `Alopecia`, `Obesity`.
-   **Output**: Saves `diabetes_model.joblib`, `diabetes_encoders.joblib`, and `diabetes_target_encoder.joblib` to `backend/models/artifacts/`.

### Usage
```bash
python backend/models/test_diabetes_model.py
```

## 2. Heart Disease Prediction

### Components
-   **Training Script**: `backend/models/train_heart_model.py`
-   **Dataset**: `backend/models/data/Heart_disease_cleveland_new.csv`
-   **Features**: `age`, `sex`, `cp`, `trestbps`, `chol`, `fbs`, `restecg`, `thalach`, `exang`, `oldpeak`, `slope`, `ca`, `thal`.
-   **Output**: Saves `heart_model.joblib` to `backend/models/artifacts/`.

### Usage
```bash
python backend/models/test_heart_model.py
```

## 3. Results
-   **Diabetes Model Accuracy**: ~99%
-   **Heart Disease Model Accuracy**: ~92%
-   **Confidence**: Both models provide a probability score indicating the certainty of the prediction.

## 3. Resource Forecast Model (Prophet)

### Components
-   **Training Script**: `backend/models/train_resource_model.py`
-   **Dataset**: `backend/models/data/resources_ai.csv`
-   **Targets**:
    -   **Core Resources**: `beds`, `icu`, `oxygen`
    -   **Seasonal/Demand Indicators**: `er_visits`, `occupancy_rate`
-   **Regressors**: `holiday`, `temp`, `humidity`
-   **Output**: Saves separate `.joblib` models for each target to `backend/models/artifacts/`.

### Usage
```bash
python backend/models/test_resource_model.py
```

### Results
-   **Forecast**: Predicts daily usage for **all 5 metrics** for the **next 7 days** from the current date.
-   **Model Score**: Displays the **Accuracy** and **MAPE** (Mean Absolute Percentage Error) for each model based on cross-validation.
-   **Probability of Increase**: Calculates the probability that the resource usage will be **higher than the current level** for each forecasted day, helping to identify rising trends.
-   **Features**: Accounts for daily seasonality and external factors like weather and holidays.
