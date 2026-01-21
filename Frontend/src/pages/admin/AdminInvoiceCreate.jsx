import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Autocomplete,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
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

const AdminInvoiceCreate = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [users, setUsers] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    billing_month: currentMonth,
    billing_year: currentYear,
    tax_rate: 0,
    currency: 'USD',
    notes: '',
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchAvailableOrders(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Update billing period when month/year changes
    if (formData.billing_month && formData.billing_year) {
      const month = MONTHS.find(m => m.value === formData.billing_month);
      setFormData(prev => ({
        ...prev,
        billing_period: `${month?.label || ''} ${formData.billing_year}`
      }));
    }
  }, [formData.billing_month, formData.billing_year]);

  const fetchUsers = async () => {
    try {
      const response = await apiService({
        method: HttpMethod.GET,
        endPoint: '/admin/users',
        token,
      });
      if (response?.success || response?.status === 'success') {
        setUsers(response.data.users || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAvailableOrders = async (userId) => {
    try {
      setLoading(true);
      const response = await apiService({
        method: HttpMethod.GET,
        endPoint: `/admin/invoices/available-orders/${userId}`,
        token,
      });
      if (response?.success || response?.status === 'success') {
        setAvailableOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelection = (order) => {
    if (selectedOrders.find(o => o.id === order.id)) {
      // Remove order
      setSelectedOrders(selectedOrders.filter(o => o.id !== order.id));
      setItems(items.filter(i => i.order_id !== order.id));
    } else {
      // Add order
      setSelectedOrders([...selectedOrders, order]);
      setItems([...items, {
        order_id: order.id,
        order_no: order.order_no,
        description: order.design_name || `Order ${order.order_no}`,
        service_type: order.order_type,
        quantity: 1,
        unit_price: parseFloat(order.price || 0),
        line_total: parseFloat(order.price || 0),
      }]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'unit_price' || field === 'quantity') {
      const unitPrice = parseFloat(newItems[index].unit_price || 0);
      const quantity = parseInt(newItems[index].quantity || 1);
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

    if (!selectedUser) {
      setError('Please select a customer');
      return;
    }

    if (items.length === 0) {
      setError('Please select at least one order');
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();

    try {
      setLoading(true);
      setError(null);

      const response = await apiService({
        method: HttpMethod.POST,
        endPoint: '/admin/invoices',
        token,
        data: {
          user_id: selectedUser.id,
          order_ids: selectedOrders.map(o => o.id),
          billing_period: formData.billing_period,
          billing_month: formData.billing_month,
          billing_year: formData.billing_year,
          tax_rate: parseFloat(formData.tax_rate || 0),
          currency: formData.currency,
          notes: formData.notes,
          items: items.map(item => ({
            order_id: item.order_id,
            description: item.description,
            service_type_id: item.service_type_id || null,
            quantity: parseInt(item.quantity || 1),
            unit_price: parseFloat(item.unit_price),
            line_total: parseFloat(item.line_total),
          })),
        },
      });

      if (response?.success || response?.status === 'success') {
        setSuccess('Invoice created successfully!');
        setTimeout(() => {
          navigate(`/admin/invoices/${response.data.id}`);
        }, 1500);
      } else {
        setError(response.message || 'Failed to create invoice');
      }
    } catch (err) {
      setError(err.apiMessage || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Box>
      <PageHeader
        title="Create Invoice"
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Invoices', path: '/admin/invoices' },
          { label: 'Create' },
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

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Customer Selection */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Selection
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={selectedUser}
              onChange={(e, newValue) => {
                setSelectedUser(newValue);
                setSelectedOrders([]);
                setItems([]);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Customer" required />
              )}
            />
          </Paper>

          {/* Order Selection */}
          {selectedUser && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Orders
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <CircularProgress />
              ) : availableOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No uninvoiced orders found for this customer.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {availableOrders.map((order) => (
                    <Grid item xs={12} sm={6} md={4} key={order.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: selectedOrders.find(o => o.id === order.id) ? 2 : 1,
                          borderColor: selectedOrders.find(o => o.id === order.id)
                            ? 'primary.main'
                            : 'divider',
                        }}
                        onClick={() => handleOrderSelection(order)}
                      >
                        <Typography variant="subtitle2">{order.order_no}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.design_name}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order.price ? `$${parseFloat(order.price).toFixed(2)}` : 'No price set'}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}

          {/* Invoice Details */}
          {items.length > 0 && (
            <>
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
                      onChange={(e) => setFormData({ ...formData, billing_year: parseInt(e.target.value) })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Line Items */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Line Items
                </Typography>
                <Divider sx={{ mb: 2 }} />
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 560 }}>
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
                        <TableRow key={index}>
                          <TableCell>{item.order_no}</TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
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

                {/* Totals */}
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

              {/* Actions */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="flex-end"
                spacing={2}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/invoices')}
                  disabled={loading}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </form>
    </Box>
  );
};

export default AdminInvoiceCreate;
