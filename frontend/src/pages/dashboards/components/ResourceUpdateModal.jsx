import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Typography, Box
} from '@mui/material';

const ResourceUpdateModal = ({ open, onClose, onUpdate, initialType = '' }) => {
    const [type, setType] = useState('beds');
    const [current, setCurrent] = useState('');
    const [capacity, setCapacity] = useState('');
    const [unit, setUnit] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && initialType) {
            setType(initialType);
        }
    }, [open, initialType]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onUpdate({ 
                type: type.toLowerCase(), 
                current: Number(current), 
                capacity: Number(capacity),
                unit: unit || 'units'
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Update Resource Levels</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                    <FormControl fullWidth>
                        <InputLabel>Resource Type</InputLabel>
                        <Select value={type} label="Resource Type" onChange={(e) => setType(e.target.value)}>
                            <MenuItem value="beds">Beds</MenuItem>
                            <MenuItem value="oxygen">Oxygen</MenuItem>
                            <MenuItem value="blood">Blood Bank</MenuItem>
                            <MenuItem value="ventilators">Ventilators</MenuItem>
                            <MenuItem value="masks">N95 Masks</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField 
                        label="Current Usage/Inventory" 
                        type="number" 
                        value={current} 
                        onChange={(e) => setCurrent(e.target.value)} 
                        fullWidth 
                    />
                    <TextField 
                        label="Total Capacity" 
                        type="number" 
                        value={capacity} 
                        onChange={(e) => setCapacity(e.target.value)} 
                        fullWidth 
                    />
                     <TextField 
                        label="Unit (e.g., L, Units)" 
                        value={unit} 
                        onChange={(e) => setUnit(e.target.value)} 
                        fullWidth 
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Updating...' : 'Update'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResourceUpdateModal;
