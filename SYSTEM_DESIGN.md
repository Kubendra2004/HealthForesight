# CHAPTER 5: SYSTEM DESIGN

This chapter outlines the experimental approach, design methodology, and data collection strategies employed in developing and validating the Intelligent Healthcare Management System. The experimental plan encompasses machine learning model development, time-series forecasting validation, system performance testing, and user acceptance evaluation.

## 5.1 EXPERIMENTAL PLAN

The experimental plan was structured to systematically validate each component of the healthcare management system, ensuring technical soundness, clinical relevance, and operational effectiveness.

### 5.1.1 Machine Learning Model Experimentation

**Objective**: Develop and validate supervised learning models for clinical decision support with accuracy >75% and transparent explainability.

**Experimental Approach**

*Phase 1: Baseline Model Development*
- Train initial models using default hyperparameters on synthetic patient dataset
- Establish baseline performance metrics (accuracy, precision, recall, F1-score)
- Identify overfitting/underfitting through learning curves
- Document training time and inference latency

*Phase 2: Hyperparameter Optimization*
- Conduct grid search for critical hyperparameters:
  - Random Forest: n_estimators [50, 100, 150], max_depth [5, 10, 15], min_samples_split [2, 5, 10]
  - Logistic Regression: C [0.1, 1.0, 10.0], solver ['lbfgs', 'saga']
  - Gradient Boosting: n_estimators [100, 150, 200], learning_rate [0.05, 0.1, 0.15]
- Use 5-fold cross-validation to prevent overfitting
- Select optimal hyperparameters based on validation F1-score

*Phase 3: Model Evaluation and Comparison*
- Test final models on held-out test set (20% of data)
- Compare performance across algorithms for each prediction task
- Generate confusion matrices, ROC curves, and precision-recall curves
- Validate SHAP explanations against clinical domain knowledge

**Success Criteria**
- Readmission model: Accuracy >75%, AUC-ROC >0.80
- ICU transfer model: Recall >0.70 (prioritize sensitivity for safety)
- LOS model: R² >0.65, MAE <2 days
- SHAP values interpretable by healthcare professionals

### 5.1.2 Time-Series Forecasting Experimentation

**Objective**: Validate Prophet models for 7-day resource forecasting with >60% accuracy improvement over baseline methods.

**Experimental Approach**

*Phase 1: Historical Data Analysis*
- Analyze 12 months of synthetic hospital resource utilization data
- Identify seasonality patterns (weekly, monthly) using decomposition
- Detect outliers and anomalies requiring special handling
- Establish statistical properties (mean, variance, trend)

*Phase 2: Baseline Model Comparison*
- Implement simple baseline: 7-day moving average forecast
- Implement seasonal naive: Last week's values as predictions
- Calculate baseline MAPE and MAE on test period

*Phase 3: Prophet Model Configuration*
- Configure seasonality: weekly (enabled), yearly (disabled for short dataset)
- Define changepoint prior scale [0.01, 0.05, 0.1] to control trend flexibility
- Add custom holidays (flu season peaks, holiday periods)
- Train separate models for each resource (beds, ICU, oxygen, ER visits, occupancy)

*Phase 4: Model Validation*
- Time-series cross-validation: Rolling window approach with 7-day forecast horizon
- Compare Prophet forecasts vs. baseline methods
- Evaluate uncertainty interval calibration (95% actual values within predicted intervals)
- Calculate probability of increase/decrease accuracy

**Success Criteria**
- MAPE <15% for all resource forecasts
- >60% accuracy improvement over moving average baseline
- Uncertainty intervals well-calibrated (93-97% coverage)
- Trend detection aligns with known seasonal patterns

### 5.1.3 System Performance Testing

**Objective**: Ensure system meets performance requirements (<200ms API response, <3s frontend load).

**Experimental Approach**

*API Performance Testing*
- Measure response times for all endpoints under varying loads:
  - Light load: 10 concurrent users
  - Medium load: 50 concurrent users
  - Heavy load: 100 concurrent users
- Test database query optimization through indexing strategies
- Measure ML model inference latency with/without lazy loading
- Profile bottlenecks using FastAPI's built-in profiling

*Frontend Performance Testing*
- Measure initial page load time (First Contentful Paint, Time to Interactive)
- Test component rendering performance with large datasets (100+ patients)
- Evaluate bundle size optimization through code splitting
- Test responsiveness across devices (desktop, tablet, mobile)

*Database Performance Testing*
- Benchmark MongoDB query times for medical record retrieval
- Benchmark MySQL authentication query times
- Test connection pool efficiency under concurrent access
- Measure write performance for high-frequency operations (appointment creation)

