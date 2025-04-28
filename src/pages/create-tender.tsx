import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, TextField, Button, Typography, Container, Input } from '@mui/material';
import Layout from '../components/Layout';
import { useWeb3 } from '../hooks/useWeb3';

const CreateTender: React.FC = () => {
  const router = useRouter();
  const { isConnected } = useWeb3();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    budget: '',
    deadline: '',
    minimumBid: '',
    selectionCriteria: '',
  });
  const [documents, setDocuments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement tender creation logic (API, blockchain, IPFS)
    // For now, just mock and redirect
    router.push('/my-tenders');
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
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
              label="Budget ($)"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              margin="normal"
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
            <TextField
              fullWidth
              label="Selection Criteria (one per line)"
              value={formData.selectionCriteria}
              onChange={(e) => setFormData({ ...formData, selectionCriteria: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Upload Tender Documents</Typography>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mb-2"
              />
              {documents.length > 0 && (
                <ul className="text-sm text-gray-600 mt-2">
                  {documents.map((doc, i) => (
                    <li key={i}>{doc.name} ({(doc.size/1024/1024).toFixed(1)} MB)</li>
                  ))}
                </ul>
              )}
            </Box>
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