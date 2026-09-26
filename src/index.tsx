import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import ManagePage from './components/ManagePage';
import ThemeSettingsPage from './components/ThemeSettingsPage';
import NowBarSettingsPage from './components/NowBarSettingsPage';
import NowBarColorPage from './components/NowBarColorPage';
import NowBarButtonColorPage from './components/NowBarButtonColorPage';
import DepositPage from './components/DepositPage';
import PortfolioPage from './components/PortfolioPage';
import PortfolioStatisticsPage from './components/PortfolioStatisticsPage';
import LogoutPage from './components/LogoutPage';
import AutoLogoutPage from './components/AutoLogoutPage';
import ManualLogoutPage from './components/ManualLogoutPage';
import AgentPage from './components/AgentPage';
import AgentToolsPage from './components/AgentToolsPage';
import AgentStatsPage from './components/AgentStatsPage';
import AgentMenuPage from './components/AgentMenuPage';
import ExchangePage from './components/ExchangePage';
import MySpacePage from './components/MySpacePage';
import MarketPage from './components/MarketPage';
import RecordsPage from './components/RecordsPage';
import ContactPage from './components/ContactPage';
import OptionsPage from './components/OptionsPage';
import LibraryPage from './components/LibraryPage';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import CommunityStandardsPage from './components/CommunityStandardsPage';
import InformationPage from './components/InformationPage';
import DeveloperPage from './components/DeveloperPage';
import AssetPage from './components/AssetPage';
import DangerPage from './components/DangerPage';
import PendingDeletionPage from './components/PendingDeletionPage';
import EnableAccountPage from './components/EnableAccountPage';
import SecurityPage from './components/SecurityPage';
import WithdrawalsPage from './components/WithdrawalsPage';
import TransferPage from './components/TransferPage';
import TransactionHistoryPage from './components/TransactionHistoryPage';
import NotificationsPage from './components/NotificationsPage';
import AlertSettingsPage from './components/AlertSettingsPage';
import AppUsagePage from './components/AppUsagePage';
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
  if (pathname === '/manage' || hash === '#/manage') return 'manage';
  if (pathname === '/theme-settings' || hash === '#/theme-settings') return 'theme-settings';
  if (pathname === '/nowbar-settings' || hash === '#/nowbar-settings') return 'nowbar-settings';
  if (pathname === '/nowbar-color' || hash === '#/nowbar-color') return 'nowbar-color';
  if (pathname === '/nowbar-button-color' || hash === '#/nowbar-button-color') return 'nowbar-button-color';
  if (pathname === '/portfolio/statistics' || hash === '#/portfolio/statistics') return 'portfolio-statistics';
  if (pathname === '/portfolio' || hash === '#/portfolio') return 'portfolio';
  if (pathname === '/logout' || hash === '#/logout') return 'logout';
  if (pathname === '/agent/stats' || hash === '#/agent/stats') return 'agent-stats';
  if (pathname === '/agent/tools' || hash === '#/agent/tools') return 'agent-tools';
  if (pathname === '/agent/menu' || hash === '#/agent/menu') return 'agent-menu';
  if (pathname === '/agent' || hash === '#/agent') return 'agent';
  if (pathname === '/exchange' || hash === '#/exchange') return 'exchange';
  if (pathname === '/my-space' || hash === '#/my-space') return 'my-space';
  if (pathname === '/market' || hash === '#/market') return 'market';
  if (pathname === '/records' || hash === '#/records') return 'records';
  if (pathname === '/contact' || hash === '#/contact') return 'contact';
  if (pathname === '/options' || hash === '#/options') return 'options';
  if (pathname === '/library' || hash === '#/library') return 'library';
  if (pathname === '/about' || hash === '#/about') return 'about';
  if (pathname === '/information' || hash === '#/information') return 'information';
  if (pathname === '/privacy-policy' || hash === '#/privacy-policy') return 'privacy-policy';
  if (pathname === '/community-standards' || hash === '#/community-standards') return 'community-standards';
  if (pathname === '/developer' || hash === '#/developer') return 'developer';
  if (pathname === '/asset' || hash === '#/asset') return 'asset';
  if (pathname === '/danger' || hash === '#/danger') return 'danger';
  if (pathname === '/pending-deletion' || hash === '#/pending-deletion') return 'pending-deletion';
  if (pathname === '/enable-account' || hash === '#/enable-account') return 'enable-account';
  if (pathname === '/security' || hash === '#/security') return 'security';
  if (pathname === '/withdrawals' || hash === '#/withdrawals') return 'withdrawals';
  if (pathname === '/transfer' || hash === '#/transfer') return 'transfer';
  if (pathname === '/deposit' || hash === '#/deposit') return 'deposit';
  if (pathname === '/transactions' || hash === '#/transactions') return 'transactions';
  if (pathname === '/notifications' || hash === '#/notifications') return 'notifications';
  if (pathname === '/alert-settings' || hash === '#/alert-settings') return 'alert-settings';
  if (pathname === '/app-usage' || hash === '#/app-usage') return 'app-usage';
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
  if (path === '/manage' || path === '#/manage') return 'manage';
  if (path === '/theme-settings' || path === '#/theme-settings') return 'theme-settings';
  if (path === '/nowbar-settings' || path === '#/nowbar-settings') return 'nowbar-settings';
  if (path === '/nowbar-color' || path === '#/nowbar-color') return 'nowbar-color';
  if (path === '/nowbar-button-color' || path === '#/nowbar-button-color') return 'nowbar-button-color';
  if (path === '/portfolio/statistics' || path === '#/portfolio/statistics') return 'portfolio-statistics';
  if (path === '/portfolio' || path === '#/portfolio') return 'portfolio';
  if (path === '/logout' || path === '#/logout') return 'logout';
  if (path === '/auto-logout' || path === '#/auto-logout') return 'auto-logout';
  if (path === '/manual-logout' || path === '#/manual-logout') return 'manual-logout';
  if (path === '/agent/stats' || path === '#/agent/stats') return 'agent-stats';
  if (path === '/agent/tools' || path === '#/agent/tools') return 'agent-tools';
  if (path === '/agent/menu' || path === '#/agent/menu') return 'agent-menu';
  if (path === '/agent' || path === '#/agent') return 'agent';
  if (path === '/exchange' || path === '#/exchange') return 'exchange';
  if (path === '/my-space' || path === '#/my-space') return 'my-space';
  if (path === '/market' || path === '#/market') return 'market';
  if (path === '/records' || path === '#/records') return 'records';
  if (path === '/contact' || path === '#/contact') return 'contact';
  if (path === '/options' || path === '#/options') return 'options';
  if (path === '/library' || path === '#/library') return 'library';
  if (path === '/about' || path === '#/about') return 'about';
  if (path === '/information' || path === '#/information') return 'information';
  if (path === '/privacy-policy' || path === '#/privacy-policy') return 'privacy-policy';
  if (path === '/community-standards' || path === '#/community-standards') return 'community-standards';
  if (path === '/developer' || path === '#/developer') return 'developer';
  if (path === '/asset' || path === '#/asset') return 'asset';
  if (path === '/danger' || path === '#/danger') return 'danger';
  if (path === '/pending-deletion' || path === '#/pending-deletion') return 'pending-deletion';
  if (path === '/enable-account' || path === '#/enable-account') return 'enable-account';
  if (path === '/security' || path === '#/security') return 'security';
  if (path === '/withdrawals' || path === '#/withdrawals') return 'withdrawals';
  if (path === '/transfer' || path === '#/transfer') return 'transfer';
  if (path === '/deposit' || path === '#/deposit') return 'deposit';
  if (path === '/transactions' || path === '#/transactions') return 'transactions';
  if (path === '/notifications' || path === '#/notifications') return 'notifications';
  if (path === '/alert-settings' || path === '#/alert-settings') return 'alert-settings';
  if (path === '/app-usage' || path === '#/app-usage') return 'app-usage';
  return 'landing';
};