**Success Criteria**
- 95th percentile API response time <200ms
- Frontend initial load <3 seconds on 4G connection
- Database queries <100ms for indexed operations
- System handles 100 concurrent users without degradation

### 5.1.4 User Acceptance Testing Plan

**Objective**: Validate system usability and workflow integration with target user groups.

**Experimental Approach**

*Participant Recruitment*
- Patient role: 5 volunteers familiar with healthcare portals
- Doctor role: 3 healthcare professionals or medical students
- Frontdesk role: 2 administrative staff or volunteers

*Testing Scenarios*
- Patient: Register account, book appointment, view medical records, check risk predictions
- Doctor: Login, view assigned patients, create consultation notes, interpret ML predictions
- Frontdesk: Register patient, schedule appointments, allocate beds, manage waitlist, process billing

*Metrics Collection*
- Task completion rate: Percentage of scenarios completed successfully
- Task completion time: Time to complete each scenario
- Error rate: Number of user errors or system failures
- Satisfaction score: 1-5 Likert scale post-task survey
- Qualitative feedback: Open-ended comments on usability

**Success Criteria**
- Task completion rate >90%
- User satisfaction score >4.0/5.0
- Critical errors: 0
- Average task time reduction >30% vs. manual processes

## 5.2 DESIGN OF EXPERIMENTS

### 5.2.1 ML Model Training Experiment Design

**Experiment 1: Feature Selection Impact**

*Hypothesis*: Including derived features (BMI, comorbidity count, medication interactions) improves model accuracy compared to using only raw patient attributes.

*Independent Variable*: Feature set (raw features only vs. raw + derived features)
*Dependent Variables*: Model accuracy, F1-score, AUC-ROC
*Control*: Same algorithm, same hyperparameters, same train-test split
*Sample Size*: Full synthetic dataset (N=1000 patients)

*Procedure*:
1. Train Random Forest model using only raw features (age, gender, vitals, diagnoses)
2. Train identical Random Forest model with raw + derived features
3. Compare test set performance
4. Conduct paired t-test on cross-validation scores

*Expected Outcome*: Derived features increase F1-score by 5-10 percentage points.

**Experiment 2: Class Imbalance Handling**

*Hypothesis*: Oversampling minority class (readmitted patients) using SMOTE improves recall without significantly reducing precision.

*Independent Variable*: Sampling strategy (no balancing vs. SMOTE oversampling)
*Dependent Variables*: Recall, Precision, F1-score
*Control*: Same features, same algorithm, same hyperparameters
*Sample Size*: Full synthetic dataset with natural imbalance (~30% readmission rate)

*Procedure*:
1. Train model on imbalanced dataset
2. Apply SMOTE to balance training set to 50/50 ratio
3. Train model on balanced dataset
4. Compare test set performance (test set remains imbalanced to reflect reality)

*Expected Outcome*: SMOTE increases recall by 8-12% with <3% precision decrease.

**Experiment 3: SHAP Explanation Validation**

*Hypothesis*: SHAP feature importance rankings align with clinical domain knowledge (e.g., previous admission count ranks highly for readmission risk).

*Independent Variable*: N/A (observational analysis)
*Dependent Variables*: SHAP feature importance rankings
*Validation Method*: Expert review by healthcare professional

*Procedure*:
1. Generate SHAP values for 50 random test patients
2. Rank features by mean absolute SHAP value
3. Compare rankings to clinical literature on readmission risk factors
4. Present to healthcare professional for validation

*Expected Outcome*: Top 5 SHAP features match established clinical risk factors.

### 5.2.2 Forecasting Model Experiment Design

**Experiment 4: Seasonality Component Impact**

*Hypothesis*: Enabling weekly seasonality in Prophet improves forecast accuracy for resources with weekly patterns (higher weekend ER visits).

*Independent Variable*: Seasonality configuration (weekly disabled vs. weekly enabled)
*Dependent Variables*: MAPE, MAE, forecast vs. actual correlation
*Control*: Same historical data, same forecast horizon
*Sample Size*: 12 months historical data, 4 weeks test period

*Procedure*:
1. Train Prophet model with weekly_seasonality=False
2. Train Prophet model with weekly_seasonality=True
3. Generate 7-day forecasts for each week in test period
4. Compare accuracy metrics

*Expected Outcome*: Weekly seasonality reduces MAPE by 10-15% for ER visits and bed occupancy.

**Experiment 5: Forecast Horizon Sensitivity**

*Hypothesis*: Forecast accuracy degrades linearly as horizon increases from 1-day to 7-day ahead.

*Independent Variable*: Forecast horizon (1, 3, 5, 7 days)
*Dependent Variables*: MAPE for each horizon
*Control*: Same model configuration, same test period
*Sample Size*: 4 weeks test period

