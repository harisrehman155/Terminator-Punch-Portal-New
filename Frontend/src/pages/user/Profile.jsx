import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  alpha,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { getUserProfile, updateProfile, updateUserProfile } from '../../redux/actions/AuthAction';
import Loader from '../../components/common/Loader';

const FormSection = ({ title, children }) => (
  <Paper
    sx={{
      p: 3,
      mb: 3,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} mb={2}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔒 Flag to prevent re-setting form while typing
  const isFormInitialized = useRef(false);
  const isFormDirty = useRef(false);

  // Load profile once
  useEffect(() => {
    if (!user) {
      dispatch(getUserProfile());
    }
  }, [dispatch, user]);

  // Initialize form when user data arrives and the form is not dirty
  useEffect(() => {
    if (user && (!isFormInitialized.current || !isFormDirty.current)) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
      });
      isFormInitialized.current = true;
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    isFormDirty.current = true;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await dispatch(updateUserProfile(formData));
      const message = result?.message;
      const normalizedMessage = message?.toLowerCase() || '';
      const isSuccess =
        result?.success === true ||
        normalizedMessage.includes('profile updated') ||
        normalizedMessage.includes('updated successfully');

      if (isSuccess) {
        const updatedProfile = {
          ...(user || {}),
          ...formData,
          ...(result?.data || {}),
        };
        dispatch(updateProfile(updatedProfile));
        setFormData({
          name: updatedProfile.name || '',
          email: updatedProfile.email || '',
          company: updatedProfile.company || '',
          phone: updatedProfile.phone || '',
          address: updatedProfile.address || '',
          city: updatedProfile.city || '',
          country: updatedProfile.country || '',
        });
        isFormDirty.current = false;
        isFormInitialized.current = true;
        toast.success(message || 'Profile updated successfully');
      } else {
        toast.error(message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !user) {
    return (
      <Box>
        <PageHeader title="Profile" />
        <Loader />
      </Box>
    );
  }

  if (error && !user) {
    return (
      <Box textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Profile" />

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <FormSection title="Personal Information">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <TextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  disabled
                  fullWidth
                />

                <TextField
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                  sx={{ gridColumn: '1 / -1' }}
                />

                <TextField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  fullWidth
                />
              </Box>
            </FormSection>

            <Box textAlign="right">
              <Button
                type="submit"
                variant="contained"
                startIcon={<PersonIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
