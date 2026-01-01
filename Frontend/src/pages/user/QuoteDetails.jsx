import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  alpha,
  Stack,
  TextField,
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  ShoppingCart,
  Refresh,
  Close,
  Person,
  AdminPanelSettings,
  AttachMoney,
  History,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { dummyQuotes } from '../../data/dummyQuotes';
import { toast } from 'react-toastify';
import { useState } from 'react';

const QuoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const quote = dummyQuotes.find((q) => q.id === parseInt(id));

  if (!quote) {
    return <Typography>Quote not found</Typography>;
  }

  const handleConvertToOrder = () => {
    toast.success('Quote converted to order successfully!');
    setConvertDialogOpen(false);
    navigate('/orders');
  };

  const handleRequestRevision = () => {
    if (!revisionNote.trim()) {
      toast.error('Please provide a note for the revision request');
      return;
    }
    toast.success('Revision request sent to admin');
    setRevisionDialogOpen(false);
    setRevisionNote('');
  };

  const handleRejectQuote = () => {
    toast.success('Quote rejected');
    setRejectDialogOpen(false);
    setRejectReason('');
    navigate('/quotes');
  };

  const handleDelete = () => {
    toast.success('Quote deleted successfully');
    setDeleteDialogOpen(false);
    navigate('/quotes');
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

  // Section wrapper component
  const DetailSection = ({ title, icon, children, color = 'primary' }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.03),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[color].main, 0.2),
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={600} color={`${color}.main`}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );

  const DetailRow = ({ label, value, children }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {value && (
        <Typography variant="body1" fontWeight={500}>
          {value}
        </Typography>
      )}
      {children}
    </Box>
  );

  const canTakeAction = quote.status === 'PRICED';
  const isPending = quote.status === 'PENDING';
  const isRevisionRequested = quote.status === 'REVISION_REQUESTED';
  const isConverted = quote.status === 'CONVERTED';
  const isRejected = quote.status === 'REJECTED';

  return (
    <Box>
      <PageHeader
        title={`Quote ${quote.quote_no}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Quotes', path: '/quotes' },
          { label: quote.quote_no },
        ]}
      />

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Main Quote Card */}
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
                pb: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={600} mb={1}>
                  {quote.design_name}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <StatusChip status={quote.status} type="quote" />
                  {quote.is_urgent && (
                    <Chip label="Urgent" size="small" color="warning" />
                  )}
                </Box>
              </Box>
              {!isConverted && !isRejected && (
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => navigate(`/quotes/${id}/edit`)}
                    disabled={!isPending}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Box>

            {/* Quote Details */}
            <DetailSection title="Quote Details" icon={null}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <DetailRow label="Quote Type" value={quote.quote_type} />
                <DetailRow
                  label="Size"
                  value={`${quote.width} x ${quote.height} ${quote.unit}`}
                />
                {quote.number_of_colors && (
                  <DetailRow label="Number of Colors" value={quote.number_of_colors} />
                )}
                {quote.fabric && <DetailRow label="Fabric" value={quote.fabric} />}
                <DetailRow label="Placement">
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {quote.placement.map((place) => (
                      <Chip key={place} label={place} size="small" />
                    ))}
                  </Box>
                </DetailRow>
                <DetailRow label="Required Format">
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {quote.required_format.map((format) => (
                      <Chip key={format} label={format} size="small" />
                    ))}
                  </Box>
                </DetailRow>
              </Box>
              {quote.instruction && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Instructions
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {quote.instruction}
                  </Typography>
                </Box>
              )}
            </DetailSection>

            {/* Current Pricing - Only show if priced */}
            {quote.current_price && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) =>
                    alpha(
                      canTakeAction
                        ? theme.palette.success.main
                        : theme.palette.grey[500],
                      0.08
                    ),
                  border: '2px solid',
                  borderColor: canTakeAction ? 'success.main' : 'grey.400',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney color={canTakeAction ? 'success' : 'action'} />
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color={canTakeAction ? 'success.main' : 'text.secondary'}
                  >
                    Current Pricing
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={canTakeAction ? 'success.main' : 'text.primary'}
                  mb={1}
                >
                  {quote.currency} {quote.current_price.toFixed(2)}
                </Typography>
                {quote.pricing_history?.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {quote.pricing_history[0].admin_notes}
                  </Typography>
                )}

                {/* Action Buttons - Only show when PRICED */}
                {canTakeAction && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ShoppingCart />}
                      onClick={() => setConvertDialogOpen(true)}
                    >
                      Accept & Convert to Order
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Refresh />}
                      onClick={() => setRevisionDialogOpen(true)}
                    >
                      Request Revision
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Close />}
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      Reject Quote
                    </Button>
                  </Box>
                )}
              </Paper>
            )}

            {/* Status Messages */}
            {isPending && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  border: '1px solid',
                  borderColor: 'warning.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="warning.dark" fontWeight={500}>
                  ⏳ Your quote is pending review. You will be notified once pricing is
                  available.
                </Typography>
              </Paper>
            )}

            {isRevisionRequested && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  border: '1px solid',
                  borderColor: 'info.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="info.dark" fontWeight={500}>
                  🔄 You have requested a revision. Please wait for admin response with
                  updated pricing.
                </Typography>
              </Paper>
            )}

            {isConverted && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="success.dark" fontWeight={500}>
                  ✅ This quote has been converted to Order #{quote.converted_order_id}
                </Typography>
                <Button
                  variant="text"
                  color="success"
                  sx={{ mt: 1 }}
                  onClick={() => navigate(`/orders/${quote.converted_order_id}`)}
                >
                  View Order →
                </Button>
              </Paper>
            )}

            {isRejected && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="error.dark" fontWeight={500}>
                  ❌ This quote has been rejected.
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>

        {/* Conversation / Remarks History */}
        {quote.remarks_history?.length > 0 && (
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <History color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Conversation History
                </Typography>
              </Box>

              <Stack spacing={2}>
                {quote.remarks_history.map((remark, index) => (
                  <Paper
                    key={remark.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor:
                        remark.type === 'admin'
                          ? (theme) => alpha(theme.palette.primary.main, 0.05)
                          : (theme) => alpha(theme.palette.grey[500], 0.05),
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
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor:
                            remark.type === 'admin' ? 'primary.main' : 'grey.500',
                        }}
                      >
                        {remark.type === 'admin' ? (
                          <AdminPanelSettings sx={{ fontSize: 16 }} />
                        ) : (
                          <Person sx={{ fontSize: 16 }} />
                        )}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {remark.created_by}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {formatDate(remark.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ ml: 4.5 }}>
                      {remark.message}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Pricing History */}
        {quote.pricing_history?.length > 1 && (
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AttachMoney color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Pricing History
                </Typography>
              </Box>

              <Stack spacing={2}>
                {quote.pricing_history.map((price, index) => (
                  <Box
                    key={price.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: index === 0 ? 'success.50' : 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: index === 0 ? 'success.200' : 'grey.200',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color={index === 0 ? 'success.main' : 'text.secondary'}
                        sx={{
                          textDecoration: index !== 0 ? 'line-through' : 'none',
                        }}
                      >
                        {price.currency} {price.price.toFixed(2)}
                        {index === 0 && (
                          <Chip
                            label="Current"
                            size="small"
                            color="success"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {price.admin_notes}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(price.created_at)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Convert to Order Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Convert Quote to Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to accept the quoted price of{' '}
            <strong>
              {quote.currency} {quote.current_price?.toFixed(2)}
            </strong>{' '}
            and convert this quote to an order.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConvertToOrder}
            variant="contained"
            color="success"
            startIcon={<ShoppingCart />}
          >
            Convert to Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog
        open={revisionDialogOpen}
        onClose={() => setRevisionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Revision</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide details about what you'd like to discuss or revise
            (pricing, design changes, etc.)
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Message"
            placeholder="e.g., Can we discuss a lower price for bulk orders? I'd like to request a discount..."
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevisionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRequestRevision}
            variant="contained"
            startIcon={<Refresh />}
          >
            Send Revision Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Quote Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Quote</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to reject this quote? You can optionally provide a
            reason.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (Optional)"
            placeholder="e.g., Price is too high, found a better alternative..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectQuote}
            variant="contained"
            color="error"
            startIcon={<Close />}
          >
            Reject Quote
          </Button>
        </DialogActions>
      </Dialog>

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

export default QuoteDetails;
