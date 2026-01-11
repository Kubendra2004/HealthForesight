import pandas as pd
import numpy as np
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
import joblib
import os

# Paths
DATA_PATH = 'data/patient_dataset.csv'
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_model.joblib')
SCALER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_scaler.joblib')
PCA_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_pca.joblib')
ENCODERS_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_encoders.joblib')
IMPUTER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_imputer.joblib')
FEATURE_NAMES_PATH = os.path.join(ARTIFACTS_DIR, 'feature_names.joblib')

def validate_model():
    print("📊 Validating Clustering Model...")
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Model not found.")
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    pca = joblib.load(PCA_PATH)
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
        
    # Reorder
    # We need to reconstruct the feature order used in training
    # In training: `feature_cols = [col for col in df.columns if col != target]`
    # We can infer this by checking which columns are in numeric + categorical
    target = 'heart_disease'
    feature_cols = [col for col in df.columns if col != target and col in numeric_cols + categorical_cols]
    
    X = df[feature_cols]
    
    # Scale
    X_scaled = scaler.transform(X)
    
    # PCA
    X_pca = pca.transform(X_scaled)
    
    # Predict
    labels = model.predict(X_pca)
    
    # Calculate Metrics
    sil = silhouette_score(X_pca, labels)
    db = davies_bouldin_score(X_pca, labels)
    ch = calinski_harabasz_score(X_pca, labels)
    
    print(f"\n✅ Validation Metrics:")
    print(f"Silhouette Score: {sil:.4f} (Range: -1 to 1, Higher is better)")
    print(f"Davies-Bouldin Index: {db:.4f} (Lower is better, 0 is perfect)")
    print(f"Calinski-Harabasz Index: {ch:.4f} (Higher is better)")
    
    print("\nInterpretation:")
    if sil > 0.5:
        print(" - Silhouette: Good structure.")
    elif sil > 0.25:
        print(" - Silhouette: Fair structure (Typical for complex data).")
    else:
        print(" - Silhouette: Weak structure.")
        
    if db < 1.5:
        print(" - Davies-Bouldin: Good separation.")
    else:
        print(" - Davies-Bouldin: Moderate/Low separation.")

if __name__ == "__main__":
    validate_model()
