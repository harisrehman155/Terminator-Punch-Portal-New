import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Grid, Typography, alpha, CircularProgress } from '@mui/material';
import {
  ShoppingCart,
  Description,
  People,
  HourglassEmpty,
  CheckCircle,
} from '@mui/icons-material';
import StatCard from '../../components/common/StatCard';
import apiService, { HttpMethod } from '../../api/ApiService';

const AdminDashboard = () => {
  const token = useSelector((state) => state.auth.token);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    orders: { total: 0, pending: 0, in_progress: 0, completed: 0 },
    quotes: { total: 0, pending: 0, priced: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: '/admin/stats',
          token,
        });

        const isSuccess = response?.success === true || response?.status === 'success';
        if (!isSuccess) {
          throw new Error(response?.message || 'Failed to load admin stats');
        }

        if (isMounted) {
          setStats(response.data || {});
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.apiMessage || err?.message || 'Failed to load admin stats');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (token) {
      loadStats();
    } else {
      setLoading(false);
      setError('Authentication required');
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const normalizedStats = useMemo(
    () => ({
      totalOrders: Number(stats?.orders?.total || 0),
      pendingOrders: Number(stats?.orders?.pending || 0),
      inProgressOrders: Number(stats?.orders?.in_progress || 0),
      completedOrders: Number(stats?.orders?.completed || 0),
      pendingQuotes: Number(stats?.quotes?.pending || 0),
      totalUsers: Number(stats?.users?.total || 0),
    }),
    [stats]
  );

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
        <Box
          sx={(theme) => ({
            mb: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: '1px solid',
            borderColor: 'divider',
          })}
        >
          <Typography variant="h4" component="h1" fontWeight={700} mb={0.5}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            High level overview of orders, quotes and users.
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load dashboard
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
      <Box
        sx={(theme) => ({
          mb: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: '1px solid',
          borderColor: 'divider',
        })}
      >
        <Typography variant="h4" component="h1" fontWeight={700} mb={0.5}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          High level overview of orders, quotes and users.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Orders"
            value={normalizedStats.totalOrders}
            icon={ShoppingCart}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Orders"
            value={normalizedStats.pendingOrders}
            icon={HourglassEmpty}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="In Progress"
            value={normalizedStats.inProgressOrders}
            icon={HourglassEmpty}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Completed Orders"
            value={normalizedStats.completedOrders}
            icon={CheckCircle}
            color="#36e27b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Quotes"
            value={normalizedStats.pendingQuotes}
            icon={Description}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={normalizedStats.totalUsers}
            icon={People}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
