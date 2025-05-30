import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip, Divider } from '@mui/material';
import { Home, Person, Message, Logout, DocumentScannerTwoTone, Feed, Quiz, Menu, ChevronLeft } from '@mui/icons-material';
import { getUserAuth, removeUserAuth } from "../handlers/userAuth.ts";
import api from "../serverApi.ts";
import logo from '../../assets/NextStep.png';

const LeftBar: React.FC = () => {
  const userAuthRef = useRef(getUserAuth());
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
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

  const menuItems = [
    { path: '/main-dashboard', icon: <Home />, text: 'Home' },
    { path: '/resume', icon: <DocumentScannerTwoTone />, text: 'Resume' },
    { path: '/quiz', icon: <Quiz />, text: 'Quiz' },
    { path: '/feed', icon: <Feed />, text: 'Feed' },
    { path: '/chat', icon: <Message />, text: 'Chat' },
    { path: '/profile', icon: <Person />, text: 'Profile' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 72 : 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? 72 : 240,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ 
              height: 40,
              width: 'auto',
              transition: 'all 0.3s ease',
            }}
          />
        )}
        <IconButton 
          onClick={toggleCollapse} 
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {collapsed ? <Menu /> : <ChevronLeft />}
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <Tooltip 
            key={item.path} 
            title={collapsed ? item.text : ''} 
            placement="right"
          >
            <ListItem
              button
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List sx={{ px: 1 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 'auto' : 40,
                color: 'text.secondary',
              }}
            >
              <Logout />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText 
                primary="Logout"
                primaryTypographyProps={{
                  color: 'text.primary',
                }}
              />
            )}
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default LeftBar;