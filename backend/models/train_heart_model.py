import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Paths
DATA_PATH = 'data/Heart_disease_cleveland_new.csv'
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'heart_model.joblib')

def train_model():
    # 1. Load Data
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alt = os.path.join(base_dir, 'data', 'Heart_disease_cleveland_new.csv')
        if os.path.exists(alt):
            df = pd.read_csv(alt)
        else:
            print("❌ Dataset not found.")
            return

    print("✅ Dataset Loaded Successfully")
    print(f"Records: {len(df)}")

    # 2. Features and Target
    target = 'target'
    features = [col for col in df.columns if col != target]
    
    # Identify categorical columns
    categorical_feats = ['sex', 'cp', 'fbs', 'restecg', 'exang', 'slope', 'ca', 'thal']
    
    # Convert to category dtype for LightGBM
    for col in categorical_feats:
        if col in df.columns:
            df[col] = df[col].astype('category')

    X = df[features]
    y = df[target]

    # 3. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 4. Train Model with RandomForest
    print("🚀 Tuning RandomForest with GridSearchCV...")
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import GridSearchCV
    
    estimator = RandomForestClassifier(random_state=42)
    
    param_grid = {
        'n_estimators': [100, 200, 500],
        'max_depth': [None, 5, 10, 20],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4]
    }
    
    grid = GridSearchCV(estimator, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
    grid.fit(X_train, y_train)
    
    print(f"Best Params: {grid.best_params_}")
    print(f"Best CV Score: {grid.best_score_:.4f}")
    
    model = grid.best_estimator_

    # 5. Evaluate
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"\n📊 Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, preds))

    # 6. Save Model
    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)
    
    joblib.dump(model, MODEL_PATH)
    print(f"💾 Model saved to: {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
