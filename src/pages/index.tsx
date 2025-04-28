import React from 'react';
import { Box, Typography, Container, Card, CardContent, Grid, Button } from '@mui/material';
import Layout from '../components/Layout';
import { useWeb3 } from '../hooks/useWeb3';

const Home: React.FC = () => {
  const { isConnected } = useWeb3();

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Active Tenders
          </Typography>
          
          <Grid container spacing={3}>
            {/* TODO: Add list of active tenders */}
            <Grid item xs={12} md={6} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sample Tender
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description: This is a sample tender for demonstration purposes.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Deadline: 2023-12-31
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Minimum Bid: 1 ETH
                  </Typography>
                  {isConnected && (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Place Bid
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default Home; 