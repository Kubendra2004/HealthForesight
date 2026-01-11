# PROJECT TIMELINE: 57-DAY WORK BREAKDOWN

This document outlines the systematic, expanded 57-day development schedule for the **HealthForesight** Intelligent Healthcare Management System, formatted with detailed daily work logs.

## PHASE 1: INCEPTION, RESEARCH & DESIGN (Days 1-6)

### Day 1: Project Initiation
- **Work Summary**: Defined project scope, objectives, and problem statement. Identified core stakeholders (Patients, Doctors, Administrators) and mapped their key requirements for the system.
- **Hours worked**: 8 hours
- **Learnings / Outcomes**: Established a clear project vision and scope. Delivered the Project Charter and Stakeholder Map. Learned about the specific needs of modern healthcare administration.
- **Skills Used**: JIRA, Confluence, MS Office, Agile Methodologies.

### Day 2: Literature Review
- **Work Summary**: Conducted research on existing healthcare systems. Analyzed 2022-2025 research papers on CVD prediction (Shrestha, Sahu) and diabetes detection (Zhang). Identified gaps in current solutions.
- **Hours worked**: 7 hours
- **Learnings / Outcomes**: Identified that existing systems lack explainability and real-time forecasting. Produced a Literature Review Summary and Gap Analysis document.
- **Skills Used**: Google Scholar, Python (Data Analysis), LaTeX, ResearchGate.

### Day 3: Requirement Analysis
- **Work Summary**: Gathered detailed requirements. Defined functional requirements (Login, Predict, Dashboard) and non-functional requirements (Security, Latency <200ms).
- **Hours worked**: 9 hours
- **Learnings / Outcomes**: Drafted the Software Requirements Specification (SRS). Understood the critical importance of HIPAA compliance and data security in healthcare apps.
- **Skills Used**: UML Tools, Markdown, JSON (Schema Definition), ISO/IEEE Standards.

### Day 4: System Architecture Design
- **Work Summary**: Designed the High-Level Architecture using a Three-tier pattern. Selected the technology stack: FastAPI (Backend), React (Frontend), and Hybrid DB (MySQL + MongoDB).
- **Hours worked**: 8 hours
- **Learnings / Outcomes**: finalized the Architecture Diagram. Validated that a hybrid database approach provides the best balance of structure (Auth) and flexibility (Medical Records).
- **Skills Used**: AWS Architecture Concepts, Docker, Kubernetes, Microservices Design Patterns.

### Day 5: Database Design
- **Work Summary**: Modeled relational schemas for MySQL (Users, Appointments) and document schemas for MongoDB (Patient Records, Logs). Created ER diagrams and Data Flow Diagrams.
- **Hours worked**: 8 hours
- **Learnings / Outcomes**: Completed ER Diagrams and Schema Definitions. Learned how to optimize schema design for high-read healthcare workloads.
- **Skills Used**: SQL, NoSQL, MySQL Workbench, MongoDB Compass, Lucidchart.

### Day 6: UI/UX Wireframing
- **Work Summary**: Sketched low-fidelity wireframes for Patient, Doctor, and Admin dashboards. Defined user journeys for common tasks like booking appointments.
- **Hours worked**: 7 hours
- **Learnings / Outcomes**: Created UI Wireframes and User Flowcharts. Visualized the user experience to ensure intuitive navigation for non-technical hospital staff.
- **Skills Used**: Figma, Adobe XD, Sketch, Material Design Guidelines.

---

## PHASE 2: BACKEND FOUNDATION (Days 7-18)

### Day 7: Environment Setup
- **Work Summary**: Configured the development environment. Setup Python virtualenv, Node.js, and the Git repository. Installed dependencies (FastAPI, Uvicorn, Drivers).
- **Hours worked**: 6 hours
- **Learnings / Outcomes**: Established a clean, reproducible Repository Setup with `requirements.txt`. Ensured all dev tools are version-compatible.
- **Skills Used**: Python 3.10+, Node.js, Git, GitHub Actions, VS Code.

### Day 8: Database Initialization
- **Work Summary**: Provisioned MySQL and MongoDB instances locally. Created initial database users, granted permissions, and initialized tables/collections.
- **Hours worked**: 7 hours
- **Learnings / Outcomes**: Achieved live Database Connectivity. Verified the hybrid connection logic in Python.
- **Skills Used**: MySQL, MongoDB, Docker Compose, SQL, Mongo Shell.

