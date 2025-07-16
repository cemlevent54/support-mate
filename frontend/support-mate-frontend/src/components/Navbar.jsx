import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useLanguage } from './LanguageProvider';
import { useTranslation } from 'react-i18next';
import { logout as apiLogout } from '../api/authApi';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';

export default function Navbar({
  title = '',
  leftIcon,
  isAuth = false,
  mobileSidebar,
  onLogin,
  onSignup,
  onMyAccount,
  onLogout,
  onHome,
  userRole,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { language, onLanguageChange } = useLanguage();
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('jwt');
      await apiLogout(token);
      setSnackbar({ open: true, message: t('components.navbar.logoutSuccess') || 'Çıkış yapıldı', severity: 'success' });
      if (onLogout) onLogout();
      setTimeout(() => { if (onHome) onHome(); }, 1000);
    } catch (err) {
      setSnackbar({ open: true, message: t('components.navbar.logoutError') || 'Çıkış yapılamadı', severity: 'error' });
    }
  };

  let rightContent;
  if (userRole === 'user' && isAuth) {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={() => navigate('/my-requests')}>{t('components.navbar.requests')}</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={() => navigate('/create-ticket')}>{t('components.navbar.createRequest')}</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }}>{t('components.navbar.liveChat')}</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onMyAccount}>{t('components.navbar.myAccount')}</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={handleLogout}>{t('components.navbar.logout')}</Button>
      </>
    );
  } else if (userRole === 'user' && !isAuth) {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }}>{t('components.navbar.createRequest')}</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onLogin}>{t('components.navbar.login')}</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onSignup}>{t('components.navbar.signup')}</Button>
      </>
    );
  } else if (!isAuth) {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onHome}>{t('components.navbar.home')}</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onLogin}>{t('components.navbar.login')}</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onSignup}>{t('components.navbar.signup')}</Button>
      </>
    );
  } else {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onHome}>{t('components.navbar.home')}</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={onMyAccount}>{t('components.navbar.myAccount')}</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' }, textTransform: 'none' }} onClick={handleLogout}>{t('components.navbar.logout')}</Button>
      </>
    );
  }

  const languageToggle = (
    <FormControl size="small" sx={{ ml: 2, minWidth: 80 }}>
      <Select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        sx={{
          background: '#fff',
          borderRadius: 2,
          '& .MuiSelect-select': {
            fontWeight: 'bold',
            color: '#1976d2',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
      >
        <MenuItem value="tr">TR</MenuItem>
        <MenuItem value="en">EN</MenuItem>
      </Select>
    </FormControl>
  );

  return (
    <Box sx={{ flexGrow: 1, width: '100vw', minHeight: '80px', background: 'transparent' }}>
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            width: { xs: '95vw', sm: '90vw', md: 1100 },
            maxWidth: 1100,
            borderRadius: 3,
            boxShadow: 6,
            overflow: 'hidden',
            transition: 'box-shadow 0.3s',
            pointerEvents: 'auto',
            background: 'transparent',
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <AppBar
            position="static"
            elevation={0}
            sx={{
              background: '#1976d2',
              borderRadius: 3,
              boxShadow: 'none',
              px: 2,
            }}
          >
            <Toolbar>
              {leftIcon && (
                <Box sx={{ mr: 2 }}>{leftIcon}</Box>
              )}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                {title}
              </Typography>
              {isMobile && mobileSidebar}
              {!isMobile && rightContent}
              {!isMobile && languageToggle}
            </Toolbar>
          </AppBar>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 