const RouteTransition = () => {
  const { themeMode: mode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[mode];
  const [routeKey, setRouteKey] = useState(getRouteKey);
  const [displayedRouteKey, setDisplayedRouteKey] = useState(routeKey);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const syncRoute = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      const nextRouteKey = getRouteKey();
      setRouteKey(nextRouteKey);
      setDisplayedRouteKey(nextRouteKey);
    };

    const handleNavigationStart = (event: Event) => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      const customEvent = event as CustomEvent<{ path?: string }>;
      const nextRouteKey = routeToKey(customEvent.detail?.path ?? window.location.pathname);
      setRouteKey(nextRouteKey);
      setDisplayedRouteKey(nextRouteKey);
    };

    window.addEventListener('ke:navigation-start', handleNavigationStart as EventListener);
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
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
    if (displayedRouteKey === 'manage') return <ProtectedRoute><ManagePage /></ProtectedRoute>;
    if (displayedRouteKey === 'theme-settings') return <ProtectedRoute><ThemeSettingsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'nowbar-settings') return <ProtectedRoute><NowBarSettingsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'nowbar-color') return <ProtectedRoute><NowBarColorPage /></ProtectedRoute>;
    if (displayedRouteKey === 'nowbar-button-color') return <ProtectedRoute><NowBarButtonColorPage /></ProtectedRoute>;
    if (displayedRouteKey === 'portfolio') return <ProtectedRoute><PortfolioPage /></ProtectedRoute>;
    if (displayedRouteKey === 'logout') return <ProtectedRoute><LogoutPage /></ProtectedRoute>;
    if (displayedRouteKey === 'auto-logout') return <ProtectedRoute><AutoLogoutPage /></ProtectedRoute>;
    if (displayedRouteKey === 'manual-logout') return <ProtectedRoute><ManualLogoutPage /></ProtectedRoute>;
    if (displayedRouteKey === 'portfolio-statistics') return <ProtectedRoute><PortfolioStatisticsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'agent') return <ProtectedRoute><AgentPage /></ProtectedRoute>;
    if (displayedRouteKey === 'agent-tools') return <ProtectedRoute><AgentToolsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'agent-stats') return <ProtectedRoute><AgentStatsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'agent-menu') return <ProtectedRoute><AgentMenuPage /></ProtectedRoute>;
    if (displayedRouteKey === 'exchange') return <ProtectedRoute><ExchangePage /></ProtectedRoute>;
    if (displayedRouteKey === 'my-space') return <ProtectedRoute><MySpacePage /></ProtectedRoute>;
        if (displayedRouteKey === 'market') return <ProtectedRoute><MarketPage /></ProtectedRoute>;
    if (displayedRouteKey === 'records') return <ProtectedRoute><RecordsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'contact') return <ProtectedRoute><ContactPage /></ProtectedRoute>;
    if (displayedRouteKey === 'options') return <ProtectedRoute><OptionsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'library') return <ProtectedRoute><LibraryPage /></ProtectedRoute>;
    if (displayedRouteKey === 'about') return <ProtectedRoute><AboutPage /></ProtectedRoute>;
    if (displayedRouteKey === 'information') return <ProtectedRoute><InformationPage /></ProtectedRoute>;
    if (displayedRouteKey === 'privacy-policy') return <ProtectedRoute><PrivacyPolicyPage /></ProtectedRoute>;
    if (displayedRouteKey === 'community-standards') return <ProtectedRoute><CommunityStandardsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'developer') return <ProtectedRoute><DeveloperPage /></ProtectedRoute>;
    if (displayedRouteKey === 'asset') return <ProtectedRoute><AssetPage /></ProtectedRoute>;
    if (displayedRouteKey === 'danger') return <ProtectedRoute><DangerPage /></ProtectedRoute>;
    if (displayedRouteKey === 'pending-deletion') return <PendingDeletionPage />;
    if (displayedRouteKey === 'enable-account') return <EnableAccountPage />;
    if (displayedRouteKey === 'security') return <ProtectedRoute><SecurityPage /></ProtectedRoute>;
    if (displayedRouteKey === 'withdrawals') return <ProtectedRoute><WithdrawalsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'transfer') return <ProtectedRoute><TransferPage /></ProtectedRoute>;
    if (displayedRouteKey === 'deposit') return <ProtectedRoute><DepositPage /></ProtectedRoute>;
    if (displayedRouteKey === 'transactions') return <ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>;
    if (displayedRouteKey === 'notifications') return <ProtectedRoute><NotificationsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'alert-settings') return <ProtectedRoute><AlertSettingsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'app-usage') return <ProtectedRoute><AppUsagePage /></ProtectedRoute>;

    if (!isAuthenticated && ['dashboard', 'profile', 'manage', 'theme-settings', 'nowbar-settings', 'nowbar-color', 'nowbar-button-color', 'portfolio', 'logout', 'portfolio-statistics', 'agent', 'agent-tools', 'agent-stats', 'agent-menu', 'exchange', 'my-space', 'market', 'records', 'contact', 'options', 'library', 'about', 'developer', 'asset', 'danger', 'security', 'withdrawals', 'transfer', 'deposit', 'transactions', 'notifications', 'alert-settings', 'app-usage'].includes(displayedRouteKey)) {
      return <LandingPage />;
    }

    return <LandingPage />;
  }, [displayedRouteKey, isAuthenticated]);

  const showNowBar = displayedRouteKey === 'dashboard' || displayedRouteKey === 'profile' || displayedRouteKey === 'manage' || displayedRouteKey === 'theme-settings' || displayedRouteKey === 'nowbar-settings' || displayedRouteKey === 'nowbar-color' || displayedRouteKey === 'nowbar-button-color' || displayedRouteKey === 'portfolio' || displayedRouteKey === 'logout' || displayedRouteKey === 'portfolio-statistics' || displayedRouteKey === 'agent' || displayedRouteKey === 'agent-tools' || displayedRouteKey === 'agent-stats' || displayedRouteKey === 'agent-menu' || displayedRouteKey === 'exchange' || displayedRouteKey === 'my-space' || displayedRouteKey === 'market' || displayedRouteKey === 'records' || displayedRouteKey === 'contact' || displayedRouteKey === 'options' || displayedRouteKey === 'library' || displayedRouteKey === 'about' || displayedRouteKey === 'developer' || displayedRouteKey === 'asset' || displayedRouteKey === 'withdrawals' || displayedRouteKey === 'transfer' || displayedRouteKey === 'deposit' || displayedRouteKey === 'transactions' || displayedRouteKey === 'notifications' || displayedRouteKey === 'alert-settings' || displayedRouteKey === 'app-usage';
  const isProtectedPage = ['dashboard', 'profile', 'manage', 'theme-settings', 'nowbar-settings', 'nowbar-color', 'nowbar-button-color', 'portfolio', 'logout', 'portfolio-statistics', 'agent', 'agent-tools', 'agent-stats', 'agent-menu', 'exchange', 'my-space', 'market', 'records', 'contact', 'options', 'library', 'about', 'information', 'privacy-policy', 'community-standards', 'developer', 'asset', 'danger', 'pending-deletion', 'security', 'withdrawals', 'transfer', 'deposit', 'transactions', 'notifications', 'alert-settings', 'app-usage'].includes(displayedRouteKey);
  const usagePagePath = displayedRouteKey === 'logout' ? '/logout' : displayedRouteKey === 'portfolio-statistics' ? '/portfolio/statistics' : displayedRouteKey === 'agent-tools' ? '/agent/tools' : displayedRouteKey === 'agent-stats' ? '/agent/stats' : displayedRouteKey === 'agent-menu' ? '/agent/menu' : displayedRouteKey === 'nowbar-settings' ? '/nowbar-settings' : displayedRouteKey === 'nowbar-color' ? '/nowbar-color' : displayedRouteKey === 'nowbar-button-color' ? '/nowbar-button-color' : `/${displayedRouteKey}`;

  const trackedUsagePage = useRef('');

  useEffect(() => {
    if (!isAuthenticated || !isProtectedPage || trackedUsagePage.current === usagePagePath) return;
    trackedUsagePage.current = usagePagePath;
    void api.post('/api/app-usage/page', { page: usagePagePath }).catch(() => {
      // Usage tracking must never interrupt navigation.
    });
  }, [isAuthenticated, isProtectedPage, usagePagePath]);

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
