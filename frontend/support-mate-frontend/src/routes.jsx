import React from 'react';
import SignupCard from './components/SignupCard';
// import HomePage from './components/HomePage'; // Örnek, ileride eklenebilir
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';
import SupportDashboard from './components/SupportDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import MyAccount from './components/MyAccount';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Role bazlı erişim için örnek bir yapı
export const appRoutes = [
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
  // {
  //   path: '/',
  //   element: <HomePage />,
  //   roles: ['guest', 'user', 'admin'],
  // },
]; 