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
import { useLanguage } from '../../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import { useEffect } from 'react';
import EmployeeKanbanBoard from '../../pages/support/EmployeeKanbanBoard';
import SupportKanbanBoard from '../../pages/support/SupportKanbanBoard';
import isEmployee from '../../auth/isEmployee';
import isCustomerSupporter from '../../auth/isCustomerSupporter';

const sidebarItems = [
  { key: 'requests', labelKey: 'supportDashboard.sidebar.requests', path: '/support/requests' },
  { key: 'chats', labelKey: 'supportDashboard.sidebar.chats', path: '/support/chats' },
  { key: 'kanban', labelKey: 'supportDashboard.sidebar.kanban', path: '/support/kanban' },
  { key: 'profile', labelKey: 'supportDashboard.sidebar.profile', path: '/support/profile' },
];

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' }
];

export default function SupportLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, onLanguageChange } = useLanguage();
  const { t } = useTranslation();

  // Kullanıcı rolünü JWT'den al
  let roleName = null;
  const token = localStorage.getItem('jwt');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      roleName = decoded.roleName;
    } catch (e) {}
  }

  // Eğer employee ise support paneline erişimi engelle

  // Employee ise chats ve requests menüsünü gösterme
  const filteredSidebarItems = isEmployee({ roleName })
    ? sidebarItems.filter(item => item.key !== 'chats' && item.key !== 'requests')
    : sidebarItems;

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
      <Paper elevation={3} style={{ width: 220, minHeight: '100vh', borderRadius: 0, padding: 16, display: 'flex', flexDirection: 'column', background: '#111', color: '#fff' }}>
        {/* Sidebar içeriği */}
        <Typography variant="h6" fontWeight={700} mb={1} textAlign="center" sx={{ color: '#fff' }}>
          {isEmployee({ roleName }) ? 'Employee Panel' : 'Support Panel'}
        </Typography>
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="language-select" style={{ color: '#fff', fontSize: 14, marginBottom: 4, display: 'block' }}>Dil Seçimi</label>
          <select
            id="language-select"
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #444', background: '#222', color: '#fff', fontSize: 14 }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>
        <List sx={{ flexGrow: 1 }}>
          {filteredSidebarItems.map(item => (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: '#fff',
                  ...(location.pathname === item.path && {
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#1976d2' },
                  }),
                  '&:hover': { bgcolor: '#222' },
                }}
              >
                <ListItemText primary={t(item.labelKey)} sx={{ color: '#fff' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mt: 2, borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: '#222' } }}>
          Çıkış Yap
        </Button>
      </Paper>
      <div style={{ flex: 1 }}>
        {/* Dinamik kanban yönlendirme */}
        {location.pathname === '/support/kanban' ? (
          isEmployee({ roleName }) ? <EmployeeKanbanBoard /> : <SupportKanbanBoard />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
} 