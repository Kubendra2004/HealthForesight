import React, { useState } from 'react';
import { 
  Box, Paper, Typography, TextField, Button, Grid, Tab, Tabs, 
  Chip, CircularProgress, Alert, Divider, Stack 
} from '@mui/material';
import { 
  PsychologyRounded, MonitorHeartRounded, LocalHospitalRounded, 
  ScienceRounded, AssessmentRounded
} from '@mui/icons-material';

const glassCard = {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '24px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
};

const RiskCalculators = () => {
    const [tab, setTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    return (
        <Box>
             <Typography variant="h5" fontWeight="800" mb={3} display="flex" alignItems="center" gap={1}>
                <PsychologyRounded /> Clinical Risk Assessment (ML)
            </Typography>

            <Paper sx={{ ...glassCard, overflow: 'hidden' }}>
                <Tabs 
                    value={tab} 
                    onChange={handleTabChange} 
                    variant="fullWidth" 
                    sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.5)' }}
                >
                    <Tab icon={<MonitorHeartRounded />} label="Heart Disease" />
                    <Tab icon={<AssessmentRounded />} label="Patient Clustering" />
                    <Tab icon={<LocalHospitalRounded />} label="Readmission Risk" />
                    {/* ICU Transfer could be added here */}
                </Tabs>
                
                <Box p={4}>
                    {tab === 0 && <HeartRiskCalculator />}
                    {tab === 1 && <ClusteringCalculator />}
                    {tab === 2 && <ReadmissionCalculator />}
                </Box>
            </Paper>
        </Box>
    );
};

// --- Sub-Components ---

const ResultCard = ({ result, loading, error }) => {
    if (loading) return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    if (!result) return null;

    return (
        <Paper elevation={0} sx={{ mt: 3, p: 3, bgcolor: result.prediction === 1 ? '#fef2f2' : '#f0fdf4', borderRadius: 4, border: '1px solid', borderColor: result.prediction === 1 ? '#fca5a5' : '#86efac' }}>
            <Typography variant="overline" color="text.secondary">Prediction Result</Typography>
            <Typography variant="h5" fontWeight="bold" color={result.prediction === 1 ? 'error' : 'success'}>
                {result.label || (result.cluster !== undefined ? `Cluster: ${result.risk_level}` : 'Result')}
            </Typography>
            {result.probability && (
                 <Typography variant="body2" mt={1}>
                    Confidence: <strong>{(result.probability * 100).toFixed(1)}%</strong>
                </Typography>
            )}
            
            {/* Mock Explain for now unless backend supports it fully for all */}
            {result.input_data && (
                <Box mt={2} p={2} bgcolor="rgba(255,255,255,0.6)" borderRadius={2}>
                   <Typography variant="caption" fontWeight="bold">Input Factors:</Typography>
                   <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                       {Object.entries(result.input_data).slice(0, 5).map(([k, v]) => (
                           <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" />
                       ))}
                   </Box>
                </Box>
            )}
        </Paper>
    );
};

const HeartRiskCalculator = () => {
    const [form, setForm] = useState({
        age: 55, sex: 1, cp: 0, trestbps: 140, chol: 240, fbs: 0,
        restecg: 1, thalach: 150, exang: 0, oldpeak: 1.5, slope: 1, ca: 0, thal: 2
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setLoading(true); setError(null);
        try {
            // Assume user token is valid
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/ml/predict/heart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                 const err = await res.json();
                 throw new Error(err.detail || 'Prediction failed');
            }
            setResult(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" mb={3}>Enter patient vitals to assess heart disease risk.</Typography>
            <Grid container spacing={2}>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Age" type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="BP (trestbps)" type="number" value={form.trestbps} onChange={(e) => setForm({...form, trestbps: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Cholesterol" type="number" value={form.chol} onChange={(e) => setForm({...form, chol: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Max HR" type="number" value={form.thalach} onChange={(e) => setForm({...form, thalach: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Oldpeak" type="number" value={form.oldpeak} onChange={(e) => setForm({...form, oldpeak: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Sex (1=M, 0=F)" type="number" value={form.sex} onChange={(e) => setForm({...form, sex: Number(e.target.value)})} /></Grid>
            </Grid>
            <Box mt={3} display="flex" justifyContent="flex-end">
                <Button variant="contained" size="large" onClick={handleSubmit} startIcon={<ScienceRounded />}>Analyze Risk</Button>
            </Box>
            <ResultCard result={result} loading={loading} error={error} />
        </Box>
    );
};

const ClusteringCalculator = () => {
     // Simplified form for clustering
    const [form, setForm] = useState({
        age: 45, gender: 1, blood_pressure: 120, cholesterol: 200, bmi: 25,
        plasma_glucose: 100, insulin: 80, max_heart_rate: 160
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setLoading(true); setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/ml/predict/cluster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form) // Send partial data, backend handles missing fields via Optional
            });
             if (!res.ok) {
                 const err = await res.json();
                 throw new Error(err.detail || 'Clustering failed. Model files might be missing.');
            }
            setResult(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" mb={3}>Group patient into risk clusters based on metabolic profile.</Typography>
             <Grid container spacing={2}>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Age" type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="BMI" type="number" value={form.bmi} onChange={(e) => setForm({...form, bmi: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Glucose" type="number" value={form.plasma_glucose} onChange={(e) => setForm({...form, plasma_glucose: Number(e.target.value)})} /></Grid>
            </Grid>
             <Box mt={3} display="flex" justifyContent="flex-end">
                <Button variant="contained" color="secondary" size="large" onClick={handleSubmit} startIcon={<PsychologyRounded />}>Identify Cluster</Button>
            </Box>
            <ResultCard result={result} loading={loading} error={error} />
        </Box>
    );
};

const ReadmissionCalculator = () => {
    const [form, setForm] = useState({
        age: 65, length_of_stay: 5, prev_admissions: 1, comorbidity_score: 2, surgery: 0
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setLoading(true); setError(null);
        try {
             const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/ml/predict/readmission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                 const err = await res.json();
                 throw new Error(err.detail || 'Prediction failed');
            }
            setResult(await res.json());
        } catch (e) {
             setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
         <Box>
            <Typography variant="body2" color="text.secondary" mb={3}>Estimate 30-day readmission probability.</Typography>
             <Grid container spacing={2}>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Age" type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Length of Stay (Days)" type="number" value={form.length_of_stay} onChange={(e) => setForm({...form, length_of_stay: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Prev Admissions" type="number" value={form.prev_admissions} onChange={(e) => setForm({...form, prev_admissions: Number(e.target.value)})} /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Comorbidity Score" type="number" value={form.comorbidity_score} onChange={(e) => setForm({...form, comorbidity_score: Number(e.target.value)})} /></Grid>
                 <Grid item xs={6} sm={4}><TextField fullWidth label="Surgery (1=Yes)" type="number" value={form.surgery} onChange={(e) => setForm({...form, surgery: Number(e.target.value)})} /></Grid>
            </Grid>
             <Box mt={3} display="flex" justifyContent="flex-end">
                <Button variant="contained" color="warning" size="large" onClick={handleSubmit} startIcon={<LocalHospitalRounded />}>Check Readmission</Button>
            </Box>
            <ResultCard result={result} loading={loading} error={error} />
        </Box>
    );
};

export default RiskCalculators;
