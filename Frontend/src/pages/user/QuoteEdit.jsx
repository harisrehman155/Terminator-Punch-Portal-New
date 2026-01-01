import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { lookups } from '../../data/dummyLookups';
import { dummyQuotes } from '../../data/dummyQuotes';

const QuoteEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const quote = dummyQuotes.find((q) => q.id === parseInt(id));

  const [formData, setFormData] = useState({
    quote_type: '',
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

  useEffect(() => {
    if (quote) {
      setFormData({
        quote_type: quote.quote_type || '',
        design_name: quote.design_name || '',
        width: quote.width || '',
        height: quote.height || '',
        unit: quote.unit || 'inch',
        number_of_colors: quote.number_of_colors || '',
        fabric: quote.fabric || '',
        color_type: quote.color_type || '',
        placement: quote.placement || [],
        required_format: quote.required_format || [],
        instruction: quote.instruction || '',
        is_urgent: quote.is_urgent === 1,
      });
    }
  }, [quote]);

  if (!quote) {
    return <Box>Quote not found</Box>;
  }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.quote_type || !formData.design_name || !formData.width || !formData.height) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Quote updated successfully');
    navigate(`/quotes/${id}`);
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
        title={`Edit Quote ${quote.quote_no}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Quotes', path: '/quotes' },
          { label: quote.quote_no, path: `/quotes/${id}` },
          { label: 'Edit' },
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
                  <InputLabel>Quote Type</InputLabel>
                  <Select
                    name="quote_type"
                    value={formData.quote_type}
                    onChange={handleChange}
                    label="Quote Type"
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

            {/* Conditional Fields based on Quote Type */}
            {formData.quote_type === 'DIGITIZING' && (
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

                  <TextField
                    fullWidth
                    label="Fabric"
                    name="fabric"
                    value={formData.fabric}
                    onChange={handleChange}
                    placeholder="e.g., Cotton, Polyester"
                  />
                </Box>
              </FormSection>
            )}

            {formData.quote_type === 'VECTOR' && (
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
                  <input type="file" hidden multiple />
                </Button>

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
                      Mark as Urgent Quote
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
                onClick={() => navigate(`/quotes/${id}`)}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ minWidth: 140 }}
              >
                Update Quote
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuoteEdit;
