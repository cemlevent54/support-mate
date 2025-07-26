import React, { useState, useEffect } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { login, googleLogin } from '../../api/authApi';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from '@react-oauth/google';
import isAdmin from '../../auth/isAdmin';
import isCustomerSupporter from '../../auth/isCustomerSupporter';
import isEmployee from '../../auth/isEmployee';
import isLeader from '../../auth/isLeader';

const LoginCard = ({ onUserLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const urlRedirect = params.get("redirect");

  // İlk render'da sessionStorage'a yaz
  useEffect(() => {
    if (urlRedirect) {
      sessionStorage.setItem("redirectAfterLogin", urlRedirect);
    }
  }, [urlRedirect]);

  // Kullanıcı zaten login ise ve sessionStorage'da redirect varsa otomatik yönlendir
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    const redirect = sessionStorage.getItem("redirectAfterLogin");
    if (jwt && redirect) {
      navigate(redirect, { replace: true });
      sessionStorage.removeItem("redirectAfterLogin");
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("jwt", token);
      const redirect = sessionStorage.getItem("redirectAfterLogin");
      if (redirect) {
        navigate(redirect, { replace: true });
        sessionStorage.removeItem("redirectAfterLogin");
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [token, navigate]);

  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (e) => {
    // Eğer event varsa prevent default
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setError('');
    try {
      const result = await login({ email, password });
      if (result && result.data && result.data.accessToken) {
        localStorage.setItem('jwt', result.data.accessToken);
  
        // JWT'den rol bilgilerini al
        const decoded = jwtDecode(result.data.accessToken);
        const roleName = decoded.roleName;
        setSnackbar({ open: true, message: t('pages.login.success'), severity: 'success' });

        // App.jsx'teki state'i güncelle
        if (onUserLogin) onUserLogin(roleName || 'User');

        if (isAdmin(decoded)) navigate('/admin');
        else if (isCustomerSupporter(decoded)) navigate('/support');
        else if (isEmployee(decoded)) navigate('/support');
        else if (isLeader(decoded)) navigate('/support');
        else {
          setTimeout(() => navigate('/'), 1000);
        }
      } else {
        // Başarısız login durumunda sayfa yenilenmez, kullanıcı aynı sayfada kalır
        const errorMessage = t('pages.login.error');
        setError(errorMessage);
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      }
    } catch (err) {
      console.log('Login error details:', err);
      console.log('Error response:', err?.response);
      console.log('Error data:', err?.response?.data);
      
      const errorMessage = err?.response?.data?.message || t('pages.login.error');
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      // Hata durumunda da sayfa yenilenmez, kullanıcı aynı sayfada kalır
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
        <Box component="div" noValidate>
          <Stack spacing={3.5}>
            <TextField 
              fullWidth 
              id="email" 
              label={t('pages.login.email')} 
              name="email" 
              autoComplete="email" 
              size="small" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
                          <TextField
                fullWidth
                name="password"
                label={t('pages.login.password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                size="small"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
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
            type="button"
            fullWidth
            variant="contained"
            onClick={(e) => handleSubmit(e)}
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
                  if (isAdmin(decoded)) navigate('/admin');
                  else if (isCustomerSupporter(decoded)) navigate('/support');
                  else if (isEmployee(decoded)) navigate('/support');
                  else setTimeout(() => navigate('/'), 1000);
                } else {
                  // Google login başarısız - sayfa yenilenmez
                  setSnackbar({ open: true, message: t('pages.login.error'), severity: 'error' });
                  console.log('Google login response:', result);
                }
              } catch (err) {
                const errorMessage = err?.response?.data?.message || t('pages.login.error');
                setSnackbar({ open: true, message: errorMessage, severity: 'error' });
                console.error('Google login error:', err);
                // Google login hata durumunda da sayfa yenilenmez
              }
            }}
            onError={() => {
              setSnackbar({ open: true, message: t('pages.login.error'), severity: 'error' });
              // Google login error durumunda da sayfa yenilenmez
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
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={snackbar.severity === 'error' ? 5000 : 3000} 
        onClose={handleSnackbarClose} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            fontSize: '14px',
            fontWeight: 500,
            '& .MuiAlert-message': {
              fontSize: '14px',
              fontWeight: 500
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginCard; 