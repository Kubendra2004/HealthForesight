import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Paths
DATA_PATH = 'data/diabetes_data_upload.csv'
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'diabetes_model.joblib')
ENCODER_PATH = os.path.join(ARTIFACTS_DIR, 'diabetes_encoders.joblib')
TARGET_ENCODER_PATH = os.path.join(ARTIFACTS_DIR, 'diabetes_target_encoder.joblib')


def train_model():

    # ----------------------------
    # 1. Load Dataset
    # ----------------------------
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alt = os.path.join(base_dir, 'data', 'diabetes_data_upload.csv')
        if os.path.exists(alt):
            df = pd.read_csv(alt)
        else:
            print("❌ Dataset not found.")
            return

    print("✅ Dataset Loaded Successfully")
    
    # Keep all genders represented in the source data. Evaluation below reports
    # subgroup metrics so the aggregate score cannot hide a weak subgroup.
    df = df.copy()
    print("Gender counts:", df['Gender'].value_counts(dropna=False).to_dict())

    # ----------------------------
    # 2. Final Features
    # ----------------------------
    selected_features = [
        'Age', 'Gender', 'Polyuria', 'Polydipsia', 'sudden weight loss',
        'weakness', 'Polyphagia', 'Genital thrush', 'visual blurring',
        'Itching', 'Irritability', 'delayed healing', 'partial paresis',
        'muscle stiffness', 'Alopecia', 'Obesity'
    ]

    target = 'class'

    # check missing
    missing = [c for c in selected_features + [target] if c not in df.columns]
    if missing:
        print("❌ Missing columns:", missing)
        return

    df_selected = df[selected_features + [target]].copy()

    # ----------------------------
    # 3. Label Encoding
    # ----------------------------
    encoders = {}
    categorical_cols = [c for c in selected_features if df_selected[c].dtype == object]

    for col in categorical_cols:
        le = LabelEncoder()
        df_selected[col] = le.fit_transform(df_selected[col])
        encoders[col] = le
        print(f"🔠 Encoded {col}: {dict(zip(le.classes_, le.transform(le.classes_)))}")

    # Encode target
    le_target = LabelEncoder()
    df_selected[target] = le_target.fit_transform(df_selected[target])
    print("🎯 Target mapping:", dict(zip(le_target.classes_, le_target.transform(le_target.classes_))))

    # ----------------------------
    # 4. Train-test split
    # ----------------------------
    X = df_selected[selected_features]
    y = df_selected[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ----------------------------
    # 5. Train LightGBM
    # ----------------------------
    print("🚀 Training LightGBM...")
    model = lgb.LGBMClassifier(
        random_state=42,
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=40
    )

    model.fit(X_train, y_train)

    # ----------------------------
    # 6. Evaluate
    # ----------------------------
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    balanced_acc = balanced_accuracy_score(y_test, preds)
    probabilities = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, probabilities)

    print(f"\nHoldout accuracy: {acc:.3f}; balanced accuracy: {balanced_acc:.3f}; ROC AUC: {auc:.3f}")
    print(classification_report(y_test, preds))
    test_genders = df.loc[X_test.index, 'Gender']
    for gender in sorted(test_genders.dropna().unique()):
        subgroup = test_genders == gender
        print(f"\nHoldout subgroup: {gender} (n={int(subgroup.sum())})")
        print(classification_report(y_test[subgroup], preds[subgroup], zero_division=0))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='balanced_accuracy')
    print(f"5-fold CV balanced accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # ----------------------------
    # 7. Save Model & Encoders
    # ----------------------------
    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)
    joblib.dump(le_target, TARGET_ENCODER_PATH)

    print("💾 Model saved to:", MODEL_PATH)
    print("💾 Encoders saved to:", ENCODER_PATH)
    print("💾 Target encoder saved to:", TARGET_ENCODER_PATH)

    print("\n✅ Training Complete!")


if __name__ == "__main__":
    train_model()
