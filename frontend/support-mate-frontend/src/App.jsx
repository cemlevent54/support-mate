import React from 'react';
import { BrowserRouter as Router, useLocation, useRoutes, useNavigate } from 'react-router-dom';
import LanguageProvider from './components/LanguageProvider';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import AppLogo from './components/AppLogo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { appRoutes, setGlobalModalHandlers } from './routes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import FloatingChatButton from './components/FloatingChatButton';
import CreateTicket from './pages/CreateTicket';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isAuth, setIsAuth] = React.useState(false);
  const [userRole, setUserRole] = React.useState('guest');
  const [createTicketModalOpen, setCreateTicketModalOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  // Global create ticket modal handlers
  const openCreateTicketModal = () => setCreateTicketModalOpen(true);
  const closeCreateTicketModal = () => setCreateTicketModalOpen(false);

  // Global handler'ları set et
  React.useEffect(() => {
    setGlobalModalHandlers(openCreateTicketModal, closeCreateTicketModal, handleTicketCreated);
  }, []);

  // Buton click fonksiyonları
  const handleLogin = () => {
    navigate('/login');
  };
  const handleSignup = () => {
    navigate('/signup');
  };
  const handleMyAccount = () => {
    navigate('/my-account');
  };
  const handleLogout = () => {
    setIsAuth(false);
    setUserRole('guest');
    localStorage.removeItem('jwt');
    navigate('/');
  };
  const handleHome = () => {
    navigate('/');
  };

  const handleOpenCreateTicket = () => {
    openCreateTicketModal();
  };

  const handleCloseCreateTicket = () => {
    closeCreateTicketModal();
  };

  const handleTicketCreated = (ticketData) => {
    console.log('App.jsx - handleTicketCreated called with:', ticketData);
    // Ticket oluşturulduktan sonra modal'ı kapat ve kullanıcıyı my-requests sayfasına yönlendir
    setCreateTicketModalOpen(false);
    navigate('/my-requests', { 
      state: { 
        openChatForTicket: ticketData,
        showChatAfterCreate: true 
      } 
    });
  };

  // Sayfa yenilendiğinde oturum kontrolü (JWT vs.) burada yapılabilir
  React.useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsAuth(true);
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const roleName = decoded.roleName;
        setUserRole(roleName ? roleName.toLowerCase() : 'user');
        // Eğer Customer Supporter ise support paneline yönlendir
        if (roleName === 'Customer Supporter' && location.pathname !== '/support') {
          navigate('/support');
        }
      } catch (e) {
        setUserRole('user');
      }
    } else {
      setIsAuth(false);
      setUserRole('guest');
    }
  }, [location.pathname, navigate]);

  const isAdminPanel = location.pathname.startsWith('/admin');
  const isSupportPanel = location.pathname.startsWith('/support');
  const isEmployeePanel = location.pathname.startsWith('/employee');

  // User rolündeki kullanıcılar için FloatingChatButton göster
  const shouldShowFloatingButton = isAuth && userRole === 'user' && !(isAdminPanel || isSupportPanel || isEmployeePanel);

  return (
    <>
      {!(isAdminPanel || isSupportPanel || isEmployeePanel) && (
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
              userRole={userRole}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onMyAccount={handleMyAccount}
              onLogout={handleLogout}
              onHome={handleHome}
            />
          }
        />
      )}
      {useRoutes(appRoutes)}

      {/* Floating Chat Button - User rolündeki kullanıcılar için tüm sayfalarda görünür */}
      {shouldShowFloatingButton && (
        <FloatingChatButton 
          onClick={createTicketModalOpen ? handleCloseCreateTicket : handleOpenCreateTicket}
          disabled={false}
          isOpen={createTicketModalOpen}
        />
      )}

      {/* CreateTicket Modal */}
      <Modal 
        open={createTicketModalOpen} 
        onClose={handleCloseCreateTicket}
        disableBackdropClick={false}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          p: 2,
          zIndex: 9998
        }}
      >
        <Box sx={{ 
          width: 500, 
          height: 'auto',
          maxHeight: '90vh',
          bgcolor: 'transparent',
          outline: 'none',
          mb: 8
        }}>
          <CreateTicket 
            onClose={handleCloseCreateTicket} 
            isModal={true} 
            onTicketCreated={handleTicketCreated} 
          />
        </Box>
      </Modal>
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 