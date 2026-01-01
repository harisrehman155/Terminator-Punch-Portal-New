import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Stack,
  alpha,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Delete,
  Send,
  Person,
  AdminPanelSettings,
  AttachMoney,
  History,
  Warning,
  CheckCircle,
  Description,
  Download,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  FolderZip,
  Info,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { dummyQuotes } from '../../data/dummyQuotes';
import { dummyQuoteFiles } from '../../data/dummyQuoteFiles';
import { toast } from 'react-toastify';
import { useState } from 'react';

const AdminQuoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const quote = dummyQuotes.find((q) => q.id === parseInt(id));
  const quoteFiles = dummyQuoteFiles.filter((f) => f.entity_id === parseInt(id));

  const [pricing, setPricing] = useState({
    price_total: quote?.current_price || '',
    currency: quote?.currency || 'USD',
    pricing_notes: '',
  });
  const [adminRemarks, setAdminRemarks] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!quote) {
    return <Typography>Quote not found</Typography>;
  }

  const handlePricingChange = (e) => {
    setPricing({
      ...pricing,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendQuote = () => {
    if (!pricing.price_total) {
      toast.error('Please enter a price');
      return;
    }
    if (!adminRemarks.trim()) {
      toast.error('Please add a message for the customer');
      return;
    }
    toast.success('Quote sent to customer successfully');
    navigate('/admin/quotes');
  };

  const handleSaveRemarks = () => {
    if (!adminRemarks.trim()) {
      toast.error('Please enter a message');
      return;
    }
    toast.success('Message sent to customer');
    setAdminRemarks('');
  };

  const handleDelete = () => {
    toast.success('Quote deleted successfully');
    setDeleteDialogOpen(false);
    navigate('/admin/quotes');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image color="primary" />;
    if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimeType === 'application/zip') return <FolderZip color="warning" />;
    return <InsertDriveFile color="action" />;
  };

  const handleDownloadFile = (file) => {
    toast.info(`Downloading ${file.original_name}...`);
  };

  const isPending = quote.status === 'PENDING';
  const isRevisionRequested = quote.status === 'REVISION_REQUESTED';
  const isPriced = quote.status === 'PRICED';
  const isConverted = quote.status === 'CONVERTED';
  const isRejected = quote.status === 'REJECTED';
  const needsAction = isPending || isRevisionRequested;

  // Section Component
  const SectionCard = ({ title, icon, children, sx = {} }) => (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          {icon}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <PageHeader
        title={`Quote ${quote.quote_no}`}
        breadcrumbs={[
          { label: 'Admin Dashboard', path: '/admin/dashboard' },
          { label: 'Quotes', path: '/admin/quotes' },
          { label: quote.quote_no },
        ]}
      />

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Status Alert Banner */}
        {needsAction && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              bgcolor: (theme) =>
                alpha(
                  isRevisionRequested
                    ? theme.palette.warning.main
                    : theme.palette.info.main,
                  0.08
                ),
              border: '2px solid',
              borderColor: isRevisionRequested ? 'warning.main' : 'info.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Warning
              sx={{ fontSize: 32 }}
              color={isRevisionRequested ? 'warning' : 'info'}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} mb={0.5}>
                {isRevisionRequested
                  ? 'Revision Requested by Customer'
                  : 'New Quote - Awaiting Pricing'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isRevisionRequested
                  ? 'Customer has requested changes. Please review their message and update pricing.'
                  : 'Please review the quote details and provide pricing.'}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Quote Header Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                background: (theme) =>
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={700} mb={1.5}>
                      {quote.design_name}
                    </Typography>
                    <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
                      <StatusChip status={quote.status} type="quote" />
                      {quote.is_urgent && (
                        <Chip
                          label="Urgent"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                      <Chip
                        label={quote.quote_no}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Box>
                  {!isConverted && !isRejected && (
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/admin/quotes/${id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Quote Details Section */}
            <SectionCard
              title="Quote Details"
              icon={<Info color="primary" />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                    >
                      Quote Type
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {quote.quote_type}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                    >
                      Dimensions
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {quote.width} x {quote.height} {quote.unit}
                    </Typography>
                  </Box>
                </Grid>
                {quote.number_of_colors && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                      >
                        Number of Colors
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {quote.number_of_colors}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {quote.fabric && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                      >
                        Fabric
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {quote.fabric}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {quote.color_type && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                      >
                        Color Type
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {quote.color_type}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}
                    >
                      Placement
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {quote.placement.map((place) => (
                        <Chip
                          key={place}
                          label={place}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}
                    >
                      Required Format
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {quote.required_format.map((format) => (
                        <Chip
                          key={format}
                          label={format}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </SectionCard>

            {/* Customer Instructions */}
            <SectionCard
              title="Customer Instructions"
              icon={<Description color="primary" />}
            >
              {quote.instruction ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                  >
                    {quote.instruction}
                  </Typography>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No instructions provided by customer
                  </Typography>
                </Paper>
              )}
            </SectionCard>

            {/* Files Section */}
            {quoteFiles.length > 0 && (
              <SectionCard
                title={`Uploaded Files (${quoteFiles.length})`}
                icon={<InsertDriveFile color="primary" />}
              >
                <List sx={{ p: 0 }}>
                  {quoteFiles.map((file, index) => (
                    <Box key={file.id}>
                      <ListItem
                        sx={{
                          bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleDownloadFile(file)}
                            size="small"
                            sx={{ color: 'primary.main' }}
                          >
                            <Download />
                          </IconButton>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getFileIcon(file.mime_type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>
                              {file.original_name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(file.size_bytes)} • {formatDate(file.created_at)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </SectionCard>
            )}

            {/* Conversation History */}
            {quote.remarks_history?.length > 0 && (
              <SectionCard
                title="Conversation History"
                icon={<History color="primary" />}
              >
                <Stack spacing={2}>
                  {quote.remarks_history.map((remark) => (
                    <Paper
                      key={remark.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        bgcolor:
                          remark.type === 'admin'
                            ? (theme) => alpha(theme.palette.primary.main, 0.06)
                            : (theme) => alpha(theme.palette.grey[500], 0.06),
                        borderRadius: 2,
                        borderLeft: '4px solid',
                        borderLeftColor:
                          remark.type === 'admin' ? 'primary.main' : 'grey.400',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor:
                              remark.type === 'admin' ? 'primary.main' : 'grey.500',
                          }}
                        >
                          {remark.type === 'admin' ? (
                            <AdminPanelSettings sx={{ fontSize: 18 }} />
                          ) : (
                            <Person sx={{ fontSize: 18 }} />
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {remark.created_by}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(remark.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ ml: 5, lineHeight: 1.7 }}>
                        {remark.message}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </SectionCard>
            )}

            {/* Pricing & Message Card - Combined */}
            {needsAction && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 3,
                      pb: 2.5,
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AttachMoney sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {isPending ? 'Set Pricing & Send Quote' : 'Update Pricing'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Provide pricing and message to customer
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={3}>
                    {/* Price Input */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        Pricing Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4} md={3}>
                          <TextField
                            fullWidth
                            label="Price"
                            name="price_total"
                            type="number"
                            value={pricing.price_total}
                            onChange={handlePricingChange}
                            required
                            InputProps={{
                              startAdornment: (
                                <Typography
                                  sx={{ mr: 1, fontWeight: 600, color: 'primary.main' }}
                                >
                                  $
                                </Typography>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'white',
                                '&:hover fieldset': {
                                  borderColor: 'primary.main',
                                },
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Currency</InputLabel>
                            <Select
                              name="currency"
                              value={pricing.currency}
                              onChange={handlePricingChange}
                              label="Currency"
                              sx={{
                                bgcolor: 'white',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                              }}
                            >
                              <MenuItem value="USD">USD</MenuItem>
                              <MenuItem value="EUR">EUR</MenuItem>
                              <MenuItem value="GBP">GBP</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    {/* Message to Customer - Single Combined Field */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        Message to Customer
                      </Typography>
                      <TextField
                        fullWidth
                        label="Your Message"
                        value={adminRemarks}
                        onChange={(e) => setAdminRemarks(e.target.value)}
                        multiline
                        rows={5}
                        placeholder="Enter your message to the customer. This will be visible to them along with the pricing..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
                      >
                        This message will be sent to the customer along with the pricing
                      </Typography>
                    </Box>

                    {/* Submit Button */}
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Send />}
                      onClick={handleSendQuote}
                      size="large"
                      sx={{
                        py: 1.75,
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2,
                      }}
                    >
                      {isPending ? 'Send Quote to Customer' : 'Update & Send Quote'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Current Price Display */}
            {(isPriced || isConverted || isRejected) && quote.current_price && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '2px solid',
                  borderColor: 'success.main',
                  borderRadius: 3,
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2.5,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Current Price
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Quote has been sent to customer
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="success.main"
                    mb={1.5}
                  >
                    {quote.currency} {quote.current_price.toFixed(2)}
                  </Typography>
                  {quote.pricing_history?.[0]?.admin_notes && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: 'success.50',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'success.200',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {quote.pricing_history[0].admin_notes}
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Message to Customer - For Already Priced Quotes */}
            {!needsAction && !isConverted && !isRejected && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2.5,
                    }}
                  >
                    <Send color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Send Message to Customer
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="Your Message"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    multiline
                    rows={5}
                    placeholder="Enter your message to the customer..."
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Send />}
                    onClick={handleSaveRemarks}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pricing History */}
            {quote.pricing_history?.length > 0 && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2.5,
                    }}
                  >
                    <History color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Pricing History
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    {quote.pricing_history.map((price, index) => (
                      <Paper
                        key={price.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: index === 0 ? 'success.50' : 'grey.50',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: index === 0 ? 'success.200' : 'grey.200',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                textDecoration: index !== 0 ? 'line-through' : 'none',
                                color: index === 0 ? 'success.main' : 'text.secondary',
                              }}
                            >
                              {price.currency} {price.price.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {price.admin_notes}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(price.created_at)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Status Info */}
            {isConverted && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                  border: '2px solid',
                  borderColor: 'success.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="success.dark" fontWeight={600} mb={1}>
                  ✅ Converted to Order #{quote.converted_order_id}
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  fullWidth
                  onClick={() => navigate(`/admin/orders/${quote.converted_order_id}`)}
                >
                  View Order
                </Button>
              </Paper>
            )}

            {isRejected && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  border: '2px solid',
                  borderColor: 'error.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="error.dark" fontWeight={600}>
                  ❌ Quote Rejected by Customer
                </Typography>
              </Paper>
            )}

            {/* Date Info */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(quote.created_at)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(quote.updated_at)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quote? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQuoteDetails;
