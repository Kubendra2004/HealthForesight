import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// Chart.js registration for the new Resources Section (copied from PatientDashboard)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend as ChartJSLegend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  ChartJSLegend
);

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

// Glassmorphism Style Constant
const glassStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)"
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState("overview");

  // Sliding Navigation Component
  const SlidingNav = ({ active, onChange }) => {
    const tabs = [
        { id: "overview", label: "Overview", icon: "📊" },
        { id: "users", label: "Users", icon: "👥" },
        { id: "audit", label: "Audit", icon: "🛡️" },
        { id: "resources", label: "Resources", icon: "🏥" },
        { id: "tools", label: "Tools", icon: "🛠️" },
        { id: "reports", label: "Reports", icon: "📈" },
        { id: "profile", label: "Profile", icon: "👤" },
    ];

    return (
        <Box sx={{ 
            position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', 
            bgcolor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)',
            borderRadius: 50, p: 0.75, display: 'flex', gap: 0.5,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 1000,
            border: '1px solid rgba(255,255,255,0.5)'
        }}>
            {tabs.map((tab) => (
                <Box 
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    sx={{ 
                        position: 'relative', 
                        px: 2.5, py: 1.25, 
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 1,
                        zIndex: 1,
                        color: active === tab.id ? '#fff' : '#64748b',
                        fontWeight: 700,
                        transition: 'color 0.2s',
                        userSelect: 'none'
                    }}
                >
                    {active === tab.id && (
                        <motion.div
                            layoutId="active-pill"
                            style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                borderRadius: 30,
                                zIndex: -1,
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span style={{ fontSize: "1.2rem" }}>{tab.icon}</span>
                    <span style={{ fontSize: "0.9rem" }}>{tab.label}</span>
                </Box>
            ))}
        </Box>
    );
  };

  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <Box sx={{ width: "100%", maxWidth: "100%", mb: 10, overflowX: "hidden", mt: -2 }}>
        <AnimatePresence mode="wait">
          {active === "overview" && <OverviewSection key="overview" setActive={setActive} />}
          {active === "users" && <UserManagementSection key="users" />}
          {active === "audit" && <AuditLogsSection key="audit" />}
          {active === "reports" && <ReportsSection key="reports" />}
          {active === "resources" && <ResourcesSection key="resources" />}
          {active === "tools" && <ToolsSection key="tools" />}
          {active === "profile" && <ProfileSection key="profile" />}
        </AnimatePresence>
      </Box>

      <SlidingNav active={active} onChange={setActive} />
      
      {/* Notifications/Alerts */}
      <ToolsNotification />
    </DashboardLayout>
  );
}

// Global Notification Helper (simplified for now)
const ToolsNotification = () => {
  // In a real app, use a context or global state
  return null;
}



const SectionHeader = ({ title, subtitle, color }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    style={{
      background: color || "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      borderRadius: "16px",
      padding: "2rem",
      marginBottom: "2rem",
      color: "white",
      boxShadow: "0 10px 40px rgba(59, 130, 246, 0.3)",
    }}
  >
    <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>{title}</h1>
    <p style={{ fontSize: "1rem", opacity: 0.9 }}>{subtitle}</p>
  </motion.div>
);

