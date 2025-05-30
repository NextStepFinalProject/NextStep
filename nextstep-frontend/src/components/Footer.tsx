import React from 'react';
import { Box, Container, Typography, Link, Stack } from '@mui/material';
import { GitHub, LinkedIn, Twitter } from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 4 }}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            © {new Date().getFullYear()} Next Step. All rights reserved.
          </Typography>
          
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              sx={{
                '&:hover': {
                  color: 'primary.main',
                },
                transition: 'color 0.2s ease',
              }}
            >
              <GitHub />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              sx={{
                '&:hover': {
                  color: 'primary.main',
                },
                transition: 'color 0.2s ease',
              }}
            >
              <LinkedIn />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              sx={{
                '&:hover': {
                  color: 'primary.main',
                },
                transition: 'color 0.2s ease',
              }}
            >
              <Twitter />
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;