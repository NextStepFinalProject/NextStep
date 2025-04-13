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

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RequireAuth><TopBar /><Dashboard /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><TopBar /><Profile /></RequireAuth>} />
          <Route path="/new-post" element={<RequireAuth><TopBar /><NewPost /></RequireAuth>} />
          <Route path="/post/:postId" element={<RequireAuth><TopBar /><PostDetails /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><TopBar /><Chat /></RequireAuth>} />
          <Route path="/resume" element={<RequireAuth><ResumePage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Footer/>
    </>
  );
};

export default App;
