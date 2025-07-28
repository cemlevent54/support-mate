import * as React from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';

const sidebarStyle = `
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1300;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .sidebar-overlay.open {
    opacity: 1;
    visibility: visible;
  }
  
  .sidebar-container {
    position: fixed;
    top: 0;
    left: -280px;
    width: 280px;
    height: 100vh;
    background: #fff;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    z-index: 1400;
    transition: left 0.3s ease;
    overflow-y: auto;
  }
  
  .sidebar-container.open {
    left: 0;
  }
  
  .sidebar-header {
    padding: 24px 20px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
  }
  
  .sidebar-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: white;
  }
  
  .sidebar-subtitle {
    font-size: 0.875rem;
    margin: 4px 0 0 0;
    opacity: 0.9;
    color: white;
  }
  
  .sidebar-content {
    padding: 16px 0;
  }
  
  .sidebar-menu-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #374151;
    text-decoration: none;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    font-weight: 500;
  }
  
  .sidebar-menu-item:hover {
    background-color: #f3f4f6;
    color: #1976d2;
  }
  
  .sidebar-menu-item:active {
    background-color: #e5e7eb;
  }
  
  .sidebar-menu-item.logout {
    color: #dc2626;
  }
  
  .sidebar-menu-item.logout:hover {
    background-color: #fef2f2;
    color: #b91c1c;
  }
  
  .sidebar-divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 8px 20px;
  }
  
  .sidebar-language-section {
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }
  
  .sidebar-language-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 12px 0;
  }
  
  .sidebar-language-buttons {
    display: flex;
    gap: 8px;
  }
  
  .sidebar-language-btn {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .sidebar-language-btn:hover {
    border-color: #1976d2;
    color: #1976d2;
  }
  
  .sidebar-language-btn.active {
    background: #1976d2;
    color: white;
    border-color: #1976d2;
  }
  
  @media (max-width: 480px) {
    .sidebar-container {
      width: 100vw;
      left: -100vw;
    }
  }
`;

const Sidebar = ({ open, onClose, isAuth, onLogin, onSignup, onMyAccount, onLogout, onHome, userRole }) => {
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();

  const handleLanguageChange = (newLanguage) => {
    onLanguageChange(newLanguage);
  };

  const handleMenuClick = (action) => {
    if (action) {
      action();
    }
    onClose();
  };

  let content;
  if (userRole === 'user' && isAuth) {
    content = (
      <>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(() => window.location.href = '/my-requests')}>
          {t('components.navbar.requests')}
        </button>
        
        <div className="sidebar-divider"></div>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onMyAccount)}>
          {t('components.navbar.myAccount')}
        </button>
        <button className="sidebar-menu-item logout" onClick={() => handleMenuClick(onLogout)}>
          {t('components.navbar.logout')}
        </button>
      </>
    );
  } else if (userRole === 'user' && !isAuth) {
    content = (
      <>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onLogin)}>
          {t('components.navbar.login')}
        </button>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onSignup)}>
          {t('components.navbar.signup')}
        </button>
      </>
    );
  } else if (!isAuth) {
    content = (
      <>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onHome)}>
          {t('components.navbar.home')}
        </button>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onLogin)}>
          {t('components.navbar.login')}
        </button>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onSignup)}>
          {t('components.navbar.signup')}
        </button>
      </>
    );
  } else {
    content = (
      <>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onHome)}>
          {t('components.navbar.home')}
        </button>
        <button className="sidebar-menu-item" onClick={() => handleMenuClick(onMyAccount)}>
          {t('components.navbar.myAccount')}
        </button>
        <button className="sidebar-menu-item logout" onClick={() => handleMenuClick(onLogout)}>
          {t('components.navbar.logout')}
        </button>
      </>
    );
  }

  return (
    <>
      <style>{sidebarStyle}</style>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`sidebar-container ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{t('components.sidebar.title', 'Menu')}</h2>
          <p className="sidebar-subtitle">{t('components.sidebar.subtitle', 'Navigation')}</p>
        </div>
        
        <div className="sidebar-content">
          {content}
        </div>
        
        <div className="sidebar-language-section">
          <h3 className="sidebar-language-title">{t('components.sidebar.language')}</h3>
          <div className="sidebar-language-buttons">
            <button
              className={`sidebar-language-btn ${language === 'tr' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('tr')}
            >
              TR
            </button>
            <button
              className={`sidebar-language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 