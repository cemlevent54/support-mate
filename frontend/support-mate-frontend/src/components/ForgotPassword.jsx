import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import { forgotPassword } from '../api/authApi';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword(email);
      setOpen(true);
    } catch (err) {
      setError(t('pages.signup.error') || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
        <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center">
          {t('pages.login.reset', 'Şifremi Unuttum')}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={3}>
          {t('pages.login.forgot', 'Şifrenizi sıfırlamak için e-posta adresinizi girin.')}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            required
            fullWidth
            id="email"
            label={t('pages.login.email', 'Email Address')}
            name="email"
            autoComplete="email"
            size="small"
            value={email}
            onChange={e => setEmail(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 600, textTransform: 'none' }}>
            {t('pages.login.reset', 'Gönder')}
          </Button>
        </form>
        {error && <Typography color="error" mt={2} align="center">{error}</Typography>}
      </Paper>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        message={t('pages.login.forgotMailSent', 'Şifre sıfırlama maili gönderildi')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 