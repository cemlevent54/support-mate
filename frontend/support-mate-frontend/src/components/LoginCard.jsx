import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import { login, googleLogin } from '../api/authApi';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginCard({ onUserLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ email, password });
      if (result && result.data && result.data.accessToken) {
        localStorage.setItem('jwt', result.data.accessToken);
  
        // JWT'den rol bilgilerini al
        const decoded = jwtDecode(result.data.accessToken);
        const roleName = decoded.roleName;
        const isAdmin = roleName === 'Admin';
        const isSupport = roleName === 'Customer Supporter';
        const isEmployee = roleName === 'Employee';

        setSnackbar({ open: true, message: t('pages.login.success'), severity: 'success' });

        // App.jsx'teki state'i güncelle
        if (onUserLogin) onUserLogin(roleName || 'User');

        if (isAdmin) navigate('/admin');
        else if (isSupport) navigate('/support');
        else if (roleName === 'Support') navigate('/support');
        else if (isEmployee) navigate('/employee');
        else {
          setTimeout(() => navigate('/'), 1000);
        }
      } else {
        if (onUserLogin) onUserLogin('user');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(t('pages.login.error'));
      setSnackbar({ open: true, message: t('pages.login.error'), severity: 'error' });
    }
  };

  const localLang = localStorage.getItem('language') || 'tr';

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 6, p: 2.5, borderRadius: 3, width: '100%', maxWidth: 500 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
            {t('pages.login.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('pages.login.subtitle')}
          </Typography>
        </Box>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Stack spacing={3.5}>
            <TextField required fullWidth id="email" label={t('pages.login.email')} name="email" autoComplete="email" size="small" value={email} onChange={e => setEmail(e.target.value)} />
            <TextField
              required
              fullWidth
              name="password"
              label={t('pages.login.password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              size="small"
              value={password}
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3.5, mb: 1.5, py: 1, fontWeight: 600, textTransform: 'none' }}
          >
            {t('pages.login.button')}
          </Button>
          {/* Google ile Giriş Yap butonu */}
          <GoogleLogin
            onSuccess={async credentialResponse => {
              try {
                const result = await googleLogin(credentialResponse.credential);
                const accessToken = result?.accessToken || result?.data?.accessToken;
                if (accessToken) {
                  localStorage.setItem('jwt', accessToken);
                  const decoded = jwtDecode(accessToken);
                  const roleName = decoded.roleName;
                  setSnackbar({ open: true, message: t('pages.login.success'), severity: 'success' });
                  if (onUserLogin) onUserLogin(roleName || 'User');
                  if (roleName === 'Admin') navigate('/admin');
                  else if (roleName === 'Customer Supporter' || roleName === 'Support') navigate('/support');
                  else if (roleName === 'Employee') navigate('/employee');
                  else setTimeout(() => navigate('/'), 1000);
                } else {
                  setSnackbar({ open: true, message: t('pages.login.error'), severity: 'error' });
                  console.log('Google login response:', result);
                }
              } catch (err) {
                setSnackbar({ open: true, message: t('pages.login.error'), severity: 'error' });
                console.error('Google login error:', err);
              }
            }}
            onError={() => {
              setSnackbar({ open: true, message: t('pages.login.error'), severity: 'error' });
            }}
            text="signin_with"
            shape="rectangular"
            size="large"
            locale={localLang}
          />
          <Box mt={1.5} textAlign="center">
            <Typography variant="body2">
              {t('pages.login.noAccount')}{' '}
              <Link href="#" color="primary" underline="hover" onClick={() => navigate('/signup')}>
                {t('pages.login.signup')}
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('pages.login.forgot')}{' '}
              <Link href="#" color="primary" underline="hover" onClick={() => navigate('/forgot-password')}>
                {t('pages.login.reset')}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 