const OverviewSection = ({ setActive }) => {
  const [stats, setStats] = useState([
      { title: "Total Users", value: "...", icon: "👥", color: "#3b82f6" },
      { title: "Appointments", value: "...", icon: "🏥", color: "#10b981" },
      { title: "Active Doctors", value: "...", icon: "👨‍⚕️", color: "#8b5cf6" },
      { title: "Pending Appts", value: "...", icon: "🕒", color: "#f59e0b" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/overview-stats`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
            const data = await res.json();
            setStats([
                { title: "Total Users", value: data.total_users, icon: "👥", color: "#3b82f6" },
                { title: "Total Appts", value: data.total_appointments, icon: "🏥", color: "#10b981" },
                { title: "Active Doctors", value: data.active_doctors, icon: "👨‍⚕️", color: "#8b5cf6" },
                { title: "Pending Appts", value: data.pending_appointments, icon: "🕒", color: "#f59e0b" },
            ]);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };
    fetchStats();
  }, []);

  const actions = [
      { title: "User Management", desc: "Manage patients, doctors, and staff accounts", icon: "👥", color: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", onClick: () => setActive("users") },
      { title: "System Audit", desc: "View security logs and access history", icon: "🛡️", color: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)", onClick: () => setActive("audit") },
      { title: "Model Reports", desc: "Check ML model performance and accuracy", icon: "📈", color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", onClick: () => setActive("reports") },
      { title: "Quick Export", desc: "Download User and Patient data CSVs", icon: "📂", color: "linear-gradient(135deg, #10b981 0%, #059669 100%)", onClick: () => setActive("users") },
      { title: "Hospital Resources", desc: "Track Beds, Oxygen, and ICU availability", icon: "🏥", color: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", onClick: () => setActive("resources") },
      { title: "Admin Tools", desc: "Announcements and System Maintenance", icon: "🛠️", color: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", onClick: () => setActive("tools") }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      {/* Adjusted header margins */}
      <SectionHeader title="System Overview" subtitle="Real-time insights into hospital operations" />
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={`stat-${index}`}>
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  ...glassStyle,
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}
             >
                <div style={{ 
                    width: 50, height: 50, borderRadius: "12px", 
                    background: `${stat.color}20`, display: "flex", 
                    alignItems: "center", justifyContent: "center",
                    fontSize: "1.5rem"
                }}>
                    {stat.icon}
                </div>
                <div>
                   <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600 }}>{stat.title}</div>
                   <div style={{ color: "#1e293b", fontSize: "1.5rem", fontWeight: 800 }}>{stat.value}</div>
                </div>
             </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {actions.map((action, index) => (
             <Grid item xs={12} sm={6} md={3} key={`action-${index}`}>
                <ActionCard 
                    title={action.title} 
                    desc={action.desc}
                    icon={action.icon}
                    color={action.color}
                    onClick={action.onClick}
                />
             </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

const ActionCard = ({ title, desc, icon, color, onClick }) => (
    <motion.div
        whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
            ...glassStyle,
            padding: "1.5rem",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            height: "100%", 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
        }}
    >
        <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ 
                width: 48, height: 48, borderRadius: "12px", // Reduced size
                background: color, marginBottom: "0.75rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "1.5rem", boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.25rem" }}>{title}</h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>{desc}</p>
        </div>
    </motion.div>
);

const UserManagementSection = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0); // 0: All, 1: Patient, 2: Doctor, 3: Admin
    
    // Edit Modal State
    const [editOpen, setEditOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: "", email: "", role: "", is_active: true });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        fetch("http://localhost:8000/admin/users", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
            setUsers(data);
            setLoading(false);
        })
        .catch(err => setLoading(false));
    };

    const handleExport = (type, format = "csv") => {
        const token = localStorage.getItem("token");
        
        let roleFilter = "";
        if (tabValue === 1) roleFilter = "&role=patient";
        else if (tabValue === 2) roleFilter = "&role=doctor";
        else if (tabValue === 3) roleFilter = "&role=staff";
        
        const url = `${import.meta.env.VITE_API_URL}/admin/export/${type}?format=${format}${roleFilter}`;
        
        fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${roleFilter ? roleFilter.replace('&role=', '') + '_' : ''}${type}_export.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(err => alert("Export failed: " + err));
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Filter users based on tab
    const getFilteredUsers = () => {
        if (tabValue === 0) return users;
        if (tabValue === 1) return users.filter(u => u.role === 'patient');
        if (tabValue === 2) return users.filter(u => u.role === 'doctor');
        if (tabValue === 3) return users.filter(u => u.role === 'admin' || u.role === 'frontdesk'); // Group staff
        return users;
    };

    // Generate custom ID based on role index (e.g. 1, 2, 3)
    const getCustomId = (user, index) => {
        return index + 1; 
    };

    const handleEditClick = (user) => {
        setCurrentUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role,
            is_active: user.is_active
        });
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${currentUser.id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}` 
                },
                body: JSON.stringify(editForm)
            });
            
            if (res.ok) {
                setEditOpen(false);
                fetchUsers(); // Refresh list
            } else {
                alert("Failed to update user");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating user");
        }
    };

    const filteredUsers = getFilteredUsers();

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <SectionHeader 
                title="User Management" 
                subtitle="View, manage, and edit user accounts" 
                color="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" 
            />
            
            <Box sx={{ ...glassStyle, borderRadius: 4, p: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 'bold' } }}>
                    <Tab label="All Users" />
                    <Tab label="Patients" />
                    <Tab label="Doctors" />
                    <Tab label="Staff" />
                </Tabs>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => handleExport("users", "csv")}>
                        Export {tabValue === 0 ? "All" : tabValue === 1 ? "Patients" : tabValue === 2 ? "Doctors" : "Staff"} CSV
                    </Button>
                    <Button variant="contained" size="small" onClick={() => handleExport("users", "pdf")} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
                        Export {tabValue === 0 ? "All" : tabValue === 1 ? "Patients" : tabValue === 2 ? "Doctors" : "Staff"} PDF
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ ...glassStyle, borderRadius: 4, maxHeight: '60vh', background: 'transparent' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Custom ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Role</TableCell>
                            {tabValue === 2 && <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Specialization</TableCell>}
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user, i) => (
                            <TableRow key={user.id} hover component={motion.tr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                                <TableCell sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                                    {getCustomId(user, i)}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                            {(user.username && !user.username.startsWith('eyJ')) ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                                        </div>
                                        {/* Heuristic to detect JWT token as username and fallback to email prefix */}
                                        {(user.username && user.username.startsWith('eyJ')) 
                                            ? <span title={user.username}>{user.email.split('@')[0]} (Fixed)</span> 
                                            : user.username}
                                    </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip label={user.role} size="small" 
                                        sx={{ 
                                            bgcolor: user.role === 'admin' ? '#fce7f3' : user.role === 'doctor' ? '#dbeafe' : '#f1f5f9',
                                            color: user.role === 'admin' ? '#be185d' : user.role === 'doctor' ? '#1e40af' : '#475569',
                                            fontWeight: 600
                                        }} 
                                    />
                                </TableCell>
                                {tabValue === 2 && (
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {user.specialization || '-'}
                                        </Typography>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Chip label={user.is_active ? "Active" : "Inactive"} size="small" color={user.is_active ? "success" : "default"} variant="dot" />
                                </TableCell>
                                <TableCell>
                                    <Button size="small" variant="text" onClick={() => handleEditClick(user)}>Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit User Modal */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                             <TextField fullWidth label="Username" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} />
                        </Grid>
                        <Grid item xs={12}>
                             <TextField fullWidth label="Email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select value={editForm.role} label="Role" onChange={(e) => setEditForm({...editForm, role: e.target.value})}>
                                    <MenuItem value="patient">Patient</MenuItem>
                                    <MenuItem value="doctor">Doctor</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="frontdesk">Frontdesk</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select value={editForm.is_active} label="Status" onChange={(e) => setEditForm({...editForm, is_active: e.target.value})}>
                                    <MenuItem value={true}>Active</MenuItem>
                                    <MenuItem value={false}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained" color="primary">Save Changes</Button>
                </DialogActions>
            </Dialog>

        </motion.div>
    );
};

const AuditLogsSection = () => {
    const [logs, setLogs] = useState([]);
    
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/audit/logs`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
            const allLogs = data.logs || [];
            // Filter out logs from 'admin' users as per request
            const userLogs = allLogs.filter(log => !log.user || !log.user.toLowerCase().includes('admin'));
            setLogs(userLogs);
        }) 
        .catch(err => console.error(err));
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <SectionHeader 
                title="Audit Logs" 
                subtitle="Security and access logs" 
                color="linear-gradient(135deg, #ec4899 0%, #db2777 100%)" 
            />
            
            <Box sx={{ ...glassStyle, width: '100%', overflowX: 'auto', borderRadius: 4 }}>
                <TableContainer component={Paper} sx={{ minWidth: 800, background: 'transparent', boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.length === 0 ? (
                            <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>No logs found</TableCell>
                            </TableRow>
                            ) : logs.map((log, i) => (
                                <TableRow key={i} hover>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{log.user || 'Anonymous'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={log.method} 
                                            size="small" 
                                            color={log.method === 'GET' ? 'primary' : log.method === 'DELETE' ? 'error' : 'warning'} 
                                            variant="outlined" 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{log.endpoint}</Typography>
                                            {log.status_code && <Typography variant="caption" color={log.status_code >= 400 ? 'error' : 'text.secondary'}>Status: {log.status_code}</Typography>}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip_address}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </motion.div>
    );
};

const ReportsSection = () => {
    const [models, setModels] = useState([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/models/stats`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        .then(res => res.json())
        .then(data => setModels(data))
        .catch(err => console.error(err));
    }, []);

    const chartData = (models || []).map(m => ({
        name: m.name ? m.name.split(' ')[0] : 'Unknown',
        fullName: m.name,
        accuracy: parseFloat(m.accuracy) || 0,
        type: m.type
    }));

    const handleRetrain = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/admin/models/retrain?model_name=heart`, { 
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            alert("Model retraining started!");
        } catch (e) {
            alert("Error starting retraining");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <SectionHeader 
                title="Model Performance" 
                subtitle="Accuracy metrics for predictive models" 
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" 
            />
            
            <Card sx={{ ...glassStyle, p: 3, mb: 4, height: 400 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Accuracy Comparison</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey="accuracy" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={50}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.type === 'Disease' ? '#f59e0b' : entry.type === 'Resource' ? '#3b82f6' : '#8b5cf6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            
            <Grid container spacing={3}>
                {(models || []).map((model, i) => (
                    <Grid item xs={12} md={6} lg={4} key={i}>
                        <Card sx={{ ...glassStyle, textAlign: 'center', p: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">{model.type}</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5, mb: 0.5, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{model.name}</Typography>
                            <Typography variant="h4" fontWeight="900" color="primary">{model.accuracy}</Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button variant="contained" size="large" color="warning" onClick={handleRetrain} sx={{ borderRadius: 3, px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Trigger Retraining Calculation
                </Button>
            </Box>
        </motion.div>
    );
};

import { Bar as ChartBar } from "react-chartjs-2";

const ResourcesSection = () => {
    const [forecastData, setForecastData] = useState({ beds: [], oxygen: [], icu: [], er_visits: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/ml/predict/resources?days=7`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setForecastData(data);
                } else {
                    console.error("Failed to fetch resources:", res.status);
                }
            } catch (err) {
                console.error("Error fetching forecast:", err);
            }
            setLoading(false);
        };
        fetchForecast();
    }, []);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top", labels: { color: "#1e293b", font: { size: 12, weight: "600" } } },
            title: { display: false },
        },
        scales: {
            x: { ticks: { color: "#64748b" }, grid: { color: "rgba(148, 163, 184, 0.1)" } },
            y: { ticks: { color: "#64748b" }, grid: { color: "rgba(148, 163, 184, 0.2)" }, beginAtZero: true },
        },
    };

    const ChartCard = ({ title, data, label, color, borderColor }) => (
        <Card sx={{ ...glassStyle, p: 3, height: '350px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1e293b' }}>{title}</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                {data && data.length > 0 ? (
                    <ChartBar
                        data={{
                            labels: data.map(d => d.date),
                            datasets: [{
                                label: label,
                                data: data.map(d => d.prediction),
                                backgroundColor: color,
                                borderColor: borderColor,
                                borderWidth: 2,
                            }]
                        }}
                        options={chartOptions}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                        No data available
                    </Box>
                )}
            </Box>
        </Card>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <SectionHeader title="Hospital Resources Forecast" subtitle="AI-Driven 7-Day Resource Prediction" color="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" />
             
             {loading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><Typography>Loading forecasts...</Typography></Box>
             ) : (
                 <Box sx={{ 
                     display: 'grid', 
                     gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                     gap: 3 
                 }}>
                     <ChartCard 
                        title="🛏️ Bed Availability Forecast" 
                        data={forecastData.beds} 
                        label="Predicted Occupancy" 
                        color="rgba(239, 68, 68, 0.7)" 
                        borderColor="rgba(239, 68, 68, 1)" 
                     />
                     <ChartCard 
                        title="💨 Oxygen Supply Forecast" 
                        data={forecastData.oxygen} 
                        label="Predicted Usage (L)" 
                        color="rgba(139, 92, 246, 0.7)" 
                        borderColor="rgba(139, 92, 246, 1)" 
                     />
                     <ChartCard 
                        title="🏥 ICU Admissions Forecast" 
                        data={forecastData.icu} 
                        label="Predicted Admissions" 
                        color="rgba(34, 197, 94, 0.7)" 
                        borderColor="rgba(34, 197, 94, 1)" 
                     />
                     <ChartCard 
                        title="🚑 ER Visits Forecast" 
                        data={forecastData.er_visits} 
                        label="Predicted Visits" 
                        color="rgba(234, 179, 8, 0.7)" 
                        borderColor="rgba(234, 179, 8, 1)" 
                     />
                 </Box>
             )}
        </motion.div>
    );
};

