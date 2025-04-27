import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Home as HomeIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, connectWallet, isConnected } = useWeb3();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Tender DApp
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Home
            </Button>

            <Button
              color="inherit"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Create Tender
            </Button>

            <IconButton
              color="inherit"
              onClick={() => navigate('/dashboard')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <PersonIcon />
            </IconButton>

            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {isConnected ? (
              <Button
                color="inherit"
                variant="outlined"
                sx={{ ml: 2 }}
              >
                {`${account?.slice(0, 6)}...${account?.slice(-4)}`}
              </Button>
            ) : (
              <Button
                color="inherit"
                variant="outlined"
                onClick={handleConnectWallet}
                sx={{ ml: 2 }}
              >
                Connect Wallet
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Tender DApp. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 