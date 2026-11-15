import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import FrontdeskDashboard from "./pages/dashboards/FrontdeskDashboard";
import "./index.css";

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const fallback = user.role ? `/dashboard/${user.role}` : "/login";
    return <Navigate to={fallback} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes - Dashboards */}
              <Route path="/dashboard/patient" element={<RoleRoute role="patient"><PatientDashboard /></RoleRoute>} />
              <Route path="/dashboard/doctor" element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />
              <Route path="/dashboard/admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
              <Route
                path="/dashboard/frontdesk"
                element={<RoleRoute role="frontdesk"><FrontdeskDashboard /></RoleRoute>}
              />

              {/* Fallback */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </AnimatePresence>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
