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
import { register, googleRegister } from '../../api/authApi';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarType, setSnackbarType] = useState('success'); // 'success' | 'error'
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();
  const navigate = useNavigate();

  const localLang = localStorage.getItem('language') || 'tr';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Frontend validasyonları - sadece error state'e set et, snackbar gösterme
    if (!firstName || !email || !password || !confirmPassword) {
      setError(t('pages.signup.required'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('pages.signup.passwordsNoMatch'));
      return;
    }
    
    try {
      const result = await register({ firstName, lastName, email, password, language: localLang });
      
      // API başarılı response'unda snackbar göster
      const successMsg = result?.message || t('pages.signup.success');
      setSnackbarType('success');
      setSnackbarMsg(successMsg);
      setOpenSnackbar(true);
      
      // Form temizle
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err) {
      // API error response'unda snackbar göster
      const errorMsg = err?.response?.data?.message || err?.message || t('pages.signup.error');
      setSnackbarType('error');
      setSnackbarMsg(errorMsg);
      setOpenSnackbar(true);
      setError(errorMsg);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 6, p: 2.5, borderRadius: 3, width: '100%', maxWidth: 500 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
            {t('pages.signup.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('pages.signup.subtitle')}
          </Typography>
        </Box>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Stack spacing={3.5} direction={{ xs: 'column', sm: 'row' }}>
            <TextField required fullWidth id="firstName" label={t('pages.signup.firstName')} name="firstName" autoComplete="given-name" size="small" sx={{ minWidth: 0, flex: 1 }} value={firstName} onChange={e => setFirstName(e.target.value)} />
            <TextField fullWidth id="lastName" label={t('pages.signup.lastName')} name="lastName" autoComplete="family-name" size="small" sx={{ minWidth: 0, flex: 1 }} value={lastName} onChange={e => setLastName(e.target.value)} />
          </Stack>
          <Stack spacing={3.5} mt={2}>
            <TextField required fullWidth id="email" label={t('pages.signup.email')} name="email" autoComplete="email" size="small" value={email} onChange={e => setEmail(e.target.value)} />
            <TextField
              required
              fullWidth
              name="password"
              label={t('pages.signup.password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
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
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label={t('pages.signup.confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              size="small"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword((show) => !show)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
          {/* Frontend validation error mesajı */}
          {error && (
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ mt: 1, textAlign: 'center' }}
            >
              {error}
            </Typography>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2.5, mb: 1.5, py: 1, fontWeight: 600, textTransform: 'none' }}
          >
            {t('pages.signup.button')}
          </Button>
          {/* Google ile Kayıt Ol butonu */}
          <GoogleLogin
            onSuccess={async credentialResponse => {
              try {
                console.log('Google register starting with locale:', localLang);
                const result = await googleRegister(credentialResponse.credential, localLang);
                console.log('Google register result:', result);
                
                // Response yapısını kontrol et
                const responseData = result?.data || result;
                const accessToken = responseData?.accessToken;
                const successMessage = responseData?.message || result?.message;
                
                if (accessToken) {
                  localStorage.setItem('jwt', accessToken);
                  
                  // API başarılı response'unda snackbar göster
                  const successMsg = successMessage;
                  setSnackbarType('success');
                  setSnackbarMsg(successMsg);
                  setOpenSnackbar(true);
                  
                  setTimeout(() => window.location.href = '/', 1000);
                } else {
                  // Access token yoksa hata olarak değerlendir
                  const errorMsg = successMessage || t('pages.signup.error');
                  setSnackbarType('error');
                  setSnackbarMsg(errorMsg);
                  setOpenSnackbar(true);
                  console.log('Google register response without access token:', result);
                }
              } catch (err) {
                console.error('Google register error details:', err);
                
                // API error response'unda snackbar göster
                const errorMsg = err?.response?.data?.message || err?.message || t('pages.signup.error');
                setSnackbarType('error');
                setSnackbarMsg(errorMsg);
                setOpenSnackbar(true);
              }
            }}
            onError={(error) => {
              // Google OAuth hatası - API response değil, bu yüzden snackbar gösterme
              console.error('Google OAuth error:', error);
              // Opsiyonel: Kullanıcıya bilgi ver
              setSnackbarType('error');
              setSnackbarMsg(t('pages.signup.googleOAuthError') || 'Google ile giriş yapılırken bir hata oluştu');
              setOpenSnackbar(true);
            }}
            text="signup_with"
            shape="rectangular"
            size="large"
            locale={localLang}
          />
          <Box mt={1.5} textAlign="center">
            <Typography variant="body2">
              {t('pages.signup.alreadyUser')}{' '}
              <Link href="#" color="primary" underline="hover" onClick={() => navigate('/login')}>
                {t('pages.signup.login')}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarType} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
} 