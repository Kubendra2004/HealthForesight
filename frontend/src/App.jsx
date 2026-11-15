import React, { lazy, Suspense } from "react";
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
import "./index.css";

const PatientDashboard = lazy(() => import("./pages/dashboards/PatientDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const DoctorDashboard = lazy(() => import("./pages/dashboards/DoctorDashboard"));
const FrontdeskDashboard = lazy(() => import("./pages/dashboards/FrontdeskDashboard"));

function WorkspaceLoading() {
  return <div className="workspace-loading" role="status">Loading your workspace…</div>;
}

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
              <Route path="/dashboard/patient" element={<Suspense fallback={<WorkspaceLoading />}><RoleRoute role="patient"><PatientDashboard /></RoleRoute></Suspense>} />
              <Route path="/dashboard/doctor" element={<Suspense fallback={<WorkspaceLoading />}><RoleRoute role="doctor"><DoctorDashboard /></RoleRoute></Suspense>} />
              <Route path="/dashboard/admin" element={<Suspense fallback={<WorkspaceLoading />}><RoleRoute role="admin"><AdminDashboard /></RoleRoute></Suspense>} />
              <Route
                path="/dashboard/frontdesk"
                element={<Suspense fallback={<WorkspaceLoading />}><RoleRoute role="frontdesk"><FrontdeskDashboard /></RoleRoute></Suspense>}
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
