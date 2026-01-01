import { Box, Grid, Typography, alpha } from '@mui/material';
import {
  ShoppingCart,
  Description,
  People,
  HourglassEmpty,
} from '@mui/icons-material';
import StatCard from '../../components/common/StatCard';
import { dummyOrders } from '../../data/dummyOrders';
import { dummyQuotes } from '../../data/dummyQuotes';
import { dummyUsers } from '../../data/dummyUsers';

const AdminDashboard = () => {
  const orders = dummyOrders;
  const quotes = dummyQuotes;
  const users = dummyUsers;

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'PENDING').length,
    inProgressOrders: orders.filter(o => o.status === 'IN_PROGRESS').length,
    pendingQuotes: quotes.filter(q => q.status === 'PENDING').length,
    totalUsers: users.length,
  };

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
            value={stats.totalOrders}
            icon={ShoppingCart}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={HourglassEmpty}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="In Progress"
            value={stats.inProgressOrders}
            icon={HourglassEmpty}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Quotes"
            value={stats.pendingQuotes}
            icon={Description}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={People}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;

