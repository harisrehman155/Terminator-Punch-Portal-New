import { Box, Switch } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PageHeader from '../../components/common/PageHeader';
import { dummyUsers } from '../../data/dummyUsers';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const handleToggleActive = (userId, isActive) => {
    toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 200,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value === 1}
          onChange={(e) => handleToggleActive(params.row.id, e.target.checked)}
          color="primary"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Users' },
        ]}
      />

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={dummyUsers}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
};

export default AdminUsers;

