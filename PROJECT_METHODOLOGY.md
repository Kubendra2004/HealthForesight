# CHAPTER 3: PROJECT METHODOLOGY

This chapter presents the systematic approach employed in developing the Intelligent Healthcare Management System. The methodology encompasses requirement analysis, system design, implementation using modern web technologies and machine learning frameworks, and validation through testing protocols. The development followed an iterative approach, combining Agile principles with structured software engineering practices to ensure flexibility in addressing evolving requirements while maintaining technical rigor and quality standards.

## 3.1 OBJECTIVES

- Design and implement a hybrid database architecture combining MongoDB for medical records and MySQL for user authentication to optimize data flexibility and security
- Develop three role-based responsive web interfaces (Patient, Doctor, Frontdesk) using React and Material UI for optimal user experience across devices
- Build a RESTful API backend using FastAPI exposing comprehensive endpoints for CRUD operations, ML predictions, and resource management
- Train and deploy four supervised machine learning models (readmission risk, ICU transfer risk, length of stay, SHAP explainability) achieving >75% accuracy
- Implement five Prophet time-series forecasting models for resource prediction (beds, ICU, oxygen, ER visits, occupancy) with 7-day forecast horizons
- Create automated bed allocation and priority-based waitlist management algorithms for efficient resource utilization
- Integrate JWT-based authentication with role-based access control (RBAC) ensuring HIPAA-aligned security architecture
- Develop comprehensive hospital operations workflows including registration, appointments, consultations, billing, and inventory tracking
- Optimize system performance achieving <200ms API response times and <3 second frontend load times
- Validate system functionality through unit testing, integration testing, and user acceptance testing with healthcare professionals
- Demonstrate measurable improvements in operational efficiency (≥40% reduction in administrative time) and forecast accuracy (+60-75% over manual methods)

## 3.2 METHODOLOGY

### 3.2.1 Development Framework and Architecture

**System Architecture**  
The system follows a three-tier architecture consisting of:
- **Presentation Layer**: React-based single-page application (SPA) with Vite build tool
- **Application Layer**: FastAPI RESTful backend exposing API endpoints
- **Data Layer**: Hybrid database with MongoDB and MySQL

**Technology Stack**
- **Frontend**: React 18.x, Vite 5.x, Material UI 5.x, Axios for HTTP requests, React Router for navigation
- **Backend**: Python 3.10+, FastAPI 0.104+, Uvicorn ASGI server
- **Databases**: MongoDB 6.x (document store), MySQL 8.x (relational database)
- **Authentication**: PyJWT for token generation, bcrypt for password hashing
- **Machine Learning**: Scikit-learn 1.3+, SHAP 0.42+, Pandas, NumPy
- **Time-Series Forecasting**: Prophet 1.1+, Matplotlib for visualizations
- **Development Tools**: Git for version control, VS Code as IDE, Postman for API testing

**Design Patterns**
- **Repository Pattern**: Database access abstraction for MongoDB and MySQL operations
- **Service Layer Pattern**: Business logic separation from API routes
- **Factory Pattern**: ML model loading and inference management
- **Observer Pattern**: Real-time notification system implementation

### 3.2.2 Database Design and Implementation

**MongoDB Schema Design**  
Document-oriented collections for:
- **Patients**: Personal information, medical history, contact details
- **Appointments**: Scheduling data with doctor assignments and timestamps
- **Consultations**: Clinical notes, diagnoses, treatment plans
- **Beds**: Resource status, location, patient assignments
- **Inventory**: Medical supplies tracking with quantity and thresholds
- **Forecasts**: Historical predictions and model performance metrics

**MySQL Schema Design**  
Normalized relational tables for:
- **Users**: Authentication credentials (username, email, hashed_password, role)
- **Roles**: Role definitions (patient, doctor, frontdesk, admin) with permissions
- **Sessions**: Active JWT tokens for session management

**Database Connection Management**
- MongoDB: Motor async driver with connection pooling
- MySQL: SQLAlchemy ORM with asyncio support
- Environment-based configuration using `.env` files for credentials

### 3.2.3 Frontend Development Methodology

