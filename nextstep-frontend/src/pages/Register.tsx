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
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Visibility, VisibilityOff, LightMode, DarkMode } from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

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
  const { isDarkMode, toggleTheme } = useCustomTheme();
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
      await axios.post(`${config.app.backend_url()}/auth/register`, {
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
        position: 'relative',
      }}
    >
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
          color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
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
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #64B5F6, #4DD0E1)'
                  : 'linear-gradient(45deg, #0984E3, #00B894)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: theme.palette.mode === 'dark'
                  ? '0 0 20px rgba(100, 181, 246, 0.2)'
                  : '0 0 20px rgba(9, 132, 227, 0.2)',
              }}
            >
              Join NextStep
            </Typography>
            <Typography
              variant="h5"
              sx={{ 
                mb: 3, 
                fontWeight: 500,
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary'
              }}
            >
              Start your career journey today
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              {[
                'Create your professional profile',
                'Get personalized career recommendations',
                'Connect with mentors and peers'
              ].map((text, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    mb: 2,
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    '&::before': {
                      content: '"•"',
                      mr: 1,
                      color: theme.palette.mode === 'dark' ? '#64B5F6' : '#0984E3',
                    }
                  }}
                >
                  {text}
                </Typography>
              ))}
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
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'text.primary'
                }}
              >
                Create Account
              </Typography>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    background: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : undefined,
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(211, 47, 47, 0.3)' : undefined,
                  }}
                >
                  {error}
                </Alert>
              )}
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    background: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : undefined,
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(46, 125, 50, 0.3)' : undefined,
                  }}
                >
                  Registration successful! Redirecting to login...
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : undefined,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : undefined,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                    },
                  }}
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
                          sx={{
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : undefined,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : undefined,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                    },
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ 
                    mb: 2, 
                    py: 1.5,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #64B5F6, #4DD0E1)'
                      : 'linear-gradient(45deg, #0984E3, #00B894)',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #42A5F5, #26C6DA)'
                        : 'linear-gradient(45deg, #0873C4, #00A884)',
                    }
                  }}
                >
                  Create Account
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                  >
                    Already have an account?{' '}
                    <Link 
                      component={RouterLink} 
                      to="/login" 
                      sx={{ 
                        color: theme.palette.mode === 'dark' ? '#64B5F6' : 'primary.main',
                        '&:hover': {
                          color: theme.palette.mode === 'dark' ? '#42A5F5' : 'primary.dark',
                        }
                      }}
                    >
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