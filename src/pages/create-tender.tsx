import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, TextField, Button, Typography, Container } from '@mui/material';
import Layout from '../components/Layout';
import { useWeb3 } from '../hooks/useWeb3';

const CreateTender: React.FC = () => {
  const router = useRouter();
  const { isConnected } = useWeb3();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    minimumBid: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement tender creation logic
    router.push('/');
  };

  if (!isConnected) {
    return (
      <Layout>
        <Container maxWidth="sm">
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Please connect your wallet to create a tender
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create New Tender
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Minimum Bid (ETH)"
              type="number"
              value={formData.minimumBid}
              onChange={(e) => setFormData({ ...formData, minimumBid: e.target.value })}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
            >
              Create Tender
            </Button>
          </form>
        </Box>
      </Container>
    </Layout>
  );
};

export default CreateTender; 