import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { TimelineRounded } from '@mui/icons-material';

const glassCard = {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '24px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
};

const ResourceForecast = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:8000/ml/predict/resources?days=7', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Failed to fetch forecast');
                const result = await res.json();
                
                // Transform data for charts
                // Result has separate arrays: { beds: [{date, prediction}], oxygen: ... }
                // We'll trust the structure for now
                setData(result);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, []);

    if (loading) return <Box p={3}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return <Alert severity="warning">No forecast data available</Alert>;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight="bold" color={payload[0].color}>
                        {payload[0].name}: {payload[0].value.toFixed(1)}
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight="800" mb={3} display="flex" alignItems="center" gap={1}>
                <TimelineRounded /> 7-Day Forecasting
            </Typography>
            
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={3}>
                {/* Beds Forecast */}
                <Paper sx={{ ...glassCard, p: 3 }}>
                    <Typography variant="h6" mb={2}>Predicted Bed Occupancy</Typography>
                    <Box height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.beds}>
                                <defs>
                                    <linearGradient id="colorBeds" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(d) => d.split('-').slice(1).join('/')} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="prediction" name="Occupied Beds" stroke="#8884d8" fillOpacity={1} fill="url(#colorBeds)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                {/* Oxygen Forecast */}
                <Paper sx={{ ...glassCard, p: 3 }}>
                    <Typography variant="h6" mb={2}>Oxygen Demand (Liters)</Typography>
                    <Box height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.oxygen}>
                                <defs>
                                    <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(d) => d.split('-').slice(1).join('/')} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="prediction" name="Oxygen (L)" stroke="#10b981" fillOpacity={1} fill="url(#colorO2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
                
                 {/* ER Visits Forecast */}
                 <Paper sx={{ ...glassCard, p: 3 }}>
                    <Typography variant="h6" mb={2}>ER Visits Projection</Typography>
                    <Box height={250}>
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.er_visits}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(d) => d.split('-').slice(1).join('/')} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="prediction" name="ER Visits" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
                
                {/* ICU Forecast */}
                <Paper sx={{ ...glassCard, p: 3 }}>
                    <Typography variant="h6" mb={2}>ICU Admissions</Typography>
                     <Box height={250}>
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.icu}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(d) => d.split('-').slice(1).join('/')} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="prediction" name="ICU Cases" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default ResourceForecast;
