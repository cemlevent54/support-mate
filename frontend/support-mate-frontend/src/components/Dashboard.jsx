import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout as apiLogout } from '../api/authApi';

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin' },
  { key: 'users', label: 'Kullanıcılar', path: '/admin/users' },
  { key: 'roles', label: 'Roller', path: '/admin/roles' },
  // { key: 'settings', label: 'Ayarlar', path: '/admin/settings' },
];

export default function Dashboard() {
  const [selected, setSelected] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = sidebarItems.find(item => currentPath === item.path);
    if (currentItem) {
      setSelected(currentItem.key);
    } else if (currentPath.startsWith('/admin/users')) {
      setSelected('users');
    } else {
      setSelected('dashboard');
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('jwt');
      await apiLogout(token);
    } catch (e) {
      // Hata olsa da localStorage temizlensin ve yönlendirilsin
      localStorage.removeItem('jwt');
    } finally {
      navigate('/login');
    }
  };

  const handleSidebarItemClick = (item) => {
    setSelected(item.key);
    navigate(item.path);
  };

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: '#f5f5f5' }}>
      {/* Sidebar */}
      <Paper elevation={3} sx={{ width: 220, minHeight: '100vh', borderRadius: 0, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: '#111', color: '#fff' }}>
        <div>
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" sx={{ color: '#fff' }}>Admin Panel</Typography>
          <List>
            {sidebarItems.map(item => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton 
                  selected={selected === item.key} 
                  onClick={() => handleSidebarItemClick(item)}
                  sx={{
                    color: '#fff',
                    ...(selected === item.key && {
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
      {/* İçerik */}
      <Box flex={1} p={4}>
        <Outlet />
      </Box>
    </Box>
  );
} 