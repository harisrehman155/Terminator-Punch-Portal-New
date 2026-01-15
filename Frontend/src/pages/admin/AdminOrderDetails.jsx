import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  alpha,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Download, Upload, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import TypeChip from '../../components/common/TypeChip';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../utils/Constants';
import apiService, { HttpMethod } from '../../api/ApiService';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [tabValue, setTabValue] = useState(0);
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState(null);
  const [files, setFiles] = useState([]);
  const [history] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const orderStatusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
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
          setStatus(orderData?.status || '');
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.apiMessage || err?.message || 'Failed to load order');
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
          title="Order Details"
          breadcrumbs={[
            { label: 'Admin Dashboard', path: '/admin/dashboard' },
            { label: 'Orders', path: '/admin/orders' },
          ]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load order
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!order) {
    return <Typography>Order not found</Typography>;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;

    if (!token) {
      toast.error('Please log in again to update status');
      return;
    }

    if (isUpdatingStatus) {
      return;
    }

    const previousStatus = status;
    setStatus(nextStatus);
    setIsUpdatingStatus(true);

    try {
      const response = await apiService({
        method: HttpMethod.PATCH,
        endPoint: `/orders/${id}/status`,
        data: { status: nextStatus },
        token,
      });

      const isSuccess = response?.success === true || response?.status === 'success';
      if (!isSuccess) {
        throw new Error(response?.message || 'Failed to update status');
      }

      const updatedOrder = response?.data;
      setOrder((prev) => (prev ? { ...prev, ...updatedOrder } : prev));
      setStatus(updatedOrder?.status || nextStatus);
      toast.success(response?.message || 'Status updated successfully');
    } catch (err) {
      setStatus(previousStatus);
      toast.error(err?.apiMessage || err?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    if (!token) {
      toast.error('Please log in again to upload files');
      return;
    }

    setIsUploading(true);

    try {
      const uploadResults = await Promise.all(
        selectedFiles.map(async (file) => {
          const data = new FormData();
          data.append('file', file);
          const uploadResponse = await fetch(
            `${API_BASE_URL}/files/orders/${id}/upload`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: data,
            }
          );

          let errorMessage = null;
          if (!uploadResponse.ok) {
            try {
              const payload = await uploadResponse.json();
              errorMessage = payload?.message || null;
            } catch (err) {
              errorMessage = null;
            }
          }

          return {
            name: file.name,
            ok: uploadResponse.ok,
            message: errorMessage,
          };
        })
      );

      const failedUploads = uploadResults.filter((result) => !result.ok);
      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map((result) => result.name).join(', ');
        const failureMessage = failedUploads.find((result) => result.message)?.message;
        toast.error(
          failureMessage
            ? `Upload failed: ${failureMessage}`
            : `Some files failed to upload: ${failedNames}`
        );
      } else {
        toast.success('Files uploaded successfully');
      }

      const filesResponse = await apiService({
        method: HttpMethod.GET,
        endPoint: `/files/orders/${id}`,
        token,
      });
      setFiles(filesResponse?.data || []);
    } catch (err) {
      toast.error(err?.apiMessage || err?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
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

  const handleDeleteFile = async (fileId) => {
    if (!token) {
      toast.error('Please log in again to delete the file');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await apiService({
        method: HttpMethod.DELETE,
        endPoint: `/files/${fileId}`,
        token,
      });

      toast.success('File deleted successfully');
      setFiles(files.filter((file) => file.id !== fileId));
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to delete file';
      toast.error(message);
    }
  };

  // Normalize and filter files by role
  const normalizedFiles = files.map((file) => ({
    ...file,
    file_role: file.file_role ? String(file.file_role).toUpperCase() : '',
  }));

  const customerFiles = normalizedFiles.filter((file) => {
    const role = String(file.file_role || '').toUpperCase();
    return role === 'CUSTOMER_UPLOAD' || role === 'ATTACHMENT';
  });

  const adminFiles = normalizedFiles.filter((file) => {
    const role = String(file.file_role || '').toUpperCase();
    return role === 'ADMIN_RESPONSE';
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
              <TableRow key={file.id} hover>
                <TableCell>{file.original_name}</TableCell>
                <TableCell>{file.mime_type}</TableCell>
                <TableCell>
                  {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(2)} KB` : '-'}
                </TableCell>
                <TableCell>
                  {file.file_role ? file.file_role.replace('_', ' ') : '-'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(file)}
                        color="primary"
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFile(file.id)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

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
        <Typography variant="body1" fontWeight={500}>
          {value}
        </Typography>
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

  return (
    <Box>
      <PageHeader
        title={`Order ${order.order_no}`}
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Orders', path: '/admin/orders' },
          { label: order.order_no },
        ]}
      />

      <Card sx={{ mb: 3, maxWidth: 900, mx: 'auto', boxShadow: 3 }}>
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
                {order.design_name}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <StatusChip status={order.status} />
                {order.is_urgent && <Chip label="Urgent" size="small" color="warning" />}
              </Box>
            </Box>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Change Status</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                label="Change Status"
                disabled={isUpdatingStatus}
              >
                {orderStatusOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label={`Files (${customerFiles.length} customer, ${adminFiles.length} admin)`} />
              <Tab label={`History (${history.length})`} />
            </Tabs>
          </Box>

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
                  <DetailRow label="Order Type">
                    <TypeChip type={order.order_type} />
                  </DetailRow>
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

          {tabValue === 1 && (
            <DetailSection title="Files">
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Customer Files
                </Typography>
                {renderFilesTable(customerFiles)}
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Admin Response Files
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Upload />}
                    component="label"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Response File'}
                    <input type="file" hidden multiple onChange={handleFileUpload} />
                  </Button>
                </Box>
                {renderFilesTable(adminFiles)}
              </Box>
            </DetailSection>
          )}

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
    </Box>
  );
};

export default AdminOrderDetails;
