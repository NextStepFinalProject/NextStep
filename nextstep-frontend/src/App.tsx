import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import './App.css'
import Feed from './pages/Feed';
import Footer from './components/Footer';
import RequireAuth from './hoc/RequireAuth';
import NewPost from './pages/NewPost';
import PostDetails from './pages/PostDetails';
import Chat from './pages/Chat';
import Resume from './pages/Resume';
import TopBar from './components/TopBar';
import Layout from './components/Layout';
import MainDashboard from './pages/MainDashboard';
import Quiz from './pages/Quiz';

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout className="login"><Login /></Layout>} />
          <Route path="/login" element={<Layout className="login"><Login /></Layout>} /> 
          <Route path="/register" element={<Layout className="register"><Register /></Layout>} />
          <Route path="/feed" element={<RequireAuth><TopBar /><Layout className="feed"><Feed /></Layout></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><TopBar /><Layout className="profile"><Profile /></Layout></RequireAuth>} />
          <Route path="/new-post" element={<RequireAuth><TopBar /><Layout className="new-post"><NewPost /></Layout></RequireAuth>} />
          <Route path="/post/:postId" element={<RequireAuth><TopBar /><Layout className="post-details"><PostDetails /></Layout></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><TopBar /><Layout className="chat"><Chat /></Layout></RequireAuth>} />
          <Route path="/resume" element={<RequireAuth><TopBar /><Layout className="resume"><Resume /></Layout></RequireAuth>} />
          <Route path="/main-dashboard" element={<RequireAuth><TopBar /><Layout className="main-dashboard"><MainDashboard /></Layout></RequireAuth>} />
          <Route path="/quiz" element={<RequireAuth><TopBar /><Layout className="quiz"><Quiz /></Layout></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Footer/>
    </>
  );
};

export default App;
