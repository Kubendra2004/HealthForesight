import pandas as pd
from prophet import Prophet
import joblib
import os

# Paths
DATA_PATH = 'data/resources_ai.csv'
ARTIFACTS_DIR = 'artifacts'
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'resource_model_beds.joblib')

def train_model():
    # 1. Load Data
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alt = os.path.join(base_dir, 'data', 'resources_ai.csv')
        if os.path.exists(alt):
            df = pd.read_csv(alt)
        else:
            print("❌ Dataset not found.")
            return

    print("✅ Dataset Loaded Successfully")
    print(f"Records: {len(df)}")

    # Targets to forecast
    targets = ['beds', 'icu', 'oxygen', 'er_visits', 'occupancy_rate']
    metrics_storage = {}

    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)

    from prophet.diagnostics import cross_validation, performance_metrics
    import json

    for target in targets:
        print(f"\n🚀 Training Prophet Model for: {target}...")
        
        # 2. Preprocess for Prophet
        df_prophet = df.rename(columns={'date': 'ds', target: 'y'})
        df_prophet['ds'] = pd.to_datetime(df_prophet['ds'])

        # 3. Initialize Prophet
        # interval_width=0.95 for 95% confidence intervals (better for probability calc)
        model = Prophet(daily_seasonality=True, interval_width=0.95)
        model.add_regressor('temp')
        model.add_regressor('humidity')
        model.add_regressor('holiday')

        # 4. Train Model
        model.fit(df_prophet)

        # 5. Evaluate (Cross Validation)
        # Initial: 365 days, Period: 30 days, Horizon: 7 days
        print(f"   📊 Evaluating {target} model...")
        try:
            df_cv = cross_validation(model, initial='365 days', period='30 days', horizon='7 days', parallel="processes")
            df_p = performance_metrics(df_cv)
            
            # Get average metrics
            mae = df_p['mae'].mean()
            rmse = df_p['rmse'].mean()
            mape = df_p['mape'].mean()
            
            metrics_storage[target] = {
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'accuracy_score': 1.0 - mape  # Simple accuracy approximation
            }
            print(f"   ✅ MAE: {mae:.2f} | MAPE: {mape:.2%}")
            
        except Exception as e:
            print(f"   ⚠️ CV Failed (likely not enough data): {e}")
            metrics_storage[target] = {'mae': 0, 'rmse': 0, 'mape': 0, 'accuracy_score': 0}

        # 6. Save Model
        save_path = os.path.join(ARTIFACTS_DIR, f'resource_model_{target}.joblib')
        joblib.dump(model, save_path)
        print(f"   💾 Model saved to: {save_path}")

    # Save Metrics
    metrics_path = os.path.join(ARTIFACTS_DIR, 'resource_model_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics_storage, f, indent=4)
    print(f"\n📝 Metrics saved to: {metrics_path}")

if __name__ == "__main__":
    train_model()
