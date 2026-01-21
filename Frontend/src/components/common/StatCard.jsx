import { Card, CardContent, Typography, Box, alpha } from '@mui/material';

const StatCard = ({ title, value, icon: Icon, color = '#36e27b' }) => {
  return (
    <Card
      sx={{
        height: '100%',
        boxShadow: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
          borderColor: color,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              fontWeight={700}
              sx={{
                color: color,
                lineHeight: 1.2,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              }}
            >
              {value}
            </Typography>
          </Box>
          {Icon && (
            <Box
              sx={{
                backgroundColor: alpha(color, 0.1),
                borderRadius: 2,
                p: { xs: 1.25, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: alpha(color, 0.2),
              }}
            >
              <Icon sx={{ fontSize: { xs: 24, sm: 32, md: 36 }, color: color }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
