import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Snackbar,
  TableSortLabel,
  TablePagination,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Sort as SortIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { TenderManager } from '../contracts/TenderManager';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { BigNumber } from 'ethers';

interface Tender {
  id: number;
  title: string;
  description: string;
  deadline: number;
  minBid: string;
  owner: string;
  status: number;
  winningBidId: number;
  totalBids: number;
}

interface Bid {
  id: number;
  bidder: string;
  amount: string;
  timestamp: number;
  proposal: string;
  status: number; // 0: Active, 1: Winner, 2: NotSelected
}

interface ContractTender {
  ids: BigNumber[];
  titles: string[];
  descriptions: string[];
  owners: string[];
  statuses: number[];
  deadlines: BigNumber[];
  minBids: BigNumber[];
  winningBidIds: BigNumber[];
  totalBids: BigNumber[];
}

interface ContractBid {
  ids: BigNumber[];
  bidders: string[];
  amounts: BigNumber[];
  timestamps: BigNumber[];
  proposals: string[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { contract, account, isConnected } = useWeb3();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    minBid: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Bid; direction: 'asc' | 'desc' } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    minBid?: string;
  }>({});

  const loadAdminTenders = useCallback(async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      const totalTenders = await contract.getTenderCount();
      const allTenders = await contract.getAllTenders(0, totalTenders.toNumber()) as unknown as ContractTender;

      const adminTenders = allTenders.ids
        .map((id, index) => ({
          id: id.toNumber(),
          title: allTenders.titles[index],
          description: allTenders.descriptions[index],
          deadline: allTenders.deadlines[index].toNumber(),
          minBid: formatEther(allTenders.minBids[index]),
          owner: allTenders.owners[index],
          status: allTenders.statuses[index],
          winningBidId: allTenders.winningBidIds[index].toNumber(),
          totalBids: allTenders.totalBids[index].toNumber(),
        }))
        .filter((tender) => tender.owner === account);

      setTenders(adminTenders);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to load tenders',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  const loadTenderBids = useCallback(async (tenderId: number) => {
    if (!contract) return;

    try {
      const bidsCount = await contract.getTenderBidsCount(tenderId);
      const bidsData = await contract.getTenderBids(tenderId, 0, bidsCount.toNumber()) as unknown as ContractBid;

      const formattedBids = await Promise.all(
        bidsData.ids.map(async (bidId, index) => {
          const status = await contract.getBidStatus(tenderId, bidId.toNumber());
          return {
            id: bidId.toNumber(),
            bidder: bidsData.bidders[index],
            amount: formatEther(bidsData.amounts[index]),
            timestamp: bidsData.timestamps[index].toNumber(),
            proposal: bidsData.proposals[index],
            status: status,
          };
        })
      );

      setBids(formattedBids);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to load bids',
        severity: 'error',
      });
    }
  }, [contract]);

  const handleEditTender = async () => {
    if (!validateForm()) return;

    if (!contract || !selectedTender) return;

    try {
      setLoading(true);
      const tx = await contract.updateTender(
        selectedTender.id,
        editForm.title,
        editForm.description,
        parseEther(editForm.minBid)
      );
      await tx.wait();
      
      setSnackbar({
        open: true,
        message: 'Tender updated successfully!',
        severity: 'success',
      });
      
      setEditDialogOpen(false);
      await loadAdminTenders();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to update tender. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Bid) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBids = React.useMemo(() => {
    if (!sortConfig) return bids;
    
    return [...bids].sort((a, b) => {
      if (sortConfig.key === 'amount') {
        const aAmount = parseFloat(a.amount);
        const bAmount = parseFloat(b.amount);
        return sortConfig.direction === 'asc' ? aAmount - bAmount : bAmount - aAmount;
      } else if (sortConfig.key === 'timestamp') {
        return sortConfig.direction === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
      }
      return 0;
    });
  }, [bids, sortConfig]);

  const handleCloseTender = useCallback(async () => {
    if (!contract || !selectedTender || selectedWinner === null) return;

    try {
      setLoading(true);
      const tx = await contract.closeTender(selectedTender.id);
      await tx.wait();
      
      setSnackbar({
        open: true,
        message: 'Tender closed successfully!',
        severity: 'success',
      });
      
      setCloseDialogOpen(false);
      await loadAdminTenders();
      await loadTenderBids(selectedTender.id);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to close tender. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [contract, selectedTender, selectedWinner, loadAdminTenders, loadTenderBids]);

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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!editForm.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!editForm.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!editForm.minBid || isNaN(Number(editForm.minBid)) || Number(editForm.minBid) <= 0) {
      errors.minBid = 'Minimum bid must be a positive number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === null || tender.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedTenders = filteredTenders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />}
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search tenders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter === null ? '' : statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === '' ? null : Number(e.target.value))}
            label="Status Filter"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value={0}>Active</MenuItem>
            <MenuItem value={1}>Closed</MenuItem>
            <MenuItem value={2}>Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Your Tenders ({filteredTenders.length})
          </Typography>
          {paginatedTenders.map((tender) => (
            <Card key={tender.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip
                    label={getStatusLabel(tender.status)}
                    color={getStatusColor(tender.status)}
                    size="small"
                  />
                  <Box>
                    <Tooltip title="Edit Tender">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTender(tender);
                          setEditForm({
                            title: tender.title,
                            description: tender.description,
                            minBid: tender.minBid,
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {tender.status === 0 && (
                      <Tooltip title="Close Tender">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTender(tender);
                            loadTenderBids(tender.id);
                            setCloseDialogOpen(true);
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom>
                  {tender.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {tender.description}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Min Bid: {tender.minBid} ETH
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Bids: {tender.totalBids}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
          <TablePagination
            component="div"
            count={filteredTenders.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          {selectedTender && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Tender Details
              </Typography>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedTender.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTender.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deadline: {format(new Date(selectedTender.deadline * 1000), 'PPP')}
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Bids
                <Tooltip title="Click column headers to sort">
                  <IconButton size="small">
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig?.key === 'bidder'}
                          direction={sortConfig?.direction}
                          onClick={() => handleSort('bidder')}
                        >
                          Bidder
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig?.key === 'amount'}
                          direction={sortConfig?.direction}
                          onClick={() => handleSort('amount')}
                        >
                          Amount (ETH)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Proposal</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig?.key === 'timestamp'}
                          direction={sortConfig?.direction}
                          onClick={() => handleSort('timestamp')}
                        >
                          Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedBids.map((bid) => (
                      <TableRow 
                        key={bid.id}
                        sx={{
                          backgroundColor: bid.status === 1 ? 'success.light' : 'inherit',
                          '&:hover': {
                            backgroundColor: bid.status === 1 ? 'success.light' : 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          {`${bid.bidder.slice(0, 6)}...${bid.bidder.slice(-4)}`}
                        </TableCell>
                        <TableCell>{bid.amount}</TableCell>
                        <TableCell>{bid.proposal}</TableCell>
                        <TableCell>
                          {format(new Date(bid.timestamp * 1000), 'PPp')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              bid.status === 1 ? 'Winner' :
                              bid.status === 2 ? 'Not Selected' : 'Active'
                            }
                            color={
                              bid.status === 1 ? 'success' :
                              bid.status === 2 ? 'default' : 'primary'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {selectedTender.status === 0 && (
                            <Tooltip title={bid.status !== 0 ? "Cannot select non-active bid" : "Select as winner"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedWinner(bid.id)}
                                  color={selectedWinner === bid.id ? 'primary' : 'default'}
                                  disabled={bid.status !== 0}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Edit Tender Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Tender</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            error={!!validationErrors.title}
            helperText={validationErrors.title}
          />
          <TextField
            margin="dense"
            label="Description"
            multiline
            rows={4}
            fullWidth
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            error={!!validationErrors.description}
            helperText={validationErrors.description}
          />
          <TextField
            margin="dense"
            label="Minimum Bid (ETH)"
            type="number"
            fullWidth
            value={editForm.minBid}
            onChange={(e) => setEditForm({ ...editForm, minBid: e.target.value })}
            error={!!validationErrors.minBid}
            helperText={validationErrors.minBid}
            InputProps={{
              inputProps: { min: 0, step: 0.01 }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTender} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Tender Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
        <DialogTitle>Close Tender</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to close this tender? This action cannot be undone.
          </Typography>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {bids.length > 0 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Winner</InputLabel>
              <Select
                value={selectedWinner || ''}
                onChange={(e) => setSelectedWinner(Number(e.target.value))}
                label="Select Winner"
                disabled={loading}
              >
                {bids.map((bid) => (
                  <MenuItem key={bid.id} value={bid.id}>
                    {`${bid.bidder.slice(0, 6)}...${bid.bidder.slice(-4)} - ${bid.amount} ETH`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCloseDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCloseTender}
            variant="contained"
            color="primary"
            disabled={!selectedWinner || loading}
          >
            Close Tender
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(AdminDashboard); 