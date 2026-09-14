import React, { useEffect, useMemo, useState } from 'react';
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
import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import NowBar from './components/NowBar';
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

const getPathname = () => window.location.pathname;
const getHash = () => window.location.hash;

const getRouteKey = () => {
  const pathname = getPathname();
  const hash = getHash();

  if (pathname === '/signup' || hash === '#/signup') return 'signup';
  if (pathname === '/signup-confirmation-sent' || hash === '#/signup-confirmation-sent') return 'signup-confirmation-sent';
  if (pathname === '/verify-email' || hash === '#/verify-email') return 'verify-email';
  if (pathname === '/account-confirmed' || hash === '#/account-confirmed') return 'account-confirmed';
  if (pathname === '/signin' || hash === '#/signin') return 'signin';
  if (pathname === '/forgot-password' || hash === '#/forgot-password') return 'forgot-password';
  if (pathname === '/dashboard' || hash === '#/dashboard') return 'dashboard';
  if (pathname === '/profile' || hash === '#/profile') return 'profile';
  return 'landing';
};

const RouteTransition = () => {
  const [routeKey, setRouteKey] = useState(getRouteKey);
  const [displayedRouteKey, setDisplayedRouteKey] = useState(routeKey);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const syncRoute = () => {
      const nextRouteKey = getRouteKey();
      setRouteKey(nextRouteKey);
    };

    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    if (routeKey === displayedRouteKey) {
      return;
    }

    setDisplayedRouteKey(routeKey);
    setIsExiting(false);
  }, [displayedRouteKey, routeKey]);

  const appContent = useMemo(() => {
    const pathname = getPathname();
    const hash = getHash();

    if (displayedRouteKey === 'signup') return <SignupPage />;
    if (displayedRouteKey === 'signup-confirmation-sent') return <SignupConfirmationSentPage />;
    if (displayedRouteKey === 'verify-email') return <VerifyEmailPage />;
    if (displayedRouteKey === 'account-confirmed') return <AccountConfirmedPage />;
    if (displayedRouteKey === 'signin') return <SigninPage />;
    if (displayedRouteKey === 'forgot-password') return <ForgotPasswordPage />;
    if (displayedRouteKey === 'dashboard') return <ProtectedRoute><DashboardPage /></ProtectedRoute>;
    if (displayedRouteKey === 'profile') return <ProtectedRoute><ProfilePage /></ProtectedRoute>;

    return pathname === '/' || hash === '#/' || displayedRouteKey === 'landing' ? <LandingPage /> : <LandingPage />;
  }, [displayedRouteKey]);

  const showNowBar = displayedRouteKey === 'dashboard' || displayedRouteKey === 'profile';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div
        style={{
          transform: 'translateX(0)',
          transition: 'transform 120ms ease',
          minHeight: '100vh',
        }}
      >
        {appContent}
      </div>
      {showNowBar ? <NowBar /> : null}
    </div>
  );
};

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AppSplashOverlay />
      <RouteTransition />
    </HelmetProvider>
  </React.StrictMode>
);
