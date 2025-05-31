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
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, #1A1A1A 0%, #2D2D2D 100%)'
          : 'linear-gradient(45deg, #F8F9FA 0%, #FFFFFF 100%)',
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