const ToolsSection = () => {

    const [alertMsg, setAlertMsg] = useState(null);
    const [announcement, setAnnouncement] = useState("");
    const [maintenance, setMaintenance] = useState(false);
    const [health, setHealth] = useState({ cpu: 0, memory: 0, db: "Checking...", uptime: "0" });

    useEffect(() => {
        const fetchHealth = () => {
            fetch("http://localhost:8000/admin/system/health", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            .then(res => res.json())
            .then(data => setHealth(data))
            .catch(err => console.error(err));
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 5000); // Live update
        return () => clearInterval(interval);
    }, []);

    const showAlert = (msg) => {
        setAlertMsg(msg);
        setTimeout(() => setAlertMsg(null), 3000);
    };

    const handlePost = async () => {
        if(!announcement) return;
        try {
            await fetch("http://localhost:8000/admin/announcement", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${localStorage.getItem("token")}` 
                },
                body: JSON.stringify({ message: announcement, type: "info" })
            });
            showAlert("Announcement posted successfully!");
            setAnnouncement("");
        } catch(e) { console.error(e); }
    };

    const handleBackup = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/system/backup", {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            showAlert("System backup started!");
        } catch(e) { showAlert("Backup failed"); }
    };

    const handleExport = (type) => {
         // Reusing logic via new function or just explicit here
         // For Tools section simplified export:
         const token = localStorage.getItem("token");
         fetch(`http://localhost:8000/admin/export/users?format=csv`, {
             headers: { Authorization: `Bearer ${token}` }
         })
         .then(res => res.blob())
         .then(blob => {
             const url = window.URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = "users_export.csv";
             document.body.appendChild(a);
             a.click();
             a.remove();
         });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <SectionHeader title="Admin Tools" subtitle="System configuration and broadcasting" color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" />
             
             {alertMsg && (
                 <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{alertMsg}</Alert>
             )}

             <Grid container spacing={4}>
                 <Grid item xs={12} md={6}>
                     <Card sx={{ ...glassStyle, p: 3 }}>
                         <Typography variant="h6" fontWeight="bold" gutterBottom>📢 Broadcast Announcement</Typography>
                         <TextField 
                             fullWidth 
                             multiline 
                             rows={3} 
                             placeholder="Type message for all users..." 
                             value={announcement}
                             onChange={(e) => setAnnouncement(e.target.value)}
                             sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}
                         />
                         <Button variant="contained" fullWidth onClick={handlePost} disabled={!announcement}>Post Announcement</Button>
                     </Card>
                 </Grid>

                 <Grid item xs={12} md={6}>
                     <Card sx={{ ...glassStyle, p: 3, height: '100%' }}>
                         <Typography variant="h6" fontWeight="bold" gutterBottom>📦 System Maintenance</Typography>
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                             <Button variant="outlined" color="primary" onClick={handleBackup} startIcon={<span>💾</span>}>
                                 Trigger System Backup
                             </Button>
                             <Button variant="outlined" color="success" onClick={() => handleExport('csv')} startIcon={<span>📂</span>}>
                                 Export All Data (CSV)
                             </Button>
                             <Button variant="outlined" color="error" disabled startIcon={<span>🔒</span>}>
                                 Rotate API Keys (Restricted)
                             </Button>
                         </Box>
                     </Card>
                 </Grid>

                 <Grid item xs={12}>
                     <Card sx={{ ...glassStyle, p: 3 }}>
                         <Typography variant="h6" fontWeight="bold" gutterBottom>🖥️ System Health</Typography>
                         <Grid container spacing={2} sx={{ mt: 1 }}>
                             <HealthMetric label="CPU Usage" value={`${health.cpu}%`} color={health.cpu > 80 ? 'error' : 'success'} />
                             <HealthMetric label="Memory" value={`${health.memory}%`} color={health.memory > 80 ? 'warning' : 'success'} />
                             <HealthMetric label="Database" value={health.db} color={health.db === 'Error' ? 'error' : 'success'} />
                             <HealthMetric label="Uptime" value={health.uptime} color="info" />
                         </Grid>
                     </Card>
                 </Grid>
             </Grid>
        </motion.div>
    );
};

