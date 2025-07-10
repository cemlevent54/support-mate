import React from 'react';
import { BrowserRouter as Router, useLocation, useRoutes } from 'react-router-dom';
import LanguageProvider from './components/LanguageProvider';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import AppLogo from './components/AppLogo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { appRoutes } from './routes';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isAuth, setIsAuth] = React.useState(false);
  const [userRole, setUserRole] = React.useState('guest');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  // Buton click fonksiyonları
  const handleLogin = () => {};
  const handleSignup = () => {};
  const handleMyAccount = () => {};
  const handleLogout = () => {
    setIsAuth(false);
    setUserRole('guest');
  };
  const handleHome = () => {};

  // Sayfa yenilendiğinde oturum kontrolü (JWT vs.) burada yapılabilir
  React.useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsAuth(true);
      setUserRole('user'); // JWT decode ile rol alınabilir
    } else {
      setIsAuth(false);
      setUserRole('guest');
    }
  }, []);

  const isAdminPanel = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPanel && (
        <Navbar
          title=""
          isAuth={isAuth}
          userRole={userRole}
          onLogin={handleLogin}
          onSignup={handleSignup}
          onMyAccount={handleMyAccount}
          onLogout={handleLogout}
          onHome={handleHome}
          leftIcon={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppLogo />
              {isMobile && (
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={() => setDrawerOpen(true)}
                  sx={{ ml: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </div>
          }
          mobileSidebar={
            <Sidebar
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              isAuth={isAuth}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onMyAccount={handleMyAccount}
              onLogout={handleLogout}
            />
          }
        />
      )}
      {useRoutes(appRoutes)}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App; 