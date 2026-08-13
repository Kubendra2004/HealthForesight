<div align="center">

# HealthForesight 🏥✨

> **AI-Powered Healthcare Management System aiming to revolutionize patient care and hospital operations through Predictive Analytics and Real-Time Automation.**

<img width="100%" alt="HealthForesight Banner" src="https://github.com/user-attachments/assets/d3528436-42a6-4604-8a8d-9c21fd37b68d" />

<p>
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="Material UI" src="https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white" />
</p>

</div>

---

## 🚀 Overview

**HealthForesight** is a Next-Gen Hospital Management System designed to bridge the gap between patients, doctors, and hospital administration. Unlike traditional HMIS, it leverages **Artificial Intelligence** and **Machine Learning** to provide predictive insights, streamline workflows, and enhance accessibility.

### 🌟 Key Differentiators

- 💖 **Predictive Diagnostics:** Integrated ML models to assess Heart Disease and Diabetes risk levels for patients.
- 📈 **Resource Forecasting:** Uses Facebook Prophet to predict hospital bed occupancy and oxygen demand 7 days in advance.
- 🎙️ **Voice-Enabled AI Assistant:** A fully voice-responsive chatbot for patients (especially the elderly) to book appointments and check symptoms.
- 🏥 **3D Bed Management:** Interactive 3D visualization for real-time bed allocation and ward monitoring.

---

## 🛠️ Technology Stack

Overview organized by component:

- Frontend
  - React (Vite): SPA shell, client routing, production build
  - Material UI (MUI): design system and theming
  - Framer Motion: UI animations and transitions
  - Chart.js / Recharts: charts and visualizations
  - Web Speech API: in-browser voice capture (frontend)

- Backend & APIs
  - FastAPI: HTTP API, dependency injection, and WebSocket routes
  - Uvicorn: ASGI server for local development and production
  - SQLAlchemy + PyMySQL (MySQL): authentication, users, roles, and transactional data
  - Motor (AsyncIO): MongoDB client for document collections (predictions, reports, messages)

- Vector Search / RAG
  - ChromaDB (PersistentClient): vector index persisted under `backend/chroma_db`
  - Embeddings: SentenceTransformer-based embeddings (used for retrieval)

- AI / ML
  - google-genai (`google.genai`): Google Gemini / GenAI client used by the chatbot
  - scikit-learn / joblib: serialized ML models (heart, diabetes, resources)
  - SHAP: model explainability for feature attributions
  - Prophet: time-series forecasts used for resource predictions

- Dev / Ops & Utilities
  - python-dotenv: environment configuration
  - Docker (optional): containerization for deployment
  - gh-pages: frontend deploys to GitHub Pages (optional)

Note: MySQL is the primary relational datastore (required at startup for auth), MongoDB stores document-oriented data, and ChromaDB provides persistent RAG retrieval. ML artifacts live in `backend/models/artifacts/` and are lazy-loaded by the ML router.

---

## 💻 Modules & Features

### 1. 🧑‍🦰 Patient Dashboard

- **Health Overview:** Real-time vitals tracking (BP, Heart Rate, SpO2).
- **AI Risk Assessment:** Instant analysis of diabetes and heart disease risk based on vitals.
- **Appointment Booking:** Seamless booking wizard with doctor selection.
- **AI Chat & Voice:** Speak to the AI assistant to ask health questions or book appointments hands-free.
- **Medical Records:** Secure file upload and history management.

### 2. 👨‍⚕️ Doctor Dashboard

- **Unified Workspace:** View appointments, patient history, and prescriptions in one glassmorphic interface.
- **Patient Requests:** Accept/Reject appointment requests in real-time.
- **Digital Prescriptions:** Generate and save prescriptions instantly.
- **Telemedicine Capable:** Integrated interface for identifying online vs. in-person visits.

### 3. 🖥️ Front Desk / Reception

- **3D Bed Allocation:** Visual interface to assign beds to patients.
- **Smart Billing:** Automated bill generation including room charges, consults, and medicines.
- **Resource Forecast:** View AI predictions for upcoming resource shortages.

### 4. ⚙️ Admin Control

- **User Management:** Create/Delete Staff accounts.
- **System Logs:** Monitor all system activities.

**Backend endpoints & notes**

- `POST /chatbot/ask` — Chatbot endpoint. Retrieves relevant documents from ChromaDB, optionally includes patient context (consent required), and calls Google GenAI (`google.genai`) to generate responses. Backend exposes safe tool functions (`book_appointment`, `add_to_waitlist`) that can be invoked by the assistant.
- Machine learning endpoints under `/ml`: clustering, heart/diabetes prediction + explanation, readmission and ICU transfer risk, and resource forecasting (`/ml/predict/resources`). ML artifacts are lazy-loaded from `backend/models/artifacts/`.
- Authentication under `/auth`: signup, register, login, refresh tokens, profile management, and user listing (role-based access enforced).
- WebSockets at `/ws/connect?token=<jwt>`: JWT-authenticated realtime channel for personal messages, broadcasts, and operational events (bed updates, appointment status).
- RAG (ChromaDB) is initialized at startup to speed chatbot retrievals and is persisted under `backend/chroma_db/`.

---

## ⚡ Installation & Setup

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- MongoDB (Local or Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/Kubendra2004/HealthForesight.git
cd HealthForesight
```

### 2. Backend Setup

```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate it (Windows)
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run Server
uvicorn main:app --reload
```

_Backend runs on `http://localhost:8000`_

### 3. Frontend Setup

```bash
cd frontend
# Install packages
npm install
# Run Client
npm run dev
```

_Frontend runs on `http://localhost:5173`_

---

## 🔐 Environment Variables

Create a `.env` file in the `backend` folder:

```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=healthforesight
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_google_ai_key
```

Required / recommended variables (current codebase):

```env
# Either provide a full MySQL URL or the individual components below (MySQL is required at startup)
MYSQL_URL=
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=health_app

MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=health_app_ai

GEMINI_API_KEY= # Google GenAI (Gemini) API key used by chatbot (optional; chatbot returns offline message if missing)
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
```

Notes:
- The backend enforces MySQL configuration on startup; missing MySQL credentials will raise a clear runtime error to avoid silent fallbacks to SQLite.
- Keep `.env` out of version control and share `backend/.env.example` with collaborators.

---

## 📸 Screen Previews

<div align="center">

### 🏥 Patient Dashboard

_Glassmorphism UI with Health Score & Vitals tracking_
<br/>
<img width="80%" alt="Patient Dashboard" src="https://github.com/user-attachments/assets/99bef740-79b1-462f-b287-906816b3f47d" />

<br/><br/>

### 💬 Doctor Chat Interface

_Real-time P2P chat with file sharing & voice input_
<br/>
<img width="80%" alt="Doctor Chat" src="https://github.com/user-attachments/assets/b967ae44-4076-498b-a439-499626dd659b" />

<br/><br/>

### 📈 Resource Forecast

_AI-driven predictions for bed occupancy & resource usage_
<br/>
<img width="80%" alt="Resource Forecast" src="https://github.com/user-attachments/assets/2869bdbd-c2b4-496c-9471-63443b78aca3" />

</div>

---

## 🤝 Contribution

Contributions are welcome! Please fork the repo and create a pull request.

## 📄 License

This project is licensed under the MIT License.
