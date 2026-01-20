import { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Stack } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { resetPasswordUser } from '../../redux/actions/AuthAction';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  const resetToken = location.state?.resetToken;
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!resetToken) {
      toast.error('Invalid reset token. Please restart password reset.');
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const result = await dispatch(resetPasswordUser(resetToken, formData.password));

    if (result.success) {
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } else {
      toast.error(result.message || 'Failed to reset password');
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
            Reset Password
          </Typography>

          <Stack component="form" onSubmit={handleSubmit} spacing={{ xs: 1.5, sm: 2 }}>
            <TextField
              fullWidth
              label="New Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ py: { xs: 1.2, sm: 1.5 } }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