### Day 9: Authentication Module (Design)
- **Work Summary**: Designed the authentication flow using JWT. Decided on `bcrypt` for password hashing and defined permission scopes for RBAC (Role-Based Access Control).
- **Hours worked**: 8 hours
- **Learnings / Outcomes**: Finalized the Auth Flow Design. Understood the security implications of token storage and refresh mechanisms.
- **Skills Used**: JWT (JSON Web Tokens), OAuth 2.0, OpenSSL, BCrypt.

### Day 10: Authentication Implementation
- **Work Summary**: Coded Login and Register endpoints. Implemented middleware for JWT token validation and dependency injection for current user retrieval.
- **Hours worked**: 9 hours
- **Learnings / Outcomes**: Delivered secured Auth Endpoints (`/auth/*`). Successfully implemented secure password handling and token generation.
- **Skills Used**: Python, FastAPI, Pydantic, Passlib, PyJWT.

### Day 11: Synthetic Data Design
- **Work Summary**: Defined properties and statistical distributions for synthetic patients (demographics, vitals, diseases) to ensure the data matches real-world medical trends.
- **Hours worked**: 7 hours
- **Learnings / Outcomes**: Developed a clear Data Generation Strategy. Mapped out correlations needed (e.g., Age ↔ BP) for realistic ML training.
- **Skills Used**: Python (Statistics), Pandas, SciPy, Data Modeling.

### Day 12: Synthetic Data Generation
- **Work Summary**: Wrote Python scripts using `Faker` and `numpy`. Generated 1,000+ patient profiles and 5,000+ appointment records. Seeded the databases.
- **Hours worked**: 8 hours
- **Learnings / Outcomes**: Created a Populated Development Database. Learned to use `Faker` for localized data generation.
- **Skills Used**: Python, Faker Library, NumPy, ETL Pipelines.

### Day 13: Patient & Profile APIs
- **Work Summary**: Implemented CRUD operations for patient profiles and medical history. Added search and filtering capabilities.
- **Hours worked**: 8 hours
- **Learnings / Outcomes**: Functional Data APIs for patient management. Mastered FastAPI `Pydantic` models for request validation.
- **Skills Used**: FastAPI, RESTful APIs, JSON, Swagger/OpenAPI.

### Day 14: Doctor & Appointment APIs
-   **Work Summary**: Implemented logic for doctor availability, booking slots, and appointment management (create, update, cancel).
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Completed Appointment System APIs. Solved complex logic for time slot conflict detection.
-   **Skills Used**: Python, AsyncIO, Algorithm Design, DateTime manipulation.

### Day 15: Vitals & Health Logs
-   **Work Summary**: Created APIs for logging vitals (BP, BMI, Glucose). Implemented logic to check these vitals against standard health thresholds immediately upon entry.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Functional Vitals API. capable of triggering alerts. Integrated standard medical formulas (BMI calculation).
-   **Skills Used**: Python, REST APIs, Business Logic Implementation.

### Day 16: Clinical Decision Logic
-   **Work Summary**: Implemented business rules for medication reconciliation (checking interactions) and adverse event logging.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Delivered Clinical Support Endpoints (`/clinical/*`). Learned to structure complex decision rules within API endpoints.
-   **Skills Used**: Python, Rule-Based Engines, JSON Logic.

### Day 17: Backend Validation
-   **Work Summary**: Refined API inputs with strict Pydantic validators. Implemented global error handling to ensure consistent error responses across the app.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Achieved Robust API Error Responses. significantly improved system stability and debuggability.
-   **Skills Used**: Python, Pydantic, Exception Handling Patterns.

### Day 18: Operational Security & API Testing
-   **Work Summary**: Configured Rate limiting and CORS. Performed manual security testing (SQLi checks) and verified all endpoints via Swagger UI.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: A Fully Secured Backend ready for frontend integration. Validated 40+ endpoints.
-   **Skills Used**: OWASP ZAP, Postman, CURL, CORS, API Security.

---

## PHASE 3: MACHINE LEARNING & AI (Days 19-32)

### Day 19: Data Preprocessing
-   **Work Summary**: Fetched raw data from the DB. Handled missing values, normalized numerical scales, and formatted data for ML ingestion.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Established a reusable Preprocessing Pipeline. Learned techniques for handling medical data anomalies.
-   **Skills Used**: Python, Pandas, NumPy, Scikit-learn (Preprocessing).

### Day 20: Exploratory Data Analysis (EDA)
-   **Work Summary**: Visualized disease distributions (Heart/Diabetes) and analyzed feature correlations using Matplotlib/Seaborn.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Produced EDA Notebook & Charts. Gained insights into key predictors for heart disease and diabetes.
-   **Skills Used**: Python, Matplotlib, Seaborn, Jupyter Notebooks.

