import React from 'react';
import { Box, Typography, Container, Card, CardContent, Grid } from '@mui/material';
import Layout from '../components/Layout';
import { useWeb3 } from '../hooks/useWeb3';

const userStats = {
  activeBids: 2,
  wonContracts: 2,
  successRate: 67,
  totalValue: 440000,
};

const recentTenders = [
  {
    id: 'T-2025-001',
    title: 'Hospital Management System',
    status: 'Open',
    deadline: '2025-05-15',
  },
  {
    id: 'T-2025-002',
    title: 'Smart Traffic Control System',
    status: 'Open',
    deadline: '2025-05-05',
  },
  {
    id: 'T-2025-003',
    title: 'E-Learning Platform',
    status: 'Closed',
    deadline: '2025-04-30',
  },
];

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
            Welcome, Sam Bidder!
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Connected Account: {account}
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Active Bids</Typography>
                  <Typography variant="h4">{userStats.activeBids}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Won Contracts</Typography>
                  <Typography variant="h4">{userStats.wonContracts}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Success Rate</Typography>
                  <Typography variant="h4">{userStats.successRate}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Total Value</Typography>
                  <Typography variant="h4">${userStats.totalValue / 1000}K</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Tenders
                </Typography>
                <Box component="table" sx={{ width: '100%', textAlign: 'left' }}>
                  <Box component="thead">
                    <Box component="tr">
                      <Box component="th" sx={{ py: 1 }}>Tender</Box>
                      <Box component="th" sx={{ py: 1 }}>Status</Box>
                      <Box component="th" sx={{ py: 1 }}>Deadline</Box>
                      <Box component="th" sx={{ py: 1 }}>Action</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {recentTenders.map((tender) => (
                      <Box component="tr" key={tender.id} sx={{ borderBottom: '1px solid #f0f0f0', ':hover': { background: '#f9f9f9' } }}>
                        <Box component="td" sx={{ py: 1, fontWeight: 500 }}>{tender.title}</Box>
                        <Box component="td" sx={{ py: 1 }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: tender.status === 'Open' ? '#dcfce7' : '#e5e7eb',
                            color: tender.status === 'Open' ? '#166534' : '#374151',
                          }}>{tender.status}</span>
                        </Box>
                        <Box component="td" sx={{ py: 1 }}>{tender.deadline}</Box>
                        <Box component="td" sx={{ py: 1 }}>
                          <a href={`/tenders/${tender.id}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>View Details</a>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <a href="/tenders" style={{ background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 6, fontWeight: 600 }}>Browse Tenders</a>
            <a href="/my-bids" style={{ background: '#22c55e', color: '#fff', padding: '8px 16px', borderRadius: 6, fontWeight: 600 }}>My Bids</a>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default Dashboard;