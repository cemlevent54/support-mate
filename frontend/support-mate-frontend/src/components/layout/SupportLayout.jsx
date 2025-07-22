import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { logout as apiLogout } from '../../api/authApi';

const sidebarItems = [
  { key: 'requests', label: 'Support Requests', path: '/support/requests' },
  { key: 'chats', label: 'Chats', path: '/support/chats' },
  { key: 'profile', label: 'Profile', path: '/support/profile' },
];

export default function SupportLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('jwt');
      await apiLogout(token);
    } catch (e) {
      localStorage.removeItem('jwt');
    } finally {
      navigate('/login');
      setTimeout(() => { window.location.reload(); }, 100);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Paper elevation={3} style={{ width: 220, minHeight: '100vh', borderRadius: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#111', color: '#fff' }}>
        <div>
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" style={{ color: '#fff' }}>Support Panel</Typography>
          <List>
            {sidebarItems.map(item => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  selected={location.pathname.startsWith(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: '#fff',
                    ...(location.pathname.startsWith(item.path) && {
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#1976d2' },
                    }),
                    '&:hover': { bgcolor: '#222' },
                  }}
                >
                  <ListItemText primary={item.label} sx={{ color: '#fff' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </div>
        <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mt: 2, borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: '#222' } }}>
          Çıkış Yap
        </Button>
      </Paper>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
} 