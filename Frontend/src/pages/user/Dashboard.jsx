import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Description,
  CheckCircle,
  HourglassEmpty,
} from '@mui/icons-material';
import StatCard from '../../components/common/StatCard';
import StatusChip from '../../components/common/StatusChip';
import PageHeader from '../../components/common/PageHeader';
import { fetchDashboardData } from '../../redux/actions/PortalAction';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { userOrders, userQuotes, dashboardLoading, dashboardError } = useSelector((state) => state.home);

  // Fetch dashboard data on component mount
  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Calculate stats from real data
  const stats = {
    totalOrders: userOrders.length,
    pending: userOrders.filter(o => o.status === 'PENDING').length,
    inProgress: userOrders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: userOrders.filter(o => o.status === 'COMPLETED').length,
  };

  const recentOrders = userOrders.slice(0, 5);
  const recentQuotes = userQuotes.slice(0, 5);

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
          title="Dashboard"
          breadcrumbs={[{ label: 'Dashboard' }]}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Failed to load dashboard
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {dashboardError}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <Box>
      {/* Page header + subtle background band */}
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
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of your latest orders and quotes.
        </Typography>
      </Box>

      {/* Stats row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={HourglassEmpty}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={HourglassEmpty}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="#36e27b"
          />
        </Grid>
      </Grid>

      {/* Recent activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            })}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Recent Orders
            </Typography>
            <TableContainer component={Box} sx={{ borderRadius: 1, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Design</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>{order.order_no}</TableCell>
                      <TableCell>{order.design_name}</TableCell>
                      <TableCell>
                        <StatusChip status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            })}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Recent Quotes
            </Typography>
            <TableContainer component={Box} sx={{ borderRadius: 1, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Quote #</TableCell>
                    <TableCell>Design</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentQuotes.map((quote) => (
                    <TableRow key={quote.id} hover>
                      <TableCell>{quote.quote_no}</TableCell>
                      <TableCell>{quote.design_name}</TableCell>
                      <TableCell>
                        <StatusChip status={quote.status} type="quote" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

