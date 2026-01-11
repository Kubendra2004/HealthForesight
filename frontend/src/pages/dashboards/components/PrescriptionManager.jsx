import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Box, Chip } from '@mui/material';
import axios from 'axios';

const PrescriptionManager = () => {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        fetch('http://localhost:8000/portal/prescriptions', {
             headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => setPrescriptions(data))
        .catch(err => console.error(err));
    }
  }, []);

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                💊 My Prescriptions
            </Typography>
            {prescriptions.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography color="text.secondary">No prescriptions found.</Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {prescriptions.map((p, i) => (
                        <React.Fragment key={i}>
                            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2, bgcolor: '#f8fafc', borderRadius: 3, p: 2 }}>
                                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography fontWeight="700" color="#1e293b" variant="subtitle1">
                                        {p.medication}
                                    </Typography>
                                    <Chip label={p.dosage} color="primary" size="small" variant="outlined" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Instructions: {p.instructions}
                                </Typography>
                                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Dr. {p.prescribed_by}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(p.date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            )}
        </CardContent>
    </Card>
  );
};

export default PrescriptionManager;
