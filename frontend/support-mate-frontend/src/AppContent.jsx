import React from 'react';
import { useLocation, useRoutes, useNavigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import AppLogo from './components/common/AppLogo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { appRoutes, setGlobalModalHandlers } from './routes';
import FloatingChatButton from './components/layout/FloatingChatButton';
import CreateTicket from './pages/tickets/CreateTicket';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import ChatPanel from './components/chats/ChatPanel';
import { checkOnlineSupporters, getFirstOnlineSupporterId } from './api/ticketApi';
import axiosInstance from './api/axiosInstance';
import { useChatSocket } from './hooks/useChatSocket';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isAuth, setIsAuth] = React.useState(false);
  const [userRole, setUserRole] = React.useState('guest');
  const [createTicketModalOpen, setCreateTicketModalOpen] = React.useState(false);
  const [chatPanelOpen, setChatPanelOpen] = React.useState(false);
  const [chatTicket, setChatTicket] = React.useState(null); // ChatPanel için ticket/chat objesi
  // const [chatInput, setChatInput] = React.useState('');
  // const [chatMessages, setChatMessages] = React.useState([]);
  // const [chatSending, setChatSending] = React.useState(false);
  // const [someoneTyping, setSomeoneTyping] = React.useState(false);
  // const chatMessagesEndRef = React.useRef(null);
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

  // ChatPanel veya CreateTicket modalı açan handler
  const handleFloatingButtonClick = async () => {
    if (createTicketModalOpen) {
      setCreateTicketModalOpen(false);
      return;
    }
    if (chatPanelOpen) {
      setChatPanelOpen(false);
      setChatTicket(null);
      // setChatMessages([]);
      // setChatInput('');
      return;
    }
    // Online agent kontrolü
    const hasOnline = await checkOnlineSupporters();
    if (hasOnline) {
      const receiverId = await getFirstOnlineSupporterId();
      setChatTicket({ title: 'Destek', assignedAgentId: receiverId, receiverId, customerId: 'me' });
      // setChatMessages([]);
      // setChatInput('');
      setChatPanelOpen(true);
    } else {
      setCreateTicketModalOpen(true);
    }
  };

  // useChatSocket hook'u ile socket bağlantısı ve chat state yönetimi
  const {
    messages,
    input,
    sending,
    someoneTyping,
    messagesEndRef,
    myUserId,
    myUserName,
    handleSend,
    handleInputChange,
    handleCloseChat,
    setInput
  } = useChatSocket(chatTicket, chatPanelOpen);

  const handleTicketCreated = (ticketData) => {
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

  // User rolündeki kullanıcılar için FloatingChatButton göster
  const shouldShowFloatingButton = isAuth && userRole === 'user' && !(isAdminPanel || isSupportPanel);

  // ChatPanel'i kapatırken, mesaj varsa onay iste
  const handleCloseChatPanel = () => {
    if (messages.length > 0) {
      if (window.confirm('Chatten çıkmak istediğinize emin misiniz?')) {
        setChatPanelOpen(false);
      }
      // Onaylanmazsa hiçbir şey yapma
    } else {
      setChatPanelOpen(false);
    }
  };

  return (
    <>
      {!(isAdminPanel || isSupportPanel) && (
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
          onClick={handleFloatingButtonClick}
          disabled={false}
          isOpen={createTicketModalOpen || chatPanelOpen}
        />
      )}

      {/* CreateTicket Modal */}
      <Modal 
        open={createTicketModalOpen} 
        onClose={() => setCreateTicketModalOpen(false)}
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
            onClose={() => setCreateTicketModalOpen(false)} 
            isModal={true} 
            onTicketCreated={handleTicketCreated} 
          />
        </Box>
      </Modal>

      {/* ChatPanel Modal */}
      <Modal
        open={chatPanelOpen}
        onClose={handleCloseChatPanel}
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
          {chatPanelOpen && (
            <ChatPanel
              chatTicket={chatTicket}
              messages={messages}
              input={input}
              sending={sending}
              someoneTyping={someoneTyping}
              messagesEndRef={messagesEndRef}
              onClose={handleCloseChatPanel}
              onSend={handleSend}
              onInputChange={handleInputChange}
              isModal={true}
              receiverId={chatTicket?.receiverId}
              myUserId={myUserId}
            />
          )}
        </Box>
      </Modal>
    </>
  );
}

export default AppContent; 