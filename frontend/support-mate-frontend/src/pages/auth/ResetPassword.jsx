import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import { resetPassword } from '../../api/authApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery();
  const token = query.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword({ token, password: newPassword, confirmPassword });
      setOpen(true);
    } catch (err) {
      setError(
        err?.response?.data?.message || t('pages.signup.error', 'Bir hata oluştu. Lütfen tekrar deneyin.')
      );
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
        <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center">
          {t('pages.login.reset', 'Şifreyi Sıfırla')}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={3}>
          {t('pages.myAccount.passwordTitle', 'Yeni şifrenizi girin ve onaylayın.')}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            required
            fullWidth
            label={t('pages.myAccount.newPassword', 'New Password')}
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            required
            fullWidth
            label={t('pages.myAccount.confirmPassword', 'Confirm Password')}
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            size="small"
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
        onClose={handleClose}
        message={t('pages.myAccount.passwordResetSuccess', 'Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 