import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Download, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { fetchUserInvoices } from '../../redux/actions/PortalAction';
import { API_BASE_URL } from '../../utils/Constants';

const InvoicesList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInvoices, dashboardLoading, dashboardError } = useSelector((state) => state.home);
  const { user, token } = useSelector((state) => state.auth);

  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (user?.id) {
      const filters = tabValue === 0 ? {
        month: currentMonth,
        year: currentYear,
      } : {};

      dispatch(fetchUserInvoices(user.id, filters));
    }
  }, [dispatch, user, tabValue, currentMonth, currentYear]);

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
    if (!value) return '-';
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Apply status filter
  let filteredInvoices = userInvoices || [];
  if (statusFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === statusFilter);
  }

  if (dashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="My Invoices"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Invoices' },
        ]}
      />

      {dashboardError && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error.dark">{dashboardError}</Typography>
        </Paper>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Current Month" />
          <Tab label="All Invoices" />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="UNPAID">Unpaid</MenuItem>
          <MenuItem value="PAID">Paid</MenuItem>
        </TextField>
      </Box>

      <Stack spacing={2}>
        {filteredInvoices.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {tabValue === 0
                ? 'No invoices for the current month.'
                : 'No invoices found.'}
            </Typography>
          </Paper>
        ) : (
          filteredInvoices.map((invoice) => (
            <Paper
              key={invoice.id}
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <Stack spacing={2}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {invoice.invoice_no}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invoice.billing_period}
                    </Typography>
                  </Box>
                  <StatusChip status={invoice.status} />
                </Box>

                {/* Details Grid */}
                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
                  gap={2}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="primary">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Subtotal
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Invoice Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(invoice.created_at)}
                    </Typography>
                  </Box>
                  {invoice.paid_at && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Payment Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(invoice.paid_at)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Actions */}
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${invoice.id}`);
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
    </Box>
  );
};

export default InvoicesList;
