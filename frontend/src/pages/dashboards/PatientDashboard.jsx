import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
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
import { useAuth } from "../../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

export default function PatientDashboard() {
  const { user } = useAuth();
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

      const res = await fetch("http://localhost:8000/frontdesk/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (res.ok) {
        alert("Appointment requested successfully!");
        // Refresh appointments
        const updated = await fetch(
          `http://localhost:8000/frontdesk/appointments?patient_id=${patientId}`
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
         "http://localhost:8000/reports/generate", 
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
  const diabetesRisk =
    diabetesPrediction?.probability > 0.5
      ? { color: "#ef4444", bg: "#fee2e2" }
      : { color: "#059669", bg: "#dcfce7" };
  const heartRisk =
    heartPrediction?.probability > 0.5
      ? { color: "#ef4444", bg: "#fee2e2" }
      : { color: "#2563eb", bg: "#dbeafe" };

  // Health metrics and score
  const [healthMetrics, setHealthMetrics] = useState({ age: null, bmi: null });
  const [healthScore, setHealthScore] = useState(72); // Files and upload modal state
  const [files, setFiles] = useState([]);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async () => {
    if (!selectedFile || !patientId) return;
    try {
      setUploadingFile(true);
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("patient_id", patientId);
      await fetch("http://localhost:8000/files/upload", {
        method: "POST",
        body: form,
      });
      setSelectedFile(null);
      setShowFileUploadModal(false);
      // Optionally refresh files list
    } catch (e) {
      console.error("File upload failed", e);
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
        const res = await fetch(`http://localhost:8000/portal/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) {
          // Profile doesn't exist, show onboarding
          setShowOnboarding(true);
        }
      } catch (err) {
        // Error or no profile, show onboarding
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
      // Save to MongoDB via API
      const res = await fetch("http://localhost:8000/portal/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      // Update local state to reflect new data
      setHealthMetrics({
        age: data.age,
        bmi: (data.weight / (data.height / 100) ** 2).toFixed(1),
      });

      setShowOnboarding(false);

      // Trigger a re-fetch of predictions (since we just seeded them in the modal)
      window.location.reload(); // Simple refresh to fetch new "seeded" predictions
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
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
                    diabetesPrediction
                      ? `${(diabetesPrediction.probability * 100).toFixed(0)}%`
                      : "N/A"
                  }
                  level={diabetesPrediction?.probability > 0.5 ? "High" : "Low"}
                  colorProp={diabetesRisk}
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
                  level={heartPrediction?.probability > 0.5 ? "High" : "Low"}
                  colorProp={heartRisk}
                  sub="Based on vitals"
                  delay={0.3}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                    color: "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                      Health Score
                    </h3>
                    <span style={{ fontSize: "2rem" }}>⭐</span>
                  </div>
                  <div style={{ textAlign: "center", padding: "1rem 0" }}>
                    <div
                      style={{
                        fontSize: "3rem",
                        fontWeight: 800,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {healthScore}
                    </div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                      Out of 100
                    </div>
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

const AppointmentsSection = ({ appointments, doctors, onRequest }) => {
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
          background: `linear-gradient(135deg, ${colorProp.color} 0%, ${colorProp.bg} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
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
          setProfileData(data);
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
          </div>
        </div>
      )}

      <MedicalHistoryManager />

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
