import joblib
import pandas as pd
import os
import numpy as np

# Paths
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_model.joblib')
SCALER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_scaler.joblib')
PCA_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_pca.joblib')
MAPPING_PATH = os.path.join(ARTIFACTS_DIR, 'cluster_mapping.joblib')
ENCODERS_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_encoders.joblib')
IMPUTER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_imputer.joblib')
FEATURE_NAMES_PATH = os.path.join(ARTIFACTS_DIR, 'feature_names.joblib')

def test_model():
    print("🧪 Testing Clustering Model Inference...")
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Model not found.")
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    pca = joblib.load(PCA_PATH)
    risk_mapping = joblib.load(MAPPING_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    imputers = joblib.load(IMPUTER_PATH)
    feature_names = joblib.load(FEATURE_NAMES_PATH)
    
    # Sample Data (from patient_dataset.csv)
    # 24,1,4,250,139,212,0,108,33,109,37.99,0.48,1,1,Urban,Smoker
    sample_data = {
        'age': 24,
        'gender': 1,
        'chest_pain_type': 4,
        'blood_pressure': 250,
        'cholesterol': 139,
        'max_heart_rate': 212,
        'exercise_angina': 0,
        'plasma_glucose': 108,
        'skin_thickness': 33,
        'insulin': 109,
        'bmi': 37.99,
        'diabetes_pedigree': 0.48,
        'hypertension': 1,
        'residence_type': 'Urban',
        'smoking_status': 'Smoker'
    }
    
    df = pd.DataFrame([sample_data])
    
    print(f"Input Data:\n{df}")
    
    # Preprocessing (Same as Router)
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
    expected_cols = [
        'age', 'gender', 'chest_pain_type', 'blood_pressure', 'cholesterol', 
        'max_heart_rate', 'exercise_angina', 'plasma_glucose', 'skin_thickness', 
        'insulin', 'bmi', 'diabetes_pedigree', 'hypertension', 
        'residence_type', 'smoking_status'
    ]
    df = df[expected_cols]
    
    # Scale
    scaled_data = scaler.transform(df)
    
    # PCA
    pca_data = pca.transform(scaled_data)
    
    # Predict
    cluster = model.predict(pca_data)[0]
    risk = risk_mapping.get(cluster, "Unknown")
    
    print(f"\n✅ Prediction Result:")
    print(f"Cluster: {cluster}")
    print(f"Risk Level: {risk}")

if __name__ == "__main__":
    test_model()
