import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Home, Person, Message, Logout, DocumentScannerTwoTone, Feed, Quiz, Menu, ChevronLeft } from '@mui/icons-material';
import { getUserAuth, removeUserAuth } from "../handlers/userAuth.ts";
import api from "../serverApi.ts";
import logo from '../../assets/NextStep.png';

const LeftBar: React.FC = () => {
  const userAuthRef = useRef(getUserAuth());
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Automatically collapse the sidebar if the user is disconnected
    if (!userAuthRef.current) {
      setCollapsed(true);
    }
  }, [userAuthRef.current]);

  const handleLogout = async () => {
    if (userAuthRef.current) {
      await api.post(`/auth/logout`, {
        refreshToken: userAuthRef.current.refreshToken,
      });
      removeUserAuth();
    }
    navigate('/logout');
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 60 : 220,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? 60 : 220,
          boxSizing: 'border-box',
          backgroundColor: '#233752',
          color: 'white',
          overflowX: 'hidden',
          transition: 'width 0.3s',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '8px',
        }}
      >
        {!collapsed && (
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ height: 120, width: 150 }}
          />
        )}
        <IconButton onClick={toggleCollapse} sx={{ color: 'white' }}>
          {collapsed ? <Menu /> : <ChevronLeft fontSize="large" />}
        </IconButton>
      </Box>
      <List>
        <ListItem button onClick={() => navigate('/main-dashboard')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Home sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Home" />}
        </ListItem>
        <ListItem button onClick={() => navigate('/resume')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <DocumentScannerTwoTone sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Resume" />}
        </ListItem>
        <ListItem button onClick={() => navigate('/quiz')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Quiz sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Quiz" />}
        </ListItem>
        <ListItem button onClick={() => navigate('/feed')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Feed sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Feed" />}
        </ListItem>
        <ListItem button onClick={() => navigate('/chat')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Message sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Chat" />}
        </ListItem>
        <ListItem button onClick={() => navigate('/profile')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Person sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Profile" />}
        </ListItem>
        <ListItem button onClick={handleLogout} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Logout sx={{ color: 'white' }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Logout" />}
        </ListItem>
      </List>
    </Drawer>
  );
};

export default LeftBar;