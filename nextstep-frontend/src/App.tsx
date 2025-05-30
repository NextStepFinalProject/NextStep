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
import { Box } from '@mui/material';

const App: React.FC = () => {
  return (
    <>
    <Box height="90vh" display='flex' width="100%">
      <Router>
        <LeftBar /> 
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
      </Router>
    </Box>
    <Footer/>
    </>
  );
};

export default App;