*Procedure*:
1. For each day in test period, generate forecasts for 1, 3, 5, 7 days ahead
2. Calculate MAPE for each horizon
3. Plot accuracy degradation curve

*Expected Outcome*: MAPE increases approximately 2-3% per additional forecast day.

### 5.2.3 System Performance Experiment Design

**Experiment 6: Database Indexing Impact**

*Hypothesis*: Adding compound index on (doctor_id, appointment_date) reduces appointment retrieval query time by >50%.

*Independent Variable*: Index presence (no index vs. compound index)
*Dependent Variables*: Average query execution time
*Control*: Same query, same dataset size (500 appointments)
*Sample Size*: 100 query executions

*Procedure*:
1. Populate database with 500 appointments across 10 doctors
2. Measure average query time for "get appointments by doctor for date range" (100 runs)
3. Add compound index on (doctor_id, appointment_date)
4. Repeat query measurement (100 runs)
5. Calculate percentage improvement

*Expected Outcome*: Query time reduces from ~80ms to <30ms (>60% improvement).

**Experiment 7: ML Model Loading Strategy**

*Hypothesis*: Lazy loading ML models (on first prediction request) reduces backend startup time by >70% compared to eager loading.

*Independent Variable*: Loading strategy (eager load all models on startup vs. lazy load on demand)
*Dependent Variables*: Backend startup time, first prediction latency
*Control*: Same server environment, same models
*Sample Size*: 10 startup measurements for each strategy

*Procedure*:
1. Measure backend startup time with eager loading (all 4 models loaded immediately)
2. Measure backend startup time with lazy loading (models loaded on first use)
3. Measure first prediction request latency for lazy loading (includes model load time)
4. Compare total time to serve first prediction for both strategies

*Expected Outcome*: Startup time reduces from ~15s to <4s; acceptable 1-2s latency on first prediction.

## 5.3 DATA GATHERED

### 5.3.1 Synthetic Patient Dataset

Due to privacy constraints and HIPAA compliance requirements for real patient data, a synthetic dataset was generated to train and validate machine learning models.

**Dataset Generation Methodology**

*Data Synthesis Tool*: Custom Python script using Faker library and medical domain constraints
*Sample Size*: 1,000 patient records
*Time Period*: Simulating 24 months of hospital admissions and outcomes

**Dataset Attributes**

*Demographic Features* (5 attributes)
- Age: Uniform distribution 18-90 years
- Gender: Binary (Male/Female) with 48/52 ratio
- BMI: Normal distribution μ=27, σ=5 (capped 15-50)
- Insurance Type: Categorical (Medicare 40%, Private 35%, Medicaid 15%, Uninsured 10%)
- Zip Code: Randomly selected from urban/suburban/rural distributions

*Clinical Features* (12 attributes)
- Admission Type: Emergency (45%), Elective (35%), Urgent (20%)
- Primary Diagnosis: ICD-10 codes distributed by prevalence (Diabetes, Hypertension, COPD, Heart Failure, Pneumonia, etc.)
- Comorbidity Count: Poisson distribution λ=2.3
- Charlson Comorbidity Index: Derived from comorbidities, range 0-10
- Previous Admissions (12 months): Poisson distribution λ=1.5
- Vital Signs on Admission:
  - Heart Rate: Normal μ=78, σ=12 bpm
  - Systolic BP: Normal μ=130, σ=18 mmHg
  - Respiratory Rate: Normal μ=16, σ=3 breaths/min
  - Temperature: Normal μ=98.6, σ=1.2 °F
  - SpO2: Normal μ=96, σ=2%
- Lab Values: Hemoglobin, Creatinine, Glucose (with clinical correlations)

*Medication Features* (4 attributes)
- Number of Medications: Poisson distribution λ=4.5
- High-Risk Medication Flag: Binary (Anticoagulants, Immunosuppressants, etc.)
- Polypharmacy Flag: Boolean (>5 medications)
- Medication Adherence Score: Uniform 0.4-1.0

*Outcome Variables* (3 targets)
- Readmission within 30 days: Binary (30% positive class)
  - Logistic function based on age, comorbidity index, previous admissions
- ICU Transfer Required: Binary (18% positive class)
  - Based on vital sign abnormalities, diagnosis severity
- Length of Stay: Continuous (1-30 days)
  - Log-normal distribution influenced by admission type, diagnosis, comorbidities

**Data Quality Assurance**
- Missing values: Randomly introduced in 5% of non-critical fields to simulate real data
- Outlier detection: Flagged physiologically implausible values
- Correlation validation: Ensured clinical correlations (e.g., higher comorbidity → longer LOS)
- Expert review: Medical professional validated realism of feature distributions

