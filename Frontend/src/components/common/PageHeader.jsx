import { Box, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

const PageHeader = ({ title, breadcrumbs, action, actionLabel }) => {
  return (
    <Box mb={3}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2, flexWrap: 'wrap' }}
        >
          {breadcrumbs.map((crumb, index) => {
            if (index === breadcrumbs.length - 1) {
              return (
                <Typography key={index} color="text.primary">
                  {crumb.label}
                </Typography>
              );
            }
            return (
              <Link
                key={index}
                color="inherit"
                href={crumb.path}
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 1.5, sm: 2 }}
      >
        <Typography
          variant="h4"
          component="h1"
          fontWeight={700}
          sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' } }}
        >
          {title}
        </Typography>
        {action && actionLabel && (
          <Button
            variant="contained"
            onClick={action}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
