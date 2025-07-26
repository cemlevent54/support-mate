import React, { useEffect } from 'react';
import SignupCard from './pages/auth/SignupCard';
import HomePage from './pages/HomePage/HomePage';
import LoginCard from './pages/auth/LoginCard';
import Dashboard from './components/layout/Dashboard';
import SupportRequests from './pages/support/SupportRequests';
import SupportChatsLayout from './components/chats/SupportChatsLayout';
import MyAccount from './pages/auth/MyAccount';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserRoles from './pages/admin/AdminUserRoles';
import AdminRolePermissions from './pages/admin/AdminRolePermissions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SixDigitVerifyEmail from './pages/auth/SixDigitVerifyEmail';

import MyRequests from './pages/tickets/MyRequests';
import ChatDialog from './pages/chat/chatDialog/ChatDialog';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import AdminTickets from './pages/admin/AdminTickets';
import AdminCategories from './pages/admin/AdminCategories';
import SupportLayout from './components/layout/SupportLayout';
import AdminProducts from './pages/admin/AdminProducts';
import SupportKanbanBoard from './pages/support/SupportKanbanBoard';
import AdminKanbanBoard from './pages/admin/AdminKanbanBoard';
import { jwtDecode } from 'jwt-decode';
import isEmployee from './auth/isEmployee';
import isLeader from './auth/isLeader';
import FeedbackPage from "./pages/feedback/FeedbackPage";
import LeaderPanel from './pages/leader/LeaderPanel';
import LeaderTickets from './pages/leader/LeaderTickets';

// Global modal handlers - bu fonksiyonlar App.jsx'ten geçirilecek
let globalOpenCreateTicketModal = () => {};
let globalCloseCreateTicketModal = () => {};
let globalHandleTicketCreated = () => {};

export const setGlobalModalHandlers = (openHandler, closeHandler, ticketCreatedHandler) => {
  globalOpenCreateTicketModal = openHandler;
  globalCloseCreateTicketModal = closeHandler;
  globalHandleTicketCreated = ticketCreatedHandler;
};

// Role bazlı erişim için örnek bir yapı
export const appRoutes = [
  {
    path: '/',
    element: <HomePage />,
    roles: ['guest', 'user', 'admin'],
  },
  {
    path: '/signup',
    element: <SignupCard />,
    roles: ['guest', 'user', 'admin'],
  },
  {
    path: '/login',
    element: <LoginCard />,
    roles: ['guest', 'user', 'admin'],
  },
  {
    path: '/admin',
    element: <Dashboard />,
    roles: ['admin'],
    children: [
      {
        path: '',
        element: (
          <Box>
            <Typography variant="h5" fontWeight={600} mb={2}>Hoş Geldiniz</Typography>
            <Typography>Admin panelini kullanmaya başlayın.</Typography>
          </Box>
        ),
      },
      {
        path: 'users',
        element: <AdminUsers />,
      },
      {
        path: 'roles',
        element: <AdminUserRoles />,
      },
      {
        path: 'roles/permissions',
        element: <AdminRolePermissions />,
      },
      {
        path: 'tickets',
        element: <AdminTickets />,
      },
      {
        path: 'categories',
        element: <AdminCategories />,
      },
      {
        path: 'products',
        element: <AdminProducts />,
      },
      {
        path: 'kanban',
        element: <AdminKanbanBoard />,
      },
    ],
  },
  {
    path: '/support',
    element: <SupportLayout />,
    children: [
      { path: 'requests', element: <SupportRequests /> },
      { path: 'requests/:chatId', element: <SupportRequests /> },
      { path: 'chats', element: <SupportChatsRoleGuard><SupportChatsLayout /></SupportChatsRoleGuard> },
      { path: 'chats/:chatId', element: <SupportChatsRoleGuard><SupportChatsLayout /></SupportChatsRoleGuard> },
      { path: 'kanban', element: <SupportKanbanBoard /> },
      { path: 'tickets', element: <LeaderTicketsRoleGuard><LeaderTickets /></LeaderTicketsRoleGuard> },
      { index: true, element: <SupportIndexRoute /> }
    ]
  },
  {
    path: '/my-account',
    element: <MyAccount />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/verify-email',
    element: <SixDigitVerifyEmail />,
  },
  {
    path: '/feedback',
    element: <FeedbackPage />,
  },

  {
    path: '/my-requests',
    element: <MyRequests openCreateTicketModal={globalOpenCreateTicketModal} onTicketCreated={globalHandleTicketCreated} />,
  },
  {
    path: '/my-requests/chat',
    element: <ChatChatWrapper />,
  },
  // /support/tickets ana route listesinden kaldırıldı
];

// Role bazlı erişim için özel bir koruma bileşeni
function SupportChatsRoleGuard({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (isEmployee(decoded)) {
          navigate('/support', { replace: true });
        }
      } catch (e) {}
    }
  }, [navigate]);
  return children;
}

// ChatChatWrapper bileşeni
function ChatChatWrapper() {
  const location = useLocation();
  const ticket = location.state?.ticket;
  if (!ticket) return <Navigate to="/my-requests" />;
  return <ChatDialog ticket={ticket} onBack={() => window.history.back()} />;
}

// Support index route - rol bazlı yönlendirme
function SupportIndexRoute() {
  const token = localStorage.getItem('jwt');
  
  if (token) {
    try {
      const decoded = jwtDecode(token);
      
      // Leader rolü için LeaderPanel bileşenini göster
      if (isLeader(decoded)) {
        return <LeaderPanel />;
      }
      
      // Diğer roller için requests sayfasına yönlendir
      return <Navigate to="requests" replace />;
    } catch (e) {
      return <Navigate to="requests" replace />;
    }
  }
  
  return <Navigate to="requests" replace />;
} 

// LeaderTicketsRoleGuard bileşeni eklendi:
function LeaderTicketsRoleGuard({ children }) {
  const token = localStorage.getItem('jwt');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      if (isLeader(decoded) || (decoded.roleName && decoded.roleName.toLowerCase() === 'admin')) {
        return children;
      }
    } catch (e) {}
  }
  return <Navigate to="/support" replace />;
} 