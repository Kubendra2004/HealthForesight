import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Grid, Paper, Typography, Button, 
  IconButton, TextField, Chip, Avatar, Tooltip, Badge,
  useTheme, useMediaQuery, Fab, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, Snackbar, Alert,
  List, ListItem, ListItemText, ListItemAvatar, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Drawer,
  Tabs, Tab, Divider, Card, CardContent, CardActions, Autocomplete
} from '@mui/material';
import { 
  DashboardRounded, PeopleRounded, LocalPharmacyRounded, 
  BiotechRounded, PersonRounded, SearchRounded, 
  NotificationsRounded, PowerSettingsNewRounded,
  AddRounded, FilterListRounded, CloseRounded, MedicationRounded,
  FavoriteRounded, OpacityRounded, CalendarMonthRounded,
  CheckCircleRounded, CancelRounded, ScheduleRounded,
  HistoryRounded, AccessTimeRounded, EventAvailableRounded,
  PhoneRounded, EmailRounded, LocationOnRounded, AccountCircleRounded
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets & Styles ---
const glassCard = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '24px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden'
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

// --- Sub-Components ---



const PrescriptionsTab = ({ patients, token, user }) => {
    // Form State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientOptions, setPatientOptions] = useState([]);
    const [patientQuery, setPatientQuery] = useState('');
    
    const [medication, setMedication] = useState(null);
    const [allMedicines, setAllMedicines] = useState([]); // Cache
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [timing, setTiming] = useState('');
    
    // Feedback State
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, msg: '', type: 'success' });
    const [patientDetails, setPatientDetails] = useState(null);

    // Initial Data Load (Medicine Cache)
    useEffect(() => {
        const fetchMeds = async () => {
            try {
                const res = await fetch(`http://localhost:8000/doctor/search_medicines?q=`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllMedicines(data); // Store ~20-50 meds locally
                }
            } catch (e) { console.error("Med fetch error", e); }
        };
        fetchMeds();
    }, [token]);

    // Patient Search (Debounced)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!patientQuery) {
                setPatientOptions([]);
                return;
            }
            try {
                const res = await fetch(`http://localhost:8000/doctor/search_patients?q=${patientQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401) {
                    setFeedback({ open: true, msg: 'Session expired. Please logout and login again.', type: 'error' });
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setPatientOptions(data);
                }
            } catch (e) { 
                console.error(e); 
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [patientQuery, token]);

    // Fetch Patient Details on Selection
    useEffect(() => {
        if (!selectedPatient) {
            setPatientDetails(null);
            return;
        }
        const fetchDetails = async () => {
            // selectedPatient can be object (from search) or string (manual?)
            // We favor the object flow from search_patients endpoint
            const pId = selectedPatient.id || selectedPatient; // API expects username usually
            try {
                const res = await fetch(`http://localhost:8000/doctor/patient_profile/${pId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setPatientDetails(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchDetails();
    }, [selectedPatient, token]);

    const handleIssue = async () => {
        if (!selectedPatient || !medication) {
            setFeedback({ open: true, msg: 'Please select a patient and medication', type: 'warning' });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                patient_id: selectedPatient.username || selectedPatient.id, // Ensure we send the identifier backend expects
                doctor_id: user.username,
                medicines: [{
                    name: medication,
                    dosage: dosage || 'As Prescribed',
                    frequency: frequency || '1-0-1',
                    timing: timing || 'After Food',
                    instructions: `${frequency} | ${timing}`
                }],
                instructions: `${dosage}`,
                date: new Date().toISOString()
            };

            const res = await fetch(`http://localhost:8000/doctor/prescriptions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setFeedback({ open: true, msg: 'Prescription Issued Successfully!', type: 'success' });
                // Reset Form
                setMedication(null);
                setDosage('');
                setFrequency('');
                setTiming('');
            } else throw new Error();
        } catch (e) {
            setFeedback({ open: true, msg: 'Failed to issue prescription', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container spacing={4} sx={{ mt: 1 }}>
            <Snackbar open={feedback.open} autoHideDuration={4000} onClose={() => setFeedback({ ...feedback, open: false })}>
                <Alert severity={feedback.type} variant="filled" sx={{ width: '100%' }}>{feedback.msg}</Alert>
            </Snackbar>

            {/* LEFT PANEL: PRESCRIPTION FORM */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ ...glassCard, p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                        <Avatar sx={{ bgcolor: '#4f46e5', width: 48, height: 48 }}>
                            <LocalPharmacyRounded />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight="800" color="#1e3a8a">New Prescription</Typography>
                            <Typography variant="body2" color="text.secondary">Issue digital Rx instantly</Typography>
                        </Box>
                    </Box>

                    {/* Patient Search */}
                    <Autocomplete
                        options={patientOptions}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.label || ''}
                        filterOptions={(x) => x} // Disable local filter, rely on server
                        value={selectedPatient}
                        onChange={(event, newValue) => setSelectedPatient(newValue)}
                        onInputChange={(event, newInputValue) => setPatientQuery(newInputValue)}
                        openOnFocus
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Search Patient (Name/ID)" 
                                placeholder="Start typing name..."
                                sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }} 
                            />
                        )}
                    />

                    {/* Medicine Search (Cached) */}
                    <Autocomplete
                        options={allMedicines} 
                        // allMedicines is simple string array ["Paracetamol", ...]
                        value={medication}
                        onChange={(event, newValue) => setMedication(newValue)}
                        openOnFocus
                        freeSolo // Allow custom meds
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Medication Name" 
                                placeholder="Select or type medicine..."
                                sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }} 
                            />
                        )}
                    />

                    {/* Stacked Inputs for Clarity */}
                    <TextField 
                        fullWidth 
                        label="Dosage" 
                        placeholder="e.g. 500mg"
                        value={dosage} onChange={e => setDosage(e.target.value)}
                        sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
                    />

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                            value={frequency}
                            label="Frequency"
                            onChange={(e) => setFrequency(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                            <MenuItem value="1-0-1 (Morning-Night)">1-0-1 (Morning-Night)</MenuItem>
                            <MenuItem value="1-1-1 (Morning-Noon-Night)">1-1-1 (Thrice Daily)</MenuItem>
                            <MenuItem value="1-0-0 (Morning)">1-0-0 (Morning)</MenuItem>
                            <MenuItem value="0-0-1 (Night)">0-0-1 (Night)</MenuItem>
                            <MenuItem value="SOS (As needed)">SOS (As needed)</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel>Timing Instructions</InputLabel>
                        <Select
                            value={timing}
                            label="Timing Instructions"
                            onChange={(e) => setTiming(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                            <MenuItem value="After Food">After Food</MenuItem>
                            <MenuItem value="Before Food">Before Food</MenuItem>
                            <MenuItem value="With Food">With Food</MenuItem>
                            <MenuItem value="Empty Stomach">Empty Stomach</MenuItem>
                        </Select>
                    </FormControl>

                    <Button 
                        fullWidth 
                        variant="contained" 
                        size="large"
                        onClick={handleIssue}
                        disabled={loading || !selectedPatient || !medication}
                        startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <CheckCircleRounded />}
                        sx={{ 
                            mt: 'auto',
                            py: 1.5, borderRadius: 3,
                            background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
                            fontWeight: 'bold', fontSize: '1.1rem',
                            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        {loading ? 'Issuing...' : 'Sign & Issue Prescription'}
                    </Button>
                </Paper>
            </Grid>

            {/* RIGHT PANEL: PATIENT DETAILS */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ ...glassCard, p: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.9)', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Decorative Background Blob */}
                    <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

                    <Box display="flex" justifyContent="space-between" mb={4} position="relative" zIndex={1}>
                        <Typography variant="h6" fontWeight="bold" color="#334155" display="flex" alignItems="center" gap={1}>
                            <AccountCircleRounded color="primary"/> Patient Profile
                        </Typography>
                        {selectedPatient && (
                            <Chip 
                                label="Active Patient" 
                                color="success" 
                                size="small" 
                                icon={<CheckCircleRounded/>} 
                                sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                            />
                        )}
                    </Box>

                    <AnimatePresence mode="wait">
                        {!selectedPatient ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <SearchRounded sx={{ fontSize: 100, color: '#cbd5e1' }} />
                                </motion.div>
                                <Typography variant="h6" color="text.secondary" fontWeight="500" mt={2}>Ready to Prescribe</Typography>
                                <Typography variant="body2" color="text.disabled">Search for a patient on the left to load details</Typography>
                            </motion.div>
                        ) : !patientDetails ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="50%">
                                <CircularProgress color="primary" />
                            </Box>
                        ) : (
                            <motion.div 
                                key="details"
                                initial={{ x: 50, opacity: 0 }} 
                                animate={{ x: 0, opacity: 1 }} 
                                transition={{ type: 'spring', stiffness: 100 }}
                            >
                                <Box display="flex" alignItems="center" gap={3} mb={4} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 4, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <Avatar sx={{ width: 80, height: 80, bgcolor: '#4f46e5', fontSize: 32, boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)' }}>
                                        {patientDetails.patient_id ? patientDetails.patient_id[0].toUpperCase() : 'P'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="800" color="#1e293b" sx={{ textTransform: 'capitalize' }}>
                                            {selectedPatient.username || patientDetails.patient_id}
                                        </Typography>
                                        <Box display="flex" gap={1} flexWrap="wrap">
                                            <Chip label={`ID: ${selectedPatient.db_id}`} size="small" variant="outlined" sx={{ bgcolor: 'white' }} />
                                            <Chip label="Standard Plan" size="small" color="primary" variant="filled" sx={{ borderRadius: 1 }} />
                                        </Box>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', transition: '0.3s', '&:hover': {borderColor: '#94a3b8', transform: 'translateY(-2px)'} }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight="bold" letterSpacing={1}>AGE / GENDER</Typography>
                                            <Typography variant="h6" color="#334155" fontWeight="700">
                                                {patientDetails.age || '--'} <span style={{fontSize:'0.7em', color:'#94a3b8'}}>{patientDetails.gender || '--'}</span>
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', transition: '0.3s', '&:hover': {borderColor: '#ef4444', transform: 'translateY(-2px)'} }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight="bold" letterSpacing={1}>BLOOD TYPE</Typography>
                                            <Typography variant="h6" color="#ef4444" fontWeight="700">{patientDetails.blood_type || '--'}</Typography>
                                        </Paper>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#fff1f2', borderRadius: 3, border: '1px dashed #fda4af' }}>
                                            <Typography variant="subtitle2" color="#be123c" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                                <CancelRounded fontSize="small"/> Known Allergies
                                            </Typography>
                                            <Typography color="#881337" mt={1} fontWeight="500">
                                                {patientDetails.allergies && patientDetails.allergies !== "None" ? patientDetails.allergies : "No known allergies"}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px dashed #86efac' }}>
                                            <Typography variant="subtitle2" color="#15803d" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                                <MedicationRounded fontSize="small"/> Current Medications
                                            </Typography>
                                        <Typography color="#14532d" mt={0.5}>
                                            {patientDetails.medications && patientDetails.medications !== "None" ? patientDetails.medications : "No active medications"}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </Paper>
            </Grid>
        </Grid>
    );
};

const AIToolsTab = ({ token }) => {
    const [tool, setTool] = useState('heart');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({});

    // Heart Defaults
    const heartDefaults = { age: 50, sex: 1, cp: 0, trestbps: 120, chol: 200, fbs: 0, restecg: 1, thalach: 150, exang: 0, oldpeak: 2.3, slope: 0, ca: 0, thal: 2 };
    // Diabetes Defaults
    const diabetesDefaults = { age: 40, gender: 'Male', polyuria: 0, polydipsia: 0, sudden_weight_loss: 0, weakness: 0, polyphagia: 0, genital_thrush: 0, visual_blurring: 0, itching: 0, irritability: 0, delayed_healing: 0, partial_paresis: 0, muscle_stiffness: 0, alopecia: 0, obesity: 0 };

    useEffect(() => {
        setFormData(tool === 'heart' ? heartDefaults : diabetesDefaults);
        setResult(null);
    }, [tool]);

    const handlePredict = async () => {
        setLoading(true);
        const endpoint = tool === 'heart' ? 'http://localhost:8000/ml/predict/heart' : 'http://localhost:8000/ml/predict/diabetes';
        
        // Convert string inputs to proper types
        const payload = Object.entries(formData).reduce((acc, [key, val]) => {
             acc[key] = (key === 'gender') ? val : Number(val);
             return acc;
        }, {});

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setResult(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleChange = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    return (
        <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
                <Paper sx={{ ...glassCard, p: 3, position: 'relative', overflow: 'hidden' }}>
                     {/* Decorative Elements */}
                     <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: tool === 'heart' ? '#ec4899' : '#3b82f6', opacity: 0.2, filter: 'blur(30px)', borderRadius: '50%' }} />

                    <Typography variant="h6" fontWeight="bold" mb={3} color="#1e293b">Select Diagnostic Model</Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Button 
                            variant={tool === 'heart' ? 'contained' : 'outlined'} 
                            onClick={() => setTool('heart')}
                            startIcon={<FavoriteRounded />}
                            sx={{ 
                                borderRadius: 3, py: 1.5,
                                bgcolor: tool === 'heart' ? '#ec4899' : 'transparent',
                                borderColor: '#ec4899',
                                color: tool === 'heart' ? 'white' : '#ec4899',
                                '&:hover': { bgcolor: tool === 'heart' ? '#db2777' : 'rgba(236, 72, 153, 0.1)', borderColor: '#db2777' }
                            }}
                        >
                            Cardiology (Heart)
                        </Button>
                        <Button 
                            variant={tool === 'diabetes' ? 'contained' : 'outlined'} 
                            onClick={() => setTool('diabetes')}
                            startIcon={<OpacityRounded />}
                            sx={{ 
                                borderRadius: 3, py: 1.5,
                                bgcolor: tool === 'diabetes' ? '#3b82f6' : 'transparent',
                                borderColor: '#3b82f6',
                                color: tool === 'diabetes' ? 'white' : '#3b82f6',
                                '&:hover': { bgcolor: tool === 'diabetes' ? '#2563eb' : 'rgba(59, 130, 246, 0.1)', borderColor: '#2563eb' }
                            }}
                        >
                            Endocrinology (Diabetes)
                        </Button>
                    </Box>
                </Paper>
                
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                            <Paper sx={{ 
                                ...glassCard, p: 3, mt: 3, 
                                background: result.prediction === 1 ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                border: `1px solid ${result.prediction === 1 ? '#ef4444' : '#22c55e'}`
                            }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                    <Avatar sx={{ bgcolor: result.prediction === 1 ? '#ef4444' : '#22c55e' }}>
                                        {result.prediction === 1 ? <CancelRounded /> : <CheckCircleRounded />}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color={result.prediction === 1 ? 'error' : 'success.main'}>
                                            {result.label || (result.prediction === 1 ? "High Risk Detected" : "Low Risk Profile")}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">AI Confidence Score</Typography>
                                    </Box>
                                </Box>
                                <Box mt={2} position="relative" height={8} bgcolor="rgba(0,0,0,0.1)" borderRadius={4}>
                                    <Box 
                                        position="absolute" left={0} top={0} bottom={0} 
                                        width={`${(result.probability * 100).toFixed(0)}%`}
                                        bgcolor={result.prediction === 1 ? '#ef4444' : '#22c55e'}
                                        borderRadius={4}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1, textAlign: 'right', fontWeight: 'bold' }}>
                                    {(result.probability * 100).toFixed(1)}% Probability
                                </Typography>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Grid>

            <Grid item xs={12} md={8}>
                <Paper sx={{ ...glassCard, p: 4, position: 'relative' }}>
                     <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: tool === 'heart' ? 'linear-gradient(90deg, #ec4899, #be185d)' : 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box>
                            <Typography variant="h5" fontWeight="800" color="#1e293b">
                                {tool === 'heart' ? 'Cardiac Parameters' : 'Diabetic Indicators'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Enter clinical data for analysis</Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            onClick={handlePredict} 
                            disabled={loading} 
                            sx={{ 
                                bgcolor: tool === 'heart' ? '#ec4899' : '#3b82f6',
                                borderRadius: 3, px: 4, py: 1,
                                fontSize: '1rem', fontWeight: 'bold',
                                boxShadow: tool === 'heart' ? '0 4px 14px rgba(236, 72, 153, 0.4)' : '0 4px 14px rgba(59, 130, 246, 0.4)',
                                '&:hover': { bgcolor: tool === 'heart' ? '#db2777' : '#2563eb' }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Run Analysis"}
                        </Button>
                    </Box>
                    
                    <Grid container spacing={3}>
                        {Object.keys(formData).map((key) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                {(tool === 'diabetes' && key !== 'age' && key !== 'gender') ? (
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: formData[key] ? (tool === 'heart' ? '#fbcfe8' : '#dbeafe') : 'divider', bgcolor: formData[key] ? (tool === 'heart' ? '#fff1f2' : '#eff6ff') : 'transparent' }}>
                                        <FormControlLabel 
                                            control={
                                                <Switch 
                                                    checked={!!formData[key]} 
                                                    onChange={(e) => handleChange(key, e.target.checked ? 1 : 0)} 
                                                    color={tool === 'heart' ? 'secondary' : 'primary'}
                                                />
                                            } 
                                            label={
                                                <Typography fontWeight={formData[key] ? "bold" : "regular"} color={formData[key] ? "text.primary" : "text.secondary"}>
                                                    {key.replace(/_/g, ' ')}
                                                </Typography>
                                            } 
                                            sx={{ width: '100%', m: 0 }}
                                        />
                                    </Paper>
                                ) : (
                                    <TextField 
                                        fullWidth 
                                        label={key.toUpperCase().replace(/_/g, ' ')}
                                        value={formData[key]}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        variant="outlined"
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' },
                                            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                        }}
                                    />
                                )}
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
};

const SummaryCard = ({ title, value, sub, color }) => (
    <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Paper sx={{ ...glassCard, p: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: color, filter: 'blur(40px)', opacity: 0.2, borderRadius: '50%' }} />
            <Typography variant="h3" fontWeight="800" sx={{ color: color }}>{value}</Typography>
            <Typography variant="h6" fontWeight="600" color="text.secondary">{title}</Typography>
            <Typography variant="caption" color="text.disabled">{sub}</Typography>
        </Paper>
    </motion.div>
);

const PatientSection = ({ patients, onSelect }) => (
    <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="800" color="#1e293b">My Patients</Typography>
            <TextField 
                placeholder="Search..." 
                InputProps={{ 
                    startAdornment: <SearchRounded sx={{ mr: 1, color: 'text.disabled' }} />,
                    sx: { borderRadius: 4, bgcolor: 'white', border: 'none' } 
                }} 
                size="small"
                sx={{ width: 300 }}
            />
        </Box>
        {patients.length === 0 ? (
            <Paper sx={{ ...glassCard, p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">No patients assigned yet.</Typography>
                <Typography variant="body2">When patients book an appointment, they will appear here.</Typography>
            </Paper>
        ) : (
        <Grid container spacing={2}>
            {patients.map((p, i) => (
                <Grid item xs={12} sm={6} md={4} key={p}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Paper 
                            sx={{ ...glassCard, p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, transition: '0.3s' }}
                            onClick={() => onSelect(p)}
                        >
                            <Avatar sx={{ bgcolor: i % 2 === 0 ? '#6366f1' : '#ec4899', width: 56, height: 56 }}>
                                {p[0].toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{p}</Typography>
                                <Typography variant="body2" color="text.secondary">ID: #{1000 + i}</Typography>
                            </Box>
                            <IconButton sx={{ ml: 'auto' }}><FilterListRounded /></IconButton>
                        </Paper>
                    </motion.div>
                </Grid>
            ))}
        </Grid>
        )}
    </Box>
);

// Appointments Management Tab
const AppointmentsTab = ({ token, user }) => {
    const [appointments, setAppointments] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, msg: '', type: 'success' });

    useEffect(() => {
        fetchAppointments();
    }, [user, token]);

    const fetchAppointments = async () => {
        try {
            const res = await fetch(`http://localhost:8000/frontdesk/appointments?doctor_id=${user.username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAppointments(Array.isArray(data) ? data : []);
            }
        } catch (err) { console.error(err); }
    };

    const handleAction = async (appointmentId, newStatus) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/frontdesk/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setFeedback({ open: true, msg: `Appointment ${newStatus.toLowerCase()} successfully`, type: 'success' });
                fetchAppointments();
            } else throw new Error();
        } catch (e) {
            setFeedback({ open: true, msg: 'Failed to update appointment', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const todayObj = new Date();
    const todayDateStr = todayObj.toDateString();

    const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === todayDateStr);
    const upcomingAppts = appointments.filter(a => new Date(a.date) > todayObj).slice(0, 10);
    const requestedAppts = appointments.filter(a => a.status === 'Requested');

    const AppointmentCard = ({ appt }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{ ...glassCard, p: 3, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: appt.type === 'online' ? '#6366f1' : '#ec4899', width: 48, height: 48 }}>
                                {appt.type === 'online' ? <ScheduleRounded /> : <LocationOnRounded />}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{appt.patient_id}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <AccessTimeRounded sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                    {new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Chip 
                            label={appt.type === 'online' ? 'Virtual' : 'In-Person'} 
                            size="small"
                            sx={{ bgcolor: appt.type === 'online' ? '#dbeafe' : '#fce7f3', color: '#1e293b', fontWeight: 'bold' }}
                        />
                        <Chip 
                            label={appt.status} 
                            size="small"
                            color={appt.status === 'Scheduled' ? 'success' : appt.status === 'Requested' ? 'warning' : 'default'}
                            sx={{ ml: 1 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        {appt.status === 'Requested' && (
                            <Box display="flex" gap={1}>
                                <Button 
                                    size="small" 
                                    variant="contained" 
                                    color="success"
                                    startIcon={<CheckCircleRounded />}
                                    onClick={() => handleAction(appt._id, 'Scheduled')}
                                    disabled={loading}
                                >
                                    Approve
                                </Button>
                                <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="error"
                                    startIcon={<CancelRounded />}
                                    onClick={() => handleAction(appt._id, 'Cancelled')}
                                    disabled={loading}
                                >
                                    Reject
                                </Button>
                            </Box>
                        )}
                        {appt.status === 'Scheduled' && (
                            <Button 
                                size="small" 
                                variant="contained"
                                onClick={() => handleAction(appt._id, 'Completed')}
                                disabled={loading}
                            >
                                Mark Complete
                            </Button>
                        )}
                    </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    <strong>Reason:</strong> {appt.reason || 'Not specified'}
                </Typography>
            </Paper>
        </motion.div>
    );

    return (
        <Box>
            <Snackbar open={feedback.open} autoHideDuration={3000} onClose={() => setFeedback({ ...feedback, open: false })}>
                <Alert severity={feedback.type}>{feedback.msg}</Alert>
            </Snackbar>

            <Typography variant="h4" fontWeight="800" color="#1e293b" mb={3}>Appointments</Typography>

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label={`Today (${todayAppts.length})`} />
                <Tab label={`Upcoming (${upcomingAppts.length})`} />
                <Tab label={`Requests (${requestedAppts.length})`} />
            </Tabs>

            {tabValue === 0 && (
                todayAppts.length === 0 ? (
                    <Paper sx={{ ...glassCard, p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">No appointments today</Typography>
                    </Paper>
                ) : todayAppts.map(appt => <AppointmentCard key={appt._id} appt={appt} />)
            )}

            {tabValue === 1 && (
                upcomingAppts.length === 0 ? (
                    <Paper sx={{ ...glassCard, p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">No upcoming appointments</Typography>
                    </Paper>
                ) : upcomingAppts.map(appt => <AppointmentCard key={appt._id} appt={appt} />)
            )}

            {tabValue === 2 && (
                requestedAppts.length === 0 ? (
                    <Paper sx={{ ...glassCard, p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">No pending requests</Typography>
                    </Paper>
                ) : requestedAppts.map(appt => <AppointmentCard key={appt._id} appt={appt} />)
            )}
        </Box>
    );
};

// Patient Detail Modal
const PatientDetailModal = ({ patientId, open, onClose, token }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && patientId) {
            fetchPatientData();
        }
    }, [open, patientId]);

    const fetchPatientData = async () => {
        setLoading(true);
        try {
            const [rxRes, apptRes] = await Promise.all([
                fetch(`http://localhost:8000/patient/prescriptions/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:8000/frontdesk/appointments?patient_id=${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (rxRes.ok) setPrescriptions(await rxRes.json());
            if (apptRes.ok) setAppointments(await apptRes.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight="bold">Patient Details: {patientId}</Typography>
                    <IconButton onClick={onClose}><CloseRounded /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" fontWeight="bold" mb={2}>Prescription History</Typography>
                        {prescriptions.length === 0 ? (
                            <Typography color="text.secondary">No prescriptions found</Typography>
                        ) : (
                            <List>
                                {prescriptions.slice(0, 5).map((rx, i) => (
                                    <ListItem key={i} sx={{ bgcolor: '#f8fafc', mb: 1, borderRadius: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#dbeafe' }}><MedicationRounded /></Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={rx.medicines?.[0]?.name || 'Unknown'}
                                            secondary={`${rx.medicines?.[0]?.dosage || ''} - ${new Date(rx.date || rx.created_at).toLocaleDateString()}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="h6" fontWeight="bold" mb={2}>Appointment History</Typography>
                        {appointments.length === 0 ? (
                            <Typography color="text.secondary">No appointments found</Typography>
                        ) : (
                            <List>
                                {appointments.slice(0, 5).map((appt, i) => (
                                    <ListItem key={i} sx={{ bgcolor: '#f8fafc', mb: 1, borderRadius: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#fce7f3' }}><EventAvailableRounded /></Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={appt.reason}
                                            secondary={`${new Date(appt.date).toLocaleString()} - ${appt.status}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// Weekly Schedule View - Redesigned
const ScheduleView = ({ appointments }) => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Get date for each day of the week
    const getDayDate = (dayIdx) => {
        const date = new Date();
        date.setDate(date.getDate() + dayIdx);
        return date;
    };
    
    const getApptsForSlot = (day, hour) => {
        const dayDate = getDayDate(day);
        const dayStr = dayDate.toDateString();
        
        return appointments.filter(a => {
            if (new Date(a.date).toDateString() !== dayStr) return false;
            const apptHour = new Date(a.date).getHours();
            return apptHour === hour;
        });
    };

    const isToday = (dayIdx) => {
        const today = new Date().toDateString();
        const dayDate = getDayDate(dayIdx).toDateString();
        return today === dayDate;
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="#1e293b">Weekly Schedule</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {getDayDate(0).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Chip 
                        icon={<ScheduleRounded />} 
                        label="Virtual" 
                        size="small"
                        sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 'bold' }}
                    />
                    <Chip 
                        icon={<LocationOnRounded />} 
                        label="In-Person" 
                        size="small"
                        sx={{ bgcolor: '#fce7f3', color: '#9f1239', fontWeight: 'bold' }}
                    />
                </Box>
            </Box>

            <Paper sx={{ ...glassCard, p: 0, overflowX: 'auto' }}>
                <Box sx={{ minWidth: 1000 }}>
                    {/* Header Row with Day Names and Dates */}
                    <Box display="flex" sx={{ borderBottom: '2px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                        {/* Time Column Header */}
                        <Box sx={{ 
                            width: 100, 
                            p: 2,
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRight: '2px solid #e2e8f0'
                        }}>
                            <AccessTimeRounded sx={{ color: '#64748b', fontSize: 20 }} />
                        </Box>
                        
                        {/* Day Headers */}
                        {weekDays.map((day, idx) => {
                            const dayDate = getDayDate(idx);
                            const isTodayDay = isToday(idx);
                            return (
                                <Box 
                                    key={day} 
                                    sx={{ 
                                        flex: 1, 
                                        p: 2,
                                        textAlign: 'center',
                                        bgcolor: isTodayDay ? '#eff6ff' : 'transparent',
                                        borderRight: idx < 6 ? '1px solid #e2e8f0' : 'none',
                                        position: 'relative'
                                    }}
                                >
                                    {isTodayDay && (
                                        <Chip 
                                            label="Today" 
                                            size="small" 
                                            sx={{ 
                                                position: 'absolute', 
                                                top: 8, 
                                                right: 8,
                                                bgcolor: '#3b82f6',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: 10,
                                                height: 20
                                            }} 
                                        />
                                    )}
                                    <Typography variant="body2" fontWeight="bold" color="#475569">
                                        {weekDaysShort[idx]}
                                    </Typography>
                                    <Typography 
                                        variant="h6" 
                                        fontWeight="800" 
                                        color={isTodayDay ? '#3b82f6' : '#1e293b'}
                                        sx={{ mt: 0.5 }}
                                    >
                                        {dayDate.getDate()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Time Slots Grid */}
                    {hours.map((hour, hourIdx) => (
                        <Box key={hour} display="flex" sx={{ 
                            borderBottom: hourIdx < hours.length - 1 ? '1px solid #e2e8f0' : 'none',
                            minHeight: 80,
                            '&:hover': { bgcolor: '#fafafa' }
                        }}>
                            {/* Time Label */}
                            <Box sx={{ 
                                width: 100, 
                                p: 2,
                                display: 'flex', 
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                borderRight: '2px solid #e2e8f0',
                                bgcolor: '#f8fafc'
                            }}>
                                <Typography variant="body2" fontWeight="600" color="#64748b">
                                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                </Typography>
                            </Box>
                            
                            {/* Day Cells */}
                            {weekDaysShort.map((day, dayIdx) => {
                                const appts = getApptsForSlot(dayIdx, hour);
                                const isTodayDay = isToday(dayIdx);
                                
                                return (
                                    <Box 
                                        key={day} 
                                        sx={{ 
                                            flex: 1, 
                                            p: 1,
                                            borderRight: dayIdx < 6 ? '1px solid #e2e8f0' : 'none',
                                            bgcolor: isTodayDay ? '#fafbff' : 'transparent',
                                            position: 'relative'
                                        }}
                                    >
                                        {appts.length === 0 ? (
                                            <Box sx={{ 
                                                height: '100%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                opacity: 0.3
                                            }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                                                    —
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box display="flex" flexDirection="column" gap={0.5}>
                                                {appts.map((appt, i) => (
                                                    <Tooltip 
                                                        key={i} 
                                                        title={
                                                            <Box p={1}>
                                                                <Typography variant="body2" fontWeight="bold">{appt.patient_id}</Typography>
                                                                <Typography variant="caption">{appt.reason}</Typography>
                                                                <Box mt={0.5}>
                                                                    <Chip 
                                                                        label={appt.status} 
                                                                        size="small" 
                                                                        sx={{ height: 18, fontSize: 10 }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        }
                                                        arrow
                                                        placement="top"
                                                    >
                                                        <motion.div
                                                            initial={{ scale: 0.9, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            whileHover={{ scale: 1.02, y: -2 }}
                                                            transition={{ type: 'spring', stiffness: 300 }}
                                                        >
                                                            <Paper 
                                                                elevation={2}
                                                                sx={{ 
                                                                    p: 1,
                                                                    borderRadius: 2,
                                                                    background: appt.type === 'online' 
                                                                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                                                        : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                                                                    borderLeft: `3px solid ${appt.type === 'online' ? '#3b82f6' : '#ec4899'}`,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    '&:hover': {
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                                    }
                                                                }}
                                                            >
                                                                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                                                    {appt.type === 'online' ? (
                                                                        <ScheduleRounded sx={{ fontSize: 12, color: '#1e40af' }} />
                                                                    ) : (
                                                                        <LocationOnRounded sx={{ fontSize: 12, color: '#9f1239' }} />
                                                                    )}
                                                                    <Typography 
                                                                        variant="caption" 
                                                                        fontWeight="bold"
                                                                        sx={{ 
                                                                            fontSize: 11,
                                                                            color: appt.type === 'online' ? '#1e40af' : '#9f1239',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        {appt.patient_id}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography 
                                                                    variant="caption" 
                                                                    sx={{ 
                                                                        fontSize: 9,
                                                                        color: '#64748b',
                                                                        display: 'block',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                >
                                                                    {appt.reason}
                                                                </Typography>
                                                            </Paper>
                                                        </motion.div>
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* Legend */}
            <Box mt={3} display="flex" gap={3} justifyContent="center" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                    <Typography variant="caption" color="text.secondary">Virtual Appointment</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ec4899' }} />
                    <Typography variant="caption" color="text.secondary">In-Person Appointment</Typography>
                </Box>
            </Box>
        </Box>
    );
};


// Notification Panel
const NotificationPanel = ({ open, onClose, notifications, onMarkRead }) => {
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 350, p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Notifications</Typography>
                {notifications.length === 0 ? (
                    <Typography color="text.secondary">No new notifications</Typography>
                ) : (
                    <List>
                        {notifications.map((notif, i) => (
                            <ListItem 
                                key={i} 
                                sx={{ 
                                    bgcolor: notif.read ? 'transparent' : '#f0f9ff',
                                    mb: 1,
                                    borderRadius: 2,
                                    cursor: 'pointer'
                                }}
                                onClick={() => onMarkRead(i)}
                            >
                                <ListItemText 
                                    primary={notif.message}
                                    secondary={new Date(notif.date).toLocaleString()}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Drawer>
    );
};


const DoctorDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, todayVirtual: 0, todayInPerson: 0 });
  const [specialization, setSpecialization] = useState('General');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '' });
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [patientModal, setPatientModal] = useState({ open: false, patientId: null });

  // Auth & Data Fetching
  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }

    const fetchData = async () => {
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            // Profile for Specialization
            const uRes = await fetch(`http://localhost:8000/auth/profile/${user.username}`, { headers });
            if (uRes.ok) {
                const uData = await uRes.json();
                if (uData.specialization) setSpecialization(uData.specialization);
            }

            // Patients
            const pRes = await fetch(`http://localhost:8000/doctor/patients/${user.username}`, { headers });
            const pData = await pRes.json();
            setPatients(Array.isArray(pData) ? pData : []);

            // Appt Stats
            const aRes = await fetch(`http://localhost:8000/frontdesk/appointments?doctor_id=${user.username}`, { headers });
            const aData = await aRes.json();
            if (Array.isArray(aData)) {
                setAppointments(aData); // Store full list
                const todayDateStr = new Date().toDateString();
                const todayAppts = aData.filter(a => new Date(a.date).toDateString() === todayDateStr);
                setStats({
                    today: todayAppts.length,
                    pending: aData.filter(a => a.status === 'Requested').length,
                    todayVirtual: todayAppts.filter(a => a.type === 'online').length,
                    todayInPerson: todayAppts.filter(a => a.type === 'in-person').length
                });
                
                // Generate notifications for pending requests
                const pendingReqs = aData.filter(a => a.status === 'Requested');
                if (pendingReqs.length > 0) {
                    setNotifications(pendingReqs.map(req => ({
                        message: `New appointment request from ${req.patient_id}`,
                        date: req.created_at || req.date,
                        read: false,
                        type: 'request'
                    })));
                }
            }
        } catch (e) { console.error(e); }
    };
    fetchData();
  }, [user, navigate, token]);



  // Navigation Items
  const navItems = [
    { id: 'home', icon: <DashboardRounded />, label: 'Home', badge: notifications.filter(n => !n.read).length },
    { id: 'appointments', icon: <CalendarMonthRounded />, label: 'Appointments' },
    { id: 'patients', icon: <PeopleRounded />, label: 'Patients' },
    { id: 'rx', icon: <LocalPharmacyRounded />, label: 'Pharmacy' },
    { id: 'schedule', icon: <ScheduleRounded />, label: 'Schedule' },
    { id: 'ai', icon: <BiotechRounded />, label: 'AI Tools' },
  ];

  const handlePatientClick = (patientId) => {
    setPatientModal({ open: true, patientId });
  };

  const handleMarkNotifRead = (index) => {
    setNotifications(prev => prev.map((n, i) => i === index ? { ...n, read: true } : n));
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', pb: 12, overflowX: 'hidden' }}>
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            <Alert severity="success">{snackbar.msg}</Alert>
        </Snackbar>



        {/* Top Header */}
        <Box px={4} py={3} display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#4f46e5' }} src="/broken-image.jpg" />
                <Box>
                    <Typography variant="h6" fontWeight="800" lineHeight={1.1} color="#1e293b">Dr. {user?.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{specialization} • On Duty</Typography>
                </Box>
            </Box>
            <Box>
                <Tooltip title="Sign Out">
                     <IconButton onClick={() => { logout(); navigate('/login'); }} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <PowerSettingsNewRounded color="error" />
                     </IconButton>
                </Tooltip>
                <Tooltip title="Notifications">
                    <IconButton onClick={() => setNotifOpen(true)} sx={{ bgcolor: 'white', ml: 1, '&:hover': { bgcolor: '#f0f9ff' } }}>
                        <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                            <NotificationsRounded color="primary" />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>

        {/* Content Area */}
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                    <motion.div key="home" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                        <Typography variant="h3" fontWeight="900" color="#312e81" mb={1}>Good Afternoon,</Typography>
                        <Typography variant="h5" color="#6366f1" mb={4} fontWeight="500">Here is your daily rounds report.</Typography>
                        
                        <Grid container spacing={3} mb={6}>
                            <Grid item xs={12} md={4}>
                                <SummaryCard 
                                    title="Appointments Today" 
                                    value={stats.today} 
                                    sub={stats.today === 0 ? 'No appointments' : `${stats.todayVirtual} Virtual, ${stats.todayInPerson} In-Person`} 
                                    color="#4f46e5" 
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <SummaryCard 
                                    title="Pending Requests" 
                                    value={stats.pending} 
                                    sub={stats.pending === 0 ? 'All up to date' : stats.pending === 1 ? '1 appointment to review' : `${stats.pending} appointments to review`} 
                                    color="#ea580c" 
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <SummaryCard 
                                    title="Assigned Patients" 
                                    value={patients.length} 
                                    sub={patients.length === 0 ? 'No patients yet' : patients.length === 1 ? '1 active patient' : `${patients.length} active patients`} 
                                    color="#10b981" 
                                />
                            </Grid>
                        </Grid>

                        <Box mb={4}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h5" fontWeight="800" color="#1e293b">Today's Schedule</Typography>
                                <Button size="small" onClick={() => setActiveTab('appointments')}>View All</Button>
                            </Box>
                            {appointments.filter(a => a.date?.startsWith(new Date().toISOString().split('T')[0])).slice(0, 3).length === 0 ? (
                                <Paper sx={{ ...glassCard, p: 3, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No appointments today</Typography>
                                </Paper>
                            ) : (
                                <List sx={{ bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 3 }}>
                                    {appointments.filter(a => a.date?.startsWith(new Date().toISOString().split('T')[0])).slice(0, 3).map((appt, i) => (
                                        <ListItem key={i}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: appt.type === 'online' ? '#dbeafe' : '#fce7f3' }}>
                                                    {appt.type === 'online' ? <ScheduleRounded /> : <LocationOnRounded />}
                                                </Avatar>
                                            </ListItemAvatar>
               <ListItemText 
                                                primary={appt.patient_id}
                                                secondary={`${new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${appt.reason}`}
                                            />
                                            <Chip label={appt.type === 'online' ? 'Virtual' : 'In-Person'} size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>

                        <Box mb={4}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h5" fontWeight="800" color="#1e293b">Quick Actions</Typography>
                            </Box>
                            <Grid container spacing={2}>

                                <Grid item xs={6} md={3}>
                                    <Paper 
                                        onClick={() => setActiveTab('appointments')}
                                        sx={{ ...glassCard, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#eef2ff' } }}
                                    >
                                        <CalendarMonthRounded sx={{ fontSize: 40, color: '#6366f1' }} />
                                        <Typography fontWeight="600">Appointments</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper 
                                        onClick={() => setActiveTab('rx')}
                                        sx={{ ...glassCard, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#eef2ff' } }}
                                    >
                                        <LocalPharmacyRounded sx={{ fontSize: 40, color: '#ec4899' }} />
                                        <Typography fontWeight="600">Prescribe</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper 
                                        onClick={() => setActiveTab('patients')}
                                        sx={{ ...glassCard, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#eef2ff' } }}
                                    >
                                        <PeopleRounded sx={{ fontSize: 40, color: '#10b981' }} />
                                        <Typography fontWeight="600">Patients</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper 
                                        onClick={() => setActiveTab('ai')}
                                        sx={{ ...glassCard, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#eef2ff' } }}
                                    >
                                        <BiotechRounded sx={{ fontSize: 40, color: '#f59e0b' }} />
                                        <Typography fontWeight="600">AI Tools</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </motion.div>
                )}

                {activeTab === 'appointments' && (
                    <motion.div key="appointments" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <AppointmentsTab token={token} user={user} />
                    </motion.div>
                )}

                {activeTab === 'patients' && (
                    <motion.div key="patients" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <PatientSection patients={patients} onSelect={handlePatientClick} />
                    </motion.div>
                )}
                
                {activeTab === 'rx' && (
                     <motion.div key="rx" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <PrescriptionsTab patients={patients} token={token} user={user} />
                     </motion.div>
                )}
                
                {activeTab === 'ai' && (
                    <motion.div key="ai" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <AIToolsTab token={token} />
                    </motion.div>
                )}
                
                {activeTab === 'schedule' && (
                    <motion.div key="schedule" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <ScheduleView appointments={appointments} />
                    </motion.div>
                )}

            </AnimatePresence>
        </Container>

        {/* Patient Detail Modal */}
        <PatientDetailModal 
            patientId={patientModal.patientId}
            open={patientModal.open}
            onClose={() => setPatientModal({ open: false, patientId: null })}
            token={token}
        />

        {/* Notification Panel */}
        <NotificationPanel 
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={notifications}
            onMarkRead={handleMarkNotifRead}
        />


        {/* Floating Bottom Navigation */}
        <Paper sx={floatNavStyle} elevation={4}>
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <Tooltip title={item.label} key={item.id} placement="top">
                        <IconButton 
                            onClick={() => setActiveTab(item.id)}
                            sx={{ 
                                color: isActive ? 'white' : '#64748b',
                                bgcolor: isActive ? '#4f46e5' : 'transparent',
                                transition: '0.3s',
                                '&:hover': { bgcolor: isActive ? '#4338ca' : 'rgba(99, 102, 241, 0.1)' },
                                width: 50, height: 50
                            }}
                        >
                            {item.badge && item.badge > 0 ? (
                                <Badge badgeContent={item.badge} color="error">
                                    {item.icon}
                                </Badge>
                            ) : item.icon}
                        </IconButton>
                    </Tooltip>
                );
            })}
        </Paper>
    </Box>
  );
};

export default DoctorDashboard;
