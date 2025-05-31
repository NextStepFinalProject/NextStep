import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config';
import { LoginResponse } from '../models/LoginResponse';
import { setUserAuth } from "../handlers/userAuth";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await axios.post<LoginResponse>(`${config.app.backend_url()}/auth/social`, {
        idToken,
        authProvider: "google",
      });

      setUserAuth(res.data);
      navigate("/main-dashboard");
    } catch (error) {
      console.error("Google login failed:", error);
      setError("Google login failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post<LoginResponse>(`${config.app.backend_url()}/auth/login`, {
        email,
        password,
      });

      setUserAuth(response.data);
      navigate('/main-dashboard');
    } catch (error) {
      const err = error as any;
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 4,
            alignItems: 'center',
            maxWidth: '1800px',
            mx: 'auto',
          }}
        >
          {/* Left side - Welcome message */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flex: 1 }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(45deg, #0984E3, #00B894)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 3, fontWeight: 500 }}
            >
              Sign in to continue your career journey
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                • Access personalized career insights
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                • Connect with industry professionals
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                • Track your career progress
              </Typography>
            </Box>
          </motion.div>

          {/* Right side - Login form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flex: 2 }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 4,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(45, 45, 45, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                width: '100%',
                maxWidth: '1000px',
                mx: 'auto',
              }}
            >
              <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Sign In
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Box sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={handleGoogleLogin}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Continue with Google
                </Button>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  or continue with email
                </Typography>
              </Divider>

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Sign In
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" color="primary">
                      Sign up
                    </Link>
                  </Typography>
                </Box>
              </form>
            </Paper>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;