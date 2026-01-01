import { useParams, useNavigate } from 'react-router-dom';
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
import { dummyOrders } from '../../data/dummyOrders';
import { dummyOrderFiles } from '../../data/dummyOrderFiles';
import { dummyOrderHistory } from '../../data/dummyOrderHistory';
import { useState } from 'react';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const order = dummyOrders.find((o) => o.id === parseInt(id));
  const files = dummyOrderFiles.filter((f) => f.entity_id === parseInt(id));
  const history = dummyOrderHistory.filter((h) => h.order_id === parseInt(id));

  if (!order) {
    return <Typography>Order not found</Typography>;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDelete = () => {
    toast.success('Order deleted successfully');
    setDeleteDialogOpen(false);
    navigate('/orders');
  };

  const handleCancel = () => {
    toast.success('Order cancelled successfully');
    setCancelDialogOpen(false);
    navigate('/orders');
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
      {value && <Typography variant="body1" fontWeight={500}>{value}</Typography>}
      {children}
    </Box>
  );

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
                {order.is_urgent && <Chip label="Urgent" size="small" color="warning" />}
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
                  <DetailRow label="Size" value={`${order.width} x ${order.height} ${order.unit}`} />
                  {order.number_of_colors && (
                    <DetailRow label="Number of Colors" value={order.number_of_colors} />
                  )}
                  {order.fabric && <DetailRow label="Fabric" value={order.fabric} />}
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
                      {order.placement.map((place) => (
                        <Chip key={place} label={place} size="small" />
                      ))}
                    </Box>
                  </DetailRow>
                  <DetailRow label="Required Format">
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      {order.required_format.map((format) => (
                        <Chip key={format} label={format} size="small" />
                      ))}
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
                          <TableCell>{(file.size_bytes / 1024).toFixed(2)} KB</TableCell>
                          <TableCell>{file.file_role.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Download />}
                              variant="outlined"
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
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
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
          <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
          <Button onClick={handleCancel} color="warning" variant="contained">
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetails;
