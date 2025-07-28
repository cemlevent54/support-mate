import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { MuiOtpInput } from 'mui-one-time-password-input';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, verifyEmail } from '../../api/authApi';
import Navbar from '../../components/layout/Navbar';
import AppLogo from '../../components/common/AppLogo';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Sidebar from '../../components/layout/Sidebar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const SixDigitVerifyEmail = ({ onVerify }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // URL'den email ve token parametrelerini al
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  // Navbar handler fonksiyonları
  const handleLogin = () => navigate('/login');
  const handleSignup = () => navigate('/signup');
  const handleMyAccount = () => navigate('/my-account');
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };
  const handleHome = () => navigate('/');

  const handleChange = (newValue) => {
    if (newValue.length <= 6) setOtp(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (otp.length !== 6) {
        setSnackbar({ open: true, message: t('pages.verifyEmail.invalidCode', 'Lütfen 6 haneli kodu girin.'), severity: 'error' });
        setLoading(false);
        return;
      }
      // API'ye doğrulama isteği gönder
      await verifyEmail({ code: otp, token });
      setSnackbar({ open: true, message: t('pages.verifyEmail.success', 'Kod doğrulandı! Giriş ekranına yönlendiriliyorsunuz...'), severity: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setSnackbar({ open: true, message: t('pages.verifyEmail.error', 'Kod doğrulanamadı.'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Navbar */}
      <Navbar
        title=""
        isAuth={false}
        userRole="guest"
        onLogin={handleLogin}
        onSignup={handleSignup}
        onMyAccount={handleMyAccount}
        onLogout={handleLogout}
        onHome={handleHome}
        leftIcon={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppLogo />
            {isMobile && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setDrawerOpen(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </div>
        }
        mobileSidebar={
          <Sidebar
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            isAuth={false}
            userRole="guest"
            onLogin={handleLogin}
            onSignup={handleSignup}
            onMyAccount={handleMyAccount}
            onLogout={handleLogout}
            onHome={handleHome}
          />
        }
      />
      
      {/* Ana içerik */}
      <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ pt: 12 }}>
        <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center">
            {t('pages.verifyEmail.title', 'E-posta Doğrulama')}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            {t('pages.verifyEmail.subtitle', 'E-posta adresinize gönderilen 6 haneli kodu girin.')}
          </Typography>
          <form onSubmit={handleSubmit}>
            <MuiOtpInput
              value={otp}
              onChange={handleChange}
              length={6}
              autoFocus
              sx={{ mb: 3, width: '100%', justifyContent: 'center' }}
              TextFieldsProps={{ size: 'small', sx: { width: 100, height: 60, mx: 0.4, borderRadius: 2 }, type: 'password' }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || otp.length !== 6}
              sx={{ fontWeight: 600, textTransform: 'none', py: 1 }}
            >
              {t('pages.verifyEmail.button', 'Onayla')}
            </Button>
          </form>
        </Paper>
      </Box>
      
      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SixDigitVerifyEmail;
