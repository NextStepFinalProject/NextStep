import React from 'react';
import { Box, Container, Typography, Link, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        width: '100%',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMobile ? 'center' : 'flex-start',
              gap: 1,
            }}
          >
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
              NextStep
            </Typography>
            <Typography variant="body2" color="text.secondary" align={isMobile ? 'center' : 'left'}>
              Empowering your career journey
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 4,
              alignItems: isMobile ? 'center' : 'flex-start',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                Quick Links
              </Typography>
              <Link component={RouterLink} to="/feed" color="text.secondary" underline="hover">
                Feed
              </Link>
              <Link component={RouterLink} to="/profile" color="text.secondary" underline="hover">
                Profile
              </Link>
              <Link component={RouterLink} to="/chat" color="text.secondary" underline="hover">
                Chat
              </Link>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                Resources
              </Typography>
              <Link component={RouterLink} to="/resume" color="text.secondary" underline="hover">
                Resume Builder
              </Link>
              <Link component={RouterLink} to="/quiz" color="text.secondary" underline="hover">
                Career Quiz
              </Link>
              <Link component={RouterLink} to="/main-dashboard" color="text.secondary" underline="hover">
                Dashboard
              </Link>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" align={isMobile ? 'center' : 'left'}>
            © {new Date().getFullYear()} NextStep. All rights reserved.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: isMobile ? 'center' : 'flex-end',
            }}
          >
            <Link href="/terms" color="text.secondary" underline="hover">
              Terms
            </Link>
            <Link href="/privacy" color="text.secondary" underline="hover">
              Privacy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;