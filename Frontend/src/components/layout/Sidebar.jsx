import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Description as QuotesIcon,
  Person as ProfileIcon,
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
} from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role') || 'USER';

  const userMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Orders', path: '/orders', icon: <OrdersIcon /> },
    { label: 'Quotes', path: '/quotes', icon: <QuotesIcon /> },
    { label: 'Profile', path: '/profile', icon: <ProfileIcon /> },
  ];

  const adminMenuItems = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Orders', path: '/admin/orders', icon: <OrdersIcon /> },
    { label: 'Quotes', path: '/admin/quotes', icon: <QuotesIcon /> },
    { label: 'Users', path: '/admin/users', icon: <UsersIcon /> },
  ];

  const menuItems = role === 'ADMIN' ? adminMenuItems : userMenuItems;

  return (
    <Box
      sx={{
        width: 260,
        height: '100vh',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        position: 'fixed',
        left: 0,
        top: 0,
        pt: 8,
      }}
    >
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor: isActive ? '#36e27b15' : 'transparent',
                  color: isActive ? '#36e27b' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? '#36e27b20' : 'grey.100',
                  },
                  borderLeft: isActive ? '3px solid #36e27b' : '3px solid transparent',
                  pl: isActive ? 2 : 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#36e27b' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;

