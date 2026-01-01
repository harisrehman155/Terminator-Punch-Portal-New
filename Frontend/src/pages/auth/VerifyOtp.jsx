import { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { verifyOtpUser, forgotPasswordUser } from '../../redux/actions/AuthAction';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  const email = location.state?.email;
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!email) {
      toast.error('No email provided. Please restart password reset.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    const result = await dispatch(verifyOtpUser(email, otp));

    if (result.success) {
      toast.success('OTP verified successfully');
      navigate('/reset-password', { state: { resetToken: result.data.resetToken } });
    } else {
      toast.error(result.message || 'Invalid OTP');
    }
  };

  const handleResendOTP = async () => {
    const result = await dispatch(forgotPasswordUser(email));
    if (result.success) {
      toast.success('New OTP sent to your email');
      setOtp('');
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
            Verify OTP
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Enter the 6-digit OTP sent to your email.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="OTP"
              value={otp}
              onChange={handleChange}
              margin="normal"
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' },
              }}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 2, py: 1.5 }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleResendOTP}
                sx={{ textDecoration: 'none', color: 'primary.main' }}
              >
                Resend OTP
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyOtp;

