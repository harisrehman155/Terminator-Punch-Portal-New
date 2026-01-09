import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, TextField, MenuItem, Chip, IconButton, Tooltip, Badge, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Visibility, Warning } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { fetchAdminQuotes } from '../../redux/actions/PortalAction';

const AdminQuotes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminQuotes, dashboardLoading, dashboardError } = useSelector((state) => state.home);

  const [statusFilter, setStatusFilter] = useState('needs_action');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Fetch admin quotes on component mount
  useEffect(() => {
    dispatch(fetchAdminQuotes());
  }, [dispatch]);

  // Count quotes needing action
  const needsActionCount = adminQuotes?.filter(
    (q) => q.status === 'PENDING' || q.status === 'REVISION_REQUESTED'
  ).length || 0;

  let filteredQuotes = adminQuotes || [];

  if (statusFilter === 'needs_action') {
    filteredQuotes = filteredQuotes.filter(
      (q) => q.status === 'PENDING' || q.status === 'REVISION_REQUESTED'
    );
  } else if (statusFilter !== 'all') {
    filteredQuotes = filteredQuotes.filter(q => q.status === statusFilter);
  }

  if (typeFilter !== 'all') {
    filteredQuotes = filteredQuotes.filter(q => q.service_type === typeFilter);
  }

  if (searchText) {
    filteredQuotes = filteredQuotes.filter(
      q =>
        q.quote_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        q.design_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        q.user?.name?.toLowerCase().includes(searchText.toLowerCase())
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
          title="Quotes Management"
          breadcrumbs={[{ label: 'Admin Dashboard', path: '/admin/dashboard' }, { label: 'Quotes' }]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load quotes
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {dashboardError}
          </Typography>
        </Box>
      </>
    );
  }

  const columns = [
    {
      field: 'quote_no',
      headerName: 'Quote #',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          onClick={() => navigate(`/admin/quotes/${params.row.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      ),
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
          <Typography variant="caption" color="text.secondary">
            {params.value?.email || ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'service_type',
      headerName: 'Type',
      width: 120,
    },
    {
      field: 'design_name',
      headerName: 'Design',
      width: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusChip status={params.value} type="quote" />
          {(params.value === 'PENDING' || params.value === 'REVISION_REQUESTED') && (
            <Warning fontSize="small" color="warning" />
          )}
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip
            label={`${params.row.currency || 'USD'} ${params.value}`}
            size="small"
            color="success"
          />
        ) : (
          <Chip label="Not Set" size="small" variant="outlined" />
        ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
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
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="View">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/quotes/${params.row.id}`);
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Quotes
            {needsActionCount > 0 && (
              <Badge
                badgeContent={needsActionCount}
                color="warning"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '18px',
                    minWidth: '18px',
                  },
                }}
              />
            )}
          </Box>
        }
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Quotes' },
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
          <MenuItem value="needs_action">
            Needs Action ({needsActionCount})
          </MenuItem>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="PRICED">Priced</MenuItem>
          <MenuItem value="CONVERTED">Converted</MenuItem>
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
          rows={filteredQuotes}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          onRowClick={(params) => navigate(`/admin/quotes/${params.row.id}`)}
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

export default AdminQuotes;

