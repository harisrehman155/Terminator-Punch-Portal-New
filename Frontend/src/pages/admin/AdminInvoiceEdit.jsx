import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import apiService, { HttpMethod } from '../../api/ApiService';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const AdminInvoiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    billing_month: '',
    billing_year: '',
    billing_period: '',
    tax_rate: 0,
    currency: 'USD',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isLocked = useMemo(
    () => invoice?.is_locked === 1 || invoice?.status === 'PAID',
    [invoice]
  );

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: `/invoices/${id}`,
          token,
        });

        if (response?.success || response?.status === 'success') {
          const data = response.data;
          setInvoice(data);
          setFormData({
            billing_month: data.billing_month,
            billing_year: data.billing_year,
            billing_period: data.billing_period,
            tax_rate: parseFloat(data.tax_rate || 0),
            currency: data.currency || 'USD',
            notes: data.notes || '',
          });
          setItems(
            (data.items || []).map((item) => ({
              order_id: item.order_id,
              order_no: item.order_no || item.order_id,
              description: item.description,
              quantity: item.quantity || 1,
              unit_price: parseFloat(item.unit_price || 0),
              line_total: parseFloat(item.line_total || 0),
            }))
          );
        } else {
          setError(response.message || 'Failed to load invoice');
        }
      } catch (err) {
        setError(err.apiMessage || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, token]);

  useEffect(() => {
    if (formData.billing_month && formData.billing_year) {
      const month = MONTHS.find((m) => m.value === Number(formData.billing_month));
      setFormData((prev) => ({
        ...prev,
        billing_period: `${month?.label || ''} ${formData.billing_year}`,
      }));
    }
  }, [formData.billing_month, formData.billing_year]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'unit_price' || field === 'quantity') {
      const unitPrice = parseFloat(newItems[index].unit_price || 0);
      const quantity = parseInt(newItems[index].quantity || 1, 10);
      newItems[index].line_total = unitPrice * quantity;
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.line_total || 0), 0);
    const taxAmount = subtotal * (parseFloat(formData.tax_rate || 0) / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      setError('This invoice is locked and cannot be edited.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiService({
        method: HttpMethod.PUT,
        endPoint: `/admin/invoices/${id}`,
        token,
        data: {
          billing_period: formData.billing_period,
          billing_month: Number(formData.billing_month),
          billing_year: Number(formData.billing_year),
          tax_rate: parseFloat(formData.tax_rate || 0),
          currency: formData.currency,
          notes: formData.notes,
          items: items.map((item) => ({
            order_id: item.order_id,
            description: item.description,
            quantity: parseInt(item.quantity || 1, 10),
            unit_price: parseFloat(item.unit_price || 0),
          })),
        },
      });

      if (response?.success || response?.status === 'success') {
        setSuccess('Invoice updated successfully.');
        setTimeout(() => navigate(`/admin/invoices/${id}`), 1200);
      } else {
        setError(response.message || 'Failed to update invoice');
      }
    } catch (err) {
      setError(err.apiMessage || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Edit Invoice"
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Invoices', path: '/admin/invoices' },
          { label: 'Edit' },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {isLocked && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This invoice is locked and cannot be edited.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Invoice Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Billing Month"
                  value={formData.billing_month}
                  onChange={(e) => setFormData({ ...formData, billing_month: e.target.value })}
                  required
                  disabled={isLocked}
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Billing Year"
                  value={formData.billing_year}
                  onChange={(e) => setFormData({ ...formData, billing_year: parseInt(e.target.value, 10) })}
                  required
                  disabled={isLocked}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  disabled={isLocked}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tax Rate (%)"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                  disabled={isLocked}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isLocked}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Line Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Orders cannot be added or removed in edit mode. Update descriptions and pricing only.
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.order_id}>
                      <TableCell>{item.order_no}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          disabled={isLocked}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                          disabled={isLocked}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          inputProps={{ step: 0.01, min: 0 }}
                          sx={{ width: 120 }}
                          disabled={isLocked}
                        />
                      </TableCell>
                      <TableCell>
                        ${parseFloat(item.line_total || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, maxWidth: 400, ml: 'auto' }}>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Subtotal:</Typography>
                  <Typography fontWeight={500}>
                    ${subtotal.toFixed(2)}
                  </Typography>
                </Box>
                {parseFloat(formData.tax_rate || 0) > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Tax ({formData.tax_rate}%):</Typography>
                    <Typography fontWeight={500}>
                      ${taxAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    ${total.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/admin/invoices/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || isLocked}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
};

export default AdminInvoiceEdit;
