import { Container } from '@mui/material';
import React from 'react';


const Layout: React.FC<{ children: React.ReactNode }> = (props: any) => {
  return (
    <Container component="main" sx={{ marginTop: '10vh' }}>
        { props.children }
    </Container>
  );
};

export default Layout;