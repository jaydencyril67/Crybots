import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import SignupConfirmationSentPage from './components/SignupConfirmationSentPage';
import AccountConfirmedPage from './components/AccountConfirmedPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import SigninPage from './components/SigninPage';
import DashboardPage from './components/DashboardPage';

const ProtectedDashboard = () => {
  const isSignedIn = Boolean(localStorage.getItem('token'));

  return isSignedIn ? <DashboardPage /> : <SigninPage />;
};

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');
const root = ReactDOM.createRoot(container);

const pathname = window.location.pathname;
const hash = window.location.hash;

const isSignupRoute = pathname === '/signup' || hash === '#/signup';
const isSignupConfirmationSentRoute = pathname === '/signup-confirmation-sent' || hash === '#/signup-confirmation-sent';
const isVerifyEmailRoute = pathname === '/verify-email' || hash === '#/verify-email';
const isAccountConfirmedRoute = pathname === '/account-confirmed' || hash === '#/account-confirmed';
const isSigninRoute = pathname === '/signin' || hash === '#/signin';
const isDashboardRoute = pathname === '/dashboard' || hash === '#/dashboard';

root.render(
  <React.StrictMode>
    <HelmetProvider>
      {isSignupRoute ? <SignupPage /> : isSignupConfirmationSentRoute ? <SignupConfirmationSentPage /> : isVerifyEmailRoute ? <VerifyEmailPage /> : isAccountConfirmedRoute ? <AccountConfirmedPage /> : isSigninRoute ? <SigninPage /> : isDashboardRoute ? <ProtectedDashboard /> : <LandingPage />}
    </HelmetProvider>
  </React.StrictMode>
);
