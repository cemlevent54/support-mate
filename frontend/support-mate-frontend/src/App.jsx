import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import AppLogo from './components/AppLogo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { appRoutes } from './routes';
import HomePage from './pages/HomePage/HomePage';
import LoginCard from './components/LoginCard';
import SignupCard from './components/SignupCard';
import MyAccount from './components/MyAccount';
import LanguageProvider from './components/LanguageProvider';
import { jwtDecode } from "jwt-decode";
import { Box, Typography } from '@mui/material';
import AdminUsers from './pages/admin/AdminUsers';

// Admin route koruma bileşeni
function ProtectedAdminRoute({ children, isAuth, userRole }) {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

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
      try {
        const decoded = jwtDecode(token);
        setIsAuth(true);
        setUserRole(decoded.role || 'user'); // JWT'den rolü al
      } catch (error) {
        // JWT geçersizse temizle
        localStorage.removeItem('jwt');
        setIsAuth(false);
        setUserRole('guest');
      }
    } else {
      setIsAuth(false);
      setUserRole('guest');
    }
  }, []);

  const isAdminPanel = location.pathname.startsWith('/admin');

  return (
    <div className="App">
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginCard onUserLogin={handleUserLogin} />} />
        <Route path="/signup" element={<SignupCard />} />
        <Route path="/my-account" element={<MyAccount />} />
        {/* Nested admin route yapısı */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedAdminRoute isAuth={isAuth} userRole={userRole}>
              {filteredRoutes.find(route => route.path === '/admin')?.element}
            </ProtectedAdminRoute>
          }
        >
          <Route index element={
            <Box>
              <Typography variant="h5" fontWeight={600} mb={2}>Hoş Geldiniz</Typography>
              <Typography>Admin panelini kullanmaya başlayın.</Typography>
            </Box>
          } />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        {filteredRoutes
          .filter(route => !route.path.startsWith('/admin'))
          .map((route, idx) => (
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