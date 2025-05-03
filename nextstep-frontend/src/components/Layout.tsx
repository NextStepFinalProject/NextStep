import { Container } from '@mui/material';
import React from 'react';
import './Layout.css';


const Layout: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children
}) => {
  return (
    <Container className={["layout-container", className].join(' ')} component="main"
      sx={{
        "&.MuiContainer-root": {
          maxWidth: 'none'
        }
      }}
    >
      { children }
    </Container>
  );
};

export default Layout;