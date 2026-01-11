import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Typography, Box, Avatar, Chip, Divider 
} from '@mui/material';
import { HotelRounded, CheckCircleRounded, CancelRounded } from '@mui/icons-material';

const BedActionModal = ({ open, onClose, bed, onAllocate, onDeallocate }) => {
    if (!bed) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                Bed Management
            </DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
                    <Avatar sx={{ 
                        width: 80, height: 80, 
                        bgcolor: bed.status === 'Available' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: bed.status === 'Available' ? '#10b981' : '#ef4444'
                    }}>
                        <HotelRounded sx={{ fontSize: 40 }} />
                    </Avatar>
                    
                    <Typography variant="h5" fontWeight="800">
                        {bed.bed_number}
                    </Typography>

                    <Chip 
                        label={bed.status} 
                        color={bed.status === 'Available' ? 'success' : 'error'} 
                        icon={bed.status === 'Available' ? <CheckCircleRounded /> : <CancelRounded />}
                    />
                    
                    <Box width="100%" mt={2}>
                        <Box display="flex" justify="space-between" width="100%" mb={1}>
                            <Typography color="text.secondary">Type:</Typography>
                            <Typography fontWeight="600">{bed.type}</Typography>
                        </Box>
                        <Box display="flex" justify="space-between" width="100%" mb={1}>
                            <Typography color="text.secondary">Ward:</Typography>
                            <Typography fontWeight="600">{bed.ward}</Typography>
                        </Box>
                        {bed.status === 'Occupied' && (
                            <Box display="flex" justify="space-between" width="100%">
                                <Typography color="text.secondary">Patient:</Typography>
                                <Typography fontWeight="600">{bed.patient_id}</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Cancel
                </Button>
                {bed.status === 'Available' ? (
                    <Button 
                        onClick={() => onAllocate(bed)} 
                        variant="contained" 
                        color="primary"
                        startIcon={<CheckCircleRounded />}
                    >
                        Allocate Patient
                    </Button>
                ) : (
                    <Button 
                        onClick={() => onDeallocate(bed._id)} 
                        variant="contained" 
                        color="error"
                        startIcon={<CancelRounded />}
                    >
                        Deallocate & Bill
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default BedActionModal;
