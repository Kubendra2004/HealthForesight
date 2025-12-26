import React from 'react';
import { Box, Paper, Typography, Grid, Chip, Avatar, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { HotelRounded, PersonRounded, CheckCircleRounded, CancelRounded } from '@mui/icons-material';

const BedManagement2D = ({ beds, onBedClick, selectedBedId }) => {
    
    // Group beds by Ward for better organization
    const bedsByWard = beds.reduce((acc, bed) => {
        const ward = bed.ward || 'General';
        if (!acc[ward]) acc[ward] = [];
        acc[ward].push(bed);
        return acc;
    }, {});

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <Box sx={{ height: '100%', overflowY: 'auto', pr: 1 }}>
            {Object.entries(bedsByWard).map(([ward, wardBeds]) => (
                <Box key={ward} mb={4}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box component="span" sx={{ width: 4, height: 24, bgcolor: '#6366f1', borderRadius: 2 }} />
                        {ward} Ward
                    </Typography>
                    
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Grid container spacing={2}>
                            {wardBeds.map((bed) => {
                                const isSelected = selectedBedId === bed._id;
                                const isAvailable = bed.status === 'Available';
                                
                                return (
                                    <Grid item xs={6} sm={4} md={3} lg={2} key={bed._id}>
                                        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Paper 
                                                elevation={isSelected ? 4 : 1}
                                                onClick={() => onBedClick(bed)}
                                                sx={{ 
                                                    p: 2, 
                                                    cursor: 'pointer',
                                                    borderRadius: 3,
                                                    border: isSelected ? '2px solid #6366f1' : '1px solid transparent',
                                                    bgcolor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                                                    backdropFilter: 'blur(10px)',
                                                    transition: 'all 0.3s ease',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {/* Status Indicator Strip */}
                                                <Box sx={{ 
                                                    position: 'absolute', top: 0, left: 0, right: 0, height: 4, 
                                                    bgcolor: isAvailable ? '#10b981' : '#ef4444' 
                                                }} />

                                                <Box display="flex" flexDirection="column" alignItems="center" gap={1} mt={1}>
                                                    <Avatar 
                                                        sx={{ 
                                                            bgcolor: isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                                            color: isAvailable ? '#10b981' : '#ef4444',
                                                            width: 48, height: 48
                                                        }}
                                                    >
                                                        {isAvailable ? <HotelRounded /> : <PersonRounded />}
                                                    </Avatar>
                                                    
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {bed.bed_number}
                                                    </Typography>

                                                    <Chip 
                                                        label={isAvailable ? 'Free' : 'Occupied'} 
                                                        size="small" 
                                                        icon={isAvailable ? <CheckCircleRounded /> : <CancelRounded />}
                                                        sx={{ 
                                                            bgcolor: isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: isAvailable ? '#059669' : '#dc2626',
                                                            fontWeight: 600,
                                                            border: 'none'
                                                        }} 
                                                    />
                                                </Box>
                                            </Paper>
                                        </motion.div>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </motion.div>
                </Box>
            ))}
            
            {beds.length === 0 && (
                <Box textAlign="center" py={5} color="text.secondary">
                    <HotelRounded sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                    <Typography>No beds found.</Typography>
                </Box>
            )}
        </Box>
    );
};

export default BedManagement2D;
