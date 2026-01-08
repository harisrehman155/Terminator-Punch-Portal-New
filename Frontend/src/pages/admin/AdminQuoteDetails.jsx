import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  alpha,
  Stack,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Edit, Delete, Download, AttachMoney, ShoppingCart } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { toast } from 'react-toastify';
import apiService, { HttpMethod } from '../../api/ApiService';
import { API_BASE_URL } from '../../utils/Constants';

const DetailSection = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      mb: 3,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const DetailRow = ({ label, value, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
      {label}
    </Typography>
    {value !== undefined && value !== null && value !== '' && (
      <Typography variant="body1" fontWeight={500}>
        {value}
      </Typography>
    )}
    {children}
  </Box>
);

const AdminQuoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [quote, setQuote] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPricing, setIsPricing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);

  const [pricing, setPricing] = useState({
    price: '',
    currency: 'USD',
    remarks: '',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchQuote = async () => {
      if (!token) {
        if (isMounted) {
          setError('Authentication required');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: `/quotes/${id}`,
          token,
        });
        const quoteData = response?.data || null;

        const filesResponse = await apiService({
          method: HttpMethod.GET,
          endPoint: `/files/quotes/${id}`,
          token,
        });

        if (isMounted) {
          setQuote(quoteData);
          setFiles(filesResponse?.data || []);
          setPricing({
            price: quoteData?.price ?? '',
            currency: quoteData?.currency || 'USD',
            remarks: quoteData?.remarks || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.apiMessage || err?.message || 'Failed to load quote');
          setQuote(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader
          title="Quote Details"
          breadcrumbs={[
            { label: 'Admin Dashboard', path: '/admin/dashboard' },
            { label: 'Quotes', path: '/admin/quotes' },
          ]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load quote
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!quote) {
    return <Typography>Quote not found</Typography>;
  }

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricing((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePricingSubmit = async () => {
    if (!token) {
      toast.error('Please log in again to update pricing');
      return;
    }

    if (!pricing.price) {
      toast.error('Please enter a price');
      return;
    }

    setIsPricing(true);

    try {
      const response = await apiService({
        method: HttpMethod.PATCH,
        endPoint: `/quotes/${id}/pricing`,
        data: {
          price: parseFloat(pricing.price),
          currency: pricing.currency || 'USD',
          remarks: pricing.remarks || null,
        },
        token,
      });

      const isSuccess = response?.success === true || response?.status === 'success';
      if (!isSuccess) {
        throw new Error(response?.message || 'Failed to update pricing');
      }

      const updatedQuote = response?.data;
      setQuote(updatedQuote);
      setPricing({
        price: updatedQuote?.price ?? '',
        currency: updatedQuote?.currency || 'USD',
        remarks: updatedQuote?.remarks || '',
      });
      toast.success(response?.message || 'Pricing updated successfully');
    } catch (err) {
      toast.error(err?.apiMessage || err?.message || 'Failed to update pricing');
    } finally {
      setIsPricing(false);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      toast.error('Please log in again to delete the quote');
      return;
    }

    setIsDeleting(true);

    try {
      await apiService({
        method: HttpMethod.DELETE,
        endPoint: `/quotes/${id}`,
        token,
      });
      toast.success('Quote deleted successfully');
      setDeleteDialogOpen(false);
      navigate('/admin/quotes');
    } catch (err) {
      toast.error(err?.apiMessage || err?.message || 'Failed to delete quote');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!token) {
      toast.error('Please log in again to convert the quote');
      return;
    }

    setIsConverting(true);

    try {
      const response = await apiService({
        method: HttpMethod.POST,
        endPoint: `/quotes/${id}/convert`,
        token,
      });

      const orderId = response?.data?.order?.id;
      toast.success(response?.message || 'Quote converted to order successfully');
      setConvertDialogOpen(false);
      navigate(orderId ? `/admin/orders/${orderId}` : '/admin/orders');
    } catch (err) {
      toast.error(err?.apiMessage || err?.message || 'Failed to convert quote');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async (file) => {
    if (!token) {
      toast.error('Please log in again to download the file');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/files/${file.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = 'Failed to download file';
        try {
          const payload = await response.json();
          message = payload?.message || message;
        } catch (err) {
          // Ignore JSON parse errors for non-JSON responses.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.message || 'Failed to download file');
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const isPending = quote.status === 'PENDING';
  const isPriced = quote.status === 'PRICED';
  const isConverted = quote.status === 'CONVERTED';
  const isRejected = quote.status === 'REJECTED';

  const placements = quote.placement || [];
  const formats = quote.required_format || [];
  const sizeLabel =
    quote.width && quote.height
      ? `${quote.width} x ${quote.height} ${quote.unit || ''}`.trim()
      : '-';

  return (
    <Box>
      <PageHeader
        title={`Quote ${quote.quote_no}`}
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Quotes', path: '/admin/quotes' },
          { label: quote.quote_no },
        ]}
      />

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
                pb: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={600} mb={1}>
                  {quote.design_name}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <StatusChip status={quote.status} type="quote" />
                  {quote.is_urgent ? <Chip label="Urgent" size="small" color="warning" /> : null}
                </Box>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => navigate(`/admin/quotes/${id}/edit`)}
                  disabled={!isPending}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </Box>
            </Box>

            <DetailSection title="Quote Details">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <DetailRow label="Quote Type" value={quote.service_type} />
                <DetailRow label="Size" value={sizeLabel} />
                {quote.number_of_colors && (
                  <DetailRow label="Number of Colors" value={quote.number_of_colors} />
                )}
                {quote.fabric && <DetailRow label="Fabric" value={quote.fabric} />}
                {quote.color_type && <DetailRow label="Color Type" value={quote.color_type} />}
                <DetailRow label="Placement">
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {placements.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Not specified
                      </Typography>
                    ) : (
                      placements.map((place) => (
                        <Chip key={place} label={place} size="small" />
                      ))
                    )}
                  </Box>
                </DetailRow>
                <DetailRow label="Required Format">
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {formats.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Not specified
                      </Typography>
                    ) : (
                      formats.map((format) => (
                        <Chip key={format} label={format} size="small" />
                      ))
                    )}
                  </Box>
                </DetailRow>
              </Box>
              {quote.instruction && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Instructions
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {quote.instruction}
                  </Typography>
                </Box>
              )}
            </DetailSection>

            <DetailSection title={`Files (${files.length})`}>
              {files.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No files uploaded yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>{file.original_name}</TableCell>
                          <TableCell>{file.mime_type}</TableCell>
                          <TableCell>
                            {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(2)} KB` : '-'}
                          </TableCell>
                          <TableCell>
                            {file.file_role ? file.file_role.replace('_', ' ') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Download />}
                              variant="outlined"
                              onClick={() => handleDownload(file)}
                            >
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DetailSection>

            {isPending && (
              <DetailSection title="Set Pricing">
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Price"
                      name="price"
                      type="number"
                      value={pricing.price}
                      onChange={handlePricingChange}
                      inputProps={{ min: '0', step: '0.01' }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        name="currency"
                        value={pricing.currency}
                        onChange={handlePricingChange}
                        label="Currency"
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <TextField
                    fullWidth
                    label="Message to Customer"
                    name="remarks"
                    value={pricing.remarks}
                    onChange={handlePricingChange}
                    multiline
                    rows={4}
                    placeholder="Add a note or instructions for the customer..."
                  />
                  <Button
                    variant="contained"
                    startIcon={<AttachMoney />}
                    onClick={handlePricingSubmit}
                    disabled={isPricing}
                  >
                    {isPricing ? 'Updating...' : 'Send Pricing'}
                  </Button>
                </Stack>
              </DetailSection>
            )}

            {quote.price && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                  border: '2px solid',
                  borderColor: 'success.main',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <AttachMoney color="success" />
                  <Typography variant="subtitle1" fontWeight={600} color="success.main">
                    Current Pricing
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="success.main" mb={1}>
                  {quote.currency || 'USD'} {Number(quote.price).toFixed(2)}
                </Typography>
                {quote.remarks && (
                  <Typography variant="body2" color="text.secondary">
                    {quote.remarks}
                  </Typography>
                )}
                {isPriced && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ShoppingCart />}
                      onClick={() => setConvertDialogOpen(true)}
                    >
                      Convert to Order
                    </Button>
                  </Box>
                )}
              </Paper>
            )}

            {isConverted && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="success.dark" fontWeight={500}>
                  Converted to Order #{quote.converted_order_id}
                </Typography>
                <Button
                  variant="text"
                  color="success"
                  sx={{ mt: 1 }}
                  onClick={() => navigate(`/admin/orders/${quote.converted_order_id}`)}
                >
                  View Order
                </Button>
              </Paper>
            )}

            {isRejected && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="error.dark" fontWeight={500}>
                  Quote rejected by customer.
                </Typography>
              </Paper>
            )}

            <DetailSection title="Dates">
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Created
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(quote.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(quote.updated_at)}
                  </Typography>
                </Box>
              </Stack>
            </DetailSection>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Convert Quote to Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to convert this quote to an order.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConvertToOrder}
            variant="contained"
            color="success"
            startIcon={<ShoppingCart />}
            disabled={isConverting}
          >
            {isConverting ? 'Converting...' : 'Convert to Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQuoteDetails;
