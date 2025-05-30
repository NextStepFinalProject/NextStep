import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip, Divider, useTheme as useMuiTheme, ListItemButton } from '@mui/material';
import { Home, Person, Message, Logout, DocumentScannerTwoTone, Feed, Quiz, Menu, ChevronLeft, LightMode, DarkMode } from '@mui/icons-material';
import { getUserAuth, removeUserAuth } from "../handlers/userAuth.ts";
import api from "../serverApi.ts";
import logo from '../../assets/NextStep.png';
import { useTheme } from '../contexts/ThemeContext';

const LeftBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const userAuth = getUserAuth();
      if (userAuth) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${userAuth.accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeUserAuth();
      navigate('/login');
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Home />, path: '/main-dashboard' },
    { text: 'Feed', icon: <Feed />, path: '/feed' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
    { text: 'Chat', icon: <Message />, path: '/chat' },
    { text: 'Resume', icon: <DocumentScannerTwoTone />, path: '/resume' },
    { text: 'Quiz', icon: <Quiz />, path: '/quiz' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
        position: 'fixed',
        '& .MuiDrawer-paper': {
          width: collapsed ? 64 : 240,
          boxSizing: 'border-box',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflowX: 'hidden',
          '&:hover': {
            width: 240,
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
            '& .logo-text': {
              opacity: 1,
              transform: 'translateX(0)',
            },
            '& .menu-text': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
        },
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="NextStep"
          className="logo-text"
          sx={{ 
            height: 40, 
            cursor: 'pointer',
            opacity: 1,
            transform: collapsed ? 'scale(0.8)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => navigate('/')}
        />
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 2.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  mr: collapsed ? 0 : 2,
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                className="menu-text"
                sx={{
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ml: 1,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List sx={{ px: 1 }}>
        <Tooltip title={collapsed ? 'Theme' : ''} placement="right">
          <ListItem disablePadding>
            <ListItemButton
              onClick={toggleTheme}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  mr: collapsed ? 0 : 2,
                  color: 'text.secondary',
                }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </ListItemIcon>
              <ListItemText 
                primary={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                className="menu-text"
                sx={{
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ml: 1,
                }}
              />
            </ListItemButton>
          </ListItem>
        </Tooltip>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  mr: collapsed ? 0 : 2,
                  color: 'text.secondary',
                }}
              >
                <Logout />
              </ListItemIcon>
              <ListItemText 
                primary="Logout"
                className="menu-text"
                sx={{
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ml: 1,
                }}
              />
            </ListItemButton>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default LeftBar;