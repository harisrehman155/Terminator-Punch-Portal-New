import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Visibility, Edit, Delete } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { lookups } from '../../data/dummyLookups';
import apiService, { HttpMethod } from '../../api/ApiService';

const QuotesList = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchQuotes = async () => {
      if (!token) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: '/quotes',
          token,
        });

        const list = response?.data?.quotes || [];
        if (isMounted) {
          setQuotes(list);
        }
      } catch (error) {
        const message = error?.apiMessage || error?.message || 'Failed to load quotes';
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuotes();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const filteredQuotes = useMemo(() => {
    let filtered = quotes;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((quote) => quote.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(
        (quote) => (quote.service_type || quote.quote_type) === typeFilter
      );
    }

    if (searchText) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(
        (quote) =>
          quote.quote_no?.toLowerCase().includes(query) ||
          quote.design_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [quotes, searchText, statusFilter, typeFilter]);

  const handleDeleteClick = (quote) => {
    setSelectedQuote(quote);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuote) {
      return;
    }
    if (!token) {
      toast.error('Please log in again to delete the quote');
      return;
    }

    setIsDeleting(true);

    try {
      await apiService({
        method: HttpMethod.DELETE,
        endPoint: `/quotes/${selectedQuote.id}`,
        token,
      });
      setQuotes((prev) => prev.filter((quote) => quote.id !== selectedQuote.id));
      toast.success('Quote deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to delete quote';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      field: 'quote_no',
      headerName: 'Quote #',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          onClick={() => navigate(`/quotes/${params.row.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      field: 'quote_type',
      headerName: 'Type',
      width: 120,
      valueGetter: (params) => params.row.service_type || params.row.quote_type,
    },
    {
      field: 'design_name',
      headerName: 'Design',
      width: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <StatusChip status={params.value} type="quote" />,
    },
    {
      field: 'current_price',
      headerName: 'Price',
      width: 120,
        renderCell: (params) =>
          params.value ? (
            <Chip
              label={`${params.row.currency || 'USD'} ${params.value}`}
              size="small"
              color="success"
            />
          ) : (
            <Chip label="Pending" size="small" />
        ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/quotes/${params.row.id}`);
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/quotes/${params.row.id}/edit`);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(params.row);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Quotes"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Quotes' }]}
        action={() => navigate('/quotes/new')}
        actionLabel="New Quote"
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          {lookups.quote_status.map((status) => (
            <MenuItem key={status} value={status}>
              {status.replace('_', ' ')}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          {lookups.order_types.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 300 }}
          size="small"
        />
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredQuotes}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          onRowClick={(params) => navigate(`/quotes/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => (isDeleting ? null : setDeleteDialogOpen(false))}
      >
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quote? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuotesList;
