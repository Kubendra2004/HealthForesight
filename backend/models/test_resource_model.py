import joblib
import pandas as pd
from prophet import Prophet
import os
from datetime import datetime, timedelta
import json
from scipy.stats import norm

# Paths
DATA_PATH = 'data/resources_ai.csv'
ARTIFACTS_DIR = 'artifacts'
METRICS_PATH = os.path.join(ARTIFACTS_DIR, 'resource_model_metrics.json')

def calculate_increase_probability(current_val, forecast_val, lower_ci, upper_ci):
    """
    Calculate probability that the forecast value is greater than the current value.
    Assumes forecast follows a normal distribution.
    """
    # Estimate standard deviation from 95% CI (width is approx 4 * sigma)
    # 95% CI covers +/- 1.96 sigma. Total width = 3.92 sigma.
    sigma = (upper_ci - lower_ci) / 3.92
    
    if sigma == 0:
        return 1.0 if forecast_val > current_val else 0.0
        
    # Z-score: (current_val - mean) / sigma
    # We want P(X > current_val) = 1 - CDF(current_val)
    z = (current_val - forecast_val) / sigma
    prob_increase = 1 - norm.cdf(z)
    
    return prob_increase

def predict_resources(days=7):
    """
    Predicts resources for the next `days` days from TODAY.
    """
    targets = ['beds', 'icu', 'oxygen', 'er_visits', 'occupancy_rate']
    forecasts = {}
    metrics = {}

    # Load Metrics
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, 'r') as f:
            metrics = json.load(f)

    # Load original data for regressors and current value
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alt = os.path.join(base_dir, 'data', 'resources_ai.csv')
        df = pd.read_csv(alt)
        
    df['date'] = pd.to_datetime(df['date'])
    
    # Get current values (last known data point)
    last_row = df.iloc[-1]
    current_values = {t: last_row[t] for t in targets}
    
    # Calculate average regressors
    last_7_days_data = df.tail(7)
    avg_temp = last_7_days_data['temp'].mean()
    avg_humidity = last_7_days_data['humidity'].mean()
    
    today = datetime.now().date()
    future_dates = [today + timedelta(days=i) for i in range(days)]
    future_df = pd.DataFrame({'ds': future_dates})
    
    future_df['temp'] = avg_temp
    future_df['humidity'] = avg_humidity
    future_df['holiday'] = 0 

    print(f"🔮 Forecasting for 7 days starting: {today}")

    for target in targets:
        model_path = os.path.join(ARTIFACTS_DIR, f'resource_model_{target}.joblib')
        
        if not os.path.exists(model_path):
            continue

        model = joblib.load(model_path)
        forecast = model.predict(future_df)
        
        # Add probability of increase
        current_val = current_values[target]
        forecast['prob_increase'] = forecast.apply(
            lambda row: calculate_increase_probability(current_val, row['yhat'], row['yhat_lower'], row['yhat_upper']), 
            axis=1
        )
        
        forecasts[target] = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper', 'prob_increase']]

    return forecasts, metrics

if __name__ == "__main__":
    all_forecasts, model_metrics = predict_resources(7)
    
    if all_forecasts:
        for target, forecast in all_forecasts.items():
            # Get model score
            score = model_metrics.get(target, {}).get('accuracy_score', 0)
            mape = model_metrics.get(target, {}).get('mape', 0)
            
            print("\n" + "="*80)
            print(f" {target.upper()} FORECAST | Model Accuracy: {score:.2%} (MAPE: {mape:.2%})")
            print("="*80)
            print(f"{'Date':<12} | {'Predicted':<10} | {'Lower CI':<10} | {'Upper CI':<10} | {'Prob. Increase':<15}")
            print("-" * 80)
            for _, row in forecast.iterrows():
                date_str = row['ds'].strftime('%Y-%m-%d')
                prob = row['prob_increase']
                prob_str = f"{prob:.1%}"
                
                # Highlight high probability
                if prob > 0.7:
                    prob_str += " 🔺"
                elif prob < 0.3:
                    prob_str += " 🔻"
                
                print(f"{date_str:<12} | {row['yhat']:<10.2f} | {row['yhat_lower']:<10.2f} | {row['yhat_upper']:<10.2f} | {prob_str:<15}")
            print("="*80)
