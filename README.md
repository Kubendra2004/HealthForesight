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
*   💖 **Predictive Diagnostics:** Integrated ML models to assess Heart Disease and Diabetes risk levels for patients.
*   📈 **Resource Forecasting:** Uses Facebook Prophet to predict hospital bed occupancy and oxygen demand 7 days in advance.
*   🎙️ **Voice-Enabled AI Assistant:** A fully voice-responsive chatbot for patients (especially the elderly) to book appointments and check symptoms.
*   🏥 **3D Bed Management:** Interactive 3D visualization for real-time bed allocation and ward monitoring.

---

## 🛠️ Technology Stack

| Component | Technology | Used For |
| :--- | :--- | :--- |
| **Frontend** | React via Vite | High-performance UI rendering |
| | Material UI (MUI) | Premium design components |
| | Framer Motion | Smooth interactions & animations |
| | Chart.js | Visualizing health data & forecasts |
| **Backend** | Python FastAPI | High-speed API & ML Model serving |
| **Database** | MongoDB | Storing patient records, chats, and logs |
| **AI/ML** | Scikit-Learn | Disease prediction models |
| | Facebook Prophet | Time-series forecasting |
| | Google Gemini | Generative AI Chatbot logic |
| **Others** | WebSockets | Real-time notifications & chat |
| | Web Speech API | Native browser voice recognition |

---

## 💻 Modules & Features

### 1. 🧑‍🦰 Patient Dashboard
*   **Health Overview:** Real-time vitals tracking (BP, Heart Rate, SpO2).
*   **AI Risk Assessment:** Instant analysis of diabetes and heart disease risk based on vitals.
*   **Appointment Booking:** Seamless booking wizard with doctor selection.
*   **AI Chat & Voice:** Speak to the AI assistant to ask health questions or book appointments hands-free.
*   **Medical Records:** Secure file upload and history management.

### 2. 👨‍⚕️ Doctor Dashboard
*   **Unified Workspace:** View appointments, patient history, and prescriptions in one glassmorphic interface.
*   **Patient Requests:** Accept/Reject appointment requests in real-time.
*   **Digital Prescriptions:** Generate and save prescriptions instantly.
*   **Telemedicine Capable:** Integrated interface for identifying online vs. in-person visits.

### 3. 🖥️ Front Desk / Reception
*   **3D Bed Allocation:** Visual interface to assign beds to patients.
*   **Smart Billing:** Automated bill generation including room charges, consults, and medicines.
*   **Resource Forecast:** View AI predictions for upcoming resource shortages.

### 4. ⚙️ Admin Control
*   **User Management:** Create/Delete Staff accounts.
*   **System Logs:** Monitor all system activities.

---

## ⚡ Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)
*   MongoDB (Local or Atlas)

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
*Backend runs on `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd frontend
# Install packages
npm install
# Run Client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔐 Environment Variables
Create a `.env` file in the `backend` folder:
```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=healthforesight
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_google_ai_key
```

---

## 📸 Screen Previews

<div align="center">

### 🏥 Patient Dashboard
*Glassmorphism UI with Health Score & Vitals tracking*
<br/>
<img width="80%" alt="Patient Dashboard" src="https://github.com/user-attachments/assets/99bef740-79b1-462f-b287-906816b3f47d" />

<br/><br/>

### 💬 Doctor Chat Interface
*Real-time P2P chat with file sharing & voice input*
<br/>
<img width="80%" alt="Doctor Chat" src="https://github.com/user-attachments/assets/b967ae44-4076-498b-a439-499626dd659b" />

<br/><br/>

### 📈 Resource Forecast
*AI-driven predictions for bed occupancy & resource usage*
<br/>
<img width="80%" alt="Resource Forecast" src="https://github.com/user-attachments/assets/2869bdbd-c2b4-496c-9471-63443b78aca3" />

</div>

---

## 🤝 Contribution
Contributions are welcome! Please fork the repo and create a pull request.

## 📄 License
This project is licensed under the MIT License.
