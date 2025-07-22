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

const sidebarItems = [
  { key: 'requests', labelKey: 'supportDashboard.sidebar.requests', path: '/support/requests' },
  { key: 'chats', labelKey: 'supportDashboard.sidebar.chats', path: '/support/chats' },
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
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" style={{ color: '#fff' }}>{t('supportDashboard.title', 'Support Panel')}</Typography>
          {/* Basit HTML select ile dil seçici */}
          <div style={{ marginBottom: 16 }}>
            
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
                  <ListItemText primary={t(item.labelKey)} sx={{ color: '#fff' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </div>
        <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mt: 2, borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: '#222' } }}>
          {t('components.navbar.logout', 'Çıkış Yap')}
        </Button>
      </Paper>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
} 