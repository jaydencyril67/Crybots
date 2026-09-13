import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import SignupConfirmationSentPage from './components/SignupConfirmationSentPage';
import AccountConfirmedPage from './components/AccountConfirmedPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import SigninPage from './components/SigninPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import DashboardPage from './components/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppSplashOverlay from './components/AppSplashOverlay';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore service worker registration failures.
    });
  });
}

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
const isForgotPasswordRoute = pathname === '/forgot-password' || hash === '#/forgot-password';
const isDashboardRoute = pathname === '/dashboard' || hash === '#/dashboard';
const navigationEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const showSplashOnThisLoad = navigationEntry?.entryType === 'navigation' && navigationEntry?.type === 'reload';

const appContent = isSignupRoute ? <SignupPage /> : isSignupConfirmationSentRoute ? <SignupConfirmationSentPage /> : isVerifyEmailRoute ? <VerifyEmailPage /> : isAccountConfirmedRoute ? <AccountConfirmedPage /> : isSigninRoute ? <SigninPage /> : isForgotPasswordRoute ? <ForgotPasswordPage /> : isDashboardRoute ? <ProtectedRoute><DashboardPage /></ProtectedRoute> : <LandingPage />;

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AppSplashOverlay active={showSplashOnThisLoad} />
      {!showSplashOnThisLoad && appContent}
    </HelmetProvider>
  </React.StrictMode>
);
