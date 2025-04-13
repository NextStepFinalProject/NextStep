import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import './App.css'
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import RequireAuth from './hoc/RequireAuth';
import NewPost from './pages/NewPost';
import PostDetails from './pages/PostDetails';
import Chat from './pages/Chat';
import ResumePage from './pages/ResumePage';
import TopBar from './components/TopBar';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Login /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} /> 
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/dashboard" element={<RequireAuth><TopBar /><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><TopBar /><Layout><Profile /></Layout></RequireAuth>} />
          <Route path="/new-post" element={<RequireAuth><TopBar /><Layout><NewPost /></Layout></RequireAuth>} />
          <Route path="/post/:postId" element={<RequireAuth><TopBar /><Layout><PostDetails /></Layout></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><TopBar /><Layout><Chat /></Layout></RequireAuth>} />
          <Route path="/resume" element={<RequireAuth><Layout><ResumePage /></Layout></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Footer/>
    </>
  );
};

export default App;
