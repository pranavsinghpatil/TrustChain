import React from 'react';
import { useRouter } from 'next/router';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { useWeb3 } from '../hooks/useWeb3';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { account, connectWallet, isConnected } = useWeb3();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tender Management System
          </Typography>
          <Button color="inherit" onClick={() => router.push('/')}>
            Home
          </Button>
          <Button color="inherit" onClick={() => router.push('/create-tender')}>
            Create Tender
          </Button>
          <Button color="inherit" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            onClick={connectWallet}
            sx={{ ml: 2 }}
          >
            {isConnected ? `${account?.slice(0, 6)}...${account?.slice(-4)}` : 'Connect Wallet'}
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Tender Management System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 