### Day 21: Heart Disease Model (Training)
-   **Work Summary**: Trained baseline models (Logistic Regression, SVM) and Random Forest. Compared accuracy, precision, and recall metrics.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Documented Model Training Logs. Determined that Random Forest performed best for this dataset.
-   **Skills Used**: Python, Scikit-learn, Logistic Regression, SVM.

### Day 22: Heart Disease Model (Optimization)
-   **Work Summary**: Performed hyperparameter tuning (GridSearch) on the Random Forest model. Validated results. Saved the final model.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Finalized `heart_model.pkl` with 91.80% accuracy. Learned importance of tuning `n_estimators` and `max_depth`.
-   **Skills Used**: Python, GridSearchCV, Joblib, Random Forest Algorithm.

### Day 23: Diabetes Model (Training)
-   **Work Summary**: Experimented with Gradient Boosting and LightGBM algorithms, focusing on symptom-based features.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Generated Model Comparison reports. LightGBM showed promising speed and accuracy.
-   **Skills Used**: Python, XGBoost, LightGBM, Gradient Boosting Machines.

### Day 24: Diabetes Model (Finalization)
-   **Work Summary**: Fine-tuned the LightGBM model. Validated its exceptional accuracy against benchmarks. Integrated Label Encoders for categorical inputs.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Finalized `diabetes_model.pkl` with 96.97% accuracy. Validated performance on holdout test set.
-   **Skills Used**: LightGBM, Label Encoding, Python, ML Validation Techniques.

### Day 25: Explainability (SHAP) Setup
-   **Work Summary**: Configured SHAP (SHapley Additive exPlanations) explainers for the tree-based models (Random Forest & LightGBM).
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Created SHAP Configuration objects. Understood how to interpret SHAP values for local vs. global explainability.
-   **Skills Used**: Python, SHAP Library, Explainable AI (XAI).

### Day 26: Explainability API Integration
-   **Work Summary**: Created API endpoints to calculate and return SHAP force plot values for individual predictions on the fly.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Functional `/ml/explain` Endpoint. Successfully bridged the gap between complex ML models and user-friendly explanation.
-   **Skills Used**: FastAPI, SHAP, JSON, Python.

### Day 27: Patient Clustering (Unsupervised)
-   **Work Summary**: Applied PCA for dimensionality reduction followed by K-Means clustering. Interpreted the resulting clusters as risk cohorts.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Developed Clustering Model & Scaler. Identified three distinct patient profiles: Low, Medium, and High Risk.
-   **Skills Used**: Python, Scikit-learn, PCA, K-Means Clustering.

### Day 28: Secondary Risk Models (Readmission)
-   **Work Summary**: Trained binary classification models for 30-day Readmission Risk and ICU Transfer Risk.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Delivered `readmission.pkl` and `icu_transfer.pkl`. Expanded the system's predictive capabilities beyond disease diagnosis.
-   **Skills Used**: Python, Scikit-learn, Random Forest, Logistic Regression.

### Day 29: Fall Risk & LOS Models
-   **Work Summary**: Implemented rule-based Fall Risk scoring (Morse Scale) and a Regression model for Length of Stay (LOS) prediction.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Completed LOS Prediction Model and Fall Risk Logic. Combined heuristic and ML approaches effectively.
-   **Skills Used**: Python, SciPy, Regression Analysis, Rule-based Algo.

### Day 30: ML API Service Wrapper
-   **Work Summary**: Wrapped all trained models into FastAPI routers. Implemented Lazy Loading patterns to reduce server startup time.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Functional `/ml/*` Router. Drastically reduced memory footprint and startup latency.
-   **Skills Used**: FastAPI, Python, Design Patterns (Singleton/Lazy Loading).

### Day 31: Model Performance Evaluation
-   **Work Summary**: Calculated comprehensive metrics (Precision, Recall, F1, AUC-ROC) for all models on test data. Documented findings.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Created detailed `model_performance.md`. Validated that all models met or exceeded performance targets.
-   **Skills Used**: Scikit-learn Metrics, Confusion Matrix, ROC-AUC, Markdown.

### Day 32: AI Service Optimization
-   **Work Summary**: Profiled ML service performance. Optimized inference speed and implemented caching for frequent predictions.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Optimized ML Service with <2s inference times. Ensured the system scales under load.
-   **Skills Used**: Python Profiling tools, Redis (Caching Logic), Latency Optimization.

---

