import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import './App.css';
import Feed from './pages/Feed';
import Footer from './components/Footer';
import RequireAuth from './hoc/RequireAuth';
import NewPost from './pages/NewPost';
import PostDetails from './pages/PostDetails';
import Chat from './pages/Chat';
import Resume from './pages/Resume';
import LeftBar from './components/LeftBar';
import Layout from './components/Layout';
import MainDashboard from './pages/MainDashboard';
import Quiz from './pages/Quiz';
import Landing from './pages/Landing';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CssBaseline />
        <Router>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}>
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Layout className="login"><Login /></Layout>} />
                <Route path="/register" element={<Layout className="register"><Register /></Layout>} />
                
                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <Box sx={{ display: 'flex', flex: 1 }}>
                      <LeftBar />
                      <Box
                        component="main"
                        sx={{
                          flexGrow: 1,
                          p: 3,
                          width: '100%',
                          maxWidth: '1200px',
                          mx: 'auto',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <Routes>
                          <Route path="/feed" element={<RequireAuth><Layout className="feed"><Feed /></Layout></RequireAuth>} />
                          <Route path="/profile" element={<RequireAuth><Layout className="profile"><Profile /></Layout></RequireAuth>} />
                          <Route path="/new-post" element={<RequireAuth><Layout className="new-post"><NewPost /></Layout></RequireAuth>} />
                          <Route path="/post/:postId" element={<RequireAuth><Layout className="post-details"><PostDetails /></Layout></RequireAuth>} />
                          <Route path="/chat" element={<RequireAuth><Layout className="chat"><Chat /></Layout></RequireAuth>} />
                          <Route path="/resume" element={<RequireAuth><Layout className="resume"><Resume /></Layout></RequireAuth>} />
                          <Route path="/main-dashboard" element={<RequireAuth><Layout className="main-dashboard"><MainDashboard /></Layout></RequireAuth>} />
                          <Route path="/quiz" element={<RequireAuth><Layout className="quiz"><Quiz /></Layout></RequireAuth>} />
                          <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                      </Box>
                    </Box>
                  }
                />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
