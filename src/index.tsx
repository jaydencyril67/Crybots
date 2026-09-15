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
import StakingPage from './components/StakingPage';
import SettingsPage from './components/SettingsPage';
import DepositPage from './components/DepositPage';
import WithdrawalsPage from './components/WithdrawalsPage';
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
  if (pathname === '/staking' || hash === '#/staking') return 'staking';
  if (pathname === '/settings' || hash === '#/settings') return 'settings';
  if (pathname === '/withdrawals' || hash === '#/withdrawals') return 'withdrawals';
  if (pathname === '/deposit' || hash === '#/deposit') return 'deposit';
  return 'landing';
};

const routeToKey = (path: string) => {
  if (path === '/signup' || path === '#/signup') return 'signup';
  if (path === '/signup-confirmation-sent' || path === '#/signup-confirmation-sent') return 'signup-confirmation-sent';
  if (path === '/verify-email' || path === '#/verify-email') return 'verify-email';
  if (path === '/account-confirmed' || path === '#/account-confirmed') return 'account-confirmed';
  if (path === '/signin' || path === '#/signin') return 'signin';
  if (path === '/forgot-password' || path === '#/forgot-password') return 'forgot-password';
  if (path === '/dashboard' || path === '#/dashboard') return 'dashboard';
  if (path === '/profile' || path === '#/profile') return 'profile';
  if (path === '/staking' || path === '#/staking') return 'staking';
  if (path === '/settings' || path === '#/settings') return 'settings';
  if (path === '/withdrawals' || path === '#/withdrawals') return 'withdrawals';
  if (path === '/deposit' || path === '#/deposit') return 'deposit';
  return 'landing';
};

const RouteTransition = () => {
  const [routeKey, setRouteKey] = useState(getRouteKey);
  const [displayedRouteKey, setDisplayedRouteKey] = useState(routeKey);

  useEffect(() => {
    const syncRoute = () => {
      const nextRouteKey = getRouteKey();
      setRouteKey(nextRouteKey);
      setDisplayedRouteKey(nextRouteKey);
    };

    const handleNavigationStart = (event: Event) => {
      const customEvent = event as CustomEvent<{ path?: string }>;
      const nextRouteKey = routeToKey(customEvent.detail?.path ?? window.location.pathname);
      setRouteKey(nextRouteKey);
      setDisplayedRouteKey(nextRouteKey);
    };

    window.addEventListener('ke:navigation-start', handleNavigationStart as EventListener);
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('ke:navigation-start', handleNavigationStart as EventListener);
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    if (routeKey === displayedRouteKey) {
      return;
    }

    setDisplayedRouteKey(routeKey);
  }, [displayedRouteKey, routeKey]);

  const appContent = useMemo(() => {
    if (displayedRouteKey === 'signup') return <SignupPage />;
    if (displayedRouteKey === 'signup-confirmation-sent') return <SignupConfirmationSentPage />;
    if (displayedRouteKey === 'verify-email') return <VerifyEmailPage />;
    if (displayedRouteKey === 'account-confirmed') return <AccountConfirmedPage />;
    if (displayedRouteKey === 'signin') return <SigninPage />;
    if (displayedRouteKey === 'forgot-password') return <ForgotPasswordPage />;
    if (displayedRouteKey === 'dashboard') return <ProtectedRoute><DashboardPage /></ProtectedRoute>;
    if (displayedRouteKey === 'profile') return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
    if (displayedRouteKey === 'staking') return <ProtectedRoute><StakingPage /></ProtectedRoute>;
    if (displayedRouteKey === 'settings') return <ProtectedRoute><SettingsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'withdrawals') return <ProtectedRoute><WithdrawalsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'deposit') return <ProtectedRoute><DepositPage /></ProtectedRoute>;

    return <LandingPage />;
  }, [displayedRouteKey]);

  const showNowBar = displayedRouteKey === 'dashboard' || displayedRouteKey === 'profile' || displayedRouteKey === 'staking' || displayedRouteKey === 'settings' || displayedRouteKey === 'withdrawals' || displayedRouteKey === 'deposit';

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