const HealthMetric = ({ label, value, color }) => (
    <Grid item xs={6} md={3}>
        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>{value}</Typography>
        </Box>
    </Grid>
);

const ProfileSection = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
             <Card sx={{ 
                 ...glassStyle, 
                 maxWidth: 800, 
                 mx: 'auto', 
                 mt: 4, 
                 overflow: 'visible',
                 position: 'relative'
             }}>
                 {/* Decorative background blur */}
                 <Box sx={{
                     position: 'absolute',
                     top: -50,
                     left: '50%',
                     transform: 'translateX(-50%)',
                     width: '120%',
                     height: 200,
                     background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(255,255,255,0) 70%)',
                     filter: 'blur(40px)',
                     zIndex: 0
                 }} />

                <Box sx={{ position: 'relative', zIndex: 1, p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            style={{ 
                                width: 120, height: 120, borderRadius: '50%', 
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '1.5rem',
                                boxShadow: '0 20px 40px rgba(37, 99, 235, 0.4)',
                                border: '4px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </motion.div>
                        <Typography variant="h3" fontWeight="800" sx={{ background: 'linear-gradient(to right, #1e293b, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                            {user?.username}
                        </Typography>
                        <Chip 
                            label="Administrator" 
                            sx={{ 
                                bgcolor: 'rgba(37, 99, 235, 0.1)', 
                                color: '#2563eb', 
                                fontWeight: 'bold',
                                px: 1,
                                border: '1px solid rgba(37, 99, 235, 0.2)'
                            }} 
                        />
                    </Box>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <motion.div variants={itemVariants}>
                                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.3)' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">EMAIL ADDRESS</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <span style={{ fontSize: '1.2rem' }}>📧</span>
                                        <Typography variant="h6">{user?.email || 'N/A'}</Typography>
                                    </Box>
                                </Box>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div variants={itemVariants}>
                                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.3)' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">ROLE & PERMISSIONS</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                                        <Typography variant="h6">{user?.role?.toUpperCase() || 'ADMIN'}</Typography>
                                    </Box>
                                </Box>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div variants={itemVariants}>
                                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.3)' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">ACCOUNT STATUS</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <span style={{ fontSize: '1.2rem' }}>✅</span>
                                        <Typography variant="h6" color="success.main" fontWeight="bold">Active</Typography>
                                    </Box>
                                </Box>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                             <motion.div variants={itemVariants}>
                                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.3)' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">LAST LOGIN</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <span style={{ fontSize: '1.2rem' }}>🕒</span>
                                        <Typography variant="h6">{new Date().toLocaleDateString()}</Typography>
                                    </Box>
                                </Box>
                            </motion.div>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <motion.div variants={itemVariants} style={{ marginTop: '1rem' }}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    color="error" 
                                    onClick={handleLogout} 
                                    size="large" 
                                    sx={{ 
                                        py: 2, 
                                        fontSize: '1.1rem', 
                                        borderRadius: 3,
                                        background: 'linear-gradient(45deg, #ef4444 30%, #dc2626 90%)',
                                        boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
                                        '&:hover': {
                                            boxShadow: '0 6px 20px 0 rgba(239, 68, 68, 0.23)',
                                            background: 'linear-gradient(45deg, #dc2626 30%, #b91c1c 90%)',
                                        }
                                    }}
                                >
                                    Sign Out
                                </Button>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Box>
             </Card>
        </motion.div>
    );
};

