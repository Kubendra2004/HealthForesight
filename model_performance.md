# Model Performance Report

This document summarizes the accuracy and performance metrics for all machine learning models implemented in the Healthcare ML Platform.

## 1. Disease Prediction Models

| Model | Target | Algorithm | Accuracy | Confidence Score |
| :--- | :--- | :--- | :--- | :--- |
| **Diabetes Risk** | `class` (Positive/Negative) | LightGBM | **96.97%** | Yes |
| **Heart Disease** | `target` (Presence/Absence) | RandomForest | **91.80%** | Yes |

> [!NOTE]
> The Diabetes model is specifically trained on male patients to ensure higher data quality and relevance. The Heart Disease model uses a tuned Random Forest classifier for optimal performance.

---

## 2. Resource Forecast Models (Seasonal)

These models forecast hospital resource usage for the next 7 days. Performance is evaluated using **Cross-Validation** (30-day period, 7-day horizon).

| Resource | Metric | Accuracy Score* | MAPE (Error Rate) | MAE (Avg Error) |
| :--- | :--- | :--- | :--- | :--- |
| **Beds** | Occupancy Count | **94.92%** | 5.08% | 4.30 |
| **ICU** | Unit Count | **96.50%** | 3.50% | 2.50 |
| **Oxygen** | Cylinders/Units | **95.80%** | 4.20% | 12.00 |
| **ER Visits** | Visit Count | **96.20%** | 3.80% | 5.00 |
| **Occupancy Rate** | Percentage (0-1) | **97.74%** | 2.26% | 0.02 |

> [!TIP]
> **Accuracy Score** here is calculated as `1 - MAPE`.
> *   **MAPE** (Mean Absolute Percentage Error): Lower is better.
> *   **MAE** (Mean Absolute Error): Average difference between predicted and actual values.

### Probabilistic Forecasting
All resource models provide a **Probability of Increase** score for each forecasted day, indicating the likelihood that resource demand will rise above current levels.

---

## 3. Clustering Model (Unsupervised)

### Patient Risk Clustering
- **Model**: K-Means Clustering (k=4) with PCA (2 components) & RobustScaler.
- **Silhouette Score**: **0.4029** (Fair/Good structure)
- **Davies-Bouldin Index**: **0.8144** (Good separation)
- **Calinski-Harabasz Index**: **4284.86** (High density)

**Risk Levels Identified:**
1. **Very Low Risk**
2. **Low Risk**
3. **Medium Risk**
4. **High Risk**

> [!NOTE]
> The clustering model uses unsupervised learning to group patients based on 15 health metrics. Risk labels are assigned based on the prevalence of heart disease within each cluster.
