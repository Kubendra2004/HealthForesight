import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert, Button, CircularProgress, IconButton, InputAdornment, TextField,
} from "@mui/material";
import {
  ArrowBackRounded, ArrowForwardRounded, EmailRounded, LockRounded,
  LocalHospitalRounded, VisibilityRounded, VisibilityOffRounded,
  ShieldRounded, CheckCircleRounded,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function CareIllustration() {
  return (
    <svg viewBox="0 0 520 390" role="img" aria-label="Friendly illustration of a patient speaking with a care professional">
      <rect width="520" height="390" rx="24" fill="#edf6fb" />
      <rect x="42" y="44" width="436" height="302" rx="18" fill="#fff" stroke="#d4e4ef" />
      <rect x="72" y="74" width="376" height="46" rx="10" fill="#f3f8fc" />
      <circle cx="96" cy="97" r="10" fill="#1769aa" />
      <rect x="116" y="91" width="156" height="10" rx="5" fill="#b6cddd" />
      <circle cx="170" cy="178" r="45" fill="#d9ecf8" />
      <circle cx="170" cy="166" r="20" fill="#e7b998" />
      <path d="M125 225C130 196 210 196 215 225V260H125Z" fill="#1769aa" />
      <circle cx="350" cy="178" r="45" fill="#dff4f0" />
      <circle cx="350" cy="166" r="20" fill="#d8a486" />
      <path d="M305 225C310 196 390 196 395 225V260H305Z" fill="#12a594" />
      <rect x="215" y="286" width="90" height="60" rx="12" fill="#1769aa" />
      <rect x="232" y="302" width="56" height="44" rx="22" fill="#edf6fb" />
      <path d="M260 257v52M245 274h30" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) navigate(`/dashboard/${result.user.role}`);
    else setError(result.error);
    setLoading(false);
  };

  return (
    <main className="hospital-auth-page">
      <div className="hospital-auth-brandbar">
        <Link className="auth-home-brand" to="/">
          <span><LocalHospitalRounded /></span>
          <b>HealthForesight</b>
        </Link>
        <Link to="/"><ArrowBackRounded /> Back to website</Link>
      </div>
      <div className="hospital-auth-layout">
        <section className="auth-care-panel" aria-label="HealthForesight patient and care portal">
          <span className="auth-panel-kicker"><ShieldRounded /> Secure hospital portal</span>
          <h1>Care begins with a clear connection.</h1>
          <p>Sign in to appointments, records and your care team in one calm, accessible place.</p>
          <CareIllustration />
          <ul>
            <li><CheckCircleRounded /> Role-based access</li>
            <li><CheckCircleRounded /> Private patient context</li>
          </ul>
        </section>
        <section className="auth-form-panel" aria-labelledby="login-title">
          <div className="auth-form-card">
            <span className="auth-form-kicker">WELCOME BACK</span>
            <h2 id="login-title">Sign in to your portal</h2>
            <p>Use your username or email to continue.</p>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email or username" name="email" value={formData.email}
                onChange={(event) => { setFormData((value) => ({ ...value, email: event.target.value })); setError(""); }}
                autoComplete="username" required
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailRounded /></InputAdornment> }}
              />
              <TextField
                fullWidth label="Password" name="password" type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(event) => { setFormData((value) => ({ ...value, password: event.target.value })); setError(""); }}
                autoComplete="current-password" required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockRounded /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}</IconButton></InputAdornment>,
                }}
              />
              <Button className="auth-primary-button" type="submit" fullWidth variant="contained" size="large" disabled={loading} endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRounded />}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="auth-switch">New to HealthForesight? <Link to="/signup">Create an account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
