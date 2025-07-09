import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { getAuthenticatedUser, updateUser, deleteUser } from '../api/userApi';
import LoadingButton from '@mui/lab/LoadingButton';
import ConfirmModal from './ConfirmModal';
import { useNavigate } from 'react-router-dom';

export default function MyAccount() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarType, setSnackbarType] = useState('success'); // 'success' | 'error'
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  // Kullanıcı bilgisini çek
  useEffect(() => {
    setLoading(true);
    getAuthenticatedUser()
      .then((res) => {
        const user = res.data || res; // API'nin data alanı olabilir
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhone(user.phoneNumber || '');
        setUserId(user._id || user.id || null);
        setError(null);
      })
      .catch((err) => {
        setError(t('pages.myAccount.fetchError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  // Snackbar tetikleyici
  useEffect(() => {
    if (message) {
      setSnackbarType('success');
      setOpenSnackbar(true);
    } else if (error) {
      setSnackbarType('error');
      setOpenSnackbar(true);
    }
  }, [message, error]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
    setMessage(null);
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const updateData = { firstName, lastName, email, phoneNumber: phone };
      const res = await updateUser(userId, updateData);
      setMessage(t('pages.myAccount.updateSuccess'));
    } catch (err) {
      setError(err.message || t('pages.myAccount.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (newPassword !== confirmPassword) {
      setError(t('pages.myAccount.passwordMismatch'));
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const updateData = { password: newPassword };
      await updateUser(userId, updateData);
      setMessage(t('pages.myAccount.passwordUpdateSuccess'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || t('pages.myAccount.passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await deleteUser(userId);
      localStorage.removeItem('jwt');
      setMessage(t('accountDeleteSuccess'));
      setTimeout(() => navigate('/login'), 1500);
      // Hesap silindikten sonra logout veya yönlendirme yapılabilir
    } catch (err) {
      setError(t('accountDeleteError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center" mt={6}>
        {t('pages.myAccount.title')}
      </Typography>
      
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} mt={2}>
        {/* Kullanıcı Bilgileri Card */}
        <Paper elevation={4} sx={{ flex: 1, p: 4, minWidth: 300, width: 400 }}>
          <form onSubmit={handleSave}>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('pages.myAccount.infoTitle')}</Typography>
            <Stack spacing={2}>
              <TextField label={t('pages.myAccount.firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} fullWidth size="small" />
              <TextField label={t('pages.myAccount.lastName')} value={lastName} onChange={e => setLastName(e.target.value)} fullWidth size="small" />
              <TextField label={t('pages.myAccount.email')} value={email} onChange={e => setEmail(e.target.value)} fullWidth size="small" />
              <TextField label={t('pages.myAccount.phone')} value={phone} onChange={e => setPhone(e.target.value)} fullWidth size="small" />
              <LoadingButton
                type="submit"
                variant="contained"
                loading={loading}
                sx={{ mt: 1, fontWeight: 600, textTransform: 'none' }}
              >
                {t('pages.myAccount.save')}
              </LoadingButton>
            </Stack>
          </form>
        </Paper>
        {/* Şifre Güncelleme Card */}
        <Paper elevation={4} sx={{ flex: 1, p: 4, minWidth: 300, width: 400 }}>
          <form onSubmit={handlePasswordUpdate}>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('pages.myAccount.passwordTitle')}</Typography>
            <Stack spacing={2}>
              <TextField label={t('pages.myAccount.newPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth size="small" />
              <TextField label={t('pages.myAccount.confirmPassword')} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} fullWidth size="small" />
              <Button type="submit" variant="outlined" sx={{ mt: 1, fontWeight: 600, textTransform: 'none' }}>{t('pages.myAccount.updatePassword')}</Button>
            </Stack>
          </form>
        </Paper>
      </Box>
      <Box mt={6} textAlign="center">
        <Button variant="outlined" color="error" sx={{ fontWeight: 600, textTransform: 'none' }} onClick={handleDeleteAccount}>
          {t('pages.myAccount.deleteAccount')}
        </Button>
        <ConfirmModal
          open={confirmOpen}
          translationKey="delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </Box>
      {/* Snackbar Popup */}
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarType} sx={{ width: '100%' }}>
          {snackbarType === 'success' ? message : error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 