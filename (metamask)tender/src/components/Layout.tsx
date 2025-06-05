import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Dialog, DialogContent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { WalletManager } from './WalletManager';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole, logout } = useAuth();
  const { account, connectWallet, isConnected } = useWeb3();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const router = useRouter();

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin-dashboard' },
    { text: 'User Management', icon: <PeopleIcon />, path: '/user-management' },
    { text: 'All Tenders', icon: <ListIcon />, path: '/all-tenders' },
    { text: 'Activity Log', icon: <HistoryIcon />, path: '/activity-log' },
  ];

  const officerMenuItems = [
    { text: 'My Tenders', icon: <GavelIcon />, path: '/my-tenders' },
    { text: 'Create Tender', icon: <AddIcon />, path: '/create-tender' },
  ];

  const userMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Browse Tenders', icon: <ListIcon />, path: '/tenders' },
    { text: 'My Bids', icon: <GavelIcon />, path: '/my-bids' },
  ];

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return adminMenuItems;
      case 'officer':
        return officerMenuItems;
      case 'user':
        return userMenuItems;
      default:
        return [];
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setDrawerOpen(false);
  };

  if (!isAuthenticated && router.pathname !== '/login' && router.pathname !== '/register') {
    router.push('/login');
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed">
        <Toolbar>
          {isAuthenticated && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tender Management System
          </Typography>
          {!isConnected ? (
            <Button color="inherit" onClick={() => setWalletDialogOpen(true)}>
              Connect Wallet
            </Button>
          ) : (
            <Button color="inherit" onClick={() => setWalletDialogOpen(true)}>
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </Button>
          )}
          {isAuthenticated && (
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {isAuthenticated && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              {getMenuItems().map((item) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8,
          pb: 4,
          px: 2,
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      {/* Wallet Manager Dialog */}
      <Dialog 
        open={walletDialogOpen} 
        onClose={() => setWalletDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <WalletManager />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Layout; 