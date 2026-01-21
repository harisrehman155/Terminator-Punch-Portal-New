import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link, Stack } from '@mui/material';
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
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
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
            mb={{ xs: 2, sm: 2.5 }}
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            Forgot Password
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={{ xs: 2, sm: 3 }}
          >
            Enter your email address and we'll send you an OTP to reset your password.
          </Typography>

          <Stack component="form" onSubmit={handleSubmit} spacing={{ xs: 1.5, sm: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ py: { xs: 1.2, sm: 1.5 } }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
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
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
