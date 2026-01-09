import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, TextField, MenuItem, Chip, IconButton, Tooltip, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Visibility, Download } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { fetchAdminOrders } from '../../redux/actions/PortalAction';
import { API_BASE_URL } from '../../utils/Constants';

const AdminOrders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminOrders, dashboardLoading, dashboardError } = useSelector((state) => state.home);
  const token = useSelector((state) => state.auth.token);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Fetch admin orders on component mount
  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  // Apply client-side filtering
  let filteredOrders = adminOrders || [];

  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
  }

  if (typeFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.order_type === typeFilter);
  }

  if (searchText) {
    filteredOrders = filteredOrders.filter(
      o =>
        o.order_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.design_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // Show loading state
  if (dashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (dashboardError) {
    return (
      <>
        <PageHeader
          title="Orders Management"
          breadcrumbs={[{ label: 'Admin Dashboard', path: '/admin/dashboard' }, { label: 'Orders' }]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load orders
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {dashboardError}
          </Typography>
        </Box>
      </>
    );
  }

  const handleDownloadAll = async (order) => {
    if (!order) {
      return;
    }

    try {
      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/files/orders/${order.id}/download-all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
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
      // Silent failure; dashboard errors are handled elsewhere.
    }
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
          onClick={() => navigate(`/admin/orders/${params.row.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      field: 'order_type',
      headerName: 'Type',
      width: 120,
    },
    {
      field: 'user',
      headerName: 'Customer',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.value?.name || 'N/A'}
          </Typography>
        </Box>
      ),
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
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/orders/${params.row.id}`);
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
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
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Orders"
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Orders' },
        ]}
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </TextField>

        <TextField
          select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="DIGITIZING">Digitizing</MenuItem>
          <MenuItem value="VECTOR">Vector</MenuItem>
          <MenuItem value="PATCHES">Patches</MenuItem>
        </TextField>

        <TextField
          label="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 300 }}
          size="small"
        />
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          onRowClick={(params) => navigate(`/admin/orders/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminOrders;

