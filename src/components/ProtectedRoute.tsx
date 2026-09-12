import React from 'react';
import SigninPage from './SigninPage';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isSignedIn = Boolean(localStorage.getItem('token'));

  return isSignedIn ? <>{children}</> : <SigninPage />;
};

export default ProtectedRoute;
