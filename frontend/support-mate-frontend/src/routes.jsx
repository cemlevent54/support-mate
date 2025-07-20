import React from 'react';
import SignupCard from './components/SignupCard';
import HomePage from './pages/HomePage/HomePage';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';
import SupportDashboard from './components/SupportDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import MyAccount from './components/MyAccount';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserRoles from './pages/admin/AdminUserRoles';
import AdminRolePermissions from './pages/admin/AdminRolePermissions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SixDigitVerifyEmail from './components/SixDigitVerifyEmail';

import MyRequests from './pages/MyRequests';
import ChatDialog from './pages/ChatDialog';
import { useLocation, Navigate } from 'react-router-dom';

// Global modal handlers - bu fonksiyonlar App.jsx'ten geçirilecek
let globalOpenCreateTicketModal = () => {};
let globalCloseCreateTicketModal = () => {};

export const setGlobalModalHandlers = (openHandler, closeHandler) => {
  globalOpenCreateTicketModal = openHandler;
  globalCloseCreateTicketModal = closeHandler;
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
    ],
  },
  {
    path: '/support',
    element: <SupportDashboard />,
  },
  {
    path: '/employee',
    element: <EmployeeDashboard />,
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
    path: '/my-requests',
    element: <MyRequests openCreateTicketModal={globalOpenCreateTicketModal} />,
  },
  {
    path: '/my-requests/chat',
    element: <ChatChatWrapper />,
  },
  // {
  //   path: '/',
  //   element: <HomePage />,
  //   roles: ['guest', 'user', 'admin'],
  // },
];

// ChatChatWrapper bileşeni
function ChatChatWrapper() {
  const location = useLocation();
  const ticket = location.state?.ticket;
  if (!ticket) return <Navigate to="/my-requests" />;
  return <ChatDialog ticket={ticket} onBack={() => window.history.back()} />;
} 