**Component Architecture**  
Modular React components organized by feature:
- **Common Components**: Navbar, Sidebar, Footer, Notifications
- **Patient Module**: Dashboard, Appointments, Medical Records, Predictions
- **Doctor Module**: Patient List, Consultation Interface, Decision Support
- **Frontdesk Module**: Registration, Scheduling, Billing, Bed Management, Waitlist

**State Management**
- React Hooks (useState, useEffect, useContext) for local state
- Context API for global authentication state
- Custom hooks for API data fetching and caching

**UI/UX Design Principles**
- Material Design 3.0 specifications
- Mobile-first responsive design with breakpoints
- Accessibility standards (ARIA labels, keyboard navigation)
- Consistent color palette and typography (Google Fonts: Inter)

**Performance Optimization**
- Code splitting with React.lazy and Suspense
- Image optimization and lazy loading
- Debouncing for search inputs
- Memoization (React.memo, useMemo) for expensive computations

### 3.2.4 Backend API Development

**RESTful API Design**  
Endpoints organized by resource domains:
- `/auth/*`: Login, signup, token refresh, logout
- `/patients/*`: CRUD operations, medical records, predictions
- `/doctors/*`: Profile management, assigned patients, consultations
- `/appointments/*`: Scheduling, updates, cancellations
- `/beds/*`: Status tracking, allocation, deallocation
- `/waitlist/*`: Queue management, priority updates
- `/forecasts/*`: Resource predictions, model metrics
- `/ml/*`: ML model inference endpoints (readmission, ICU, LOS, SHAP)

**API Documentation**  
Automatic Swagger UI generation through FastAPI's built-in OpenAPI support

**Validation and Error Handling**
- Pydantic models for request/response validation
- Custom exception handlers for HTTP status codes
- Structured error responses with meaningful messages

**Middleware Implementation**
- CORS middleware for cross-origin requests
- JWT authentication middleware for protected routes
- Request logging for debugging and monitoring

### 3.2.5 Machine Learning Model Development

**Data Preparation**
- **Dataset**: Synthetic patient data generated for training (age, vitals, diagnoses, procedures, medications, previous admissions)
- **Preprocessing**: Missing value imputation, categorical encoding (one-hot, label encoding), feature scaling (StandardScaler)
- **Feature Engineering**: Derived features (BMI, comorbidity count, medication interactions, admission frequency)
- **Train-Test Split**: 80-20 split with stratification for balanced class distribution

**Model Selection and Training**

*Heart Disease Prediction*
- **Algorithm**: Random Forest Classifier
- **Features**: Age, Sex, CP, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
- **Target**: Presence of Heart Disease (Binary: 0/1)
- **Performance**: 91.80% Accuracy
- **Optimization**: Hyperparameter tuning via GridSearchCV (n_estimators, max_depth)

*Diabetes Prediction*
- **Algorithm**: LightGBM (Light Gradient Boosting Machine)
- **Features**: Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age
- **Target**: Diabetic Status (Binary: 0/1)
- **Performance**: 96.97% Accuracy
- **Optimization**: Gradient boosting with leaf-wise tree growth for speed and efficiency

*Patient Risk Clustering (Unsupervised)*
- **Algorithm**: K-Means Clustering with PCA
- **Approach**: Dimensionality reduction using PCA followed by K-Means
- **Target**: Patient Risk Cohorts (Low, Medium, High Risk)
- **Metric**: Silhouette Score for cluster quality validation

*Readmission Risk Prediction*
- **Algorithm**: Random Forest Classifier
- **Hyperparameters**: n_estimators=100, max_depth=10, min_samples_split=5
- **Target**: Binary classification (readmitted within 30 days: Yes/No)
- **Evaluation Metrics**: Accuracy, Precision, Recall, F1-score, AUC-ROC

*ICU Transfer Risk Assessment*
- **Algorithm**: Logistic Regression with L2 regularization
- **Hyperparameters**: C=1.0, solver='lbfgs', max_iter=1000
- **Target**: Binary classification (ICU transfer required: Yes/No)
- **Evaluation Metrics**: Sensitivity (recall for high-risk cases), Specificity

