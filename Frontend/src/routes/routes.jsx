import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ResetPassword from '../pages/auth/ResetPassword';

// User Pages
import Dashboard from '../pages/user/Dashboard';
import OrdersList from '../pages/user/OrdersList';
import OrderCreate from '../pages/user/OrderCreate';
import OrderDetails from '../pages/user/OrderDetails';
import OrderEdit from '../pages/user/OrderEdit';
import QuotesList from '../pages/user/QuotesList';
import QuoteCreate from '../pages/user/QuoteCreate';
import QuoteDetails from '../pages/user/QuoteDetails';
import QuoteEdit from '../pages/user/QuoteEdit';
import Profile from '../pages/user/Profile';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminOrderDetails from '../pages/admin/AdminOrderDetails';
import AdminQuotes from '../pages/admin/AdminQuotes';
import AdminQuoteDetails from '../pages/admin/AdminQuoteDetails';
import AdminQuoteEdit from '../pages/admin/AdminQuoteEdit';
import AdminUsers from '../pages/admin/AdminUsers';

// Protected Route Component
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role-based Route Component
const RequireRole = ({ children, allowedRoles }) => {
  const role = localStorage.getItem('role');
  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* User Routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/orders"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <OrdersList />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/orders/new"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <OrderCreate />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <OrderDetails />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/orders/:id/edit"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <OrderEdit />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/quotes"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <QuotesList />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/quotes/new"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <QuoteCreate />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/quotes/:id"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <QuoteDetails />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/quotes/:id/edit"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER']}>
              <AppLayout>
                <QuoteEdit />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['USER', 'ADMIN']}>
              <AppLayout>
                <Profile />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminOrders />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminOrderDetails />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/quotes"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminQuotes />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/quotes/:id"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminQuoteDetails />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/quotes/:id/edit"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminQuoteEdit />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminUsers />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

