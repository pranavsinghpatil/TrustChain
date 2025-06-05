import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Divider } from '@mui/material';
import { WalletManager } from '@/components/WalletManager';
import { useWeb3 } from '@/contexts/Web3Context';
import { ethers } from 'ethers';

export default function WalletTestPage() {
  const { account, isConnected, provider } = useWeb3();
  const [balance, setBalance] = useState<string>('0');
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    const getBalanceAndNetwork = async () => {
      if (isConnected && account && provider) {
        try {
          // Get balance
          const balanceWei = await provider.getBalance(account);
          const balanceEth = ethers.utils.formatEther(balanceWei);
          setBalance(balanceEth);
          
          // Get network info
          const network = await provider.getNetwork();
          setNetworkInfo(network);
        } catch (error) {
          console.error("Error fetching balance or network:", error);
        }
      } else {
        setBalance('0');
        setNetworkInfo(null);
      }
    };

    getBalanceAndNetwork();
  }, [account, isConnected, provider]);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Laitlum Network Wallet Test
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Wallet Connection
        </Typography>
        <WalletManager />
      </Paper>
      
      {isConnected && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Wallet Information
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Account Address
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
              {account}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              LTM Balance
            </Typography>
            <Typography variant="h5" color="primary">
              {parseFloat(balance).toLocaleString()} LTM
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Network Information
            </Typography>
            {networkInfo ? (
              <>
                <Typography variant="body1">
                  <strong>Name:</strong> {networkInfo.name || 'Laitlum Network'}
                </Typography>
                <Typography variant="body1">
                  <strong>Chain ID:</strong> {networkInfo.chainId}
                </Typography>
              </>
            ) : (
              <Typography variant="body1">
                Network information not available
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
}
