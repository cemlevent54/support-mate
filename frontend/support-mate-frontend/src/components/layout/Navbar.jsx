import * as React from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';
import { logout as apiLogout } from '../../api/authApi';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';

const navbarStyle = `
  .navbar-container {
    position: fixed;
    top: 24px;
    left: 0;
    right: 0;
    z-index: 1100;
    display: flex;
    justify-content: center;
    pointer-events: none;
    overflow: visible;
  }
  
  .navbar-content {
    width: 95vw;
    max-width: 1100px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: visible;
    transition: box-shadow 0.3s;
    pointer-events: auto;
    background: #1976d2;
  }
  
  .navbar-content:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .navbar-toolbar {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    min-height: 64px;
  }
  
  .navbar-title {
    flex-grow: 1;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }
  
  .navbar-button {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 500;
    padding: 8px 16px;
    margin-left: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    text-transform: none;
  }
  
  .navbar-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .navbar-button:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .navbar-language-dropdown {
    position: relative;
    margin-left: 16px;
  }
  
  .navbar-language-button {
    background: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-weight: 600;
    color: #1976d2;
    cursor: pointer;
    font-size: 0.9rem;
    min-width: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s;
  }
  
  .navbar-language-button:hover {
    background: #f8f9fa;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .navbar-language-button:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
  
  .navbar-language-arrow {
    margin-left: 6px;
    font-size: 0.8rem;
    transition: transform 0.2s;
  }
  
  .navbar-language-dropdown.open .navbar-language-arrow {
    transform: rotate(180deg);
  }
  
  .navbar-language-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 80px;
    z-index: 1200;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s;
    margin-top: 4px;
  }
  
  .navbar-language-dropdown.open .navbar-language-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .navbar-language-option {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    color: #333;
    transition: background-color 0.2s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  
  .navbar-language-option:hover {
    background-color: #f5f5f5;
  }
  
  .navbar-language-option.active {
    background-color: #e3f2fd;
    color: #1976d2;
    font-weight: 600;
  }
  
  .navbar-left-icon {
    margin-right: 16px;
    display: flex;
    align-items: center;
  }
  
  .navbar-right-content {
    display: flex;
    align-items: center;
  }
  
  .navbar-mobile-sidebar {
    display: none;
  }
  
  @media (max-width: 768px) {
    .navbar-content {
      width: 95vw;
    }
    
    .navbar-toolbar {
      padding: 8px 16px;
    }
    
    .navbar-title {
      font-size: 1.1rem;
    }
    
    .navbar-button {
      font-size: 0.9rem;
      padding: 6px 12px;
      margin-left: 4px;
    }
    
    .navbar-right-content {
      display: none;
    }
    
    .navbar-mobile-sidebar {
      display: block;
    }
  }
`;

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
  const { language, onLanguageChange } = useLanguage();
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });
  const [languageDropdownOpen, setLanguageDropdownOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });
  
  const handleLanguageToggle = () => {
    setLanguageDropdownOpen(!languageDropdownOpen);
  };
  
  const handleLanguageSelect = (selectedLanguage) => {
    onLanguageChange(selectedLanguage);
    setLanguageDropdownOpen(false);
  };
  
  const handleClickOutside = (event) => {
    if (!event.target.closest('.navbar-language-dropdown')) {
      setLanguageDropdownOpen(false);
    }
  };
  
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
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
        <button className="navbar-button" onClick={() => navigate('/my-requests')}>
          {t('components.navbar.requests')}
        </button>
        <button className="navbar-button" onClick={onMyAccount}>
          {t('components.navbar.myAccount')}
        </button>
        <button className="navbar-button" onClick={handleLogout}>
          {t('components.navbar.logout')}
        </button>
      </>
    );
  } else if (userRole === 'user' && !isAuth) {
    rightContent = (
      <>
        <button className="navbar-button" onClick={onLogin}>
          {t('components.navbar.login')}
        </button>
        <button className="navbar-button" onClick={onSignup}>
          {t('components.navbar.signup')}
        </button>
      </>
    );
  } else if (!isAuth) {
    rightContent = (
      <>
        <button className="navbar-button" onClick={onHome}>
          {t('components.navbar.home')}
        </button>
        <button className="navbar-button" onClick={onLogin}>
          {t('components.navbar.login')}
        </button>
        <button className="navbar-button" onClick={onSignup}>
          {t('components.navbar.signup')}
        </button>
      </>
    );
  } else {
    rightContent = (
      <>
        <button className="navbar-button" onClick={onHome}>
          {t('components.navbar.home')}
        </button>
        <button className="navbar-button" onClick={onMyAccount}>
          {t('components.navbar.myAccount')}
        </button>
        <button className="navbar-button" onClick={handleLogout}>
          {t('components.navbar.logout')}
        </button>
      </>
    );
  }

  const languageToggle = (
    <div className={`navbar-language-dropdown ${languageDropdownOpen ? 'open' : ''}`}>
      <button
        className="navbar-language-button"
        onClick={handleLanguageToggle}
        type="button"
      >
        {language.toUpperCase()}
        <span className="navbar-language-arrow">▼</span>
      </button>
      <div className="navbar-language-menu">
        <button
          className={`navbar-language-option ${language === 'tr' ? 'active' : ''}`}
          onClick={() => handleLanguageSelect('tr')}
        >
          TR
        </button>
        <button
          className={`navbar-language-option ${language === 'en' ? 'active' : ''}`}
          onClick={() => handleLanguageSelect('en')}
        >
          EN
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{navbarStyle}</style>
      <div style={{ flexGrow: 1, width: '100vw', minHeight: '80px', background: 'transparent' }}>
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-toolbar">
              {leftIcon && (
                <div className="navbar-left-icon">{leftIcon}</div>
              )}
              <h1 className="navbar-title">{title}</h1>
              <div className="navbar-mobile-sidebar">
                {mobileSidebar}
              </div>
              <div className="navbar-right-content">
                {rightContent}
                {languageToggle}
              </div>
            </div>
          </div>
        </div>
        <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
} 