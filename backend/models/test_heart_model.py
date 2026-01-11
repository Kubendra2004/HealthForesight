import joblib
import pandas as pd
import os

# Paths
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'heart_model.joblib')

# Features used in training
FEATURES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

def predict_heart_disease(patient_data):
    """
    Predicts heart disease risk.
    patient_data: dict containing feature values
    """
    if not os.path.exists(MODEL_PATH):
        print("Error: Model not found. Please train the model first.")
        return None, None

    model = joblib.load(MODEL_PATH)

    # Validate input
    for col in FEATURES:
        if col not in patient_data:
            print(f"Missing input field: {col}")
            return None, None

    # Create DataFrame
    df = pd.DataFrame([patient_data])
    
    # Ensure column order
    df = df[FEATURES]

    # Predict
    try:
        probs = model.predict_proba(df)[0]
        prediction = model.predict(df)[0]
    except Exception as e:
        print(f"Prediction error: {e}")
        return None, None

    # Confidence
    confidence = probs[prediction]
    
    # Map prediction to label (assuming 0=No Disease, 1=Disease based on target)
    # The dataset target is 0=No, 1=Yes usually.
    label = "Positive (Heart Disease)" if prediction == 1 else "Negative (No Heart Disease)"

    return label, confidence

if __name__ == "__main__":
    # Sample Data (from dataset row 2: 63,1,0,145,233,1,2,150,0,2.3,2,0,2 -> 0)
    sample_patient = {
        'age': 63,
        'sex': 1,
        'cp': 0,
        'trestbps': 145,
        'chol': 233,
        'fbs': 1,
        'restecg': 2,
        'thalach': 150,
        'exang': 0,
        'oldpeak': 2.3,
        'slope': 2,
        'ca': 0,
        'thal': 2
    }

    print("Testing with sample data:")
    print(sample_patient)

    label, conf = predict_heart_disease(sample_patient)

    if label:
        print("\n" + "="*30)
        print(" HEART DISEASE RISK ASSESSMENT")
        print("="*30)
        print(f"Prediction: {label}")
        print(f"Confidence: {conf:.2%}")
        print("="*30)
