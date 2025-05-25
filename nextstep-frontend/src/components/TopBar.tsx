import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Tooltip, Box } from '@mui/material';
import { Home, Person, Message, Logout, DocumentScannerTwoTone, Feed, Quiz } from '@mui/icons-material';
import {getUserAuth, removeUserAuth} from "../handlers/userAuth.ts";
import api from "../serverApi.ts";
import logo from '../../assets/NextStepLogo.png';

const TopBar: React.FC = () => {
  const userAuthRef = useRef(getUserAuth());
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (userAuthRef.current) {
      await api.post(`/auth/logout`, {
        refreshToken: userAuthRef.current.refreshToken,
      });
      removeUserAuth();
    }
    navigate('/logout');
  };

  return (
    <AppBar position="relative" sx={{ width: '100vw', left: 0, backgroundColor: '#233752' }} className='top-bar'>
      <Toolbar>
        <Tooltip title="Home">
          <IconButton color="inherit" onClick={() => navigate('/main-dashboard')} sx={{ mx: 1 }}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ height: 50, width: 50 }}
          />          
          </IconButton>
        </Tooltip>
        <Tooltip title="Resume">
          <IconButton color="inherit" onClick={() => navigate('/resume')} sx={{ mx: 1 }}>
            <DocumentScannerTwoTone fontSize='large'/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Quiz">
          <IconButton color="inherit" onClick={() => navigate('/quiz')} sx={{ mx: 1 }}>
            <Quiz fontSize='large'/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Feed">
          <IconButton color="inherit" onClick={() => navigate('/feed')} sx={{ mx: 1 }}>
            <Feed fontSize='large'/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Chat">
          <IconButton color="inherit" onClick={() => navigate('/chat')} sx={{ mx: 1 }}>
            <Message fontSize='large'/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Profile">
          <IconButton color="inherit" onClick={() => navigate('/profile')} sx={{ mx: 1 }}>
            <Person fontSize='large'/>
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Logout">
          <IconButton color="inherit" onClick={handleLogout} sx={{ mx: 1 }}>
            <Logout fontSize='large'/>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;