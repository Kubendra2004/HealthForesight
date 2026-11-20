import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, InputAdornment, IconButton } from "@mui/material";
import { ArrowBackRounded, ArrowForwardRounded, EmailRounded, LockRounded, PersonRounded, LocalHospitalRounded, VisibilityRounded, VisibilityOffRounded, ShieldRounded } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ username:"", email:"", password:"", confirmPassword:"", role:"patient", specialization:"" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const change = (event) => {
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.role === "doctor" && !form.specialization.trim()) return setError("Please enter your specialization");
    setLoading(true);
    const payload = { username:form.username.trim(), email:form.email, password:form.password, role:form.role };
    if (form.role === "doctor") payload.specialization = form.specialization.trim();
    const result = await signup(payload);
    if (result.success) navigate(`/dashboard/${result.user.role}`);
    else setError(result.error);
    setLoading(false);
  };

  return (
    <main className="hospital-auth-page signup-page">
      <div className="hospital-auth-brandbar">
        <Link className="auth-home-brand" to="/"><span><LocalHospitalRounded /></span><b>HealthForesight</b></Link>
        <Link to="/"><ArrowBackRounded /> Back to website</Link>
      </div>
      <div className="signup-layout">
        <section className="signup-copy">
          <span className="auth-panel-kicker"><ShieldRounded /> Patient and provider accounts</span>
          <h1>Create your care account.</h1>
          <p>Choose your role and connect to the appropriate HealthForesight workspace.</p>
        </section>
        <section className="auth-form-panel" aria-labelledby="signup-title">
          <div className="auth-form-card signup-card">
            <span className="auth-form-kicker">GET STARTED</span>
            <h2 id="signup-title">Create account</h2>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={submit}>
              <TextField fullWidth required label="Username" name="username" value={form.username} onChange={change} autoComplete="username" inputProps={{ minLength:3, maxLength:50, pattern:"[^\\s]+" }}
                InputProps={{ startAdornment:<InputAdornment position="start"><PersonRounded /></InputAdornment> }} />
              <TextField fullWidth required label="Email address" name="email" type="email" value={form.email} onChange={change} autoComplete="email"
                InputProps={{ startAdornment:<InputAdornment position="start"><EmailRounded /></InputAdornment> }} />
              <FormControl fullWidth required><InputLabel id="role-label">Account type</InputLabel><Select labelId="role-label" name="role" value={form.role} label="Account type" onChange={change}>
                <MenuItem value="patient">Patient</MenuItem><MenuItem value="doctor">Doctor</MenuItem>
              </Select></FormControl>
              {form.role === "doctor" && <TextField fullWidth required label="Specialization" name="specialization" value={form.specialization} onChange={change} placeholder="e.g. Cardiology" />}
              <TextField fullWidth required label="Password" name="password" type={showPassword ? "text":"password"} value={form.password} onChange={change} autoComplete="new-password"
                InputProps={{ startAdornment:<InputAdornment position="start"><LockRounded /></InputAdornment>, endAdornment:<InputAdornment position="end"><IconButton aria-label="Toggle password visibility" onClick={() => setShowPassword((value)=>!value)}>{showPassword?<VisibilityOffRounded/>:<VisibilityRounded/>}</IconButton></InputAdornment> }} />
              <TextField fullWidth required label="Confirm password" name="confirmPassword" type={showPassword ? "text":"password"} value={form.confirmPassword} onChange={change} autoComplete="new-password"
                InputProps={{ startAdornment:<InputAdornment position="start"><LockRounded /></InputAdornment> }} />
              <Button className="auth-primary-button" type="submit" fullWidth variant="contained" size="large" disabled={loading} endIcon={loading?<CircularProgress size={18} color="inherit"/>:<ArrowForwardRounded />}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
