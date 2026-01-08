import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControlLabel,
  Checkbox,
  Typography,
  Stack,
  Paper,
  alpha,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  BoltOutlined as UrgentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { lookups } from '../../data/dummyLookups';
import apiService, { HttpMethod } from '../../api/ApiService';
import { API_BASE_URL } from '../../utils/Constants';

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

const OrderCreate = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [formData, setFormData] = useState({
    order_type: '',
    design_name: '',
    width: '',
    height: '',
    unit: 'inch',
    number_of_colors: '',
    fabric: '',
    color_type: '',
    placement: [],
    required_format: [],
    instruction: '',
    is_urgent: false,
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fabricOptions = ['Cotton', 'Polyester', 'Linen', 'Denim', 'Wool', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (!formData.order_type || !formData.design_name || !formData.width || !formData.height) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (
      (formData.order_type === 'DIGITIZING' || formData.order_type === 'PATCHES') &&
      (!formData.number_of_colors || !formData.fabric)
    ) {
      toast.error('Please add number of colors and fabric');
      return;
    }
    if (formData.order_type === 'VECTOR' && !formData.color_type) {
      toast.error('Please add color type');
      return;
    }
    if (!token) {
      toast.error('Please log in again to create an order');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        number_of_colors: formData.number_of_colors
          ? parseInt(formData.number_of_colors, 10)
          : null,
        is_urgent: formData.is_urgent ? 1 : 0,
      };

      const response = await apiService({
        method: HttpMethod.POST,
        endPoint: '/orders',
        data: payload,
        token,
      });

      const isSuccess =
        response?.success === true ||
        response?.status === 'success';

      if (!isSuccess) {
        toast.error(response?.message || 'Failed to create order');
        return;
      }

      const orderId = response?.data?.id;

      if (orderId && files.length > 0) {
        const uploadResults = await Promise.all(
          files.map((file) => {
            const data = new FormData();
            data.append('file', file);
            return fetch(`${API_BASE_URL}/files/orders/${orderId}/upload`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: data,
            });
          })
        );

        const failedUploads = uploadResults.filter((result) => !result.ok);
        if (failedUploads.length > 0) {
          toast.error('Order created but some files failed to upload');
          navigate('/orders');
          return;
        }
      }

      toast.success(response?.message || 'Order created successfully');
      navigate('/orders');
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to create order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Create New Order"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Orders', path: '/orders' },
          { label: 'New Order' },
        ]}
      />

      <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <FormSection title="Basic Information">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2.5,
                }}
              >
                <FormControl fullWidth required size="medium">
                  <InputLabel>Order Type</InputLabel>
                  <Select
                    name="order_type"
                    value={formData.order_type}
                    onChange={handleChange}
                    label="Order Type"
                  >
                    {lookups.order_types.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Design Name"
                  name="design_name"
                  value={formData.design_name}
                  onChange={handleChange}
                  required
                />
              </Box>
            </FormSection>

            {/* Size & Dimensions Section */}
            <FormSection title="Size & Dimensions">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                  gap: 2.5,
                }}
              >
                <TextField
                  fullWidth
                  label="Width"
                  name="width"
                  type="number"
                  value={formData.width}
                  onChange={handleChange}
                  required
                  inputProps={{ step: '0.1', min: '0' }}
                />

                <TextField
                  fullWidth
                  label="Height"
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  inputProps={{ step: '0.1', min: '0' }}
                />

                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    label="Unit"
                  >
                    {lookups.units.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </FormSection>

            {/* Conditional Fields based on Order Type */}
            {(formData.order_type === 'DIGITIZING' || formData.order_type === 'PATCHES') && (
              <FormSection title="Digitizing Details">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2.5,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Number of Colors"
                    name="number_of_colors"
                    type="number"
                    value={formData.number_of_colors}
                    onChange={handleChange}
                    inputProps={{ min: '0' }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Fabric</InputLabel>
                    <Select
                      name="fabric"
                      value={formData.fabric}
                      onChange={handleChange}
                      label="Fabric"
                    >
                      {fabricOptions.map((fabric) => (
                        <MenuItem key={fabric} value={fabric}>
                          {fabric}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </FormSection>
            )}

            {formData.order_type === 'VECTOR' && (
              <FormSection title="Vector Details">
                <TextField
                  fullWidth
                  label="Color Type"
                  name="color_type"
                  value={formData.color_type}
                  onChange={handleChange}
                  placeholder="e.g., Full Color, Gradient"
                  sx={{ maxWidth: { sm: 'calc(50% - 10px)' } }}
                />
              </FormSection>
            )}

            {/* Placement & Format Section */}
            <FormSection title="Placement & Format">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2.5,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Placement</InputLabel>
                  <Select
                    multiple
                    value={formData.placement}
                    onChange={(e) => handleMultiSelect('placement', e.target.value)}
                    input={<OutlinedInput label="Placement" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {lookups.placement.map((place) => (
                      <MenuItem key={place} value={place}>
                        {place}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Required Format</InputLabel>
                  <Select
                    multiple
                    value={formData.required_format}
                    onChange={(e) => handleMultiSelect('required_format', e.target.value)}
                    input={<OutlinedInput label="Required Format" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {lookups.required_format.map((format) => (
                      <MenuItem key={format} value={format}>
                        {format}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </FormSection>

            {/* Instructions & Files Section */}
            <FormSection title="Instructions & Attachments">
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Instructions"
                  name="instruction"
                  value={formData.instruction}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  placeholder="Enter any special instructions or requirements..."
                />

                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                    },
                  }}
                >
                  Click to Upload Files
                  <input type="file" hidden multiple onChange={handleFileChange} />
                </Button>
                {files.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {files.map((file) => (
                      <Chip key={file.name} label={file.name} size="small" />
                    ))}
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_urgent}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, is_urgent: e.target.checked }))
                      }
                      icon={<UrgentIcon />}
                      checkedIcon={<UrgentIcon />}
                      sx={{
                        '&.Mui-checked': {
                          color: 'warning.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      color={formData.is_urgent ? 'warning.main' : 'text.secondary'}
                      fontWeight={formData.is_urgent ? 600 : 400}
                    >
                      Mark as Urgent Order
                    </Typography>
                  }
                  sx={{
                    p: 1.5,
                    m: 0,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: formData.is_urgent ? 'warning.main' : 'divider',
                    bgcolor: formData.is_urgent ? 'warning.lighter' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                />
              </Stack>
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
                variant="outlined"
                onClick={() => navigate('/orders')}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ minWidth: 140 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderCreate;
