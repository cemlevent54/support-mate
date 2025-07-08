import React from 'react';
import SignupCard from './components/SignupCard';
// import HomePage from './components/HomePage'; // Örnek, ileride eklenebilir
import LoginCard from './components/LoginCard';

// Role bazlı erişim için örnek bir yapı
export type UserRole = 'guest' | 'user' | 'admin';

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  roles?: UserRole[]; // Hangi roller erişebilir
  children?: AppRoute[];
}

export const appRoutes: AppRoute[] = [
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
  // {
  //   path: '/',
  //   element: <HomePage />,
  //   roles: ['guest', 'user', 'admin'],
  // },
]; 