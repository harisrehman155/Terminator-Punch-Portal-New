import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Visibility, Edit, Delete, Download } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import TypeChip from '../../components/common/TypeChip';
import { lookups } from '../../data/dummyLookups';
import apiService, { HttpMethod } from '../../api/ApiService';
import { API_BASE_URL } from '../../utils/Constants';

const OrdersList = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState([]);
  const [adminUploadMap, setAdminUploadMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      if (!token) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: '/orders',
          token,
        });

        const list = response?.data?.orders || [];
        const normalizeUrgent = (value) =>
          value === true || value === 'true' || value === 1 || value === '1';
        if (isMounted) {
          const normalized = list.map((order) => ({
            ...order,
            is_urgent: normalizeUrgent(order.is_urgent),
          }));
          setOrders(normalized);
        }

        if (list.length > 0) {
          const uploadResults = await Promise.all(
            list.map(async (order) => {
              try {
                const filesResponse = await apiService({
                  method: HttpMethod.GET,
                  endPoint: `/files/orders/${order.id}`,
                  token,
                });
                const files = filesResponse?.data || [];
                const hasAdminFiles = files.some(
                  (file) =>
                    String(file.file_role || '').toUpperCase() === 'ADMIN_RESPONSE'
                );
                return { id: order.id, hasAdminFiles };
              } catch (fileError) {
                return { id: order.id, hasAdminFiles: false };
              }
            })
          );

          if (isMounted) {
            const map = {};
            uploadResults.forEach((result) => {
              map[result.id] = result.hasAdminFiles;
            });
            setAdminUploadMap(map);
          }
        } else if (isMounted) {
          setAdminUploadMap({});
        }
      } catch (error) {
        const message = error?.apiMessage || error?.message || 'Failed to load orders';
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((order) => order.order_type === typeFilter);
    }

    if (searchText) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_no?.toLowerCase().includes(query) ||
          order.design_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, searchText, statusFilter, typeFilter]);

  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) {
      return;
    }
    if (!token) {
      toast.error('Please log in again to delete the order');
      return;
    }

    setIsDeleting(true);

    try {
      await apiService({
        method: HttpMethod.DELETE,
        endPoint: `/orders/${selectedOrder.id}`,
        token,
      });
      setOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id));
      toast.success('Order deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to delete order';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAll = async (order) => {
    if (!token) {
      toast.error('Please log in again to download files');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/files/orders/${order.id}/download-all?scope=admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message = 'Failed to download files';
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
      link.download = `${order.order_no || `order-${order.id}`}-files.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error?.message || 'Failed to download files';
      toast.error(message);
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const columns = [
    {
      field: 'order_no',
      headerName: 'Order #',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          onClick={() => navigate(`/orders/${params.row.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      field: 'order_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => <TypeChip type={params.value} />,
    },
    {
      field: 'design_name',
      headerName: 'Design',
      width: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'is_urgent',
      headerName: 'Urgent',
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Yes" size="small" color="error" />
        ) : (
          <Chip label="No" size="small" />
        ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      renderCell: (params) => {
        const value =
          params?.row?.created_at ||
          params?.row?.createdAt ||
          params?.row?.created ||
          params?.row?.created_date ||
          params?.row?.createdDate ||
          params?.row?.updated_at ||
          params?.row?.updatedAt ||
          params?.row?.updated ||
          params?.row?.updated_date ||
          params?.row?.updatedDate ||
          null;
        return formatDate(value);
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${params.row.id}`);
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${params.row.id}/edit`);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {adminUploadMap[params.row.id] && (
            <Tooltip title="Download all files">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadAll(params.row);
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(params.row);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Orders"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Orders' }]}
        action={() => navigate('/orders/new')}
        actionLabel="New Order"
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
          {lookups.order_status.map((status) => (
            <MenuItem key={status} value={status}>
              {status.replace('_', ' ')}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 150 } }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          {lookups.order_types.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 300 } }}
          size="small"
        />
      </Box>

      {isMobile ? (
        <Stack spacing={2}>
          {filteredOrders.length === 0 && !isLoading ? (
            <Typography variant="body2" color="text.secondary">
              No orders found.
            </Typography>
          ) : (
            filteredOrders.map((order) => (
              <Paper
                key={order.id}
                elevation={0}
                onClick={() => navigate(`/orders/${order.id}`)}
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
                      {order.order_no || `Order ${order.id}`}
                    </Typography>
                    <StatusChip status={order.status} />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <TypeChip type={order.order_type} />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Design
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.design_name || '-'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(
                        order.created_at ||
                          order.createdAt ||
                          order.created ||
                          order.created_date ||
                          order.createdDate ||
                          order.updated_at ||
                          order.updatedAt ||
                          order.updated ||
                          order.updated_date ||
                          order.updatedDate ||
                          null
                      )}
                    </Typography>
                  </Box>
                  {order.is_urgent && (
                    <Chip label="Urgent" size="small" color="warning" sx={{ width: 'fit-content' }} />
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}`);
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}/edit`);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {adminUploadMap[order.id] && (
                      <Tooltip title="Download all files">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAll(order);
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(order);
                        }}
                      >
                        <Delete fontSize="small" />
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
            rows={filteredOrders}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            loading={isLoading}
            onRowClick={(params) => navigate(`/orders/${params.row.id}`)}
            sx={{
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              },
            }}
          />
        </Box>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => (isDeleting ? null : setDeleteDialogOpen(false))}
      >
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
            onClick={handleDeleteConfirm}
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

export default OrdersList;