**Dataset Splits**
- Training Set: 800 records (80%)
- Test Set: 200 records (20%)
- Stratified split ensuring balanced outcome distribution in both sets

### 5.3.2 Historical Resource Utilization Data

Synthetic time-series data representing 12 months of hospital resource utilization for forecasting model training.

**Time-Series Datasets** (Daily granularity)

*Bed Occupancy Data*
- Duration: 365 days
- Range: 60-95% occupancy (75-285 beds occupied in 300-bed hospital)
- Patterns: Weekly seasonality (higher weekday admissions), holiday dips, flu season peaks (December-February)
- Trend: Slight upward trend (+0.5% per quarter) simulating growing demand

*ICU Capacity Data*
- Duration: 365 days
- Range: 50-90% occupancy (20-36 beds occupied in 40-bed ICU)
- Patterns: Weekly seasonality, random critical event spikes (simulated outbreaks)
- Trend: Relatively stable

*Oxygen Supply Consumption*
- Duration: 365 days
- Range: 500-1500 liters/day
- Patterns: Correlated with ICU occupancy and flu season
- Trend: Seasonal cycles

*ER Visits Data*
- Duration: 365 days
- Range: 30-80 visits/day
- Patterns: Strong weekly seasonality (higher weekends), holiday surges
- Trend: Summer dips, winter peaks

*Overall Occupancy Rate*
- Duration: 365 days
- Range: 65-88%
- Patterns: Composite of all resources

**Data Generation Method**
- Base trend: Linear or logistic growth
- Seasonal components: Sine waves with weekly (amplitude ±10%) and monthly (amplitude ±5%) periods
- Noise: Gaussian noise σ=3% to simulate random variation
- Special events: Manually injected spikes for holidays, flu season

### 5.3.3 User Interaction Data

Data collected during user acceptance testing to validate usability and workflow integration.

**Session Logs** (10 participants, 3 scenarios each)
- Timestamp logs for each user action (click, form submission, navigation)
- Task completion status (success/failure)
- Time duration for each task
- Error events (validation failures, incorrect navigation)

**User Feedback Surveys**
- System Usability Scale (SUS) questionnaire: 10 standardized questions, 1-5 Likert scale
- Task-specific satisfaction: 5-point scale for each scenario
- Open-ended feedback: Qualitative comments on pain points, suggestions

**Sample Size**
- Total sessions: 30 (10 users × 3 scenarios)
- Total user actions logged: ~450 interactions
- Survey responses: 10 SUS surveys, 30 task satisfaction ratings

### 5.3.4 System Performance Metrics

**API Performance Logs**
- Endpoint: All 25+ REST API endpoints
- Metrics per request: Response time (ms), status code, payload size
- Load scenarios: 10, 50, 100 concurrent users
- Sample size: 1,000+ requests per load scenario

**Database Query Metrics**
- Query type: SELECT, INSERT, UPDATE operations
- Metrics: Execution time (ms), rows scanned, index used
- Sample size: 500+ queries across different table sizes

**Frontend Performance Metrics**
- Metrics: First Contentful Paint, Time to Interactive, Total Blocking Time
- Devices: Desktop (Chrome), Tablet (iPad), Mobile (iPhone)
- Network: Fast 4G, Slow 4G conditions
- Sample size: 30 page load measurements

**ML Model Inference Metrics**
- Model: All 4 models (Readmission, ICU, LOS, SHAP)
- Metrics: Inference time (ms), memory usage (MB)
- Sample size: 100 predictions per model

### 5.3.5 Data Storage and Management

**Data Repository Structure**
```
/data
  /ml_datasets
    /patient_records.csv          # Synthetic patient data (1000 records)
    /train_test_split
      /train.csv                  # Training set (800 records)
      /test.csv                   # Test set (200 records)
  /forecasting_datasets
    /bed_occupancy.csv            # 365 days time-series
    /icu_capacity.csv
    /oxygen_supply.csv
    /er_visits.csv
    /occupancy_rate.csv
  /performance_logs
    /api_response_times.json
    /database_query_logs.json
    /frontend_metrics.json
  /user_testing
    /session_logs.json
    /survey_responses.csv
```

**Data Version Control**
- All datasets versioned using Git LFS (Large File Storage)
- Data generation scripts documented for reproducibility
- Changelog maintained for dataset modifications

**Data Privacy and Security**
- No real patient data used in development or testing
- Synthetic data generation scripts ensure no inadvertent real information
- All test user accounts use fictional names and credentials
- Production deployment guidelines emphasize HIPAA-compliant data handling
