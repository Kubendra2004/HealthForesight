import joblib
import pandas as pd
import os

# Define paths
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'diabetes_model.joblib')
ENCODER_PATH = os.path.join(ARTIFACTS_DIR, 'diabetes_encoders.joblib')
TARGET_ENCODER_PATH = os.path.join(ARTIFACTS_DIR, 'diabetes_target_encoder.joblib')

# Final feature order
FEATURES = [
    'Age', 'Gender', 'Polyuria', 'Polydipsia', 'sudden weight loss',
    'weakness', 'Polyphagia', 'Genital thrush', 'visual blurring',
    'Itching', 'Irritability', 'delayed healing', 'partial paresis',
    'muscle stiffness', 'Alopecia', 'Obesity'
]

def load_artifacts():
    """Load trained model and encoders."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH) or not os.path.exists(TARGET_ENCODER_PATH):
        print("Error: Model or Encoders not found. Please train the model first.")
        return None, None, None

    model = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODER_PATH)
    target_encoder = joblib.load(TARGET_ENCODER_PATH)
    return model, encoders, target_encoder


def preprocess_input(patient_data, encoders):
    """
    Encode categorical values using the same encoders used in training.
    patient_data must be a dict.
    """
    df = pd.DataFrame([patient_data])  # convert to DF for model

    # Encode categorical fields
    for col, encoder in encoders.items():
        if col in df.columns:
            try:
                df[col] = encoder.transform(df[col])
            except ValueError as e:
                print(f"Warning: Value in {col} not seen in training. Error: {e}")
                return None

    return df


def predict_diabetes(patient_data):
    """
    patient_data example:
    {
        "Age": 45,
        "Gender": "Male",
        "Polyuria": "Yes",
        ...
    }
    """
    model, encoders, target_encoder = load_artifacts()
    if model is None:
        return None, None

    # Ensure all required fields exist
    for col in FEATURES:
        if col not in patient_data:
            print(f"Missing input field: {col}")
            return None, None

    df_processed = preprocess_input(patient_data, encoders)
    if df_processed is None:
        return None, None
    
    # Get probability
    try:
        probs = model.predict_proba(df_processed)[0]
        prediction_numeric = model.predict(df_processed)[0]
    except Exception as e:
        print(f"Prediction error: {e}")
        return None, None
    
    # Decode label
    prediction_label = target_encoder.inverse_transform([prediction_numeric])[0]
    
    # Get confidence of the predicted class
    confidence = probs[prediction_numeric]

    return prediction_label, confidence

if __name__ == "__main__":
    # SAMPLE DATA
    sample_patient = {
        'Age': 45,
        'Gender': 'Male',
        'Polyuria': 'Yes',
        'Polydipsia': 'No',
        'sudden weight loss': 'No',
        'weakness': 'No',
        'Polyphagia': 'Yes',
        'Genital thrush': 'No',
        'visual blurring': 'No',
        'Itching': 'No',
        'Irritability': 'No',
        'delayed healing': 'No',
        'partial paresis': 'No',
        'muscle stiffness': 'No',
        'Alopecia': 'No',
        'Obesity': 'No'
    }
    
    print("Testing with sample data:")
    print(sample_patient)
    
    label, conf = predict_diabetes(sample_patient)
    
    if label:
        print("\n" + "="*30)
        print(" DIABETES RISK ASSESSMENT")
        print("="*30)
        print(f"Prediction: {label}")
        print(f"Confidence: {conf:.2%}")
        print("="*30)
