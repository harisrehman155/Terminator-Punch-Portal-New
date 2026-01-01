import { useState } from 'react';
import { Box, TextField, MenuItem, Chip, IconButton, Tooltip, Badge } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Visibility, Warning } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { dummyQuotes } from '../../data/dummyQuotes';
import { lookups } from '../../data/dummyLookups';

const AdminQuotes = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('needs_action');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Count quotes needing action
  const needsActionCount = dummyQuotes.filter(
    (q) => q.status === 'PENDING' || q.status === 'REVISION_REQUESTED'
  ).length;

  let filteredQuotes = dummyQuotes;

  if (statusFilter === 'needs_action') {
    filteredQuotes = filteredQuotes.filter(
      (q) => q.status === 'PENDING' || q.status === 'REVISION_REQUESTED'
    );
  } else if (statusFilter !== 'all') {
    filteredQuotes = filteredQuotes.filter(q => q.status === statusFilter);
  }

  if (typeFilter !== 'all') {
    filteredQuotes = filteredQuotes.filter(q => q.quote_type === typeFilter);
  }

  if (searchText) {
    filteredQuotes = filteredQuotes.filter(
      q =>
        q.quote_no.toLowerCase().includes(searchText.toLowerCase()) ||
        q.design_name.toLowerCase().includes(searchText.toLowerCase())
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
      field: 'quote_type',
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
      field: 'current_price',
      headerName: 'Price',
      width: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip
            label={`${params.row.currency} ${params.value}`}
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
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
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
        title="Quotes"
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
          sx={{ minWidth: 180 }}
          size="small"
        >
          <MenuItem value="needs_action">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Needs Action
              {needsActionCount > 0 && (
                <Chip label={needsActionCount} size="small" color="warning" />
              )}
            </Box>
          </MenuItem>
          <MenuItem value="all">All</MenuItem>
          {lookups.quote_status.map((status) => (
            <MenuItem key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </MenuItem>
          ))}
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

