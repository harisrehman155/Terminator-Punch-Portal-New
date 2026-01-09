import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  alpha,
  Stack,
} from '@mui/material';
import { Download, Edit, Delete, Cancel } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { toast } from 'react-toastify';
import apiService, { HttpMethod } from '../../api/ApiService';
import { API_BASE_URL } from '../../utils/Constants';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [files, setFiles] = useState([]);
  const [history] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: `/orders/${id}`,
          token,
        });
        const orderData = response?.data || null;

        const filesResponse = await apiService({
          method: HttpMethod.GET,
          endPoint: `/files/orders/${id}`,
          token,
        });

        if (isMounted) {
          setOrder(orderData);
          setFiles(filesResponse?.data || []);
        }
      } catch (error) {
        const message = error?.apiMessage || error?.message || 'Failed to load order';
        toast.error(message);
        if (isMounted) {
          setOrder(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  if (isLoading) {
    return <Typography>Loading order...</Typography>;
  }

  if (!order) {
    return <Typography>Order not found</Typography>;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    if (!token) {
      toast.error('Please log in again to delete the order');
      return;
    }

    setIsDeleting(true);

    try {
      await apiService({
        method: HttpMethod.DELETE,
        endPoint: `/orders/${id}`,
        token,
      });
      toast.success('Order deleted successfully');
      setDeleteDialogOpen(false);
      navigate('/orders');
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to delete order';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = async () => {
    if (!token) {
      toast.error('Please log in again to cancel the order');
      return;
    }

    setIsCancelling(true);

    try {
      await apiService({
        method: HttpMethod.POST,
        endPoint: `/orders/${id}/cancel`,
        token,
      });
      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      navigate('/orders');
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to cancel order';
      toast.error(message);
    } finally {
      setIsCancelling(false);
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

  // Section wrapper component for consistent styling
  const DetailSection = ({ title, children }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        color="primary"
        sx={{ mb: 2.5 }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );

  const DetailRow = ({ label, value, children }) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {value !== undefined && value !== null && value !== '' && (
        <Typography variant="body1" fontWeight={500}>{value}</Typography>
      )}
      {children}
    </Box>
  );

  const placements = order.placement || [];
  const formats = order.required_format || [];
  const sizeLabel =
    order.width && order.height
      ? `${order.width} x ${order.height} ${order.unit || ''}`.trim()
      : '-';
  const normalizedFiles = files.map((file) => ({
    ...file,
    file_role: file.file_role ? String(file.file_role).toUpperCase() : '',
  }));
  const customerFiles = normalizedFiles.filter((file) => {
    if (file.file_role === 'CUSTOMER_UPLOAD' || file.file_role === 'ATTACHMENT') {
      return true;
    }
    if (file.file_role === 'ADMIN_RESPONSE') {
      return false;
    }
    if (user?.id && file.uploaded_by) {
      return file.uploaded_by === user.id;
    }
    return false;
  });
  const adminFiles = normalizedFiles.filter((file) => {
    if (file.file_role === 'ADMIN_RESPONSE') {
      return true;
    }
    if (file.file_role === 'CUSTOMER_UPLOAD' || file.file_role === 'ATTACHMENT') {
      return false;
    }
    if (user?.id && file.uploaded_by) {
      return file.uploaded_by !== user.id;
    }
    return false;
  });

  const renderFilesTable = (list) => {
    if (list.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No files uploaded yet.
        </Typography>
      );
    }
    return (
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
            {list.map((file) => (
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
    );
  };

  return (
    <Box>
      <PageHeader
        title={`Order ${order.order_no}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Orders', path: '/orders' },
          { label: order.order_no },
        ]}
      />

      <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {/* Header Section */}
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
                {order.design_name}
              </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <StatusChip status={order.status} />
              {order.is_urgent ? <Chip label="Urgent" size="small" color="warning" /> : null}
            </Box>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate(`/orders/${id}/edit`)}
              >
                Edit
              </Button>
              {order.status !== 'CANCELLED' && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Cancel />}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label={`Files (${files.length})`} />
              <Tab label={`History (${history.length})`} />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          {tabValue === 0 && (
            <>
            <DetailSection title="Basic Information">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <DetailRow label="Order Type" value={order.order_type} />
                <DetailRow label="Size" value={sizeLabel} />
                {order.number_of_colors && (
                  <DetailRow label="Number of Colors" value={order.number_of_colors} />
                )}
                {order.fabric && <DetailRow label="Fabric" value={order.fabric} />}
                {order.color_type && <DetailRow label="Color Type" value={order.color_type} />}
              </Box>
            </DetailSection>

              <DetailSection title="Placement & Format">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3,
                  }}
                >
                  <DetailRow label="Placement">
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
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
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
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
              </DetailSection>

              {order.instruction && (
                <DetailSection title="Instructions">
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {order.instruction}
                  </Typography>
                </DetailSection>
              )}
            </>
          )}

          {/* Files Tab */}
          {tabValue === 1 && (
            <DetailSection title="Files">
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Your Uploads
                </Typography>
                {renderFilesTable(customerFiles)}
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Admin Responses
                </Typography>
                {renderFilesTable(adminFiles)}
              </Box>
            </DetailSection>
          )}

          {/* History Tab */}
          {tabValue === 2 && (
            <DetailSection title="Order History">
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No history available.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {history.map((item) => (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" mb={0.5}>
                        {new Date(item.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} mb={0.5}>
                        {item.from_status} → {item.to_status}
                      </Typography>
                      {item.note && (
                        <Typography variant="body2" color="text.secondary">
                          {item.note}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </DetailSection>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be undone.
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

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? The status will be changed to CANCELLED.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>
            No
          </Button>
          <Button
            onClick={handleCancel}
            color="warning"
            variant="contained"
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetails;
