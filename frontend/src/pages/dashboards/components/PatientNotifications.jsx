import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  IconButton, 
  Chip, 
  Paper,
  Divider,
  Button
} from '@mui/material';
import { 
  Notifications, 
  CheckCircle, 
  CalendarToday, 
  Info, 
  Delete 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const PatientNotifications = ({ patientId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [patientId]);

  const fetchNotifications = async () => {
    if (!patientId) {
        setLoading(false);
        return;
    }
    try {
        // Backend expects user_id
      const res = await axios.get(`http://localhost:8000/frontdesk/notifications/${patientId}`);
      // Sort by date desc
      const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(sorted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8000/frontdesk/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Appointment': return <CalendarToday sx={{ color: '#2563eb' }} />;
      case 'Billing': return <Info sx={{ color: '#f59e0b' }} />;
      default: return <Notifications sx={{ color: '#8b5cf6' }} />;
    }
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
    >
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                borderRadius: "16px",
                padding: "2rem",
                marginBottom: "2rem",
                color: "white",
                boxShadow: "0 10px 40px rgba(245, 158, 11, 0.3)",
            }}
        >
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Notifications fontSize="large" /> Notifications
            </h1>
            <p style={{ fontSize: "1rem", opacity: 0.9 }}>
                Stay updated with your appointments and alerts
            </p>
        </motion.div>

        <Paper 
            elevation={0}
            sx={{ 
                borderRadius: 4, 
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                minHeight: '400px'
            }}
        >
            {loading ? (
                 <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>
            ) : notifications.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center', color: '#94a3b8' }}>
                    <Notifications sx={{ fontSize: 60, mb: 2, opacity: 0.2 }} />
                    <Typography>No notifications yet</Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    <AnimatePresence>
                        {notifications.map((n) => (
                            <motion.div
                                key={n._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        p: 3,
                                        bgcolor: n.read ? 'white' : '#f0f9ff',
                                        transition: 'background-color 0.3s',
                                        '&:hover': { bgcolor: '#f8fafc' }
                                    }}
                                    secondaryAction={
                                        !n.read && (
                                            <IconButton onClick={() => markAsRead(n._id)} size="small" color="primary">
                                                <CheckCircle />
                                            </IconButton>
                                        )
                                    }
                                >
                                    <Box sx={{ 
                                        mr: 2.5, 
                                        mt: 0.5,
                                        width: 40, height: 40, 
                                        borderRadius: '50%', 
                                        bgcolor: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        {getIcon(n.type)}
                                    </Box>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="subtitle1" fontWeight={n.read ? 600 : 700}>
                                                    {n.type || 'Alert'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {getTimeAgo(n.date)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                {n.message}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </List>
            )}
        </Paper>
    </motion.div>
  );
};

export default PatientNotifications;
