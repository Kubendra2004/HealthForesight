import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Grid, Paper, Typography, Button, 
  IconButton, TextField, Chip, Avatar, Tooltip,
  Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Snackbar, Alert,
  List, ListItem, ListItemText, ListItemAvatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CardActions, LinearProgress, Divider, InputAdornment, Autocomplete
} from '@mui/material';
import { 
  DashboardRounded, CalendarMonthRounded, LocalHospitalRounded,
  AttachMoneyRounded, InventoryRounded, PeopleRounded,
  BedRounded, BarChartRounded, PowerSettingsNewRounded,
  AddRounded, CheckCircleRounded, CancelRounded,
  PersonAddRounded, ReceiptRounded, HotelRounded,
  TimelineRounded, WarningRounded, TrendingUpRounded,
  EditRounded, DeleteRounded, PaymentRounded,
  CalculateRounded, MedicalServicesRounded, MedicationRounded,
  ScienceRounded, PsychologyRounded
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'; // Keeping if needed later
import BedManagement2D from './components/BedManagement2D';
import ResourceForecast from './components/ResourceForecast';
import RiskCalculators from './components/RiskCalculators';
import ResourceUpdateModal from './components/ResourceUpdateModal';
import BedActionModal from './components/BedActionModal';
import BillProcessingModal from './components/BillProcessingModal';

// Glassmorphism styles
const glassCard = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '24px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
};

const floatNavStyle = {
  position: 'fixed',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  borderRadius: '50px',
  padding: '8px 16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  border: '1px solid rgba(255,255,255,0.5)',
  display: 'flex',
  gap: 2,
  zIndex: 1300
};

const FrontdeskDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  // const [patients, setPatients] = useState([]); // Not used yet
  const [resources, setResources] = useState({});
  const [beds, setBeds] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [opsStats, setOpsStats] = useState({ daily_revenue: 0, staff_on_duty: 0 });
  
  // Modal states
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [billingModal, setBillingModal] = useState(false);
  const [bedModal, setBedModal] = useState(false); // Used for Allocation/Deallocation logic based on selection
  const [resourceModal, setResourceModal] = useState({ open: false, type: '' });
  const [actionModalOpen, setActionModalOpen] = useState(false); // New Resource Modal
  const [selectedBed, setSelectedBed] = useState(null); // Explicit state for selected bed
  const [processingBill, setProcessingBill] = useState(null); // Bill being processed (edit/pay)

  // Form states
  const [apptForm, setApptForm] = useState({ patient_id: '', doctor_id: '', date: '', time: '', reason: '', type: 'in-person' });
  
  // Enhanced Billing Form
  const [billForm, setBillForm] = useState({ 
    patient_id: '', 
    consultation_charges: 0,
    room_charges: 0,
    medicine_charges: 0,
    procedure_charges: 0,
    misc_charges: 0,
    notes: ''
  });
  
  const [bedForm, setBedForm] = useState({ bed_id: '', patient_id: '' });

  // Patient Search State
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientQuery, setPatientQuery] = useState('');

  // Patient Search Effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
        if (!patientQuery) {
            setPatientOptions([]);
            return;
        }
        try {
            const res = await fetch(`http://localhost:8000/frontdesk/search_patients?q=${patientQuery}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPatientOptions(data);
            }
        } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [patientQuery, token]);

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: <DashboardRounded />, label: 'Dashboard' },
    { id: 'appointments', icon: <CalendarMonthRounded />, label: 'Appointments' },
    { id: 'billing', icon: <AttachMoneyRounded />, label: 'Billing' },
    { id: 'resources', icon: <BarChartRounded />, label: 'Resources' },
    { id: 'clinical', icon: <PsychologyRounded />, label: 'Clinical Risk' }, // New Tab
    { id: 'beds', icon: <BedRounded />, label: 'Beds' },
    { id: 'operations', icon: <InventoryRounded />, label: 'Operations' },
  ];

  /* ... fetchAllData ... */
  
  const handleUpdateResource = async (data) => {
      try {
           const res = await fetch('http://localhost:8000/frontdesk/resources/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                 setSnackbar({ open: true, message: 'Resource updated successfully!', severity: 'success' });
                 fetchAllData(); // Refresh cards
            } else {
                 throw new Error('Update failed');
            }
      } catch (e) {
           setSnackbar({ open: true, message: 'Failed to update resource', severity: 'error' });
           throw e; // Modal handles loading state
      }
  };

  // Fetch all data
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, navigate, token]);

  const fetchAllData = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const [apptsRes, doctorsRes, resourcesRes, bedsRes, waitlistRes, inventoryRes, billsRes, statsRes] = await Promise.all([
        fetch('http://localhost:8000/frontdesk/appointments', { headers }),
        fetch('http://localhost:8000/auth/users?role=doctor', { headers }),
        fetch('http://localhost:8000/resources/current', { headers }),
        fetch('http://localhost:8000/beds', { headers }),
        fetch('http://localhost:8000/operations/waitlist', { headers }),
        fetch('http://localhost:8000/operations/inventory', { headers }),
        fetch('http://localhost:8000/billing', { headers }),
        fetch('http://localhost:8000/operations/stats', { headers })
      ]);

      if (apptsRes.ok) setAppointments(await apptsRes.json());
      if (doctorsRes.ok) setDoctors(await doctorsRes.json());
      if (resourcesRes.ok) {
        const resourceData = await resourcesRes.json();
        const resourceMap = {};
        resourceData.forEach(r => { resourceMap[r.type] = r; });
        setResources(resourceMap);
      }
      if (bedsRes.ok) setBeds(await bedsRes.json());
      if (waitlistRes.ok) setWaitlist(await waitlistRes.json());
      if (inventoryRes.ok) setInventory(await inventoryRes.json());
      if (billsRes.ok) setBills(await billsRes.json());
      if (statsRes.ok) setOpsStats(await statsRes.json());
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Error loading data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Appointment Actions
  const handleCreateAppointment = async () => {
    try {
      const dateTime = new Date(`${apptForm.date}T${apptForm.time}`).toISOString();
      const res = await fetch('http://localhost:8000/frontdesk/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: apptForm.patient_id,
          doctor_id: apptForm.doctor_id,
          date: dateTime,
          reason: apptForm.reason,
          type: apptForm.type,
          status: 'Scheduled'
        })
      });
      
      if (res.ok) {
        setSnackbar({ open: true, message: 'Appointment created successfully!', severity: 'success' });
        setAppointmentModal(false);
        fetchAllData();
        setApptForm({ patient_id: '', doctor_id: '', date: '', time: '', reason: '', type: 'in-person' });
      } else {
        const errorData = await res.json();
        setSnackbar({ 
            open: true, 
            message: errorData.detail || 'Failed to create appointment', 
            severity: 'error' 
        });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create appointment (Network Error)', severity: 'error' });
    }
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:8000/frontdesk/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        setSnackbar({ open: true, message: `Appointment ${status.toLowerCase()}!`, severity: 'success' });
        fetchAllData();
      }
    } catch (error) {
       setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  }



  // 3D Bed Interaction Logic
  const handleBed3DClick = (bed) => {
    setSelectedBed(bed);
    // If bed is available, open modal to allocate.
    // If occupied, just select it (Deallocate button is in the side panel or modal).
    // Let's reuse the modal logic but smarter.
    if (bed.status === 'Available') {
         setBedForm({ ...bedForm, bed_id: bed._id, bed_number: bed.bed_number }); // Store bed info
         setBedModal(true);
    } 
  };
  
  const handleBillSubmit = async (data) => {
    try {
        const payload = {
            patient_id: data.patient_id,
            amount: data.total,
            items: data.items,
            status: processingBill ? 'Pending' : 'Pending' 
        };

        if (processingBill) {
            let billId = processingBill._id;
            // 1. Update Bill Details
            const updateRes = await fetch(`http://localhost:8000/billing/${billId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            
            if (!updateRes.ok) throw new Error('Failed to update bill');

            // 2. Process Payment immediately
            const payRes = await fetch(`http://localhost:8000/billing/${billId}/pay`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!payRes.ok) throw new Error('Payment failed');
             setSnackbar({ open: true, message: 'Payment Processed Successfully!', severity: 'success' });

        } else {
            // Create New Bill
            const res = await fetch('http://localhost:8000/frontdesk/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    ...payload,
                    appointment_id: 'frontdesk_gen',
                    date: new Date().toISOString()
                })
            });
            if (!res.ok) throw new Error('Failed to generate bill');
            setSnackbar({ open: true, message: 'Invoice Generated!', severity: 'success' });
        }

        setBillingModal(false);
        setProcessingBill(null);
        fetchAllData(); 

    } catch (e) {
        console.error(e);
        setSnackbar({ open: true, message: e.message, severity: 'error' });
    }
  };

  const handleAllocateBed = async () => {
    try {
      // If we selected a bed via 3D view, bedForm.bed_id should be set
      const res = await fetch('http://localhost:8000/beds/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bed_id: bedForm.bed_id, patient_id: bedForm.patient_id })
      });
      
      if (res.ok) {
        setSnackbar({ open: true, message: 'Bed allocated successfully!', severity: 'success' });
        setBedModal(false);
        fetchAllData();
        setBedForm({ bed_id: '', patient_id: '' });
        setSelectedBed(null);
      }
    } catch (error) {
        setSnackbar({ open: true, message: 'Failed to allocate bed', severity: 'error' });
    }
  };

  const handleDeallocateBed = async (bedId) => {
    try {
       const res = await fetch('http://localhost:8000/beds/deallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bed_id: bedId })
      });
      
      if (res.ok) {
        setSnackbar({ open: true, message: 'Bed released & bill generated!', severity: 'success' });
        fetchAllData();
        setSelectedBed(null);
      }
    } catch (error) {
        setSnackbar({ open: true, message: 'Failed to deallocate', severity: 'error' });
    }
  };

  // ----- TAB COMPONENTS -----

  const DashboardTab = () => {
    const stats = {
      totalAppts: appointments.length,
      pendingAppts: appointments.filter(a => a.status === 'Requested').length,
      availableBeds: beds.filter(b => b.status === 'Available').length,
      totalBeds: beds.length,
      waitlistCount: waitlist.length,
      lowStock: inventory.filter(i => i.quantity < (i.reorder_level || 10)).length
    };

    const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
      <motion.div whileHover={{ y: -5 }}>
        <Paper sx={{ ...glassCard, p: 3, cursor: onClick ? 'pointer' : 'default', height: '100%' }} onClick={onClick}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="600">{title}</Typography>
                <Typography variant="h3" fontWeight="900" color={color} my={1}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>{icon}</Avatar>
            </Box>
        </Paper>
      </motion.div>
    );

    return (
      <Box>
        <Typography variant="h3" fontWeight="900" color="#1e293b" mb={1}>Frontdesk Dashboard</Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>Hospital operations overview</Typography>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <StatCard title="Total Appointments" value={stats.totalAppts} subtitle={`${stats.pendingAppts} pending approval`} icon={<CalendarMonthRounded />} color="#6366f1" onClick={() => setActiveTab('appointments')} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Available Beds" value={`${stats.availableBeds}/${stats.totalBeds}`} subtitle={`${stats.totalBeds > 0 ? ((stats.availableBeds/stats.totalBeds)*100).toFixed(0) : 0}% available`} icon={<BedRounded />} color="#10b981" onClick={() => setActiveTab('beds')} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Waitlist" value={stats.waitlistCount} subtitle={stats.lowStock > 0 ? 'Low stock alerts' : 'Inventory healthy'} icon={<PeopleRounded />} color="#f59e0b" onClick={() => setActiveTab('operations')} />
          </Grid>
        </Grid>

        <Typography variant="h5" fontWeight="800" mb={2}>Quick Actions</Typography>
        <Grid container spacing={2} mb={4}>
          {[
            { label: 'Schedule Appointment', icon: CalendarMonthRounded, color: '#6366f1', onClick: () => setAppointmentModal(true) },
            { label: 'Generate Bill', icon: ReceiptRounded, color: '#10b981', onClick: () => setBillingModal(true) },
            { label: 'Manage Beds', icon: HotelRounded, color: '#f59e0b', onClick: () => setActiveTab('beds') },
            { label: 'Operations', icon: InventoryRounded, color: '#ec4899', onClick: () => setActiveTab('operations') }
          ].map((action, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper sx={{ ...glassCard, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f0f9ff' } }} onClick={action.onClick}>
                <action.icon sx={{ fontSize: 40, color: action.color, mb: 1 }} />
                <Typography fontWeight="600">{action.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const AppointmentsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="800">Appointments Management</Typography>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setAppointmentModal(true)}>New Appointment</Button>
      </Box>
      <TableContainer component={Paper} sx={glassCard}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appt) => (
              <TableRow key={appt._id} hover>
                <TableCell>{appt.patient_id}</TableCell>
                <TableCell>{appt.doctor_id}</TableCell>
                <TableCell>{new Date(appt.date).toLocaleString()}</TableCell>
                <TableCell>{appt.reason}</TableCell>
                <TableCell><Chip label={appt.type} size="small" /></TableCell>
                <TableCell><Chip label={appt.status} size="small" color={appt.status === 'Scheduled' ? 'success' : appt.status === 'Requested' ? 'warning' : 'default'} /></TableCell>
                <TableCell>
                  {appt.status === 'Requested' && (
                    <Box display="flex" gap={1}>
                      <IconButton size="small" color="success" onClick={() => handleUpdateAppointmentStatus(appt._id, 'Scheduled')}><CheckCircleRounded /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleUpdateAppointmentStatus(appt._id, 'Cancelled')}><CancelRounded /></IconButton>
                    </Box>
                  )}
                  {appt.status === 'Scheduled' && (
                      <Chip label="Confirmed" color="success" variant="outlined" size="small" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const BillingTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="800">Billing Center</Typography>
        <Box display="flex" gap={2}>
            <Chip 
                icon={<AttachMoneyRounded />} 
                label={`Pending: ₹${bills.filter(b => b.status === "Pending").reduce((acc, curr) => acc + curr.amount, 0)}`} 
                color="warning" 
                variant="outlined" 
            />
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => setBillingModal(true)}>New Invoice</Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper} sx={{ ...glassCard, mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill._id} hover>
                <TableCell>{bill._id.slice(-6).toUpperCase()}</TableCell>
                <TableCell fontWeight="bold">{bill.patient_id}</TableCell>
                <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                <TableCell>
                    {bill.items.map((item, i) => (
                        <div key={i}>{item.description}</div>
                    ))}
                </TableCell>
                <TableCell align="right">₹{bill.amount}</TableCell>
                <TableCell>
                  <Chip 
                    label={bill.status} 
                    color={bill.status === 'Paid' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="center">
                    {bill.status === "Pending" && (
                        <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            startIcon={<ReceiptRounded />}
                            onClick={() => {
                                setProcessingBill(bill);
                                setBillingModal(true);
                            }}
                        >
                            Proceed
                        </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No invoices found
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const ResourcesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
         <Typography variant="h4" fontWeight="800">Resource Monitoring</Typography>
         <Button variant="outlined" startIcon={<EditRounded />} onClick={() => setResourceModal({ open: true, type: 'beds'})}>
            Update Levels
         </Button>
      </Box>
      <Grid container spacing={3} mb={4}>
        {Object.entries(resources).map(([type, data]) => (
          <Grid item xs={12} sm={6} md={3} key={type}>
            <Paper sx={{ ...glassCard, p: 3, position: 'relative', overflow: 'hidden' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold" textTransform="capitalize">{type}</Typography>
                  <Chip label={data.unit} size="small" />
              </Box>
              <Typography variant="h3" color="primary" fontWeight="900" my={2}>
                  {data.current} <span style={{fontSize: '1rem', color: '#64748b'}}>/ {data.capacity}</span>
              </Typography>
              <LinearProgress variant="determinate" value={data.capacity > 0 ? (data.current / data.capacity) * 100 : 0} 
                sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: (data.current/data.capacity) > 0.8 ? '#ef4444' : '#6366f1' } }} 
              />
              <IconButton 
                size="small" 
                sx={{ position: 'absolute', top: 5, right: 5, opacity: 0.5 }}
                onClick={() => setResourceModal({ open: true, type: type })}
              >
                <EditRounded fontSize="small" />
              </IconButton>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Forecasting Section */}
      <ResourceForecast />
    </Box>
  );

  const ClinicalRiskTab = () => (
      <RiskCalculators />
  );




  const BedsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="800">Bed Management</Typography>
        <Box>
            <Chip 
                icon={<HotelRounded />} 
                label={`Total: ${beds.length}`} 
                color="primary" 
                variant="outlined" 
                sx={{ mr: 1 }} 
            />
            <Chip 
                icon={<CheckCircleRounded />} 
                label={`Free: ${beds.filter(b => b.status === "Available").length}`} 
                color="success" 
                variant="outlined" 
                sx={{ mr: 1 }}
            />
             <Chip 
                icon={<CancelRounded />} 
                label={`Occupied: ${beds.filter(b => b.status !== "Available").length}`} 
                color="error" 
                variant="outlined" 
            />
        </Box>
      </Box>
      
      <Paper sx={{ ...glassCard, p: 3, height: 'calc(100vh - 250px)', overflow: 'hidden' }}>
          {/* Full Width 2D Grid */}
          <BedManagement2D 
            beds={beds} 
            onBedClick={(bed) => {
                setSelectedBed(bed);
                setActionModalOpen(true);
            }} 
            selectedBedId={selectedBed?._id} 
          />
      </Paper>

      {/* Action Modal */}
      <BedActionModal 
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        bed={selectedBed}
        onAllocate={() => {
            setBedForm({...bedForm, bed_id: selectedBed._id});
            setActionModalOpen(false);
            setBedModal(true); // Open existing allocation form
        }}
        onDeallocate={(id) => {
            setActionModalOpen(false);
            handleDeallocateBed(id);
        }}
      />
    </Box>
  );

  const OperationsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="800">Operations Hub</Typography>
        <Typography variant="h6" color="text.secondary">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glassCard, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#e0e7ff', color: '#6366f1' }}><PeopleRounded /></Avatar>
                <Box>
                    <Typography variant="body2" color="text.secondary">Staff on Duty</Typography>
                    <Typography variant="h5" fontWeight="bold">12</Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glassCard, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#dcfce7', color: '#10b981' }}><LocalHospitalRounded /></Avatar>
                <Box>
                    <Typography variant="body2" color="text.secondary">Occupancy Rate</Typography>
                    <Typography variant="h5" fontWeight="bold">
                        {Math.round((beds.filter(b => b.status !== 'Available').length / (beds.length || 1)) * 100)}%
                    </Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glassCard, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#ffedd5', color: '#f97316' }}><WarningRounded /></Avatar>
                <Box>
                    <Typography variant="body2" color="text.secondary">Critical Alerts</Typography>
                    <Typography variant="h5" fontWeight="bold">{waitlist.filter(w => w.priority === 'High').length}</Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
             <Paper sx={{ ...glassCard, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#fce7f3', color: '#ec4899' }}><AttachMoneyRounded /></Avatar>
                <Box>
                    <Typography variant="body2" color="text.secondary">Daily Revenue</Typography>
                    <Typography variant="h5" fontWeight="bold">₹{(opsStats?.daily_revenue || 0).toLocaleString('en-IN')}</Typography>
                </Box>
            </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...glassCard, p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
                 <Typography variant="h6" fontWeight="bold"><PeopleRounded sx={{mr:1, verticalAlign:'bottom'}}/>Waitlist</Typography>
                 <Chip label={`${waitlist.length} Pending`} size="small" color="primary" />
            </Box>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {waitlist.map((item, idx) => (
                <ListItem key={idx} divider={idx !== waitlist.length - 1} secondaryAction={
                    <Chip label={item.priority} size="small" color={item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'default'} />
                }>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: item.priority === 'High' ? '#fee2e2' : '#f3f4f6', color: item.priority === 'High' ? '#ef4444' : '#6b7280' }}>
                        <PersonAddRounded />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={item.patient_id} 
                    secondary={
                        <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                                {item.reason}
                            </Typography>
                            {` — ${new Date(item.created_at || Date.now()).toLocaleTimeString()}`}
                        </React.Fragment>
                    } 
                  />
                </ListItem>
              ))}
              {waitlist.length === 0 && (
                <Box textAlign="center" py={4} color="text.secondary">
                    <CheckCircleRounded sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
                    <Typography>All caught up!</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...glassCard, p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold"><InventoryRounded sx={{mr:1, verticalAlign:'bottom'}}/>Inventory Status</Typography>
                <Button size="small" startIcon={<AddRounded />}>Restock</Button>
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="center">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow key={item._id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                                <TableCell align="right">{item.quantity} {item.unit}</TableCell>
                                <TableCell align="center">
                                    {item.quantity < (item.reorder_level || 10) ? 
                                        <Chip label="Low" size="small" color="error" variant="outlined" /> : 
                                        <Chip label="OK" size="small" color="success" variant="outlined" />
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // --- RENDER ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'appointments': return <AppointmentsTab />;
      case 'billing': return <BillingTab />;
      case 'resources': return <ResourcesTab />;
      case 'clinical': return <ClinicalRiskTab />;
      case 'beds': return <BedsTab />;
      case 'operations': return <OperationsTab />;
      default: return <DashboardTab />;
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', pb: 12 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Header */}
      <Box px={4} py={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: '#6366f1', width: 48, height: 48 }}><LocalHospitalRounded /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight="800" color="#1e293b">Front Desk</Typography>
            <Typography variant="caption" color="text.secondary">{user?.username || 'User'}</Typography>
          </Box>
        </Box>
        <Tooltip title="Sign Out">
          <IconButton onClick={() => { logout(); navigate('/login'); }} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#fee2e2' } }}>
            <PowerSettingsNewRounded color="error" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* Floating Bottom Nav */}
      <Paper sx={floatNavStyle} elevation={4}>
        {navItems.map((item) => (
          <Tooltip title={item.label} key={item.id} placement="top">
            <IconButton onClick={() => setActiveTab(item.id)} sx={{ 
                color: activeTab === item.id ? 'white' : '#64748b', 
                bgcolor: activeTab === item.id ? '#6366f1' : 'transparent', 
                transition: '0.3s', 
                '&:hover': { bgcolor: activeTab === item.id ? '#4f46e5' : 'rgba(99, 102, 241, 0.1)' }, 
                width: 50, height: 50 
            }}>
              {item.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Paper>

      {/* --- MODALS --- */}

      {/* Appointment Modal */}
      <Dialog open={appointmentModal} onClose={() => setAppointmentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Appointment</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
             <Autocomplete
                options={patientOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label || ''}
                filterOptions={(x) => x} 
                onChange={(event, newValue) => {
                    const pid = newValue ? (newValue.username || newValue.id) : '';
                    setApptForm({...apptForm, patient_id: pid});
                }}
                onInputChange={(event, newInputValue) => setPatientQuery(newInputValue)}
                renderInput={(params) => <TextField {...params} label="Patient ID / Name" fullWidth />}
             />
             <FormControl fullWidth>
                <InputLabel>Doctor</InputLabel>
                <Select value={apptForm.doctor_id} label="Doctor" onChange={(e) => setApptForm({...apptForm, doctor_id: e.target.value})}>
                    {doctors.map(d => <MenuItem key={d.username} value={d.username}>{d.username} ({d.specialization})</MenuItem>)}
                </Select>
             </FormControl>
             <Box display="flex" gap={2}>
                 <TextField type="date" label="Date" InputLabelProps={{shrink:true}} value={apptForm.date} onChange={(e) => setApptForm({...apptForm, date: e.target.value})} fullWidth />
                 <TextField type="time" label="Time" InputLabelProps={{shrink:true}} value={apptForm.time} onChange={(e) => setApptForm({...apptForm, time: e.target.value})} fullWidth />
             </Box>
             <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={apptForm.type} label="Type" onChange={(e) => setApptForm({...apptForm, type: e.target.value})}>
                    <MenuItem value="in-person">In-Person</MenuItem>
                    <MenuItem value="online">Virtual</MenuItem>
                </Select>
             </FormControl>
             <TextField label="Reason" multiline rows={2} value={apptForm.reason} onChange={(e) => setApptForm({...apptForm, reason: e.target.value})} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAppointment}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Billing Modal */}
      {/* Bill Processing Modal (Handles New & Edit) */}
      <BillProcessingModal 
        open={billingModal}
        onClose={() => { setBillingModal(false); setProcessingBill(null); }}
        bill={processingBill}
        isNew={!processingBill}
        onProcess={handleBillSubmit}
      />

      {/* Bed Allocation Modal via 3D click */}
      <Dialog open={bedModal} onClose={() => setBedModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Bed {bedForm.bed_number ? `#${bedForm.bed_number}` : ''}</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
                Assign a patient to this bed.
            </Typography>
            <TextField 
                autoFocus
                label="Patient ID" 
                fullWidth 
                value={bedForm.patient_id} 
                onChange={(e) => setBedForm({...bedForm, patient_id: e.target.value})} 
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setBedModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAllocateBed}>Confirm Allocation</Button>
        </DialogActions>
      </Dialog>
      
      {/* Resource Update Modal */}
      <ResourceUpdateModal 
        open={resourceModal.open} 
        onClose={() => setResourceModal({ ...resourceModal, open: false })}
        onUpdate={handleUpdateResource}
        initialType={resourceModal.type}
      />
    </Box>
  );
};

export default FrontdeskDashboard;
