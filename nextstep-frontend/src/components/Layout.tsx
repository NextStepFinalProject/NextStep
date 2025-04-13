import { Container } from '@mui/material';
import React from 'react';
import './Layout.css';


const Layout: React.FC<{ children: React.ReactNode }> = (props: any) => {
  return (
    <Container className="layout-container" component="main">
        { props.children }
    </Container>
  );
};

export default Layout;