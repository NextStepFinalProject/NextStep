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
  Grid,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const response = await axios.post(`${config.app.backend_url()}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 4000);
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
              Join NextStep
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 3, fontWeight: 500 }}
            >
              Start your career journey today
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                • Create your professional profile
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                • Get personalized career recommendations
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                • Connect with mentors and peers
              </Typography>
            </Box>
          </motion.div>

          {/* Right side - Registration form */}
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
                Create Account
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 3 }}>Registration successful! Redirecting to login...</Alert>}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Create Account
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" color="primary">
                      Sign in
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

export default Register;