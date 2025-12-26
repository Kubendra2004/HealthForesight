import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Grid, TextField, Typography, Box, Paper, InputAdornment, Divider 
} from '@mui/material';
import { ReceiptRounded, PaymentRounded, LocalHospitalRounded } from '@mui/icons-material';

const BillProcessingModal = ({ open, onClose, bill, onProcess, isNew = false }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    consultation: 0,
    room: 0,
    nursing: 0,
    medicines: 0,
    lab: 0,
    ot: 0,
    supplies: 0,
    equipment: 0,
    diet: 0,
    ambulance: 0,
    misc: 0,
    notes: ''
  });

  useEffect(() => {
    if (bill && !isNew) {
       // Attempt to parse existing items
       const parseCost = (desc) => {
           const item = bill.items.find(i => i.description.includes(desc));
           return item ? item.cost : 0;
       };
       
       setFormData({
           patient_id: bill.patient_id,
           consultation: parseCost('Consultation'),
           room: parseCost('Room') || parseCost('Bed'),
           nursing: parseCost('Nursing'),
           medicines: parseCost('Medicine'),
           lab: parseCost('Lab') || parseCost('Procedure'),
           ot: parseCost('OT') || parseCost('Operation'),
           supplies: parseCost('Supplies'),
           equipment: parseCost('Equipment'),
           diet: parseCost('Diet') || parseCost('Food'),
           ambulance: parseCost('Ambulance'),
           misc: parseCost('Misc') || parseCost('Hospital Stay'), // Fallback for general stay
           notes: ''
       });
    } else {
        setFormData({
            patient_id: bill?.patient_id || '',
            consultation: 0, room: 0, nursing: 0, medicines: 0, lab: 0,
            ot: 0, supplies: 0, equipment: 0, diet: 0, ambulance: 0, misc: 0,
            notes: ''
        });
    }
  }, [bill, isNew]);

  const calculateTotal = () => {
    return Object.entries(formData)
      .filter(([key]) => key !== 'patient_id' && key !== 'notes')
      .reduce((acc, [_, val]) => acc + (parseFloat(val) || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const items = [
        { description: 'Consultation Charges', cost: parseFloat(formData.consultation) },
        { description: 'Room Service / Bed Charges', cost: parseFloat(formData.room) },
        { description: 'Nursing Charges', cost: parseFloat(formData.nursing) },
        { description: 'Medicines / Pharmacy', cost: parseFloat(formData.medicines) },
        { description: 'Laboratory & Diagnostics', cost: parseFloat(formData.lab) },
        { description: 'Operation Theatre (OT) Charges', cost: parseFloat(formData.ot) },
        { description: 'Medical Supplies / Consumables', cost: parseFloat(formData.supplies) },
        { description: 'Equipment Charges', cost: parseFloat(formData.equipment) },
        { description: 'Diet / Food Services', cost: parseFloat(formData.diet) },
        { description: 'Ambulance Services', cost: parseFloat(formData.ambulance) },
        { description: 'Miscellaneous', cost: parseFloat(formData.misc) }
    ].filter(i => i.cost > 0);

    onProcess({
        ...formData,
        items,
        total: calculateTotal()
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptRounded color="primary" /> 
        {isNew ? 'Generate New Invoice' : 'Process Bill & Payment'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField 
                            label="Patient ID" 
                            name="patient_id"
                            value={formData.patient_id} 
                            onChange={handleChange}
                            fullWidth 
                            disabled={!isNew}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                         <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" color="text.secondary">Total Payable:</Typography>
                            <Typography variant="h4" color="primary" fontWeight="bold">₹{calculateTotal().toFixed(2)}</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
            
            <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={2}>BILLING DETAILS</Typography>
            <Grid container spacing={3}>
                {[
                    { label: 'Consultation', name: 'consultation' },
                    { label: 'Room / Bed Charges', name: 'room' },
                    { label: 'Nursing Charges', name: 'nursing' },
                    { label: 'Medicines / Pharmacy', name: 'medicines' },
                    { label: 'Lab & Diagnostics', name: 'lab' },
                    { label: 'Operation Theatre (OT)', name: 'ot' },
                    { label: 'Medical Supplies', name: 'supplies' },
                    { label: 'Equipment Charges', name: 'equipment' },
                    { label: 'Diet / Food', name: 'diet' },
                    { label: 'Ambulance', name: 'ambulance' },
                    { label: 'Miscellaneous', name: 'misc' },
                ].map((field) => (
                    <Grid item xs={12} sm={6} md={4} key={field.name}>
                        <TextField
                            label={field.label}
                            name={field.name}
                            type="number"
                            value={formData[field.name]}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
            variant="contained" 
            size="large" 
            startIcon={isNew ? <ReceiptRounded /> : <PaymentRounded />}
            onClick={handleSubmit}
        >
            {isNew ? 'Generate Invoice' : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillProcessingModal;
