import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Alert,
  Tooltip
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";

const steps = ["Basic Info", "Vitals", "Heart Metrics", "Diabetes & Lifestyle"];

export default function OnboardingModal({ open, onClose, user, onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // Basic
    age: "",
    gender: "",
    height: "", // cm
    weight: "", // kg
    
    // Vitals
    systolic_bp: "",
    diastolic_bp: "",
    heart_rate: "",
    temperature: "",
    oxygen_level: "",
    cholesterol: "",
    glucose: "",

    // Heart Specific
    chest_pain_type: "", // 0-3
    max_heart_rate: "",
    exercise_angina: "0",
    st_depression: "", // oldpeak
    st_slope: "",
    major_vessels: "", // 0-3
    thalassemia: "", // 0-3
    resting_ecg: "0",

    // Diabetes Specific
    insulin: "",
    skin_thickness: "",
    pregnancies: "0",
    diabetes_pedigree: "",

    // Lifestyle
    smoking: "No",
    alcohol: "No",
    activity_level: "Moderate",
    existing_conditions: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate BMI
      const bmi =
        formData.height && formData.weight
          ? (
              parseFloat(formData.weight) /
              (parseFloat(formData.height) / 100) ** 2
            ).toFixed(1)
          : 25;

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Make Heart Disease Prediction
      const heartPayload = {
        age: parseInt(formData.age) || 30,
        sex: formData.gender === "Male" ? 1 : 0,
        cp: parseInt(formData.chest_pain_type) || 0,
        trestbps: parseInt(formData.systolic_bp) || 120,
        chol: parseInt(formData.cholesterol) || 200,
        fbs: parseInt(formData.glucose) > 120 ? 1 : 0,
        restecg: parseInt(formData.resting_ecg) || 0,
        thalach: parseInt(formData.max_heart_rate) || 150,
        exang: parseInt(formData.exercise_angina) || 0,
        oldpeak: parseFloat(formData.st_depression) || 0.0,
        slope: parseInt(formData.st_slope) || 1,
        ca: parseInt(formData.major_vessels) || 0,
        thal: parseInt(formData.thalassemia) || 2,
      };

      try {
          await axios.post(
            "http://localhost:8000/ml/predict/heart",
            heartPayload,
            { headers }
          );
      } catch (err) {
          console.error("Heart prediction failed:", err);
          if (err.response && err.response.status === 401) {
            alert("Session expired. Please log in again.");
            localStorage.clear();
            window.location.href = "/";
            return;
          }
      }

      // 2. Make Diabetes Prediction
      const diabetesPayload = {
        age: parseInt(formData.age) || 30,
        gender: formData.gender,
        polyuria: parseFloat(bmi) > 30 ? 1 : 0, // Fallback if no specific input
        polydipsia: parseFloat(formData.glucose) > 140 ? 1 : 0,
        sudden_weight_loss: 0,
        weakness: formData.activity_level === "Sedentary" ? 1 : 0,
        polyphagia: 0,
        genital_thrush: 0,
        visual_blurring: 0,
        itching: 0,
        irritability: 0,
        delayed_healing: formData.smoking === "Yes" ? 1 : 0,
        partial_paresis: 0,
        muscle_stiffness: 0,
        alopecia: 0,
        obesity: parseFloat(bmi) > 30 ? 1 : 0,
      };

      try {
          await axios.post(
            "http://localhost:8000/ml/predict/diabetes",
            diabetesPayload,
            { headers }
          );
      } catch (err) {
           console.error("Diabetes prediction failed:", err);
           if (err.response && err.response.status === 401) {
             alert("Session expired. Please log in again.");
             localStorage.clear();
             window.location.href = "/";
             return;
           }
      }

      // 3. Save profile data including all new fields
      const profilePayload = { ...formData, age: parseInt(formData.age), height: parseFloat(formData.height), weight: parseFloat(formData.weight) };
      
      // Filter out empty strings to avoid validation errors if optional
      Object.keys(profilePayload).forEach(key => {
          if (profilePayload[key] === "") delete profilePayload[key];
      });

      await axios.post(
          "http://localhost:8000/portal/profile",
          profilePayload,
          { headers }
      );

      onComplete(formData);
      onClose();
    } catch (err) {
      console.error("Onboarding error:", err);
      if (err.response && err.response.status === 401) {
         alert("Session expired. Please log in again.");
         localStorage.clear();
         window.location.href = "/";
         return;
      }
      setError(
        "Failed to save profile. Please check your network and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Age" name="age" type="number" value={formData.age} onChange={handleChange} fullWidth required />
            <TextField select label="Gender" name="gender" value={formData.gender} onChange={handleChange} fullWidth required>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
            <TextField label="Height (cm)" name="height" type="number" value={formData.height} onChange={handleChange} fullWidth />
            <TextField label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} fullWidth />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Systolic BP (mmHg)" name="systolic_bp" type="number" value={formData.systolic_bp} onChange={handleChange} fullWidth />
            <TextField label="Diastolic BP (mmHg)" name="diastolic_bp" type="number" value={formData.diastolic_bp} onChange={handleChange} fullWidth />
            <TextField label="Heart Rate (bpm)" name="heart_rate" type="number" value={formData.heart_rate} onChange={handleChange} fullWidth />
            <TextField label="Temperature (°C)" name="temperature" type="number" value={formData.temperature} onChange={handleChange} fullWidth />
            <TextField label="Glucose (mg/dL)" name="glucose" type="number" value={formData.glucose} onChange={handleChange} fullWidth />
            <TextField label="Cholesterol (mg/dL)" name="cholesterol" type="number" value={formData.cholesterol} onChange={handleChange} fullWidth />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="caption" color="primary" sx={{ mb: 2, display: 'block' }}>
                Required for accurate Heart Disease Prediction
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField select label="Chest Pain Type" name="chest_pain_type" value={formData.chest_pain_type} onChange={handleChange} fullWidth>
                    <MenuItem value="0">Typical Angina</MenuItem>
                    <MenuItem value="1">Atypical Angina</MenuItem>
                    <MenuItem value="2">Non-anginal Pain</MenuItem>
                    <MenuItem value="3">Asymptomatic</MenuItem>
                </TextField>
                <TextField label="Max Heart Rate" name="max_heart_rate" type="number" value={formData.max_heart_rate} onChange={handleChange} fullWidth placeholder="e.g. 150" />
                
                <TextField select label="Exercise Induced Angina" name="exercise_angina" value={formData.exercise_angina} onChange={handleChange} fullWidth>
                    <MenuItem value="0">No</MenuItem>
                    <MenuItem value="1">Yes</MenuItem>
                </TextField>
                <TextField label="ST Depression (Oldpeak)" name="st_depression" type="number" value={formData.st_depression} onChange={handleChange} fullWidth placeholder="e.g. 1.0" />
                
                <TextField select label="ST Slope" name="st_slope" value={formData.st_slope} onChange={handleChange} fullWidth>
                    <MenuItem value="0">Upsloping</MenuItem>
                    <MenuItem value="1">Flat</MenuItem>
                    <MenuItem value="2">Downsloping</MenuItem>
                </TextField>
                <TextField label="Major Vessels (0-3)" name="major_vessels" type="number" value={formData.major_vessels} onChange={handleChange} fullWidth />
                
                <TextField select label="Thalassemia" name="thalassemia" value={formData.thalassemia} onChange={handleChange} fullWidth>
                    <MenuItem value="1">Normal</MenuItem>
                    <MenuItem value="2">Fixed Defect</MenuItem>
                    <MenuItem value="3">Reversable Defect</MenuItem>
                </TextField>
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
             <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField label="Insulin Level" name="insulin" type="number" value={formData.insulin} onChange={handleChange} fullWidth placeholder="mu U/ml" />
                <TextField label="Skin Thickness" name="skin_thickness" type="number" value={formData.skin_thickness} onChange={handleChange} fullWidth placeholder="mm" />
                {formData.gender === 'Female' && (
                     <TextField label="Pregnancies" name="pregnancies" type="number" value={formData.pregnancies} onChange={handleChange} fullWidth />
                )}
                <TextField label="Family Diabetes History (Pedigree)" name="diabetes_pedigree" type="number" value={formData.diabetes_pedigree} onChange={handleChange} fullWidth placeholder="0.0 - 2.5" />
             </Box>
             
             <Typography variant="overline" sx={{ mt: 2 }}>LIFESTYLE</Typography>
             <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField select label="Smoking?" name="smoking" value={formData.smoking} onChange={handleChange} fullWidth>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="Former">Former</MenuItem>
                </TextField>
                <TextField select label="Alcohol?" name="alcohol" value={formData.alcohol} onChange={handleChange} fullWidth>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="Occasional">Occasional</MenuItem>
                    <MenuItem value="Frequent">Frequent</MenuItem>
                </TextField>
             </Box>
             <TextField select label="Activity Level" name="activity_level" value={formData.activity_level} onChange={handleChange} fullWidth>
                  <MenuItem value="Sedentary">Sedentary</MenuItem>
                  <MenuItem value="Light">Light</MenuItem>
                  <MenuItem value="Moderate">Moderate</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
             </TextField>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} maxWidth="md" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', px: 3, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: '1.5rem' }}>🏥</span> 
          <Box>
            <Typography variant="h6" fontWeight="800" color="#1e293b">Health Assessment</Typography>
            <Typography variant="body2" color="text.secondary">Complete for accurate AI predictions</Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
         >
           {renderStepContent(activeStep)}
        </motion.div>
      </DialogContent>
      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
        <Button disabled={activeStep === 0} onClick={handleBack} sx={{ borderRadius: 2 }}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || (activeStep === 0 && (!formData.age || !formData.gender))}
          sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
        >
          {activeStep === steps.length - 1 ? (loading ? "Analyzing..." : "Save & Analyze") : "Next Step"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
