import { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link, Stack } from '@mui/material';
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
            mb={{ xs: 2, sm: 2.5 }}
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            Verify OTP
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={{ xs: 2, sm: 3 }}
          >
            Enter the 6-digit OTP sent to your email.
          </Typography>

          <Stack component="form" onSubmit={handleSubmit} spacing={{ xs: 1.5, sm: 2 }}>
            <TextField
              fullWidth
              label="OTP"
              value={otp}
              onChange={handleChange}
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  fontSize: '22px',
                  letterSpacing: '6px',
                },
              }}
              sx={{
                '& input': {
                  fontSize: { xs: '20px', sm: '22px' },
                  letterSpacing: { xs: '5px', sm: '6px' },
                },
              }}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ py: { xs: 1.2, sm: 1.5 } }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
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
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyOtp;
