import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import AppLogo from './components/AppLogo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { appRoutes, AppRoute, UserRole } from './routes';
import HomePage from './pages/HomePage/HomePage';
import LoginCard from './components/LoginCard';
import SignupCard from './components/SignupCard';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isAuth, setIsAuth] = React.useState(false); // örnek auth state
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  // Örnek kullanıcı rolü, ileride auth ile dinamik yapılabilir
  const userRole: UserRole = isAuth ? 'user' : 'guest';

  // Buton click fonksiyonları (örnek)
  const handleLogin = () => navigate('/login');
  const handleSignup = () => navigate('/signup');
  const handleMyAccount = () => {};
  const handleLogout = () => setIsAuth(false);
  const handleHome = () => navigate('/');

  // Route'ları role bazlı filtrele (ileride kullanılacak)
  const filteredRoutes = appRoutes.filter(route => !route.roles || route.roles.includes(userRole));

  return (
    <div className="App">
      <Navbar
        title=""
        isAuth={isAuth}
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginCard />} />
        <Route path="/signup" element={<SignupCard />} />
        {filteredRoutes.map((route, idx) => (
          <Route key={idx} path={route.path} element={route.element} />
        ))}
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
