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
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  ShoppingCart,
  Download,
  Person,
  AdminPanelSettings,
  AttachMoney,
  History,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import apiService, { HttpMethod } from '../../api/ApiService';
import { API_BASE_URL } from '../../utils/Constants';

const QuoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [quote, setQuote] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchQuote = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

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
        }
      } catch (error) {
        const message = error?.apiMessage || error?.message || 'Failed to load quote';
        toast.error(message);
        if (isMounted) {
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
    return <Typography>Loading quote...</Typography>;
  }

  if (!quote) {
    return <Typography>Quote not found</Typography>;
  }

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
      navigate(orderId ? `/orders/${orderId}` : '/orders');
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to convert quote';
      toast.error(message);
    } finally {
      setIsConverting(false);
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
      navigate('/quotes');
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to delete quote';
      toast.error(message);
    } finally {
      setIsDeleting(false);
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
        } catch (error) {
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
    } catch (error) {
      const message = error?.message || 'Failed to download file';
      toast.error(message);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Section wrapper component
  const DetailSection = ({ title, icon, children, color = 'primary' }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.03),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[color].main, 0.2),
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={600} color={`${color}.main`}>
          {title}
        </Typography>
      </Box>
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

  const canTakeAction = quote.status === 'PRICED';
  const isPending = quote.status === 'PENDING';
  const isRevisionRequested = quote.status === 'REVISION_REQUESTED';
  const isConverted = quote.status === 'CONVERTED';
  const isRejected = quote.status === 'REJECTED';

  const placements = quote.placement || [];
  const formats = quote.required_format || [];
  const sizeLabel =
    quote.width && quote.height
      ? `${quote.width} x ${quote.height} ${quote.unit || ''}`.trim()
      : '-';
  const createdValue =
    quote.created_at ||
    quote.createdAt ||
    quote.created ||
    quote.created_date ||
    quote.createdDate ||
    quote.updated_at ||
    quote.updatedAt ||
    quote.updated ||
    quote.updated_date ||
    quote.updatedDate ||
    null;
  const updatedValue =
    quote.updated_at ||
    quote.updatedAt ||
    quote.updated ||
    quote.updated_date ||
    quote.updatedDate ||
    null;
  const pricingRemarks =
    quote.remarks ||
    quote.pricing_history?.[0]?.admin_notes ||
    '';

  return (
    <Box>
      <PageHeader
        title={`Quote ${quote.quote_no}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Quotes', path: '/quotes' },
          { label: quote.quote_no },
        ]}
      />

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Main Quote Card */}
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Header */}
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
                  {quote.is_urgent && (
                    <Chip label="Urgent" size="small" color="warning" />
                  )}
                </Box>
              </Box>
              {!isConverted && !isRejected && (
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => navigate(`/quotes/${id}/edit`)}
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
              )}
            </Box>

            {/* Quote Details */}
            <DetailSection title="Quote Details" icon={null}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <DetailRow label="Quote Type" value={quote.service_type || quote.quote_type} />
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

          <DetailSection title={`Files (${files.length})`} icon={null}>
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

          {/* Current Pricing - Only show if priced */}
          {quote.price && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) =>
                    alpha(
                      canTakeAction
                        ? theme.palette.success.main
                        : theme.palette.grey[500],
                      0.08
                    ),
                  border: '2px solid',
                  borderColor: canTakeAction ? 'success.main' : 'grey.400',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney color={canTakeAction ? 'success' : 'action'} />
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color={canTakeAction ? 'success.main' : 'text.secondary'}
                  >
                    Current Pricing
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={canTakeAction ? 'success.main' : 'text.primary'}
                  mb={1}
                >
                  {quote.currency || 'USD'} {Number(quote.price).toFixed(2)}
                </Typography>
                {pricingRemarks && (
                  <Typography variant="body2" color="text.secondary">
                    {pricingRemarks}
                  </Typography>
                )}

                {/* Action Buttons - Only show when PRICED */}
                  {canTakeAction && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ShoppingCart />}
                        onClick={() => setConvertDialogOpen(true)}
                      >
                        Accept & Convert to Order
                      </Button>
                    </Box>
                  )}
              </Paper>
            )}

            {/* Status Messages */}
            {isPending && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  border: '1px solid',
                  borderColor: 'warning.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="warning.dark" fontWeight={500}>
                  ⏳ Your quote is pending review. You will be notified once pricing is
                  available.
                </Typography>
              </Paper>
            )}

            {isRevisionRequested && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  border: '1px solid',
                  borderColor: 'info.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="info.dark" fontWeight={500}>
                  🔄 You have requested a revision. Please wait for admin response with
                  updated pricing.
                </Typography>
              </Paper>
            )}

            {isConverted && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="success.dark" fontWeight={500}>
                  ✅ This quote has been converted to Order #{quote.converted_order_id}
                </Typography>
                <Button
                  variant="text"
                  color="success"
                  sx={{ mt: 1 }}
                  onClick={() => navigate(`/orders/${quote.converted_order_id}`)}
                >
                  View Order →
                </Button>
              </Paper>
            )}

            {isRejected && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="error.dark" fontWeight={500}>
                  ❌ This quote has been rejected.
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Created
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDateTime(createdValue)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDateTime(updatedValue)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Conversation / Remarks History */}
        {quote.remarks_history?.length > 0 && (
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <History color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Conversation History
                </Typography>
              </Box>

              <Stack spacing={2}>
                {quote.remarks_history.map((remark, index) => (
                  <Paper
                    key={remark.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor:
                        remark.type === 'admin'
                          ? (theme) => alpha(theme.palette.primary.main, 0.05)
                          : (theme) => alpha(theme.palette.grey[500], 0.05),
                      borderRadius: 2,
                      borderLeft: '4px solid',
                      borderLeftColor:
                        remark.type === 'admin' ? 'primary.main' : 'grey.400',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor:
                            remark.type === 'admin' ? 'primary.main' : 'grey.500',
                        }}
                      >
                        {remark.type === 'admin' ? (
                          <AdminPanelSettings sx={{ fontSize: 16 }} />
                        ) : (
                          <Person sx={{ fontSize: 16 }} />
                        )}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {remark.created_by}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {formatDateTime(remark.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ ml: 4.5 }}>
                      {remark.message}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Pricing History */}
        {quote.pricing_history?.length > 1 && (
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AttachMoney color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Pricing History
                </Typography>
              </Box>

              <Stack spacing={2}>
                {quote.pricing_history.map((price, index) => (
                  <Box
                    key={price.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: index === 0 ? 'success.50' : 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: index === 0 ? 'success.200' : 'grey.200',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color={index === 0 ? 'success.main' : 'text.secondary'}
                        sx={{
                          textDecoration: index !== 0 ? 'line-through' : 'none',
                        }}
                      >
                        {price.currency} {price.price.toFixed(2)}
                        {index === 0 && (
                          <Chip
                            label="Current"
                            size="small"
                            color="success"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {price.admin_notes}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(price.created_at)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Convert to Order Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Convert Quote to Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to accept the quoted price of{' '}
            <strong>
              {quote.currency || 'USD'} {Number(quote.price || 0).toFixed(2)}
            </strong>{' '}
            and convert this quote to an order.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Do you want to proceed?
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

      {/* Delete Dialog */}
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
          <Button
            onClick={handleDelete}
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

export default QuoteDetails;