*Length of Stay Estimation*
- **Algorithm**: Gradient Boosting Regressor
- **Hyperparameters**: n_estimators=150, learning_rate=0.1, max_depth=5
- **Target**: Continuous value (number of days)
- **Evaluation Metrics**: MAE, RMSE, R² score

*Fall Risk Assessment*
- **Algorithm**: Rule-based Scoring System (Adapted Morse Fall Scale)
- **Factors**: History of falling, secondary diagnosis, ambulatory aid, IV/Heparin lock, gait, mental status
- **Output**: Risk Score (0-125) categorized into No Risk, Low Risk, High Risk

**Model Explainability with SHAP**
- **Framework**: SHAP (SHapley Additive exPlanations)
- **Explainer Type**: TreeExplainer for tree-based models, LinearExplainer for logistic regression
- **Outputs**: Feature importance values, waterfall plots, force plots
- **Integration**: Real-time SHAP value computation for each prediction

**Model Persistence**
- Serialization using `joblib` for efficient model storage
- Version control for model files with timestamp naming
- Lazy loading on backend startup to reduce initialization time

### 3.2.6 Time-Series Forecasting Methodology

**Prophet Framework Configuration**
- **Seasonality**: Automatic detection of weekly and monthly patterns
- **Holidays**: Custom healthcare-specific events (flu season peaks)
- **Changepoint Detection**: Automatic identification of trend changes
- **Uncertainty Intervals**: 95% confidence intervals for probabilistic forecasting

**Forecasting Models Implementation**

1. **Bed Occupancy Forecast**
   - Historical data: Daily bed occupancy counts
   - Forecast horizon: 7 days
   - Output: Daily occupancy predictions with upper/lower bounds

2. **ICU Capacity Forecast**
   - Historical data: ICU bed utilization
   - Forecast horizon: 7 days
   - Seasonality components: Weekly patterns (higher weekend admissions)

3. **Oxygen Supply Forecast**
   - Historical data: Daily oxygen consumption (liters)
   - Forecast horizon: 7 days
   - Integration with inventory thresholds

4. **ER Visits Forecast**
   - Historical data: Emergency room patient counts
   - Forecast horizon: 7 days
   - Seasonal adjustments for holidays and weekends

5. **Overall Occupancy Rate**
   - Historical data: Hospital-wide capacity utilization percentage
   - Forecast horizon: 7 days
   - Composite metric for administrative planning

**Model Evaluation**
- **Metrics**: Mean Absolute Percentage Error (MAPE), Mean Absolute Error (MAE)
- **Cross-validation**: Time-series split validation
- **Baseline Comparison**: Prophet forecasts vs. moving average predictions

**Probability Calculations**
- Trend analysis to compute probability of resource increase/decrease
- Risk categorization (low/medium/high) based on forecast confidence

### 3.2.7 Algorithms and Business Logic

**Bed Allocation Algorithm**
```
Input: Patient ID, Department, Priority Level
Process:
1. Query available beds matching department
2. If beds available:
   - Select bed with lowest occupancy history
   - Assign patient to bed
   - Update bed status to "occupied"
   - Remove patient from waitlist if present
3. If no beds available:
   - Add patient to priority-based waitlist
   - Notify frontdesk of waitlist addition
Output: Bed assignment confirmation or waitlist position
```

**Priority-based Waitlist Management**
```
Priority Scoring = (Clinical_Urgency × 0.5) + (Wait_Time × 0.3) + (Comorbidity_Score × 0.2)

Process:
1. Calculate priority score for each patient in waitlist
2. Sort waitlist by descending priority score
3. When bed becomes available:
   - Dequeue highest priority patient
   - Trigger allocation algorithm
   - Notify patient and doctor
4. Periodic recalculation (every hour) to adjust for wait time increases
```

**Appointment Scheduling Algorithm**
```
Input: Patient ID, Doctor ID, Preferred Date/Time
Process:
1. Query doctor's availability for requested date
2. Check for existing appointments in time slot
3. If slot available:
   - Create appointment record
   - Block time slot in doctor's calendar
   - Send confirmation notifications
4. If slot unavailable:
   - Suggest next 3 available slots
   - Allow patient to select alternative
Output: Appointment confirmation or alternative options
```

