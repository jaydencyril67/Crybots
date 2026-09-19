import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import AppThemeProvider, { useAppTheme } from './components/AppTheme';
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
import PortfolioPage from './components/PortfolioPage';
import DangerPage from './components/DangerPage';
import PendingDeletionPage from './components/PendingDeletionPage';
import SecurityPage from './components/SecurityPage';
import WithdrawalsPage from './components/WithdrawalsPage';
import TransferPage from './components/TransferPage';
import TransactionHistoryPage from './components/TransactionHistoryPage';
import NotificationsPage from './components/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import NowBar from './components/NowBar';
import AppHeader from './components/AppHeader';
import AppSplashOverlay from './components/AppSplashOverlay';
import { HYBRID_THEME_TOKENS } from './components/HybridTheme';
import api, { forceLogout } from './api/axios';

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
  if (pathname === '/portfolio' || hash === '#/portfolio') return 'portfolio';
  if (pathname === '/danger' || hash === '#/danger') return 'danger';
  if (pathname === '/pending-deletion' || hash === '#/pending-deletion') return 'pending-deletion';
  if (pathname === '/security' || hash === '#/security') return 'security';
  if (pathname === '/withdrawals' || hash === '#/withdrawals') return 'withdrawals';
  if (pathname === '/transfer' || hash === '#/transfer') return 'transfer';
  if (pathname === '/deposit' || hash === '#/deposit') return 'deposit';
  if (pathname === '/transactions' || hash === '#/transactions') return 'transactions';
  if (pathname === '/notifications' || hash === '#/notifications') return 'notifications';
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
  if (path === '/portfolio' || path === '#/portfolio') return 'portfolio';
  if (path === '/danger' || path === '#/danger') return 'danger';
  if (path === '/pending-deletion' || path === '#/pending-deletion') return 'pending-deletion';
  if (path === '/security' || path === '#/security') return 'security';
  if (path === '/withdrawals' || path === '#/withdrawals') return 'withdrawals';
  if (path === '/transfer' || path === '#/transfer') return 'transfer';
  if (path === '/deposit' || path === '#/deposit') return 'deposit';
  if (path === '/transactions' || path === '#/transactions') return 'transactions';
  if (path === '/notifications' || path === '#/notifications') return 'notifications';
  return 'landing';
};

const RouteTransition = () => {
  const { themeMode: mode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[mode];
  const [routeKey, setRouteKey] = useState(getRouteKey);
  const [displayedRouteKey, setDisplayedRouteKey] = useState(routeKey);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));

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

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem('token')));
    };

    const validateSession = async () => {
      if (!localStorage.getItem('token')) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await api.get('/api/auth/me');
      } catch (error: any) {
        if (error?.response?.data?.forceLogout) {
          forceLogout();
          return;
        }
      }
    };

    const interval = window.setInterval(() => {
      void validateSession();
    }, 15000);

    const connectForceLogoutStream = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        return null;
      }

      const stream = new EventSource(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/force-logout/stream`, {
        withCredentials: true,
      });

      const handleForceLogout = () => {
        forceLogout();
        stream.close();
      };

      stream.addEventListener('force-logout', handleForceLogout);
      stream.addEventListener('error', () => {
        stream.close();
        window.setTimeout(() => {
          connectForceLogoutStream();
        }, 5000);
      });

      return stream;
    };

    const forceLogoutStream = connectForceLogoutStream();

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('ke:force-logout', syncAuthState);

    void validateSession();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('ke:force-logout', syncAuthState);
      forceLogoutStream?.close();
    };
  }, []);

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
    if (displayedRouteKey === 'portfolio') return <ProtectedRoute><PortfolioPage /></ProtectedRoute>;
    if (displayedRouteKey === 'danger') return <ProtectedRoute><DangerPage /></ProtectedRoute>;
    if (displayedRouteKey === 'pending-deletion') return <PendingDeletionPage />;
    if (displayedRouteKey === 'security') return <ProtectedRoute><SecurityPage /></ProtectedRoute>;
    if (displayedRouteKey === 'withdrawals') return <ProtectedRoute><WithdrawalsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'transfer') return <ProtectedRoute><TransferPage /></ProtectedRoute>;
    if (displayedRouteKey === 'deposit') return <ProtectedRoute><DepositPage /></ProtectedRoute>;
    if (displayedRouteKey === 'transactions') return <ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>;
    if (displayedRouteKey === 'notifications') return <ProtectedRoute><NotificationsPage /></ProtectedRoute>;

    if (!isAuthenticated && ['dashboard', 'profile', 'staking', 'settings', 'portfolio', 'danger', 'security', 'withdrawals', 'transfer', 'deposit', 'transactions', 'notifications'].includes(displayedRouteKey)) {
      return <LandingPage />;
    }

    return <LandingPage />;
  }, [displayedRouteKey, isAuthenticated]);

  const showNowBar = displayedRouteKey === 'dashboard' || displayedRouteKey === 'profile' || displayedRouteKey === 'staking' || displayedRouteKey === 'settings' || displayedRouteKey === 'portfolio' || displayedRouteKey === 'withdrawals' || displayedRouteKey === 'transfer' || displayedRouteKey === 'deposit' || displayedRouteKey === 'transactions' || displayedRouteKey === 'notifications';
  const isProtectedPage = ['dashboard', 'profile', 'staking', 'settings', 'portfolio', 'danger', 'pending-deletion', 'security', 'withdrawals', 'transfer', 'deposit', 'transactions', 'notifications'].includes(displayedRouteKey);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        background: theme.background,
        color: theme.text,
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          paddingTop: '80px',
        }}
      >
        <AppHeader isPublicPage={!isProtectedPage} />
        {appContent}
      </div>
      {showNowBar ? <NowBar /> : null}
    </div>
  );
};

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AppThemeProvider>
        <AppSplashOverlay />
        <RouteTransition />
      </AppThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);
