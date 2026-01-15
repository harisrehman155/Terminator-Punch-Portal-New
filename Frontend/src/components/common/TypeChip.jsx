import Chip from '@mui/material/Chip';

const TYPE_COLOR_MAP = {
  VECTOR: { color: '#3b82f6', bg: '#dbeafe' },
  DIGITIZING: { color: '#f59e0b', bg: '#fef3c7' },
  PATCHES: { color: '#36e27b', bg: '#d1fae5' },
  DEFAULT: { color: '#6b7280', bg: '#f3f4f6' },
};

const formatTypeLabel = (value) => {
  if (!value) {
    return '-';
  }
  return String(value)
    .trim()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const TypeChip = ({ type }) => {
  const normalized = String(type || '').trim();
  const upper = normalized.toUpperCase();
  const colors = TYPE_COLOR_MAP[upper] || TYPE_COLOR_MAP.DEFAULT;
  const label = formatTypeLabel(normalized || '-');

  return (
    <Chip
      label={label}
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

export default TypeChip;
