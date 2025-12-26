import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Box,
  Typography
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const AppointmentModal = ({ open, onClose, onSubmit, doctors }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('in-person');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setType('in-person');
      setDate('');
      setTime('');
      setDoctorId('');
      setReason('');
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit({ type, date, time, doctorId, reason });
    setLoading(false);
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else handleSubmit();
  };

  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
       <DialogTitle sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', p: 3 }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <span style={{fontSize: '1.5rem'}}>📅</span>
           <Typography variant="h6" fontWeight="bold">
             {step === 1 ? 'Select Appointment Type' : 'Appointment Details'}
           </Typography>
         </Box>
       </DialogTitle>

       <DialogContent sx={{ p: 4, mt: 1 }}>
         <AnimatePresence mode="wait">
           {step === 1 && (
             <motion.div
               key="step1"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
             >
               <FormControl component="fieldset" fullWidth>
                 <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>How would you like to meet?</FormLabel>
                 <RadioGroup value={type} onChange={(e) => setType(e.target.value)}>
                   
                   {/* In-Person Option */}
                   <Box 
                     onClick={() => setType('in-person')}
                     sx={{ 
                       p: 2, mb: 2, borderRadius: 2, cursor: 'pointer',
                       border: `2px solid ${type === 'in-person' ? '#6366f1' : '#e2e8f0'}`,
                       bgcolor: type === 'in-person' ? '#eef2ff' : 'transparent',
                       transition: 'all 0.2s',
                       display: 'flex', alignItems: 'center'
                     }}
                   >
                     <Radio value="in-person" checked={type === 'in-person'} sx={{ color: '#6366f1 !important' }} />
                     <Box>
                       <Typography fontWeight="bold" color="#1e293b">In-Person Visit</Typography>
                       <Typography variant="body2" color="#64748b">Visit the clinic for a physical checkup.</Typography>
                     </Box>
                   </Box>

                   {/* Video Option */}
                   <Box 
                     onClick={() => setType('video')}
                     sx={{ 
                       p: 2, borderRadius: 2, cursor: 'pointer',
                       border: `2px solid ${type === 'video' ? '#8b5cf6' : '#e2e8f0'}`,
                       bgcolor: type === 'video' ? '#f5f3ff' : 'transparent',
                       transition: 'all 0.2s',
                       display: 'flex', alignItems: 'center'
                     }}
                   >
                     <Radio value="video" checked={type === 'video'} sx={{ color: '#8b5cf6 !important' }} />
                     <Box>
                       <Typography fontWeight="bold" color="#1e293b">Video Consultation</Typography>
                       <Typography variant="body2" color="#64748b">Connect with a doctor remotely via secure video.</Typography>
                     </Box>
                   </Box>

                 </RadioGroup>
               </FormControl>
             </motion.div>
           )}

           {step === 2 && (
             <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
             >
                <TextField 
                  select 
                  label="Select Doctor" 
                  value={doctorId} 
                  onChange={(e) => setDoctorId(e.target.value)} 
                  fullWidth
                >
                  <MenuItem value=""><em>Any Available</em></MenuItem>
                  {doctors.map(doc => (
                    <MenuItem key={doc.id} value={doc.id}>Dr. {doc.name || doc.username} ({doc.specialization})</MenuItem>
                  ))}
                  {doctors.length === 0 && <MenuItem disabled>No doctors available</MenuItem>}
                </TextField>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField 
                    label="Date" 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                  />
                  <TextField 
                    label="Time" 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                  />
                </Box>

                <TextField 
                  label="Reason for Visit" 
                  multiline 
                  rows={3} 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  fullWidth 
                  placeholder="Describe your symptoms or reason for consulting..."
                />
             </motion.div>
           )}
         </AnimatePresence>
       </DialogContent>

       <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
         {step === 2 ? (
           <Button onClick={() => setStep(1)} disabled={loading}>Back</Button>
         ) : (
           <Button onClick={onClose} disabled={loading}>Cancel</Button>
         )}
         
         <Button 
           variant="contained" 
           onClick={handleNext}
           disabled={loading || (step === 2 && (!date || !time || !reason))}
           sx={{ 
             background: step === 1 ? '#6366f1' : '#22c55e',
             '&:hover': { background: step === 1 ? '#4f46e5' : '#16a34a' }
           }}
         >
           {step === 1 ? 'Next Step' : (loading ? 'Booking...' : 'Confirm Request')}
         </Button>
       </DialogActions>
    </Dialog>
  );
};

export default AppointmentModal;