### 3.2.8 Security Implementation

**Authentication Flow**
1. User submits credentials (username/email + password)
2. Backend validates credentials against MySQL database
3. Password verification using bcrypt comparison
4. JWT token generation with user role and expiration (24 hours)
5. Token returned to frontend, stored in localStorage
6. Subsequent requests include token in Authorization header
7. Middleware validates token and extracts user role
8. Route access granted based on RBAC permissions

**Role-Based Access Control Matrix**

| Resource | Patient | Doctor | Frontdesk | Admin |
|----------|---------|--------|-----------|-------|
| Own Medical Records | Read | Read/Write | Read | Read |
| All Patient Records | - | Read (assigned) | Read/Write | Read/Write |
| Appointments | Create/Read (own) | Read (assigned) | CRUD (all) | Read |
| Bed Management | - | Read | CRUD | CRUD |
| Forecasts | - | Read | Read | Read/Write |
| User Management | - | - | - | CRUD |

**Data Security Measures**
- Password hashing with bcrypt (cost factor: 12 rounds)
- SQL injection prevention through parameterized queries (SQLAlchemy ORM)
- NoSQL injection prevention through input validation
- HTTPS enforcement for production deployment
- Sensitive data filtering in API responses (password hashes never returned)

### 3.2.9 Testing Methodology

**Unit Testing**
- **Framework**: pytest for Python backend
- **Coverage**: Individual functions, database queries, ML model predictions
- **Mocking**: Database connections, external API calls

**Integration Testing**
- **API Testing**: Postman collections for endpoint validation
- **Database Integration**: Testing MongoDB and MySQL interactions
- **ML Pipeline**: End-to-end prediction workflow validation

**Performance Testing**
- **Load Testing**: Simulating 100+ concurrent users
- **Response Time Measurement**: API endpoint benchmarking
- **Database Query Optimization**: Index effectiveness analysis

**User Acceptance Testing (UAT)**
- **Participants**: Healthcare professionals (doctors, frontdesk staff)
- **Scenarios**: Real-world workflows (patient registration, appointment booking, bed allocation)
- **Feedback Collection**: Usability surveys, task completion time measurement

**Browser Testing**
- **Compatibility**: Chrome, Firefox, Safari, Edge
- **Responsiveness**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

### 3.2.10 Development Workflow

**Version Control Strategy**
- Git repository with feature branching model
- Main branches: `main` (production), `develop` (integration), `feature/*` (development)
- Pull requests with code review before merging

**Iterative Development Cycles**
1. **Requirements Gathering**: Stakeholder analysis, user story creation
2. **Design Phase**: Database schema, API contracts, UI mockups
3. **Implementation**: Feature development in 2-week sprints
4. **Testing**: Automated tests + manual validation
5. **Deployment**: Staging environment verification
6. **Retrospective**: Lessons learned, process improvements

**Documentation Practices**
- Inline code comments for complex logic
- API endpoint documentation via Swagger/OpenAPI
- Database schema diagrams (ER diagrams)
- User manuals for each role (Patient, Doctor, Frontdesk)
- Deployment guides for system administrators

### 3.2.11 Deployment Strategy

**Environment Configuration**
- **Development**: Local machines with Docker containers for databases
- **Staging**: Cloud-based deployment for pre-production testing
- **Production**: Recommended deployment on cloud platforms (AWS, Azure, Google Cloud)

**Backend Deployment**
- FastAPI application served via Uvicorn ASGI server
- Process management with systemd or supervisord
- Environment variables for configuration (database URLs, JWT secret)

**Frontend Deployment**
- React app built with `npm run build`
- Static files served via Nginx or CDN
- Environment-specific API endpoints configuration

**Database Deployment**
- MongoDB: Replica set for high availability
- MySQL: Master-slave replication for read scaling
- Automated backups with daily snapshots

**Continuous Integration/Continuous Deployment (CI/CD)**
- Automated testing on code commits
- Build verification before deployment
- Rollback mechanisms for failed deployments