## PHASE 4: FORECASTING & ADVANCED FEATURES (Days 33-40)

### Day 33: Forecasting Dataset Creation
-   **Work Summary**: Generated a 2-year synthetic history for Bed, Oxygen, and ICU usage, injecting realistic seasonal trends and noise.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Created Time-series CSV datasets. Learned to simulate complex time-series patterns.
-   **Skills Used**: Python, Pandas Time Series, Data Simulation.

### Day 34: Forecasting Baseline Models
-   **Work Summary**: Implemented Naïve and Moving Average models to serve as baselines for forecasting accuracy comparison.
-   **Hours worked**: 6 hours
-   **Learnings / Outcomes**: Established Baseline Metrics. Confirmed the need for more advanced models like Prophet.
-   **Skills Used**: Python, Statsmodels, Time Series Analysis.

### Day 35: Prophet Model Implementation
-   **Work Summary**: Trained Facebook Prophet models for 5 resource types. Tuned seasonality parameters (weekly/yearly) and prior scales.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Successfully Trained Prophet Models. Captured weekly hospital occupancy cycles accurately.
-   **Skills Used**: Meta Prophet, Python, Forecasting Algorithms.

### Day 36: Forecasting Validation
-   **Work Summary**: Performed cross-validation with a 7-day horizon. Calculated MAPE (Mean Absolute Percentage Error).
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Produced Forecast Accuracy Report showing 8.3% MAPE. Validated significant improvement over baselines.
-   **Skills Used**: Python, Cross-Validation, MAPE/RMSE Metrics.

### Day 37: Knowledge Base Preparation (RAG)
-   **Work Summary**: Compiled hospital protocols, FAQs, and medical guidelines into a structured text corpus for the chatbot.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Created a comprehensive Knowledge Base. Learned principles of data curation for LLMs.
-   **Skills Used**: NLP Data Cleaning, Text Processing, Markdown, Regex.

### Day 38: Vector Database Setup
-   **Work Summary**: Implemented text chunking. Generated embeddings using SentenceTransformers and indexed them in ChromaDB.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Populated Vector DB. Successfully implemented semantic search capabilities.
-   **Skills Used**: SentenceTransformers, ChromaDB (Vector DB), Embeddings, Python.

### Day 39: Chatbot Logic Implementation
-   **Work Summary**: Connected Google Gemini 2.0 Flash API. Implemented the RAG (Retrieval Augmented Generation) flow using the Vector DB.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Functional Basic Chatbot capable of answering protocol questions. Integrated LLM with local data context.
-   **Skills Used**: Google Gemini API, LangChain, RAG Architecture, LLMs.

### Day 40: Advanced Chatbot Agency
-   **Work Summary**: Added Function Calling capabilities (e.g., "Book Appointment") and injected patient profile context into prompts.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Delivered Smart Health Assistant. Achieved a conversational interface that can perform actions.
-   **Skills Used**: LLM Agents, Function Calling API, Prompt Engineering.

---

## PHASE 5: FRONTEND DEVELOPMENT (Days 41-48)

### Day 41: Project Initialization & Theming
-   **Work Summary**: Created React Vite app. Configured the Material UI (MUI) theme with custom brand colors, typography, and dark mode support.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Initialized Empty React App with a consistent Design System. Set up the visual foundation.
-   **Skills Used**: React.js, Vite, Material UI (MUI), CSS3.

### Day 42: Common Components
-   **Work Summary**: Built reusable UI components: Navbar, Sidebar with role-based links, Protected Routes, Auth Layouts, and Data Tables.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Developed a robust Component Library. Implemented layout patterns for dashboard consistency.
-   **Skills Used**: React Components, React Router, JavaScript (ES6+).

### Day 43: Authentication UI
-   **Work Summary**: Developed Login, Register, and Forgot Password screens. Implemented logic for JWT storage and state management.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Functional Auth Screens securely integrated with backend. Learned local storage security best practices.
-   **Skills Used**: React Hooks, Axios, JWT, LocalStorage.

### Day 44: Patient Dashboard Core
-   **Work Summary**: Built the Patient Dashboard Home, Statistics Cards (Vitals summary), and Profile View/Edit pages.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Delivered Patient Home interface. Successfully visualized patient summary data.
-   **Skills Used**: React.js, JSX, Responsive Web Design, MUI Grid.

### Day 45: Patient Dashboard Modules
-   **Work Summary**: Developed interactive forms for Heart/Diabetes prediction. Integrated charts for viewing Vitals and Medical History trends.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Interactive Patient Features complete. Connected UI forms to ML endpoints.
-   **Skills Used**: Formik, React Hook Form, Recharts, Chart.js.

