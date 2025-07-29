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
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });
  
  const handleClickOutside = (event) => {
    if (!event.target.closest('.navbar-language-dropdown')) {
      // Language dropdown removed, so this function is no longer needed
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