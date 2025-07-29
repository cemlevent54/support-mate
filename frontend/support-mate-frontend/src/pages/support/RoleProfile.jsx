import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import CustomSingleLineTextArea from '../../components/common/CustomSingleLineTextArea';
import CustomButton from '../../components/common/CustomButton';
import CustomRadioButton from '../../components/common/CustomRadioButton';
import { getAuthenticatedUser, updateUser } from '../../api/userApi';
import { changePassword } from '../../api/authApi';
import { getCategories } from '../../api/categoryApi';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { jwtDecode } from 'jwt-decode';

export default function RoleProfile() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarType, setSnackbarType] = useState('success');
  
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();
  
  // Mock radio button state'i - LanguageProvider'dan başlat
  const [languagePreference, setLanguagePreference] = useState(language);

  // Kullanıcı rolünü JWT'den al
  let roleName = null;
  const token = localStorage.getItem('jwt');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      roleName = decoded.roleName;
    } catch (e) {}
  }

  // Kategori listesi (Leader rolü için)
  const [categories, setCategories] = useState([]);

  // Kategori listesini çek
  useEffect(() => {
    if (roleName === 'Leader') {
      setCategoriesLoading(true);
      getCategories()
        .then((res) => {
          const categoriesData = res.data || res;
          console.log('Kategoriler yüklendi:', categoriesData);
          setCategories(categoriesData);
        })
        .catch((err) => {
          console.error('Kategoriler yüklenirken hata:', err);
        })
        .finally(() => {
          setCategoriesLoading(false);
        });
    }
  }, [roleName]);

  // Kullanıcı bilgisini çek
  useEffect(() => {
    setLoading(true);
    getAuthenticatedUser()
      .then((res) => {
        const user = res.data || res;
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhone(user.phoneNumber || '');
        setUserId(user._id || user.id || null);
        
        // Kullanıcının veritabanındaki dil tercihini radio button'a ayarla
        const userLanguagePreference = user.languagePreference || 'tr';
        setLanguagePreference(userLanguagePreference);
        
        // LanguageProvider'ı kullanıcının veritabanındaki dil tercihi ile güncelle
        if (language !== userLanguagePreference) {
          onLanguageChange(userLanguagePreference);
        }
        
        // Leader rolü için kategori bilgilerini set et
        if (roleName === 'Leader' && user.categoryIds) {
          console.log('Kullanıcı kategori ID\'leri:', user.categoryIds);
          setSelectedCategories(user.categoryIds.map(id => id.toString()));
        }
        
        setError(null);
      })
      .catch((err) => {
        setError(t('pages.myAccount.fetchError'));
      })
      .finally(() => setLoading(false));
  }, [t, roleName]);

  // LanguageProvider'daki dil değişikliğini dinle ve radio button'ı güncelle
  useEffect(() => {
    console.log('LanguageProvider dil değişikliği:', language);
    setLanguagePreference(language);
  }, [language]);

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
      case 'languagePreference':
        console.log('Radio button seçildi:', value);
        setLanguagePreference(value);
        // Radio button seçildiğinde hemen backend'e kaydet
        handleLanguagePreferenceChange(value);
        break;
      default:
        break;
    }
  };

  const handleLanguagePreferenceChange = async (selectedLanguage) => {
    console.log('handleLanguagePreferenceChange çağrıldı:', selectedLanguage);
    console.log('mevcut language state:', language);
    
    try {
      // UI'da dili güncelle (Accept-Language header'ı da güncellenir)
      onLanguageChange(selectedLanguage);
      
      // Eğer kullanıcı giriş yapmışsa backend'e de kaydet
      if (userId) {
        try {
          console.log('Backend\'e kaydediliyor:', selectedLanguage);
          // Backend'e dil tercihini kaydet
          await updateUser(userId, { languagePreference: selectedLanguage });
          
          // Başarı mesajı göster
          setMessage(t('pages.myAccount.languageUpdateSuccess'));
        } catch (backendError) {
          // Backend hatası olsa bile UI'da dil değişmiş olur
          console.warn('Backend dil güncelleme hatası:', backendError);
          setError(t('pages.myAccount.languageUpdateError'));
        }
      }
    } catch (err) {
      console.error('Genel hata:', err);
      // Genel hata durumunda sadece UI'da dili güncelle
      onLanguageChange(selectedLanguage);
      setError(t('pages.myAccount.languageUpdateError'));
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Kategori zaten seçiliyse kaldır
        return prev.filter(id => id !== categoryId);
      } else {
        // Kategori seçili değilse ekle
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError(t('pages.roleProfile.userNotFound'));
      return;
    }
    
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
      const updateData = { 
        firstName, 
        lastName, 
        email, 
        phoneNumber: phone 
      };
      
      // Leader rolü için kategori bilgilerini de ekle
      if (roleName === 'Leader' && selectedCategories.length > 0) {
        updateData.categoryIds = selectedCategories;
      }
      
      await updateUser(userId, updateData);
      setMessage(t('pages.roleProfile.updateSuccess'));
    } catch (err) {
      setError(err.message || t('pages.roleProfile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (!newPassword || newPassword.length < 6) {
      setError(t('pages.roleProfile.passwordMinLength'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('pages.roleProfile.passwordMismatch'));
      return;
    }
    
    setLoading(true);
    setMessage(null);
    setError(null);
    
    try {
      await changePassword({ newPassword, confirmPassword });
      setMessage(t('pages.roleProfile.passwordUpdateSuccess'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || t('pages.roleProfile.passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    if (roleName === 'Leader') {
      return t('pages.roleProfile.leaderProfile');
    } else if (roleName === 'Support') {
      return t('pages.roleProfile.supportProfile');
    } else if (roleName === 'Employee') {
      return t('pages.roleProfile.employeeProfile');
    }
    return t('pages.roleProfile.profile');
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
        {getRoleTitle()}
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
              {t('pages.roleProfile.profileInfo')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CustomSingleLineTextArea
                label={t('pages.roleProfile.firstName')}
                name="firstName"
                value={firstName}
                onChange={handleChange}
                required
                placeholder={t('pages.roleProfile.firstNamePlaceholder')}
                minLength={1}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.roleProfile.lastName')}
                name="lastName"
                value={lastName}
                onChange={handleChange}
                required
                placeholder={t('pages.roleProfile.lastNamePlaceholder')}
                minLength={1}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.roleProfile.email')}
                name="email"
                value={email}
                onChange={handleChange}
                required
                placeholder={t('pages.roleProfile.emailPlaceholder')}
                minLength={1}
                maxLength={100}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.roleProfile.phone')}
                name="phone"
                value={phone}
                onChange={handleChange}
                placeholder={t('pages.roleProfile.phonePlaceholder')}
                maxLength={20}
                showCharCounter={true}
                size="small"
              />

              {/* Leader rolü için kategori seçimi */}
              {roleName === 'Leader' && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {t('pages.roleProfile.categorySelection')}
                  </label>
                  {categoriesLoading ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {t('pages.roleProfile.loadingCategories', 'Kategoriler yükleniyor...')}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '12px',
                      backgroundColor: '#f9fafb'
                    }}>
                      {categories.length > 0 ? (
                        categories.map(category => (
                          <label key={category.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '4px 0',
                            fontSize: '14px',
                            color: '#374151'
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id.toString())}
                              onChange={() => handleCategoryChange(category.id.toString())}
                              style={{
                                width: '16px',
                                height: '16px',
                                accentColor: '#1976d2'
                              }}
                            />
                            <span>{category.category_name_tr || category.category_name_en || category.name}</span>
                          </label>
                        ))
                      ) : (
                        <div style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#6b7280',
                          fontSize: '14px',
                          fontStyle: 'italic'
                        }}>
                          {t('pages.roleProfile.noCategories', 'Kategori bulunamadı')}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedCategories.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      {t('pages.roleProfile.selectedCategories', 'Seçili kategoriler:')} {selectedCategories.length}
                    </div>
                  )}
                </div>
              )}
              
              <CustomButton
                type="submit"
                variant="primary"
                disabled={loading}
                size="small"
                style={{ marginTop: '8px' }}
              >
                {loading ? t('pages.roleProfile.saving') : t('pages.roleProfile.save')}
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
              {t('pages.roleProfile.passwordUpdate')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CustomSingleLineTextArea
                label={t('pages.roleProfile.newPassword')}
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={handleChange}
                required
                placeholder={t('pages.roleProfile.newPasswordPlaceholder')}
                minLength={6}
                maxLength={50}
                showCharCounter={true}
                size="small"
              />
              
              <CustomSingleLineTextArea
                label={t('pages.roleProfile.confirmPassword')}
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleChange}
                required
                placeholder={t('pages.roleProfile.confirmPasswordPlaceholder')}
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
                {loading ? t('pages.roleProfile.updating') : t('pages.roleProfile.updatePassword')}
              </CustomButton>
            </div>
          </form>
        </div>
      </div>
      
      {/* Dil Tercihi Card */}
      <div style={{ 
        marginTop: '24px',
        maxWidth: '900px',
        width: '100%'
      }}>
        <div style={{ 
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            {t('pages.myAccount.languageTitle')}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CustomRadioButton
              label={t('pages.myAccount.languageLabel')}
              name="languagePreference"
              value={languagePreference}
              onChange={handleChange}
              required
              options={[
                { value: 'tr', label: t('pages.myAccount.languageTurkish') },
                { value: 'en', label: t('pages.myAccount.languageEnglish') }
              ]}
              helperText={t('pages.myAccount.languageHelperText')}
            />
          </div>
        </div>
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