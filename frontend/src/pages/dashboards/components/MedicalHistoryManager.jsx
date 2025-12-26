import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Chip, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MedicalHistoryManager = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        fetch('http://localhost:8000/portal/history', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => setHistory(data))
        .catch(err => console.error(err));
    }
  }, []);

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
    >
        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏥 Medical History
                </Typography>
                {history.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography color="text.secondary">No medical conditions recorded.</Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {history.map((h, i) => (
                            <React.Fragment key={i}>
                                <ListItem sx={{ 
                                    px: 2, py: 2, 
                                    '&:hover': { bgcolor: '#f8fafc' },
                                    borderRadius: 2,
                                    mb: 1
                                }}>
                                    <ListItemText 
                                        primary={
                                            <Typography fontWeight="700" color="#1e293b">
                                                {h.condition}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                 <Typography variant="caption" color="text.secondary">
                                                    Diagnosed: {new Date(h.date_diagnosed).toLocaleDateString()}
                                                 </Typography>
                                                 {h.notes && (
                                                     <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        "{h.notes}"
                                                     </Typography>
                                                 )}
                                            </Box>
                                        }
                                    />
                                    <Chip 
                                        label={h.status} 
                                        size="small"
                                        sx={{ 
                                            bgcolor: h.status === 'Active' ? '#fee2e2' : '#dcfce7',
                                            color: h.status === 'Active' ? '#991b1b' : '#166534',
                                            fontWeight: 700
                                        }} 
                                    />
                                </ListItem>
                                {i < history.length - 1 && <Divider component="li" variant="inset" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    </motion.div>
  );
};

export default MedicalHistoryManager;
