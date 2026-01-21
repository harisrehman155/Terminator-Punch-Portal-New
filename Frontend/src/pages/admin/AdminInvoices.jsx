import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Visibility, Download, Add, CheckCircle } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { fetchAdminInvoices } from '../../redux/actions/PortalAction';
import { API_BASE_URL } from '../../utils/Constants';

const AdminInvoices = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminInvoices, dashboardLoading, dashboardError } = useSelector((state) => state.home);
  const token = useSelector((state) => state.auth.token);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Fetch admin invoices on component mount
  useEffect(() => {
    dispatch(fetchAdminInvoices());
  }, [dispatch]);

  // Apply client-side filtering
  let filteredInvoices = adminInvoices || [];

  if (statusFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === statusFilter);
  }

  if (searchText) {
    filteredInvoices = filteredInvoices.filter(
      inv =>
        inv.invoice_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        inv.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        inv.billing_period?.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // Show loading state
  if (dashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (dashboardError) {
    return (
      <>
        <PageHeader
          title="Invoices Management"
          breadcrumbs={[{ label: 'Admin Dashboard', path: '/admin/dashboard' }, { label: 'Invoices' }]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load invoices
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {dashboardError}
          </Typography>
        </Box>
      </>
    );
  }

  const handleDownloadPDF = async (invoice) => {
    if (!invoice || !token) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoice.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_no}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const columns = [
    {
      field: 'invoice_no',
      headerName: 'Invoice #',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          onClick={() => navigate(`/admin/invoices/${params.row.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      field: 'user',
      headerName: 'Customer',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.value?.name || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'billing_period',
      headerName: 'Billing Period',
      width: 150,
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {formatCurrency(params.value, params.row.currency)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/invoices/${params.row.id}`);
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadPDF(params.row);
              }}
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Invoices"
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Invoices' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/admin/invoices/create')}
          >
            Create Invoice
          </Button>
        }
      />

      <Box
        sx={{
          mb: 3,
          display: { xs: 'grid', sm: 'flex' },
          gap: 2,
          flexWrap: 'wrap',
          gridTemplateColumns: { xs: '1fr', sm: 'none' },
        }}
      >
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 150 } }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="UNPAID">Unpaid</MenuItem>
          <MenuItem value="PAID">Paid</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </TextField>

        <TextField
          label="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Invoice #, customer, period..."
          sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 300 } }}
          size="small"
        />
      </Box>

      {isMobile ? (
        <Stack spacing={2}>
          {filteredInvoices.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No invoices found.
            </Typography>
          ) : (
            filteredInvoices.map((invoice) => (
              <Paper
                key={invoice.id}
                elevation={0}
                onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {invoice.invoice_no}
                    </Typography>
                    <StatusChip status={invoice.status} />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {invoice.user?.name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Billing Period
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {invoice.billing_period}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(invoice.created_at)}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/invoices/${invoice.id}`);
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(invoice);
                        }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      ) : (
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredInvoices}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            onRowClick={(params) => navigate(`/admin/invoices/${params.row.id}`)}
            sx={{
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AdminInvoices;
