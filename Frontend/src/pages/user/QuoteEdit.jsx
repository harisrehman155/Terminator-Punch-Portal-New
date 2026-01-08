import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const QuoteEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteFiles, setQuoteFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

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

  const fabricOptions = ['Cotton', 'Polyester', 'Linen', 'Denim', 'Wool', 'Other'];
  const colorTypeOptions = ['Full Color', 'Solid', 'Gradient', 'Two Color', 'Multi Color', 'Other'];

  useEffect(() => {
    let isMounted = true;

    const fetchQuote = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await apiService({
          method: HttpMethod.GET,
          endPoint: `/quotes/${id}`,
          token,
        });
        const quoteData = response?.data || null;

        let filesData = [];
        try {
          const filesResponse = await apiService({
            method: HttpMethod.GET,
            endPoint: `/files/quotes/${id}`,
            token,
          });
          filesData = filesResponse?.data || [];
        } catch (fileError) {
          const message =
            fileError?.apiMessage || fileError?.message || 'Failed to load quote files';
          toast.error(message);
        }

        if (isMounted) {
          setQuote(quoteData);
          setQuoteFiles(filesData);
          if (quoteData) {
            setFormData({
              quote_type: quoteData.service_type || quoteData.quote_type || '',
              design_name: quoteData.design_name || '',
              width: quoteData.width ?? '',
              height: quoteData.height ?? '',
              unit: quoteData.unit || 'inch',
              number_of_colors: quoteData.number_of_colors ?? '',
              fabric: quoteData.fabric || '',
              color_type: quoteData.color_type || '',
              placement: quoteData.placement || [],
              required_format: quoteData.required_format || [],
              instruction: quoteData.instruction || '',
              is_urgent: Boolean(quoteData.is_urgent),
            });
          }
        }
      } catch (error) {
        const message = error?.apiMessage || error?.message || 'Failed to load quote';
        toast.error(message);
        if (isMounted) {
          setQuote(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  if (isLoading) {
    return <Box>Loading quote...</Box>;
  }

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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setNewFiles(selectedFiles);
  };

  const handleDownload = async (file) => {
    if (!token) {
      toast.error('Please log in again to download the file');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/files/${file.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = 'Failed to download file';
        try {
          const payload = await response.json();
          message = payload?.message || message;
        } catch (error) {
          // Ignore JSON parse errors for non-JSON responses.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error?.message || 'Failed to download file';
      toast.error(message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (!formData.quote_type || !formData.design_name || !formData.width || !formData.height) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (
      (formData.quote_type === 'DIGITIZING' || formData.quote_type === 'PATCHES') &&
      (!formData.number_of_colors || !formData.fabric)
    ) {
      toast.error('Please add number of colors and fabric');
      return;
    }
    if (formData.quote_type === 'VECTOR' && !formData.color_type) {
      toast.error('Please add color type');
      return;
    }
    if (!token) {
      toast.error('Please log in again to update the quote');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        design_name: formData.design_name.trim(),
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        unit: formData.unit || undefined,
        placement: formData.placement,
        required_format: formData.required_format,
        instruction: formData.instruction,
        is_urgent: formData.is_urgent ? 1 : 0,
      };

      if (formData.quote_type === 'VECTOR') {
        payload.color_type = formData.color_type;
      }

      if (formData.quote_type === 'DIGITIZING' || formData.quote_type === 'PATCHES') {
        payload.number_of_colors = formData.number_of_colors
          ? parseInt(formData.number_of_colors, 10)
          : null;
        payload.fabric = formData.fabric;
      }

      const response = await apiService({
        method: HttpMethod.PUT,
        endPoint: `/quotes/${id}`,
        data: payload,
        token,
      });

      const isSuccess =
        response?.success === true ||
        response?.status === 'success';

      if (!isSuccess) {
        toast.error(response?.message || 'Failed to update quote');
        return;
      }

      if (newFiles.length > 0) {
        const uploadResults = await Promise.all(
          newFiles.map(async (file) => {
            const data = new FormData();
            data.append('file', file);
            const uploadResponse = await fetch(
              `${API_BASE_URL}/files/quotes/${id}/upload`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: data,
              }
            );

            let errorMessage = null;
            if (!uploadResponse.ok) {
              try {
                const payload = await uploadResponse.json();
                errorMessage = payload?.message || null;
              } catch (err) {
                errorMessage = null;
              }
            }

            return {
              name: file.name,
              ok: uploadResponse.ok,
              message: errorMessage,
            };
          })
        );

        const failedUploads = uploadResults.filter((result) => !result.ok);
        if (failedUploads.length > 0) {
          const failedNames = failedUploads.map((result) => result.name).join(', ');
          const failureMessage = failedUploads.find((result) => result.message)?.message;
          toast.error(
            failureMessage
              ? `Quote updated but upload failed: ${failureMessage}`
              : `Quote updated but some files failed to upload: ${failedNames}`
          );
        } else {
          toast.success('Quote updated and files uploaded successfully');
        }
      } else {
        toast.success(response?.message || 'Quote updated successfully');
      }

      setNewFiles([]);
      navigate(`/quotes/${id}`);
    } catch (error) {
      const message = error?.apiMessage || error?.message || 'Failed to update quote';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    disabled
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
            {(formData.quote_type === 'DIGITIZING' || formData.quote_type === 'PATCHES') && (
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

            {formData.quote_type === 'VECTOR' && (
              <FormSection title="Vector Details">
                <FormControl fullWidth sx={{ maxWidth: { sm: 'calc(50% - 10px)' } }}>
                  <InputLabel>Color Type</InputLabel>
                  <Select
                    name="color_type"
                    value={formData.color_type}
                    onChange={handleChange}
                    label="Color Type"
                  >
                    {colorTypeOptions.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                {newFiles.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {newFiles.map((file) => (
                      <Chip key={file.name} label={file.name} size="small" />
                    ))}
                  </Box>
                )}
                {quoteFiles.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {quoteFiles.map((file) => (
                      <Chip
                        key={file.id}
                        label={file.original_name}
                        size="small"
                        onClick={() => handleDownload(file)}
                        sx={{ cursor: 'pointer' }}
                      />
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Quote'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuoteEdit;
