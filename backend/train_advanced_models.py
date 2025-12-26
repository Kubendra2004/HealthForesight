import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, '../models/artifacts')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def train_readmission_model():
    print("🏥 Training Readmission Model...")
    # Dummy Data
    # Features: Age, Length of Stay, # Previous Admissions, Comorbidity Score, Surgery (0/1)
    X = np.random.rand(100, 5)
    X[:, 0] = X[:, 0] * 100 # Age
    X[:, 1] = X[:, 1] * 30  # LOS
    X[:, 2] = X[:, 2] * 5   # Prev Admissions
    X[:, 3] = X[:, 3] * 10  # Comorbidity
    
    y = np.random.randint(0, 2, 100)
    
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X, y)
    
    path = os.path.join(ARTIFACTS_DIR, 'readmission_model.joblib')
    joblib.dump(model, path)
    print(f"✅ Saved to {path}")

def train_icu_transfer_model():
    print("🚑 Training ICU Transfer Model...")
    # Dummy Data
    # Features: Age, O2 Saturation, Heart Rate, BP Systolic, Temperature
    X = np.random.rand(100, 5)
    X[:, 0] = X[:, 0] * 100 # Age
    X[:, 1] = 80 + X[:, 1] * 20 # O2 Sat (80-100)
    X[:, 2] = 50 + X[:, 2] * 100 # HR (50-150)
    X[:, 3] = 90 + X[:, 3] * 100 # BP (90-190)
    X[:, 4] = 36 + X[:, 4] * 4   # Temp (36-40)
    
    y = np.random.randint(0, 2, 100)
    
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X, y)
    
    path = os.path.join(ARTIFACTS_DIR, 'icu_transfer_model.joblib')
    joblib.dump(model, path)
    print(f"✅ Saved to {path}")

if __name__ == "__main__":
    train_readmission_model()
    train_icu_transfer_model()
