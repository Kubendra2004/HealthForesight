import pandas as pd
import numpy as np
from sklearn.metrics import silhouette_score
import joblib
import os

# Paths
DATA_PATH = 'data/patient_dataset.csv'
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_model.joblib')
SCALER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_scaler.joblib')
ENCODERS_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_encoders.joblib')
IMPUTER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_imputer.joblib')
FEATURE_NAMES_PATH = os.path.join(ARTIFACTS_DIR, 'feature_names.joblib')

def calculate_score():
    print("📊 Calculating Silhouette Score for Clustering Model...")
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Model not found.")
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    imputers = joblib.load(IMPUTER_PATH)
    feature_names = joblib.load(FEATURE_NAMES_PATH)
    
    # Load Data
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        print("❌ Dataset not found.")
        return
        
    # Preprocessing
    numeric_cols = feature_names['numeric']
    categorical_cols = feature_names['categorical']
    
    # Impute
    df[numeric_cols] = imputers['num'].transform(df[numeric_cols])
    df[categorical_cols] = imputers['cat'].transform(df[categorical_cols])
    
    # Encode
    for col in categorical_cols:
        le = encoders[col]
        df[col] = le.transform(df[col])
        
    # Reorder (using the order from feature_names is not enough, we need the order used in training)
    # In training, we did: X = df[feature_cols] where feature_cols was all cols except target.
    # And we separated them into numeric/categorical for imputation but put them back?
    # No, in training:
    # X[numeric_cols] = ...
    # X[categorical_cols] = ...
    # X_scaled = scaler.fit_transform(X)
    # So X retained the original column order of `df[feature_cols]`.
    # `feature_cols` was `[col for col in df.columns if col != target]`.
    # So we need to reconstruct that order.
    
    target = 'heart_disease'
    feature_cols = [col for col in df.columns if col != target and col in numeric_cols + categorical_cols]
    
    X = df[feature_cols]
    X_scaled = scaler.transform(X)
    
    # Predict clusters
    labels = model.predict(X_scaled)
    
    # Calculate Score
    # Sampling to speed up if dataset is huge, but 6000 is fine.
    score = silhouette_score(X_scaled, labels)
    print(f"\n✅ Silhouette Score: {score:.4f}")

if __name__ == "__main__":
    calculate_score()
