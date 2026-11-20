import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  AutoAwesome,
  Email,
  Favorite,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const reduceMotion = useReducedMotion();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate(`/dashboard/${result.user.role}`);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const enter = reduceMotion ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 } };

  return (
    <main className="auth-page auth-page-login">
      <div className="auth-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <div className="auth-layout">
        <motion.section className="auth-story" {...enter} transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <Link className="auth-brand" to="/" aria-label="HealthForesight home">
            <span className="auth-brand-mark"><Favorite /></span>
            <span>Health<span>Foresight</span></span>
          </Link>
          <div className="auth-story-copy">
            <span className="auth-eyebrow"><i /> YOUR CARE WORKSPACE</span>
            <h1>Clarity for care.<br /><span>Room to focus.</span></h1>
            <p>Sign in to bring patient context, clinical workflows, and the next step into view.</p>
          </div>
          <div className="auth-scene" aria-hidden="true">
            <div className="auth-scene-orbit orbit-a" /><div className="auth-scene-orbit orbit-b" />
            <div className="auth-scene-core"><Favorite /></div>
            <span className="auth-scene-node node-a"><AutoAwesome /></span>
            <span className="auth-scene-node node-b"><Email /></span>
            <div className="auth-scene-caption"><span>CARE</span><i /><span>CONTEXT</span><i /><span>CONNECTION</span></div>
          </div>
          <div className="auth-story-foot"><span className="auth-foot-icon"><Favorite /></span><span>Thoughtful technology.<br /><strong>People at the center.</strong></span><span className="auth-foot-line" /></div>
        </motion.section>

        <motion.section
          className="auth-form-container"
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          aria-labelledby="login-title"
        >
          <div className="auth-form">
            <Link className="auth-mobile-brand" to="/">
              <span className="auth-brand-mark"><Favorite /></span>
              <span>Health<span>Foresight</span></span>
            </Link>
            <div className="form-header">
              <span className="form-kicker">WELCOME BACK</span>
              <h2 id="login-title">Sign in to continue</h2>
              <p>Your workspace is ready when you are.</p>
            </div>

            {error && <Alert className="auth-alert" severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <TextField
                  fullWidth
                  label="Email or username"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
                />
              </div>

              <div className="form-group">
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <Button className="auth-submit" type="submit" fullWidth variant="contained" size="large" disabled={loading} endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}>
                {loading ? "Signing in…" : "Sign in to workspace"}
              </Button>

              <p className="signup-link">New to HealthForesight? <Link to="/signup">Create an account</Link></p>
              <Link className="back-home" to="/"><ArrowBack /> Back to home</Link>
            </form>
          </div>
          <p className="auth-form-note">For care teams and patients using a configured HealthForesight service.</p>
        </motion.section>
      </div>
    </main>
  );
};

export default Login;
