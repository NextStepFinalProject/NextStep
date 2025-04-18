import { Container } from '@mui/material';
import React from 'react';
import './Layout.css';


const Layout: React.FC<{ children: React.ReactNode }> = (props: any) => {
  return (
    <Container className="layout-container" component="main"
      sx={{
        "&.MuiContainer-root": {
          maxWidth: 'none'
        }
      }}
    >
        { props.children }
    </Container>
  );
};

export default Layout;