import React from 'react';
import SigninPage from './SigninPage';

const isTokenValid = (token: string) => {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 > Date.now() : false;
  } catch {
    return false;
  }
};

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token') || '';
  const isSignedIn = Boolean(token) && isTokenValid(token);

  return isSignedIn ? <>{children}</> : <SigninPage />;
};

export default ProtectedRoute;
