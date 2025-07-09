import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import AppLogo from './components/AppLogo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { appRoutes } from './routes';
import HomePage from './pages/HomePage/HomePage';
import LoginCard from './components/LoginCard';
import SignupCard from './components/SignupCard';
import MyAccount from './components/MyAccount';
import LanguageProvider from './components/LanguageProvider';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isAuth, setIsAuth] = React.useState(false); // örnek auth state
  const [userRole, setUserRole] = React.useState('guest');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  // Buton click fonksiyonları (örnek)
  const handleLogin = () => navigate('/login');
  const handleSignup = () => navigate('/signup');
  const handleMyAccount = () => navigate('/my-account');
  const handleLogout = () => {
    setIsAuth(false);
    setUserRole('guest');
  };
  const handleHome = () => navigate('/');

  const handleUserLogin = (role) => {
    setIsAuth(true);
    setUserRole(role);
  };

  // Route'ları role bazlı filtrele (ileride kullanılacak)
  const filteredRoutes = appRoutes.filter(route => !route.roles || route.roles.includes(userRole));

  // Sayfa yenilendiğinde oturum kontrolü
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

  return (
    <div className="App">
      {location.pathname !== '/admin' && location.pathname !== '/support' && location.pathname !== '/employee' && (
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginCard onUserLogin={handleUserLogin} />} />
        <Route path="/signup" element={<SignupCard />} />
        <Route path="/my-account" element={<MyAccount />} />
        {filteredRoutes.map((route, idx) => (
          <Route key={idx} path={route.path} element={route.element} />
        ))}
      </Routes>
    </div>
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