import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { loginUser } from '../../redux/actions/AuthAction';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle redirection when auth state changes
  useEffect(() => {
    if (shouldRedirect && isAuthenticated && user) {
      console.log('Redirecting after auth state update, user role:', user.role);
      const redirectPath = user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      navigate(redirectPath, { replace: true });
      setShouldRedirect(false);
    }
  }, [shouldRedirect, isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await dispatch(loginUser(formData.email, formData.password));

    if (result.success) {
      console.log('Login successful, result:', result);
      console.log('User data:', result.data.user);
      toast.success('Login successful');

      // Redirect immediately based on user role from API response
      const userRole = result.data.user.role;
      console.log('User role:', userRole);
      const redirectPath = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    } else {
      console.log('Login failed, result:', result);
      if (result.errors) {
        setFormErrors(result.errors);
      } else {
        toast.error(result.message || 'Login failed');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 6 },
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 2, boxShadow: { xs: 2, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            fontWeight={700}
            textAlign="center"
            mb={{ xs: 2.5, sm: 3 }}
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            Login
          </Typography>

          <Stack component="form" onSubmit={handleSubmit} spacing={{ xs: 1.5, sm: 2 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              error={!!formErrors.password}
              helperText={formErrors.password}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ py: { xs: 1.2, sm: 1.5 } }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/forgot-password')}
                sx={{ textDecoration: 'none' }}
              >
                Forgot Password?
              </Link>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{ textDecoration: 'none', color: 'primary.main' }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
