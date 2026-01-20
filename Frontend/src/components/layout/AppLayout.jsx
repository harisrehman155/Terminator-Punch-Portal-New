import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', backgroundColor: '#f9fafb' }}>
      <Sidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box sx={{ flexGrow: 1, ml: { xs: 0, md: '260px' } }}>
        <Topbar isMobile={isMobile} onMenuClick={handleDrawerToggle} />
        <Box
          component="main"
          sx={{
            minHeight: '100dvh',
            p: { xs: 2, sm: 3 },
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
