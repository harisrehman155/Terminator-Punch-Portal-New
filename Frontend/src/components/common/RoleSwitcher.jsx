import { Box, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdminPanelSettings, Person } from '@mui/icons-material';

// Quick Role Switcher Component (for development/testing)
// You can add this to Topbar or Sidebar for easy role switching
const RoleSwitcher = () => {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem('role') || 'USER';

  const switchRole = (newRole) => {
    localStorage.setItem('role', newRole);
    if (newRole === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
    window.location.reload();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}>
      <Chip
        icon={<Person />}
        label={`Current: ${currentRole}`}
        color={currentRole === 'ADMIN' ? 'primary' : 'default'}
        size="small"
      />
      <Button
        size="small"
        variant="outlined"
        onClick={() => switchRole(currentRole === 'ADMIN' ? 'USER' : 'ADMIN')}
      >
        Switch to {currentRole === 'ADMIN' ? 'USER' : 'ADMIN'}
      </Button>
    </Box>
  );
};

export default RoleSwitcher;

