import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Pagination,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { TenderManager } from '../contracts/TenderManager';
import { formatEther } from 'ethers/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const ITEMS_PER_PAGE = 6;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { contract, isConnected } = useWeb3();
  const [tenders, setTenders] = useState<any[]>([]);
  const [totalTenders, setTotalTenders] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTenders = async () => {
      if (!contract) return;

      try {
        const total = await contract.getTenderCount();
        setTotalTenders(total.toNumber());

        const offset = (page - 1) * ITEMS_PER_PAGE;
        const limit = ITEMS_PER_PAGE;
        const result = await contract.getAllTenders(offset, limit);

        const formattedTenders = result.ids.map((id: number, index: number) => ({
          id: id.toNumber(),
          title: result.titles[index],
          owner: result.owners[index],
          status: result.statuses[index],
          deadline: new Date(result.deadlines[index].toNumber() * 1000),
          minBid: formatEther(result.minBids[index]),
          totalBids: result.totalBids[index].toNumber(),
        }));

        setTenders(formattedTenders);
      } catch (error) {
        console.error('Error loading tenders:', error);
      }
    };

    loadTenders();
  }, [contract, page]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredTenders = tenders.filter((tender) =>
    tender.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'success';
      case 1:
        return 'error';
      case 2:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return 'Active';
      case 1:
        return 'Closed';
      case 2:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Active Tenders
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search tenders..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredTenders.map((tender) => (
          <Grid item xs={12} sm={6} md={4} key={tender.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip
                    label={getStatusLabel(tender.status)}
                    color={getStatusColor(tender.status)}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formatDistanceToNow(tender.deadline, { addSuffix: true })}
                  </Typography>
                </Box>

                <Typography variant="h6" component="h2" gutterBottom>
                  {tender.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  Minimum Bid: {tender.minBid} ETH
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Total Bids: {tender.totalBids}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/tender/${tender.id}`)}
                >
                  View Details
                </Button>
                {isConnected && tender.status === 0 && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/tender/${tender.id}/bid`)}
                  >
                    Place Bid
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {totalTenders > ITEMS_PER_PAGE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(totalTenders / ITEMS_PER_PAGE)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default Home; 