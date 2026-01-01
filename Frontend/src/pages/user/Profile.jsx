import { useState } from 'react';
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
import { dummyUser } from '../../data/dummyUser';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: dummyUser.name,
    email: dummyUser.email,
    company: dummyUser.company,
    phone: dummyUser.phone,
    address: dummyUser.address,
    city: dummyUser.city,
    country: dummyUser.country,
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Profile updated successfully');
  };

  // Section wrapper component for consistent styling
  const FormSection = ({ title, children }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        color="primary"
        sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );

  return (
    <Box>
      <PageHeader
        title="Profile"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Profile' }]}
      />

      <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <FormSection title="Personal Information">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2.5,
                }}
              >
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                />

                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
                />

                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </Box>
            </FormSection>

            {/* Submit Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                type="submit"
                variant="contained"
                startIcon={<PersonIcon />}
                sx={{ minWidth: 160 }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
