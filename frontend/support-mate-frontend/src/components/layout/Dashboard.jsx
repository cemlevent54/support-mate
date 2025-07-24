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
import { logout } from '../../api/authApi';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import { jwtDecode } from 'jwt-decode';

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' }
];

export default function Dashboard() {
  const [selected, setSelected] = useState('dashboard');
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Kullanıcı rolünü JWT'den al
  let roleName = null;
  const token = localStorage.getItem('jwt');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      roleName = decoded.roleName;
    } catch (e) {}
  }

  // Sadece admin rolü için menüleri göster
  const sidebarItems = [
    { key: 'dashboard', label: t('adminDashboard.dashboard'), path: '/admin', roles: ['Admin'] },
    { key: 'users', label: t('adminDashboard.users'), path: '/admin/users', roles: ['Admin'] },
    { key: 'roles', label: t('adminDashboard.roles'), path: '/admin/roles', roles: ['Admin'] },
    { key: 'tickets', label: t('adminDashboard.tickets'), path: '/admin/tickets', roles: ['Admin'] },
    { key: 'categories', label: t('adminDashboard.categories'), path: '/admin/categories', roles: ['Admin'] },
    { key: 'kanban', label: t('adminDashboard.kanban'), path: '/admin/kanban', roles: ['Admin'] },
    { key: 'products', label: t('adminDashboard.products'), path: '/admin/products', roles: ['Admin'] },
    // { key: 'settings', label: t('adminDashboard.settings'), path: '/admin/settings', roles: ['Admin'] },
  ];
  const filteredSidebarItems = sidebarItems.filter(item => !item.roles || (roleName && item.roles.includes(roleName)));

  React.useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = filteredSidebarItems.find(item => currentPath === item.path);
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
      await logout(token);
    } catch (e) {
      // Hata olsa da localStorage temizlensin ve yönlendirilsin
      localStorage.removeItem('jwt');
    } finally {
      navigate('/login');
      setTimeout(() => { window.location.reload(); }, 100);
    }
  };

  const handleSidebarItemClick = (item) => {
    setSelected(item.key);
    navigate(item.path);
  };

  const handleLanguageChange = (e) => {
    onLanguageChange(e.target.value);
    // window.location.reload(); // LanguageProvider zaten context ile değişimi sağlıyor
  };

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: '#f5f5f5' }}>
      {/* Sidebar */}
      <Paper elevation={3} sx={{ width: 220, minHeight: '100vh', borderRadius: 0, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: '#111', color: '#fff' }}>
        <div>
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" sx={{ color: '#fff' }}>{t('adminDashboard.title')}</Typography>
          <Select
            value={language}
            onChange={handleLanguageChange}
            size="small"
            sx={{ mb: 2, width: '100%', bgcolor: '#222', color: '#fff', '.MuiSvgIcon-root': { color: '#fff' } }}
          >
            {LANGUAGES.map(lang => (
              <MenuItem key={lang.code} value={lang.code}>{lang.label}</MenuItem>
            ))}
          </Select>
          <List>
            {filteredSidebarItems.map(item => (
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
          {t('components.navbar.logout')}
        </Button>
      </Paper>
      {/* İçerik */}
      <Box flex={1} p={4}>
        <Outlet />
      </Box>
    </Box>
  );
} 