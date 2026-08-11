import React, { useState, useEffect } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PatientResourceForecast from "./components/PatientResourceForecast";
import PrescriptionManager from "./components/PrescriptionManager";
import MedicalHistoryManager from "./components/MedicalHistoryManager";
import MedicalReportGenerator from "./components/MedicalReportGenerator";
import PatientChat from "./components/PatientChat";
import PatientNotifications from "./components/PatientNotifications";
import OnboardingModal from "./components/OnboardingModal";
import AppointmentModal from "./components/AppointmentModal";
import ChatInterface from "../../components/ChatInterface";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  Title,
} from "chart.js";
import { Tooltip } from "@mui/material";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  ChartTooltip,
  Legend,
  Title
);

export default function PatientDashboard() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const [active, setActive] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Safe defaults to prevent render-time ReferenceErrors
  const patientId = user?.username || "";

  // Appointments and doctors state
  // Appointments and doctors state
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'info' });

  // WebSocket Listener
  useEffect(() => {
    if (lastMessage) {
        if (lastMessage.type === 'new_message') {
            setSnackbar({
                open: true,
                msg: `New message from ${lastMessage.data.sender_id}`,
                type: 'info'
            });
        } else if (lastMessage.type === 'message_sent') {
             setSnackbar({
                open: true,
                msg: `Message sent to ${lastMessage.data.receiver_id}`,
                type: 'success'
            });
        }
    }
  }, [lastMessage]);

  // Fetch doctors on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/users?role=doctor`, {
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setDoctors(data))
      .catch(err => console.error("Error fetching doctors:", err));
  }, []);

  const handleAppointmentRequest = async (formData) => {
    try {
      const appointmentData = {
        patient_id: patientId,
        doctor_id: formData.doctorId,
        date: `${formData.date} ${formData.time}`,
        reason: formData.reason,
        status: "Requested",
        type: formData.type, // 'video' or 'in-person'
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/frontdesk/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (res.ok) {
        alert("Appointment requested successfully!");
        // Refresh appointments
        const updated = await fetch(
          `${import.meta.env.VITE_API_URL}/frontdesk/appointments?patient_id=${patientId}`
        );
        if (updated.ok) setAppointments(await updated.json());
      }
    } catch (err) {
      console.error("Appointment request error:", err);
      alert("Failed to request appointment");
    }
    setShowAppointmentModal(false);
  };

  const handleGenerateReport = async () => {
    try {
       const token = localStorage.getItem("token");
       const res = await axios.post(
         `${import.meta.env.VITE_API_URL}/reports/generate`, 
         {}, 
         { 
           headers: { Authorization: `Bearer ${token}` },
           responseType: 'blob'
         }
       );
       
       // Download Blob
       const url = window.URL.createObjectURL(new Blob([res.data]));
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `medical_report_${patientId}.pdf`);
       document.body.appendChild(link);
       link.click();
       const event = new CustomEvent("reportGenerated"); // Notify report generator component if needed
       window.dispatchEvent(event);
    } catch (e) {
       console.error("Report generation failed:", e);
       alert("Failed to generate report. Please try again.");
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // Predictions and risk state
  const [heartPrediction, setHeartPrediction] = useState(null);
  const [diabetesPrediction, setDiabetesPrediction] = useState(null);

  // Risk color themes - dynamic based on predictions
  // Risk color themes - dynamic based on predictions
  // Risk Level Helper
  const getRiskLevel = (prob) => {
      // User requested: Low (<30%), Medium (30-70%), High (70-80%), Very High (>80%)
      if (prob < 0.3) return { label: "Low", color: "#059669", bg: "#dcfce7" };
      if (prob < 0.7) return { label: "Medium", color: "#d97706", bg: "#fef3c7" }; 
      if (prob < 0.8) return { label: "High", color: "#dc2626", bg: "#fee2e2" };
      return { label: "Very High", color: "#7f1d1d", bg: "#fecaca" };
  };

  const diabetesLevel = getRiskLevel(diabetesPrediction?.probability || 0);
  const heartLevel = getRiskLevel(heartPrediction?.probability || 0);

  // Health metrics and score
  const [healthMetrics, setHealthMetrics] = useState({ age: null, bmi: null });
  const [healthScore, setHealthScore] = useState(100);
  const [profileData, setProfileData] = useState(null); // Lifted state for score calc

  // Calculate Dynamic Health Score
  // Calculate Dynamic Health Score
  useEffect(() => {
    // If no profile data, keep at 100 or default
    if (!profileData || Object.keys(profileData).length === 0) return;

    let score = 100;
    
    // 1. Lifestyle Factors
    if (profileData.smoking === "Yes") score -= 10;
    if (profileData.alcohol === "Frequent") score -= 5;
    if (profileData.activity_level === "Sedentary") score -= 5;

    // 2. BMI / Obesity
    const heightM = parseFloat(profileData.height) / 100;
    const weightKg = parseFloat(profileData.weight);
    if(heightM > 0 && weightKg > 0) {
        const bmi = weightKg / (heightM * heightM);
        if (bmi > 25) score -= 5;
        if (bmi > 30) score -= 5; // Cumulative -10 for obese
    }

    // 3. Vitals
    if (parseInt(profileData.systolic_bp) > 140 || parseInt(profileData.diastolic_bp) > 90) score -= 10;
    if (parseFloat(profileData.glucose) > 140) score -= 10;

    // 4. Medical History / Conditions
    let conditions = profileData.conditions || profileData.existing_conditions || "";
    if (conditions) {
        if (conditions.includes("Diabetes")) score -= 10;
        if (conditions.includes("Hypertension")) score -= 5;
        if (conditions.includes("Heart Attack")) score -= 15;
        if (conditions.includes("Stroke")) score -= 15;
    }

    // 5. ML Predictions
    // Medium Risk (30-70%): -10 points
    if (heartPrediction?.probability >= 0.3 && heartPrediction?.probability < 0.7) score -= 10;
    if (diabetesPrediction?.probability >= 0.3 && diabetesPrediction?.probability < 0.7) score -= 10;

    // High Risk (70-80%): -20 points
    if (heartPrediction?.probability >= 0.7 && heartPrediction?.probability < 0.8) score -= 20;
    if (diabetesPrediction?.probability >= 0.7 && diabetesPrediction?.probability < 0.8) score -= 20;

    // Very High Risk (>80%): -30 points
    if (heartPrediction?.probability >= 0.8) score -= 30;
    if (diabetesPrediction?.probability >= 0.8) score -= 30;

    setHealthScore(Math.max(0, Math.round(score)));
  }, [profileData, heartPrediction, diabetesPrediction]);

  // Files and upload modal state
  const [files, setFiles] = useState([]);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async () => {
    if (!selectedFile || !patientId) return;
    try {
      setUploadingFile(true);
      const form = new FormData();
      // FIX 422: Parameter 'patient_id' must be sent
      form.append("file", selectedFile);
      form.append("patient_id", patientId);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/files/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed");

      // Attempt to process it immediately to trigger predictions
      const data = await res.json();
      if(data.id) {
           await fetch(`${import.meta.env.VITE_API_URL}/files/process/${data.id}`, { method: 'POST' });
           // Refresh page or predictions after short delay
           setTimeout(() => window.location.reload(), 1500);
      }

      setSelectedFile(null);
      setShowFileUploadModal(false);
      // Optionally refresh files list
    } catch (e) {
      console.error("File upload failed", e);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  // ... (other state)

  // Initial Load & Check Onboarding
  useEffect(() => {
    // Check MongoDB for profile instead of localStorage
    const checkProfile = async () => {
      if (!user?.username) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/portal/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) {
          // Profile doesn't exist, show onboarding
          setShowOnboarding(true);
        } else {
           // FIX: Load profile data into state so Health Score can calculate
           const data = await res.json();
           setProfileData(data);
           if(data.weight && data.height) {
              setHealthMetrics({
                age: data.age,
                bmi: (data.weight / (data.height / 100) ** 2).toFixed(1)
              });
           }
        }
      } catch (err) {
        // Error or no profile, show onboarding
        console.error("Profile check failed", err);
        setShowOnboarding(true);
      }
    };

    checkProfile();

    // Listen for custom event from profile page
    const handleTriggerOnboarding = () => {
      setActive("dashboard");
      setShowOnboarding(true);
    };

    window.addEventListener("triggerOnboarding", handleTriggerOnboarding);
    return () =>
      window.removeEventListener("triggerOnboarding", handleTriggerOnboarding);
  }, [user]);

  // Fetch files
  useEffect(() => {
    if (patientId) {
      fetch(`http://localhost:8000/files/patient/${patientId}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setFiles(data))
        .catch((err) => console.error("Files fetch error:", err));
    }
  }, [patientId]);

  // Fetch appointments
  useEffect(() => {
    if (patientId) {
      fetch(
        `http://localhost:8000/frontdesk/appointments?patient_id=${patientId}`
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setAppointments(data))
        .catch((err) => console.error("Appointments fetch error:", err));
    }
  }, [patientId]);

  // Fetch predictions on load
  useEffect(() => {
    const fetchPredictions = async () => {
      if (!patientId) return;

      try {
        // Check MongoDB for latest predictions
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch heart prediction from MongoDB
        const heartRes = await fetch(
          `http://localhost:8000/ml/predictions/heart/${patientId}`,
          { headers }
        );
        if (heartRes.ok) {
          const heartData = await heartRes.json();
          setHeartPrediction(heartData);
        }

        // Fetch diabetes prediction from MongoDB
        const diabetesRes = await fetch(
          `http://localhost:8000/ml/predictions/diabetes/${patientId}`,
          { headers }
        );
        if (diabetesRes.ok) {
          const diabetesData = await diabetesRes.json();
          setDiabetesPrediction(diabetesData);
        }
      } catch (err) {
        console.error("Error fetching predictions:", err);
      }
    };

    fetchPredictions();
  }, [patientId]);

  const handleOnboardingComplete = async (data) => {
    try {
      // 1. Fetch the LATEST full profile from backend (ensures we have processed fields like 'obesity')
      // The modal already saved it, so we just GET it now.
      const token = localStorage.getItem("token");
      const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/portal/profile`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      if(profileRes.ok) {
          const freshProfile = await profileRes.json();
          setProfileData(freshProfile); // Update state triggers Health Score recalc
          setHealthMetrics({
             age: freshProfile.age,
             bmi: (freshProfile.weight / (freshProfile.height / 100) ** 2).toFixed(1)
          });
      }

      // 2. Fetch NEW Predictions (since profile changed)
      // Heart
      const heartRes = await fetch(`${import.meta.env.VITE_API_URL}/ml/predictions/heart/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      if (heartRes.ok) setHeartPrediction(await heartRes.json());

      // Diabetes
      const diabetesRes = await fetch(`${import.meta.env.VITE_API_URL}/ml/predictions/diabetes/${patientId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (diabetesRes.ok) setDiabetesPrediction(await diabetesRes.json());
      
      setShowOnboarding(false);
      // NO RELOAD - State updates handle it
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
      // Fallback if fetch fails
      window.location.reload(); 
    }
  };

  // ... (rest of useEffects)

  return (
    <DashboardLayout title="Patient Dashboard" role="patient">
      {/* Main Content Container with overflow fix */}
      <Box
        sx={{ width: "100%", maxWidth: "100vw", mb: 8, overflowX: "hidden" }}
      >
        <AnimatePresence mode="wait">
          {active === "appointments" ? (
            // ... (AppointmentsPage)
            <AppointmentsSection
              appointments={appointments}
              doctors={doctors}
              onRequest={() => setShowAppointmentModal(true)}
              onChat={(doctorId) => {
                    // ChatInterface expects a User Object, not just a string ID
                    const doc = doctors.find(d => d.username === doctorId || d.id === doctorId);
                    setChatPartner(doc || { username: doctorId, id: doctorId });
                    setChatOpen(true);
                }}
            />
          ) : active === "resources" ? (
            // ... (Resources)
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* ... Resource Header ... */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                  borderRadius: "16px",
                  padding: "2rem",
                  marginBottom: "2rem",
                  color: "white",
                  boxShadow: "0 10px 40px rgba(139, 92, 246, 0.3)",
                }}
              >
                <h1
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    marginBottom: "0.5rem",
                  }}
                >
                  📊 Hospital Resource Forecast
                </h1>
                <p style={{ fontSize: "1rem", opacity: 0.9 }}>
                  View projected bed and oxygen availability
                </p>
              </motion.div>
              <PatientResourceForecast />
            </motion.div>
          ) : active === "chat" ? (
            <PatientChat patientId={patientId} />
          ) : active === "notifications" ? (
            <PatientNotifications patientId={patientId} />
          ) : active === "dashboard" ? (
            // ... (Dashboard Main)
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* ... Welcome Header ... */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  borderRadius: "16px",
                  padding: "2rem",
                  marginBottom: "2rem",
                  color: "white",
                  boxShadow: "0 10px 40px rgba(59, 130, 246, 0.3)",
                }}
              >
                <h1
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    marginBottom: "0.5rem",
                  }}
                >
                  Welcome back, {user?.name || user?.username}! 👋
                </h1>
                <p style={{ fontSize: "1rem", opacity: 0.9 }}>
                  Here's your health overview
                </p>
              </motion.div>

              {/* Risk Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <RiskCard
                  title="Diabetes Risk"
                  icon="🩺"
                  value={
                    diabetesPrediction?.probability !== undefined && diabetesPrediction?.probability !== null
                      ? (diabetesPrediction.probability < 0.01 
                          ? "< 1%" 
                          : `${(diabetesPrediction.probability * 100).toFixed(0)}%`)
                      : "N/A"
                  }
                  level={diabetesLevel.label}
                  colorProp={diabetesLevel}
                  sub="Based on recent tests"
                  delay={0.2}
                />
                <RiskCard
                  title="Heart Disease Risk"
                  icon="❤️"
                  value={
                    heartPrediction
                      ? `${(heartPrediction.probability * 100).toFixed(0)}%`
                      : "N/A"
                  }
                  level={heartLevel.label}
                  colorProp={heartLevel}
                  sub="Based on vitals"
                  delay={0.3}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => setShowOnboarding(true)}
                  style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "1.5rem",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, width: '100%', height: '8px', 
                      background: `linear-gradient(90deg, ${healthScore > 80 ? '#10b981' : healthScore > 50 ? '#f59e0b' : '#ef4444'} 0%, #10b981 100%)` 
                  }} />
                  
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Health Score</h3>
                      <div style={{ padding: "8px", background: "#f1f5f9", borderRadius: "50%" }}>
                         <span style={{ fontSize: "1.2rem" }}>💊</span>
                      </div>
                  </div>

                  <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* Circular Progress Background */}
                      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="70" cy="70" r="60" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                          <circle 
                              cx="70" cy="70" r="60" 
                              stroke={healthScore > 80 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444"} 
                              strokeWidth="12" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 60} 
                              strokeDashoffset={2 * Math.PI * 60 * (1 - healthScore / 100)} 
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                          />
                      </svg>
                      <div style={{ position: "absolute", textAlign: "center" }}>
                          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{healthScore}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>/ 100</div>
                      </div>
                  </div>
                  
                  <div style={{ marginTop: "1rem", textAlign: "center" }}>
                      <div style={{ 
                          alignItems: "center", gap: "0.5rem", justifyContent: "center",
                          color: healthScore > 80 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444",
                          fontWeight: 700, fontSize: "0.9rem"
                      }}>
                          {healthScore > 80 ? "Excellent" : healthScore > 50 ? "Needs Attention" : "Action Required"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>Tap to analyze</div>
                  </div>
                </motion.div>
              </div>

              {/* Files Section ... */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "2rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  marginBottom: "2rem",
                }}
              >
                {/* ... (Existing File Upload Logic) ... */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h2
                    style={{
                      color: "#1e293b",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                    }}
                  >
                    📁 My Medical Files
                  </h2>
                  <button
                    onClick={() => setShowFileUploadModal(true)}
                    style={{
                      padding: "0.5rem 1.5rem",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Upload New
                  </button>
                </div>
                {files.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#94a3b8",
                    }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                      📄
                    </div>
                    <p>No files uploaded yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          padding: "1rem",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>
                            {file.filename}
                          </div>
                          <div
                            style={{ fontSize: "0.875rem", color: "#64748b" }}
                          >
                            {new Date(file.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                        <a
                          href={`http://localhost:8000/files/download/${file.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#3b82f6",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <PrescriptionManager patientId={patientId} />
              <MedicalReportGenerator 
                patientId={patientId} 
                patientName={user?.username}
                onGenerate={handleGenerateReport}
              />
            </motion.div>
          ) : (
            <ProfileSection user={user} onSignOut={handleSignOut} />
          )}
        </AnimatePresence>
      </Box>

      {showFileUploadModal && (
        <FileUploadModal
          onClose={() => setShowFileUploadModal(false)}
          onUpload={handleFileUpload}
          setSelectedFile={setSelectedFile}
          selectedFile={selectedFile}
          uploadingFile={uploadingFile}
        />
      )}

      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        user={user}
        onComplete={handleOnboardingComplete}
      />

      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          bgcolor: "white",
          borderRadius: 10,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          p: 1,
          zIndex: 1000,
          display: "flex",
          gap: 1,
        }}
      >
        <NavBtn
          label="Dashboard"
          active={active === "dashboard"}
          onClick={() => setActive("dashboard")}
          icon="🏠"
        />
        <NavBtn
          label="Appointments"
          active={active === "appointments"}
          onClick={() => setActive("appointments")}
          icon="📅"
        />
        <NavBtn
          label="Resources"
          active={active === "resources"}
          onClick={() => setActive("resources")}
          icon="📊"
        />
        <NavBtn
          label="AI Chat"
          active={active === "chat"}
          onClick={() => setActive("chat")}
          icon="🤖"
        />
        <NavBtn
          label="Alerts"
          active={active === "notifications"}
          onClick={() => setActive("notifications")}
          icon="🔔"
        />
        <NavBtn
          label="Profile"
          active={active === "profile"}
          onClick={() => setActive("profile")}
          icon="👤"
        />
      </Box>

      <AppointmentModal 
         open={showAppointmentModal} 
         onClose={() => setShowAppointmentModal(false)} 
         onSubmit={handleAppointmentRequest}
         doctors={doctors}
      />
      <AppointmentModal 
         open={showAppointmentModal} 
         onClose={() => setShowAppointmentModal(false)} 
         onSubmit={handleAppointmentRequest}
         doctors={doctors}
      />

      {/* Secure Chat Interface */}
      {chatOpen && chatPartner && (
          <ChatInterface 
              currentUser={user}
              otherUser={chatPartner}
              onClose={() => setChatOpen(false)}
          />
      )}

      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.type || 'info'} sx={{ width: '100%' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

const FileUploadModal = ({
  onClose,
  onUpload,
  setSelectedFile,
  selectedFile,
  uploadingFile,
}) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "2rem",
        borderRadius: "16px",
        width: "400px",
      }}
    >
      <h3>Upload File</h3>
      <input
        type="file"
        onChange={(e) => setSelectedFile(e.target.files[0])}
        style={{ marginBottom: "1rem" }}
      />
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button
          onClick={onUpload}
          disabled={!selectedFile || uploadingFile}
          style={{
            padding: "0.5rem 1rem",
            background: "#3b82f6",
            color: "white",
            borderRadius: "4px",
            border: "none",
          }}
        >
          Upload
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "0.5rem 1rem",
            background: "#e2e8f0",
            borderRadius: "4px",
            border: "none",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// --- New Components ---

const AppointmentsSection = ({ appointments, doctors, onRequest, onChat }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>🗓️ My Appointments</h2>
                <p style={{ color: '#64748b' }}>Track your upcoming and past visits</p>
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRequest}
                style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                <span>➕</span> New Appointment
            </motion.button>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {appointments.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', padding: '4rem', 
                    background: 'white', borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📅</div>
                    <h3 style={{ color: '#94a3b8' }}>No appointments scheduled</h3>
                </div>
            ) : (
                appointments.map((appt, i) => (
                    <motion.div
                        key={appt.id || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            position: 'relative',
                            borderLeft: `6px solid ${appt.status === 'Confirmed' ? '#10b981' : appt.status === 'Requested' ? '#f59e0b' : '#3b82f6'}`,
                            overflow: 'hidden'
                        }}
                    >
                         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ 
                                background: '#f8fafc', padding: '1rem', borderRadius: '16px',
                                textAlign: 'center', minWidth: '80px'
                            }}>
                                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                                    {new Date(appt.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                                    {new Date(appt.date).getDate()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    {new Date(appt.date).toLocaleString('default', { weekday: 'short' })}
                                </div>
                            </div>
                            
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                                    {appt.type === 'Online' ? '🎥 Teleconsultation' : '🏥 In-Person Visit'}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>with</span>
                                    <span style={{ fontWeight: 600, color: '#3b82f6' }}>Dr. {appt.doctor_id}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    "{appt.reason}"
                                </div>
                            </div>
                         </div>

                         <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                                display: 'inline-block',
                                padding: '0.5rem 1rem', 
                                borderRadius: '30px', 
                                fontSize: '0.85rem', fontWeight: 700,
                                background: appt.status === 'Confirmed' ? '#dcfce7' : '#fef3c7',
                                color: appt.status === 'Confirmed' ? '#166534' : '#b45309',
                                marginBottom: '0.5rem'
                            }}>
                                {appt.status.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                                {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                             {appt.meet_url && (
                                <a 
                                    href={appt.meet_url} target="_blank" rel="noreferrer"
                                    style={{ 
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                        marginTop: '0.5rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none'
                                    }}
                                >
                                    <span>👉 Join Meet</span>
                                </a>
                            )}
                       <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            let docId = appt.doctor_id || appt.doctor;
                            // Check for "undefined" string literal which can happen if data is corrupted
                            if (docId === "undefined" || docId === "null") docId = null;
                            
                            if (!docId) {
                                alert("Error: No doctor ID found for this appointment. ID is: " + (appt.doctor_id || appt.doctor));
                                return;
                            }
                            onChat(docId);
                        }}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                        }}
                    >
                        💬 Message Doctor
                    </motion.button>
               </div>
                         </div>
                    </motion.div>
                ))
            )}
        </div>
    </motion.div>
  );
};

const NavBtn = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: "0.5rem 1rem",
      background: active ? "#3b82f6" : "transparent",
      color: active ? "white" : "#64748b",
      border: "none",
      borderRadius: "20px",
      fontWeight: "bold",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.2s",
    }}
  >
    <span>{icon}</span>
    {active && <span>{label}</span>}
  </button>
);

const RiskCard = ({ title, icon, value, level, colorProp, sub, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    whileHover={{
      scale: 1.05,
      y: -10,
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    }}
    style={{
      background: `linear-gradient(135deg, ${colorProp.bg}15 0%, ${colorProp.bg}08 100%)`,
      borderRadius: "20px",
      padding: "2rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      border: `3px solid ${colorProp.bg}40`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Standardized Top Border */}
    <div style={{ 
        position: 'absolute', 
        top: 0, left: 0, width: '100%', height: '8px', 
        background: `linear-gradient(90deg, ${colorProp.color} 0%, ${colorProp.bg} 100%)` 
    }} />

    {/* Decorative gradient overlay */}
    <div
      style={{
        position: "absolute",
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        background: `radial-gradient(circle, ${colorProp.bg}20 0%, transparent 70%)`,
        borderRadius: "50%",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        position: "relative",
        zIndex: 1,
      }}
    >
      <h3 style={{ color: "#1e293b", fontSize: "1.2rem", fontWeight: 800 }}>
        {title}
      </h3>
      <motion.span
        style={{ fontSize: "2.5rem" }}
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        {icon}
      </motion.span>
    </div>
    <div
      style={{
        textAlign: "center",
        padding: "1.5rem 0",
        position: "relative",
        zIndex: 1,
      }}
    >
      <motion.div
        style={{
          fontSize: "3.5rem",
          fontWeight: 900,
          color: colorProp.color, // Solid color instead of gradient clip
          marginBottom: "0.75rem",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: "spring" }}
      >
        {value}
      </motion.div>
      <motion.div
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          borderRadius: "25px",
          background: `linear-gradient(135deg, ${colorProp.color} 0%, ${colorProp.bg} 100%)`,
          color: "white",
          fontWeight: 700,
          fontSize: "0.95rem",
          boxShadow: `0 4px 15px ${colorProp.bg}40`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {level} Risk
      </motion.div>
    </div>
    {sub && (
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "rgba(255,255,255,0.8)",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "#475569",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {sub}
        </p>
      </div>
    )}
  </motion.div>
);

function ProfileSection({ user, onSignOut }) {
  const [profileData, setProfileData] = React.useState(null);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = React.useState(false);

  React.useEffect(() => {
    // Fetch profile data from MongoDB
    const fetchProfile = async () => {
      if (!user?.username) return;

      try {
        const res = await fetch("http://localhost:8000/portal/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setProfileData(data); // Set full profile data
          setShowOnboardingPrompt(false); // Valid profile found -> Hide prompt
        } else {
          setShowOnboardingPrompt(true);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setShowOnboardingPrompt(true);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          color: "white",
          boxShadow: "0 10px 40px rgba(99, 102, 241, 0.3)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👤</div>
        <h1
          style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}
        >
          {user?.name || user?.username}
        </h1>
        <p style={{ fontSize: "1rem", opacity: 0.9 }}>
          Patient ID: {user?.username}
        </p>
      </div>

      {/* Onboarding Prompt */}
      {showOnboardingPrompt && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
            border: "2px solid #fbbf24",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#78350f",
              marginBottom: "0.5rem",
            }}
          >
            Complete Your Profile
          </h3>
          <p style={{ color: "#92400e", marginBottom: "1rem" }}>
            Please complete the health assessment on the dashboard to unlock
            your full profile with health metrics, vitals, and personalized
            insights.
          </p>
          <button
            onClick={() => {
              // Navigate to dashboard and trigger onboarding
              const event = new CustomEvent("triggerOnboarding");
              window.dispatchEvent(event);
            }}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Complete Assessment
          </button>
        </div>
      )}

      {/* Profile Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Account Info */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "#1e293b",
            }}
          >
            📧 Account Info
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>Email:</span>
              <span style={{ color: "#1e293b", fontWeight: 700 }}>
                {user?.email || "Not set"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>Role:</span>
              <span style={{ color: "#1e293b", fontWeight: 700 }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Health Profile */}
        {profileData && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
                color: "#1e293b",
              }}
            >
              🏥 Health Profile
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                }}
              >
                <span style={{ color: "#0369a1", fontWeight: 600 }}>Age:</span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>
                  {profileData.age} years
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                }}
              >
                <span style={{ color: "#0369a1", fontWeight: 600 }}>
                  Gender:
                </span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>
                  {profileData.gender}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                }}
              >
                <span style={{ color: "#0369a1", fontWeight: 600 }}>BMI:</span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>
                  {(
                    profileData.weight /
                    (profileData.height / 100) ** 2
                  ).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vitals Section */}
      {profileData && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "#1e293b",
            }}
          >
            📊 Latest Vitals
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            {profileData.systolic_bp && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Blood Pressure
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {profileData.systolic_bp}/{profileData.diastolic_bp}
                </div>
              </div>
            )}
            {profileData.heart_rate && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Heart Rate
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {profileData.heart_rate} bpm
                </div>
              </div>
            )}
            {profileData.temperature && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Temperature
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {profileData.temperature}°C
                </div>
              </div>
            )}
            {profileData.glucose && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Glucose
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {profileData.glucose} mg/dL
                </div>
              </div>
            )}
            {profileData.cholesterol && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Cholesterol
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {profileData.cholesterol} mg/dL
                </div>
              </div>
            )}
            {profileData.oxygen_level && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Oxygen (SpO2)
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {profileData.oxygen_level}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <MedicalHistoryManager conditions={profileData?.conditions} />

      {/* Symptoms & Additional Info */}
      {profileData && (
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.5rem", color: "#1e293b" }}>
          ⚠️ Reported Symptoms
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
           {[
             { k: 'polyuria', l: 'Frequent Urination' },
             { k: 'polydipsia', l: 'Excessive Thirst' },
             { k: 'polyphagia', l: 'Excessive Hunger' },
             { k: 'sudden_weight_loss', l: 'Sudden Weight Loss' },
             { k: 'weakness', l: 'Weakness' },
             { k: 'visual_blurring', l: 'Blurred Vision' },
             { k: 'genital_thrush', l: 'Genital Thrush' },
             { k: 'itching', l: 'Itching' },
             { k: 'irritability', l: 'Irritability' },
             { k: 'delayed_healing', l: 'Delayed Healing' },
             { k: 'muscle_stiffness', l: 'Muscle Stiffness' },
             { k: 'alopecia', l: 'Hair Loss' }
           ].map(sym => 
              (profileData[sym.k] === 1 || profileData[sym.k] === "1") && (
               <span key={sym.k} style={{ 
                   padding: "0.5rem 1rem", 
                   background: "#fff1f2", 
                   color: "#be123c", 
                   borderRadius: "20px",
                   fontSize: "0.9rem",
                   fontWeight: 600,
                   border: "1px solid #fda4af"
               }}>
                  {sym.l}
               </span>
           ))}
           {/* If no symptoms found */}
           {![
             'polyuria','polydipsia','polyphagia','sudden_weight_loss','weakness','visual_blurring',
             'genital_thrush','itching','irritability','delayed_healing','muscle_stiffness','alopecia'
           ].some(k => profileData[k] == 1) && (
             <span style={{ color: "#64748b", fontStyle: "italic" }}>No specific symptoms reported.</span>
           )}
        </div>
      </div>
      )}

      {/* Lifestyle Section */}
      {profileData && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "#1e293b",
            }}
          >
            🌿 Lifestyle
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                background:
                  profileData.smoking === "No" ? "#dcfce7" : "#fee2e2",
                color: profileData.smoking === "No" ? "#166534" : "#991b1b",
                borderRadius: "20px",
                fontWeight: 700,
              }}
            >
              🚭 Smoking: {profileData.smoking}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                background: "#dbeafe",
                color: "#1e40af",
                borderRadius: "20px",
                fontWeight: 700,
              }}
            >
              🍷 Alcohol: {profileData.alcohol}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                background: "#f0f9ff",
                color: "#0369a1",
                borderRadius: "20px",
                fontWeight: 700,
              }}
            >
              🏃 Activity: {profileData.activity_level}
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        style={{
          width: "100%",
          padding: "1.25rem",
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: "1.1rem",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(239, 68, 68, 0.3)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
      >
        🚪 Sign Out
      </button>
    </motion.div>
  );
}
