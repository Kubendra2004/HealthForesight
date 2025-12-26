import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
import joblib
import os

# Paths
DATA_PATH = 'data/patient_dataset.csv'
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_model.joblib')
SCALER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_scaler.joblib')
PCA_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_pca.joblib')
MAPPING_PATH = os.path.join(ARTIFACTS_DIR, 'cluster_mapping.joblib')
ENCODERS_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_encoders.joblib')
IMPUTER_PATH = os.path.join(ARTIFACTS_DIR, 'clustering_imputer.joblib')
FEATURE_NAMES_PATH = os.path.join(ARTIFACTS_DIR, 'feature_names.joblib')

def train_clustering_model():
    # 1. Load Data
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alt = os.path.join(base_dir, 'data', 'patient_dataset.csv')
        if os.path.exists(alt):
            df = pd.read_csv(alt)
        else:
            print("❌ Dataset not found.")
            return

    print("✅ Dataset Loaded Successfully")
    print(f"Original Shape: {df.shape}")
    
    # 2. Preprocessing
    # Target for risk profiling (not for clustering)
    target = 'heart_disease'
    
    # Features to use for clustering
    feature_cols = [col for col in df.columns if col != target]
    
    X = df[feature_cols]
    
    # Separate numeric and categorical columns
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
    
    print(f"Numeric Features: {numeric_cols}")
    print(f"Categorical Features: {categorical_cols}")
    
    # Impute missing values
    imputer_num = SimpleImputer(strategy='mean')
    X[numeric_cols] = imputer_num.fit_transform(X[numeric_cols])
    
    imputer_cat = SimpleImputer(strategy='most_frequent')
    X[categorical_cols] = imputer_cat.fit_transform(X[categorical_cols])
    
    # Encode Categorical Variables
    encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le
        
    # Scale features (RobustScaler)
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)
    
    # PCA (n_components=2)
    print("📉 Applying PCA (2 components)...")
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    
    # 3. Train K-Means (k=4)
    print("🚀 Training K-Means Clustering Model (k=4)...")
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_pca)
    
    df['cluster'] = clusters
    
    # 4. Analyze Clusters to Assign Risk Labels
    if df[target].isnull().any():
         df_analysis = df.dropna(subset=[target])
    else:
        df_analysis = df
        
    cluster_risk = df_analysis.groupby('cluster')[target].mean().sort_values()
    
    # Map sorted clusters to risk levels: Very Low, Low, Medium, High
    sorted_clusters = cluster_risk.index.tolist()
    risk_mapping = {
        sorted_clusters[0]: 'Very Low Risk',
        sorted_clusters[1]: 'Low Risk',
        sorted_clusters[2]: 'Medium Risk',
        sorted_clusters[3]: 'High Risk'
    }
    
    print("\n📊 Cluster Analysis:")
    for cluster_id in sorted_clusters:
        risk = risk_mapping[cluster_id]
        prevalence = cluster_risk[cluster_id]
        count = df[df['cluster'] == cluster_id].shape[0]
        print(f"Cluster {cluster_id}: {risk} (Heart Disease Prevalence: {prevalence:.2f}, Count: {count})")
        
    # 5. Save Artifacts
    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)
        
    joblib.dump(kmeans, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(pca, PCA_PATH)
    joblib.dump(risk_mapping, MAPPING_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    joblib.dump({'num': imputer_num, 'cat': imputer_cat}, IMPUTER_PATH)
    
    # Save feature names
    joblib.dump({'numeric': numeric_cols, 'categorical': categorical_cols}, FEATURE_NAMES_PATH)
    
    print(f"\n💾 Model saved to: {MODEL_PATH}")
    print(f"💾 Scaler saved to: {SCALER_PATH}")
    print(f"💾 PCA saved to: {PCA_PATH}")
    print(f"💾 Mapping saved to: {MAPPING_PATH}")
    print(f"💾 Encoders saved to: {ENCODERS_PATH}")
    print(f"💾 Imputers saved to: {IMPUTER_PATH}")

if __name__ == "__main__":
    train_clustering_model()
