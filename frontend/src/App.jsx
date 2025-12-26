import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import FrontdeskDashboard from './pages/dashboards/FrontdeskDashboard';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes - Dashboards */}
            <Route path="/dashboard/patient" element={<PatientDashboard />} />
            <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/frontdesk" element={<FrontdeskDashboard />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}

export default App;
