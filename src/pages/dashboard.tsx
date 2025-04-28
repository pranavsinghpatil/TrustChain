import React from 'react';
import { Box, Typography, Container, Card, CardContent, Grid } from '@mui/material';
import Layout from '../components/Layout';
import { useWeb3 } from '../hooks/useWeb3';

const Dashboard: React.FC = () => {
  const { isConnected, account } = useWeb3();

  if (!isConnected) {
    return (
      <Layout>
        <Container maxWidth="sm">
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Please connect your wallet to view your dashboard
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Connected Account: {account}
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    My Tenders
                  </Typography>
                  {/* TODO: Add list of user's tenders */}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    My Bids
                  </Typography>
                  {/* TODO: Add list of user's bids */}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default Dashboard; 