import { Container, Box, useTheme } from '@mui/material';
import React from 'react';
import './Layout.css';

interface LayoutProps {
  className?: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  className = '',
  children
}) => {
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.background.default,
          zIndex: -2,
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 50% 50%, rgba(45, 45, 45, 0.1) 0%, rgba(26, 26, 26, 0.2) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, rgba(248, 249, 250, 0.2) 100%)',
          zIndex: -1,
        },
      }}
    >
      <Container
        maxWidth={false}
        className={className}
        sx={{
          flex: 1,
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          position: 'relative',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'transparent',
          '&.login, &.register': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
          },
          '&.feed, &.profile, &.chat, &.resume, &.main-dashboard, &.quiz': {
            maxWidth: 'lg',
          },
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;