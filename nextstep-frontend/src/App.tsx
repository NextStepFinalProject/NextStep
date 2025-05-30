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
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0984E3',
    },
    secondary: {
      main: '#00B894',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8F9FA',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Router>
          <LeftBar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - 240px)` },
              ml: { sm: '240px' },
              transition: 'margin 0.3s ease',
            }}
          >
            <Routes>
              <Route path="/" element={<Layout className="login"><Login /></Layout>} />
              <Route path="/login" element={<Layout className="login"><Login /></Layout>} />
              <Route path="/register" element={<Layout className="register"><Register /></Layout>} />
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
        </Router>
      </Box>
      <Footer />
    </ThemeProvider>
  );
};

export default App;
