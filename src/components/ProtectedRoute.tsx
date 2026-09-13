import React from 'react';
import SigninPage from './SigninPage';
import { isTokenValid } from '../utils/auth';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token') || '';
  const isSignedIn = Boolean(token) && isTokenValid(token);

  return isSignedIn ? <>{children}</> : <SigninPage />;
};

export default ProtectedRoute;
