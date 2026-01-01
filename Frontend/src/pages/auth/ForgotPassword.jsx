import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { forgotPasswordUser } from '../../redux/actions/AuthAction';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    const result = await dispatch(forgotPasswordUser(email));

    if (result.success) {
      toast.success('OTP sent to your email');
      navigate('/verify-otp', { state: { email } });
    } else {
      toast.error(result.message || 'Failed to send OTP');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700} textAlign="center" mb={2}>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Enter your email address and we'll send you an OTP to reset your password.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 2, py: 1.5 }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ textDecoration: 'none', color: 'primary.main' }}
              >
                Back to Login
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;

