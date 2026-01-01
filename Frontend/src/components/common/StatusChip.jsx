import { Chip } from '@mui/material';

const StatusChip = ({ status, type = 'order' }) => {
  const getStatusColor = () => {
    if (type === 'order') {
      switch (status) {
        case 'PENDING':
          return { color: '#f59e0b', bg: '#fef3c7' };
        case 'IN_PROGRESS':
          return { color: '#3b82f6', bg: '#dbeafe' };
        case 'COMPLETED':
          return { color: '#36e27b', bg: '#d1fae5' };
        case 'CANCELLED':
          return { color: '#ef4444', bg: '#fee2e2' };
        default:
          return { color: '#6b7280', bg: '#f3f4f6' };
      }
    } else {
      // Quote statuses
      switch (status) {
        case 'PENDING':
          return { color: '#f59e0b', bg: '#fef3c7' };
        case 'PRICED':
          return { color: '#36e27b', bg: '#d1fae5' };
        case 'REVISION_REQUESTED':
          return { color: '#8b5cf6', bg: '#ede9fe' };
        case 'CONVERTED':
          return { color: '#3b82f6', bg: '#dbeafe' };
        case 'REJECTED':
          return { color: '#ef4444', bg: '#fee2e2' };
        default:
          return { color: '#6b7280', bg: '#f3f4f6' };
      }
    }
  };

  const colors = getStatusColor();

  return (
    <Chip
      label={status.replace('_', ' ')}
      size="small"
      sx={{
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    />
  );
};

export default StatusChip;

