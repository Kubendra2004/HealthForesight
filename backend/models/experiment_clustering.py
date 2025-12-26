import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import os

# Paths
DATA_PATH = 'data/patient_dataset.csv'

def experiment():
    print("🧪 Starting Clustering Experiments...")
    
    # 1. Load Data
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        print("❌ Dataset not found.")
        return

    # 2. Preprocessing
    target = 'heart_disease'
    feature_cols = [col for col in df.columns if col != target]
    X = df[feature_cols]
    
    # Separate numeric and categorical
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
    
    # Impute
    imputer_num = SimpleImputer(strategy='mean')
    X[numeric_cols] = imputer_num.fit_transform(X[numeric_cols])
    
    imputer_cat = SimpleImputer(strategy='most_frequent')
    X[categorical_cols] = imputer_cat.fit_transform(X[categorical_cols])
    
    # Encode
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        
    # Experiment Configurations
    scalers = {
        'StandardScaler': StandardScaler(),
        'RobustScaler': RobustScaler()
    }
    
    pca_components = [None, 2, 3, 5, 8]
    k_values = [2, 3, 4, 5]
    
    best_score = -1
    best_config = None
    
    print(f"\n{'Scaler':<15} | {'PCA':<5} | {'K':<3} | {'Score':<8}")
    print("-" * 40)
    
    for scaler_name, scaler in scalers.items():
        # Scale
        X_scaled = scaler.fit_transform(X)
        
        for n_pca in pca_components:
            if n_pca:
                pca = PCA(n_components=n_pca)
                X_processed = pca.fit_transform(X_scaled)
                pca_str = str(n_pca)
            else:
                X_processed = X_scaled
                pca_str = "None"
            
            for k in k_values:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                labels = kmeans.fit_predict(X_processed)
                
                score = silhouette_score(X_processed, labels)
                
                print(f"{scaler_name:<15} | {pca_str:<5} | {k:<3} | {score:.4f}")
                
                if score > best_score:
                    best_score = score
                    best_config = {
                        'scaler': scaler_name,
                        'pca': n_pca,
                        'k': k
                    }
                    
    print("\n🏆 Best Configuration:")
    print(best_config)
    print(f"Score: {best_score:.4f}")

if __name__ == "__main__":
    experiment()