### Day 46: Doctor Dashboard
-   **Work Summary**: Built the Doctor Dashboard including a filterable Patient List and Appointment Management interface.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Delivered Doctor Portal. Implemented complex list filtering and modal interactions.
-   **Skills Used**: React.js, Context API, Array Methods (Filter/Map).

### Day 47: Admin Dashboard & Analytics
-   **Work Summary**: Integrated Forecasting charts (Recharts) for Admin view. Added Resource management controls and User management tables.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Functional Admin Control Panel. Visualized complex time-series data effectively on the frontend.
-   **Skills Used**: React.js, Recharts, Data Visualization.

### Day 48: Frontend Integration Polish
-   **Work Summary**: Connected any remaining forms to APIs. Implemented comprehensive form validation (Formik/Yup) and added Toast notifications for user feedback.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Feature-Complete UI. significantly improved User Experience (UX) with immediate feedback loops.
-   **Skills Used**: React Toastify, Error Boundaries, Frontend Optimization.

---


## PHASE 6: LOCAL VALIDATION & REFINEMENT (Days 49-57)

### Day 49: Integration Testing
-   **Work Summary**: Conducted End-to-End testing of full workflows (e.g., Signup -> Predict -> Book -> Admin View). Identified and fixed integration bugs.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Stable Release Candidate. Verified that all system components communicate correctly.
-   **Skills Used**: Jest, React Testing Library, Postman.

### Day 50: Security & Edge Case Testing
-   **Work Summary**: Tested for vulnerabilities: unauthorized access, invalid inputs, network failures (404/500), and token expiry handling.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Generated Security Audit Report. Confirmed system resilience against common threats.
-   **Skills Used**: OWASP Tools, Network Analysis, Chrome DevTools.

### Day 51: Performance Benchmarking
-   **Work Summary**: Conducted load testing using Locust. Measured API latency and UI rendering speeds. Optimized slow components.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Documented Performance Metrics. Confirmed API response times meet the <200ms target.
-   **Skills Used**: Locust, Apache JMeter, Performance Profiling.

### Day 52: Validation against Literature
-   **Work Summary**: Compared our system's results against the researched 2022-2025 papers. Detailed the improvements in accuracy and features.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Finalized Validation Data. Confirmed HealthForesight's superiority over discussed benchmarks.
-   **Skills Used**: Python (Data Analysis), Excel/Sheets, Comparative Statistics.

### Day 53: Documentation & Reports
-   **Work Summary**: Finalized User Manuals, API Documentation, and compiled all Project Report Chapters (1-8).
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Complete Documentation Bundle ready for submission. Ensured all deliverables are professional and comprehensive.
-   **Skills Used**: Markdown, MkDocs, Swagger Documentation.

### Day 54: System Demo & Local Validation
-   **Work Summary**: Presented the "Release Candidate" to stakeholders/supervisors on the local machine. Simulated full user workflows to demonstrate stability.
-   **Hours worked**: 6 hours
-   **Learnings / Outcomes**: Successful Local Demo. Verified seamless data flow between all 3 dashboards on a single machine.
-   **Skills Used**: Presentation Skills, System Integration, Localhost Debugging.

### Day 55: Stress Testing & Error Logging
-   **Work Summary**: Performed extended run tests (kept server running for 12+ hours) to check for memory leaks or connection drops. Analyzed `uvicorn` and console logs.
-   **Hours worked**: 9 hours
-   **Learnings / Outcomes**: Validated Long-running Stability. Fixed a minor database connection timeout issue during idle periods.
-   **Skills Used**: Python Logging, Process Management, Error Analysis.

### Day 56: Code Cleanup & Optimization
-   **Work Summary**: Refactored redundant code in the frontend. Optimized local asset loading times and removed unused dependencies.
-   **Hours worked**: 8 hours
-   **Learnings / Outcomes**: Optimized Codebase. Reduced application startup time and improved code readability for future reference.
-   **Skills Used**: Code Refactoring, Dependency Management, Clean Code Principles.

### Day 57: Final Review & Roadmap
-   **Work Summary**: Documented known limitations (e.g., local networking only). Outlined a "Future Work" plan for potentially hosting this on a cloud server later.
-   **Hours worked**: 7 hours
-   **Learnings / Outcomes**: Project officially wrapped as a "Complete Local Prototype". Defined clear steps for moving to Phase 2.
-   **Skills Used**: Project Documentation, Future Planning, Self-Review.

