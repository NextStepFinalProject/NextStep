import React, { useState } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Typography, Box, Paper, Link, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import './Login.css';
import { config } from '../config';
import { LoginResponse } from '../models/LoginResponse';
import {setUserAuth} from "../handlers/userAuth.ts";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";



const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

   // Google Login
   const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken(); // Get Firebase ID Token

      // Send the token to the backend for authentication
      const res = await axios.post<LoginResponse>(`${config.app.backend_url()}/auth/social`, {
        idToken,
        authProvider: "google",
      });

      setUserAuth(res.data);

      navigate("/dashboard");
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

      // Handle successful login, e.g., save tokens, redirect, etc.
      setUserAuth(response.data)

      navigate('/dashboard'); // Redirect to dashboard or another page after login

    } catch (error) {
      // Handle login error
      const err = error as any;
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
          <Typography component="h1" variant="h3" gutterBottom>
            Insight Hub
          </Typography>
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Typography component="h1" variant="h5" align="center">
              Login
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
              >
                Login
              </Button>
              <Typography variant="body2" align="center">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register">
                  Register
                </Link>
              </Typography>
            </Box>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button variant="contained" color="error" fullWidth sx={{ mb: 1 }} onClick={handleGoogleLogin}>
                Login with Google
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </div>
  );
};

export default Login;