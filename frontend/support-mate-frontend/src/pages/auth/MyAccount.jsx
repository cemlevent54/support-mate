import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSingleLineTextArea from '../../components/common/CustomSingleLineTextArea';
import CustomButton from '../../components/common/CustomButton';
import { getAuthenticatedUser, updateUser, deleteUser } from '../../api/userApi';
import { changePassword } from '../../api/authApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'newPassword':
        setNewPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    
    // Validasyon
    if (!firstName || firstName.length < 1) {
      setError(t('components.customTextInput.validation.required'));
      return;
    }
    
    if (!lastName || lastName.length < 1) {
      setError(t('components.customTextInput.validation.required'));
      return;
    }
    
    if (!email || email.length < 1) {
      setError(t('components.customTextInput.validation.required'));
      return;
    }
    
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
    
    // Validasyon
    if (!newPassword || newPassword.length < 6) {
      setError(t('pages.myAccount.passwordMinLength', 'Şifre en az 6 karakter olmalıdır.'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('pages.myAccount.passwordMismatch', 'Şifreler eşleşmiyor.'));
      return;
    }
    
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await changePassword({
        newPassword,
        confirmPassword
      });
      setMessage(t('pages.myAccount.passwordUpdateSuccess', 'Şifreniz başarıyla güncellendi.'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err?.response?.data?.message || t('pages.myAccount.passwordUpdateError', 'Şifre güncellenemedi.')
      );
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
    <div style={{ 
      background: '#f5f5f5', 
      minHeight: '100vh',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{ 
        marginTop: '24px',
        marginBottom: '32px',
        fontWeight: 700,
        fontSize: '28px',
        textAlign: 'center',
        color: '#1f2937'
      }}>
        {t('pages.myAccount.title')}
      </h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        gap: '24px',
        maxWidth: '900px',
        width: '100%'
      }}>
        {/* Kullanıcı Bilgileri Card */}
        <div style={{ 
          flex: 1,
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          minWidth: '300px'
        }}>
          <form onSubmit={handleSave}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              {t('pages.myAccount.infoTitle')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CustomSingleLineTextArea
                label={t('pages.myAccount.firstName')}
                name="firstName"
                value={firstName}
                onChange={handleChange}
                required
                placeholder={t('pages.myAccount.firstNamePlaceholder', 'Adınızı girin')}
                minLength={1}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.myAccount.lastName')}
                name="lastName"
                value={lastName}
                onChange={handleChange}
                required
                placeholder={t('pages.myAccount.lastNamePlaceholder', 'Soyadınızı girin')}
                minLength={1}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.myAccount.email')}
                name="email"
                value={email}
                onChange={handleChange}
                required
                placeholder={t('pages.myAccount.emailPlaceholder', 'E-posta adresinizi girin')}
                minLength={1}
                maxLength={100}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.myAccount.phone')}
                name="phone"
                value={phone}
                onChange={handleChange}
                placeholder={t('pages.myAccount.phonePlaceholder', 'Telefon numaranızı girin')}
                maxLength={20}
                showCharCounter={true}
                size="small"
              />
              
              <CustomButton
                type="submit"
                variant="primary"
                disabled={loading}
                size="small"
                style={{ marginTop: '8px' }}
              >
                {loading ? t('pages.myAccount.saving', 'Kaydediliyor...') : t('pages.myAccount.save')}
              </CustomButton>
            </div>
          </form>
        </div>
        
        {/* Şifre Güncelleme Card */}
        <div style={{ 
          flex: 1,
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          minWidth: '300px'
        }}>
          <form onSubmit={handlePasswordUpdate}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              {t('pages.myAccount.passwordTitle')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CustomSingleLineTextArea
                label={t('pages.myAccount.newPassword')}
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={handleChange}
                required
                placeholder={t('pages.myAccount.newPasswordPlaceholder', 'Yeni şifrenizi girin')}
                minLength={6}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.myAccount.confirmPassword')}
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleChange}
                required
                placeholder={t('pages.myAccount.confirmPasswordPlaceholder', 'Şifrenizi tekrar girin')}
                minLength={6}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomButton
                type="submit"
                variant="secondary"
                disabled={loading}
                size="small"
                style={{ marginTop: '8px' }}
              >
                {loading ? t('pages.myAccount.updating', 'Güncelleniyor...') : t('pages.myAccount.updatePassword')}
              </CustomButton>
            </div>
          </form>
        </div>
      </div>
      
      {/* Hesap Silme Bölümü */}
      <div style={{ 
        marginTop: '48px',
        textAlign: 'center',
        maxWidth: '900px',
        width: '100%'
      }}>
        <CustomButton
          variant="danger"
          onClick={handleDeleteAccount}
          disabled={loading}
          size="small"
        >
          {t('pages.myAccount.deleteAccount')}
        </CustomButton>
        
        <ConfirmModal
          open={confirmOpen}
          translationKey="delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
      
      {/* Snackbar Popup */}
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarType} sx={{ width: '100%' }}>
          {snackbarType === 'success' ? message : error}
        </Alert>
      </Snackbar>
    </div>
  );
} 