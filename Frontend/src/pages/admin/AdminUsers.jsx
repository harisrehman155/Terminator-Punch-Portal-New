import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Switch, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';
import apiService, { HttpMethod } from '../../api/ApiService';

const AdminUsers = () => {
  const token = useSelector((state) => state.auth.token);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      if (!token) {
        if (isMounted) {
          setError('Authentication required');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: '/admin/users',
          token,
        });

        const isSuccess = response?.success === true || response?.status === 'success';
        if (!isSuccess) {
          throw new Error(response?.message || 'Failed to load users');
        }

        if (isMounted) {
          setUsers(response?.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.apiMessage || err?.message || 'Failed to load users');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleToggleActive = async (userId) => {
    if (!token) {
      toast.error('Please log in again to update user status');
      return;
    }

    if (updatingId) {
      return;
    }

    setUpdatingId(userId);

    try {
      const response = await apiService({
        method: HttpMethod.PATCH,
        endPoint: `/admin/users/${userId}/toggle-status`,
        token,
      });

      const isSuccess = response?.success === true || response?.status === 'success';
      if (!isSuccess) {
        throw new Error(response?.message || 'Failed to update user status');
      }

      const updatedUser = response?.data;
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...updatedUser } : user
        )
      );
      toast.success(
        `User ${updatedUser?.is_active ? 'activated' : 'deactivated'} successfully`
      );
    } catch (err) {
      toast.error(err?.apiMessage || err?.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
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
      renderCell: (params) => (params?.row?.company ? params.row.company : '-'),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (params?.row?.role ? params.row.role : '-'),
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={Boolean(params.value)}
          onChange={() => handleToggleActive(params.row.id)}
          color="primary"
          disabled={updatingId === params.row.id}
        />
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
  ];

  if (loading) {
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
          title="Users"
          breadcrumbs={[
            { label: 'Admin Dashboard', path: '/admin/dashboard' },
            { label: 'Users' },
          ]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load users
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

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
          rows={users}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
};

export default AdminUsers;
