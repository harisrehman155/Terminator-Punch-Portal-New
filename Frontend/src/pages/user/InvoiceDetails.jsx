import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import apiService, { HttpMethod } from '../../api/ApiService';
import { API_BASE_URL } from '../../utils/Constants';
import PayPalInvoiceButton from '../../components/payments/PayPalInvoiceButton';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService({
        method: HttpMethod.GET,
        endPoint: `/invoices/${id}`,
        token,
      });

      if (response?.success || response?.status === 'success') {
        setInvoice(response.data);
      } else {
        setError(response.message || 'Failed to load invoice');
      }
    } catch (err) {
      setError(err.apiMessage || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <PageHeader
          title="Invoice Details"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Invoices', path: '/invoices' },
            { label: 'Details' },
          ]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            {error || 'Invoice not found'}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Invoice ${invoice.invoice_no}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Invoices', path: '/invoices' },
          { label: invoice.invoice_no },
        ]}
      />

      <Stack spacing={3}>
        {/* Header Card */}
        <Paper sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {invoice.invoice_no}
              </Typography>
              <StatusChip status={invoice.status} />
            </Box>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownloadPDF}
              fullWidth
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
            >
              Download PDF
            </Button>
          </Stack>
        </Paper>

        {/* Invoice Info */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Invoice Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Billing Period
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {invoice.billing_period}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Invoice Date
              </Typography>
              <Typography variant="body1">
                {formatDate(invoice.created_at)}
              </Typography>
            </Grid>
            {invoice.paid_at && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Payment Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(invoice.paid_at)}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Currency
              </Typography>
              <Typography variant="body1">
                {invoice.currency || 'USD'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Invoice Items */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Invoice Items
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {isMobile ? (
            <Stack spacing={2}>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">
                        {item.order_no || item.order_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Typography variant="body2">
                        Service: {item.service_type || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Qty: {item.quantity || 1}
                      </Typography>
                      <Typography variant="body2">
                        Unit: {formatCurrency(item.unit_price, invoice.currency)}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Total: {formatCurrency(item.line_total, invoice.currency)}
                      </Typography>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No items found
                </Typography>
              )}
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Service Type</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.order_no || item.order_id}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.service_type}</TableCell>
                        <TableCell align="right">{item.quantity || 1}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.line_total, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Totals */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Totals
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ maxWidth: 400, ml: 'auto' }}>
            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </Typography>
              </Box>
              {parseFloat(invoice.tax_amount || 0) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1">
                    Tax ({parseFloat(invoice.tax_rate || 0).toFixed(2)}%):
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(invoice.tax_amount, invoice.currency)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Payment */}
        {invoice.status === 'UNPAID' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pay Invoice
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You will be charged {formatCurrency(invoice.total_amount, invoice.currency)} via PayPal.
            </Typography>
            <PayPalInvoiceButton
              invoiceId={invoice.id}
              currency={invoice.currency || 'USD'}
              onPaid={(paidInvoice) => setInvoice(paidInvoice)}
            />
          </Paper>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
              {invoice.notes}
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export default InvoiceDetails;
