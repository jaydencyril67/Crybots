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
import AdminHomePage from './components/AdminHomePage';
import AdminSettingsPage from './components/AdminSettingsPage';
import AdminUsersPage from './components/AdminUsersPage';
import AdminDepositsPage from './components/AdminDepositsPage';
import AdminDepositStatsPage from './components/AdminDepositStatsPage';
import AdminAlertPage from './components/AdminAlertPage';
import AdminAlertSendPage from './components/AdminAlertSendPage';
import AdminFundsPage from './components/AdminFundsPage';
import AdminFundsSendPage from './components/AdminFundsSendPage';
import AdminUserStatsPage from './components/AdminUserStatsPage';
import AdminWithdrawalsPage from './components/AdminWithdrawalsPage';
import AdminWithdrawalStatsPage from './components/AdminWithdrawalStatsPage';
import AdminTicketsPage from './components/AdminTicketsPage';
import AdminChatPage from './components/AdminChatPage';
import AdminChatUserPage from './components/AdminChatUserPage';
import AdminTicketStatsPage from './components/AdminTicketStatsPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import HomePage from './components/HomePage';
import DetailsPage from './components/DetailsPage';
import ManagePage from './components/ManagePage';
import ThemePage from './components/ThemePage';
import NowBarPage from './components/NowBarPage';
import VoiceCommandsPage from './components/VoiceCommandsPage';
import VoiceNavigation from './components/VoiceNavigation';
import { disableVoiceMode } from './utils/voiceNavigation';
import NowBarColorPage from './components/NowBarColorPage';
import NowBarButtonColorPage from './components/NowBarButtonColorPage';
import DepositPage from './components/DepositPage';
import ProfilePage from './components/ProfilePage';
import StatisticsPage from './components/StatisticsPage';
import ExitPage from './components/ExitPage';
import AutoExitPage from './components/AutoExitPage';
import ManualExitPage from './components/ManualExitPage';
import AgentPage from './components/AgentPage';
import ToolsPage from './components/ToolsPage';
import StatsPage from './components/StatsPage';
import MenuPage from './components/MenuPage';
import TradePage from './components/TradePage';
import Chart from './components/Chart';
import Market from './components/Market';
import Creation from './components/Creation';
import RentalsPage from './components/RentalsPage';
import Portfolio from './components/Portfolio';
import TradeHistory from './components/TradeHistory';
import LogsPage from './components/LogsPage';
import HelpPage from './components/HelpPage';
import FAQPage from './components/FAQPage';
import OptionsPage from './components/OptionsPage';
import StorePage from './components/StorePage';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import CommunityStandardsPage from './components/CommunityStandardsPage';
import InformationPage from './components/InformationPage';
import DevPage from './components/DevPage';
import ApiKeysPage from './components/ApiKeysPage';
import WebhooksPage from './components/WebhooksPage';
import ConfigurePage from './components/ConfigurePage';
import AssetPage from './components/AssetPage';
import DangerPage from './components/DangerPage';
import PendingDeletionPage from './components/PendingDeletionPage';
import EnableAccountPage from './components/EnableAccountPage';
import SecurityPage from './components/SecurityPage';
import WithdrawalsPage from './components/WithdrawalsPage';
import TransferPage from './components/TransferPage';
import TransactionHistoryPage from './components/TransactionHistoryPage';
import NotificationsPage from './components/NotificationsPage';
import TicketsPage from './components/TicketsPage';
import ChatPage from './components/ChatPage';
import NotificationPage from './components/NotificationPage';
import AlertPage from './components/AlertPage';
import AppUsagePage from './components/AppUsagePage';
import ProtectedRoute from './components/ProtectedRoute';
import AppHeader from './components/AppHeader';
import { HYBRID_THEME_TOKENS } from './components/HybridTheme';
import api, { API_BASE_URL, forceLogout } from './api/axios';
import { getScheduledLogout, isScheduledLogoutDue, setScheduledLogout } from './utils/scheduledLogout';

const DEFAULT_IDLE_LOGOUT_MINUTES = 10;

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

const InitialSplashCleanup = () => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.getElementById('initial-splash')?.remove();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
};

const getRouteKey = () => {
  const pathname = getPathname().split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const hash = getHash().split(/[?#]/)[0].replace(/\/+$/, '') || '';

  if (pathname === '/signup' || hash === '#/signup') return 'signup';
  if (pathname === '/signup-confirmation-sent' || hash === '#/signup-confirmation-sent') return 'signup-confirmation-sent';
  if (pathname === '/verify-email' || hash === '#/verify-email') return 'verify-email';
  if (pathname === '/account-confirmed' || hash === '#/account-confirmed') return 'account-confirmed';
  if (pathname === '/signin' || hash === '#/signin') return 'signin';
  if (pathname === '/admin-home' || hash === '#/admin-home') return 'admin-home';
  if (pathname === '/admin/settings' || hash === '#/admin/settings') return 'admin-settings';
  if (pathname === '/admin/users' || hash === '#/admin/users') return 'admin-users';
  if (pathname === '/admin/deposits' || hash === '#/admin/deposits') return 'admin-deposits';
  if (pathname.startsWith('/admin/deposit-stats/') || hash.startsWith('#/admin/deposit-stats/')) return 'admin-deposit-stats';
  if (pathname.startsWith('/admin/alert/send/') || hash.startsWith('#/admin/alert/send/')) return 'admin-alert-send';
  if (pathname.startsWith('/admin/funds/send/') || hash.startsWith('#/admin/funds/send/')) return 'admin-funds-send';
  if (pathname === '/admin/funds' || hash === '#/admin/funds') return 'admin-funds';
  if (pathname === '/admin/alert' || hash === '#/admin/alert') return 'admin-alert';
  if (pathname === '/admin/withdrawals' || hash === '#/admin/withdrawals') return 'admin-withdrawals';
  if (pathname.startsWith('/admin/withdrawal-stats/') || hash.startsWith('#/admin/withdrawal-stats/')) return 'admin-withdrawal-stats';
  if (pathname.startsWith('/admin/user-stats/') || hash.startsWith('#/admin/user-stats/')) return 'admin-user-stats';
  if (pathname === '/admin/tickets' || hash === '#/admin/tickets') return 'admin-tickets';
  if (pathname.startsWith('/admin/chat/') || hash.startsWith('#/admin/chat/')) return 'admin-chat-user';
  if (pathname === '/admin/chat' || hash === '#/admin/chat') return 'admin-chat';
  if (pathname.startsWith('/admin/ticket-stats/') || hash.startsWith('#/admin/ticket-stats/')) return 'admin-ticket-stats';
  if (pathname === '/forgot-password' || hash === '#/forgot-password') return 'forgot-password';
  if (pathname === '/home' || hash === '#/home') return 'home';
  if (pathname === '/details' || hash === '#/details') return 'details';
  if (pathname === '/manage' || hash === '#/manage') return 'manage';
  if (pathname === '/theme' || hash === '#/theme') return 'theme';
  if (pathname === '/nowbar' || hash === '#/nowbar') return 'nowbar';
  if (pathname === '/voice-commands' || hash === '#/voice-commands') return 'voice-commands';
  if (pathname === '/nowbar-color' || hash === '#/nowbar-color') return 'nowbar-color';
  if (pathname === '/nowbar-button-color' || hash === '#/nowbar-button-color') return 'nowbar-button-color';
  if (pathname === '/statistics' || hash === '#/statistics') return 'statistics';
  if (pathname === '/profile' || hash === '#/profile') return 'profile';
  if (pathname === '/exit' || hash === '#/exit') return 'exit';
  if (pathname === '/auto-exit' || hash === '#/auto-exit') return 'auto-exit';
  if (pathname === '/manual-exit' || hash === '#/manual-exit') return 'manual-exit';
  if (pathname === '/stats' || hash === '#/stats') return 'stats';
  if (pathname === '/tools' || hash === '#/tools') return 'tools';
  if (pathname === '/menu' || hash === '#/menu') return 'menu';
  if (pathname === '/agent' || hash === '#/agent') return 'agent';
  if (pathname === '/trade' || hash === '#/trade') return 'trade';
  if (pathname === '/chart' || hash === '#/chart') return 'chart';
  if (pathname === '/market' || hash === '#/market') return 'market';
  if (pathname === '/creation' || hash === '#/creation') return 'creation';
  if (pathname === '/rentals' || hash === '#/rentals') return 'rentals';
  if (pathname === '/portfolio' || hash === '#/portfolio') return 'portfolio';
  if (pathname === '/trade/history' || hash === '#/trade/history') return 'trade-history';
  if (pathname === '/logs' || hash === '#/logs') return 'logs';
  if (pathname === '/help' || hash === '#/help') return 'help';
  if (pathname === '/faq' || hash === '#/faq') return 'faq';
  if (pathname === '/options' || hash === '#/options') return 'options';
  if (pathname === '/store' || hash === '#/store') return 'store';
  if (pathname === '/about' || hash === '#/about') return 'about';
  if (pathname === '/information' || hash === '#/information') return 'information';
  if (pathname === '/privacy-policy' || hash === '#/privacy-policy') return 'privacy-policy';
  if (pathname === '/community-standards' || hash === '#/community-standards') return 'community-standards';
  if (pathname === '/api-keys' || hash === '#/api-keys') return 'api-keys';
  if (pathname === '/webhooks' || hash === '#/webhooks') return 'webhooks';
  if (pathname === '/configure' || hash === '#/configure') return 'configure';
  if (pathname === '/dev' || hash === '#/dev') return 'dev';
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
  if (pathname === '/tickets' || hash === '#/tickets') return 'tickets';
  if (pathname === '/chat' || hash === '#/chat') return 'chat';
  if (pathname.startsWith('/notifications/') || hash.startsWith('#/notifications/')) return 'notification';
  if (pathname === '/alert' || hash === '#/alert') return 'alert';
  if (pathname === '/app-usage' || hash === '#/app-usage') return 'app-usage';
  return 'landing';
};

const routeToKey = (path: string) => {
  const normalizedPath = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (normalizedPath === '/signup' || normalizedPath === '#/signup') return 'signup';
  if (normalizedPath === '/signup-confirmation-sent' || normalizedPath === '#/signup-confirmation-sent') return 'signup-confirmation-sent';
  if (normalizedPath === '/verify-email' || normalizedPath === '#/verify-email') return 'verify-email';
  if (normalizedPath === '/account-confirmed' || normalizedPath === '#/account-confirmed') return 'account-confirmed';
  if (normalizedPath === '/signin' || normalizedPath === '#/signin') return 'signin';
  if (normalizedPath === '/admin-home' || normalizedPath === '#/admin-home') return 'admin-home';
  if (normalizedPath === '/admin/users' || normalizedPath === '#/admin/users') return 'admin-users';
  if (normalizedPath === '/admin/deposits' || normalizedPath === '#/admin/deposits') return 'admin-deposits';
  if (normalizedPath.startsWith('/admin/deposit-stats/') || normalizedPath.startsWith('#/admin/deposit-stats/')) return 'admin-deposit-stats';
  if (normalizedPath.startsWith('/admin/alert/send/') || normalizedPath.startsWith('#/admin/alert/send/')) return 'admin-alert-send';
  if (normalizedPath.startsWith('/admin/funds/send/') || normalizedPath.startsWith('#/admin/funds/send/')) return 'admin-funds-send';
  if (normalizedPath === '/admin/funds' || normalizedPath === '#/admin/funds') return 'admin-funds';
  if (normalizedPath === '/admin/alert' || normalizedPath === '#/admin/alert') return 'admin-alert';
  if (path === '/admin/withdrawals' || path === '#/admin/withdrawals') return 'admin-withdrawals';
  if (path.startsWith('/admin/withdrawal-stats/') || path.startsWith('#/admin/withdrawal-stats/')) return 'admin-withdrawal-stats';
  if (path.startsWith('/admin/user-stats/') || path.startsWith('#/admin/user-stats/')) return 'admin-user-stats';
  if (path === '/admin/tickets' || path === '#/admin/tickets') return 'admin-tickets';
  if (path.startsWith('/admin/chat/') || path.startsWith('#/admin/chat/')) return 'admin-chat-user';
  if (path === '/admin/chat' || path === '#/admin/chat') return 'admin-chat';
  if (path.startsWith('/admin/ticket-stats/') || path.startsWith('#/admin/ticket-stats/')) return 'admin-ticket-stats';
  if (path === '/forgot-password' || path === '#/forgot-password') return 'forgot-password';
  if (path === '/home' || path === '#/home') return 'home';
  if (path === '/details' || path === '#/details') return 'details';
  if (path === '/manage' || path === '#/manage') return 'manage';
  if (path === '/theme' || path === '#/theme') return 'theme';
  if (path === '/nowbar' || path === '#/nowbar') return 'nowbar';
  if (path === '/voice-commands' || path === '#/voice-commands') return 'voice-commands';
  if (path === '/nowbar-color' || path === '#/nowbar-color') return 'nowbar-color';
  if (path === '/nowbar-button-color' || path === '#/nowbar-button-color') return 'nowbar-button-color';
  if (path === '/statistics' || path === '#/statistics') return 'statistics';
  if (path === '/profile' || path === '#/profile') return 'profile';
  if (path === '/exit' || path === '#/exit') return 'exit';
  if (path === '/auto-exit' || path === '#/auto-exit') return 'auto-exit';
  if (path === '/manual-exit' || path === '#/manual-exit') return 'manual-exit';
  if (path === '/stats' || path === '#/stats') return 'stats';
  if (path === '/tools' || path === '#/tools') return 'tools';
  if (path === '/menu' || path === '#/menu') return 'menu';
  if (path === '/agent' || path === '#/agent') return 'agent';
  if (path === '/trade' || path === '#/trade') return 'trade';
  if (path === '/chart' || path === '#/chart') return 'chart';
  if (path === '/market' || path === '#/market') return 'market';
  if (path === '/creation' || path === '#/creation') return 'creation';
  if (path === '/rentals' || path === '#/rentals') return 'rentals';
  if (path === '/portfolio' || path === '#/portfolio') return 'portfolio';
  if (path === '/trade/history' || path === '#/trade/history') return 'trade-history';
  if (path === '/logs' || path === '#/logs') return 'logs';
  if (path === '/help' || path === '#/help') return 'help';
  if (path === '/faq' || path === '#/faq') return 'faq';
  if (path === '/options' || path === '#/options') return 'options';
  if (path === '/store' || path === '#/store') return 'store';
  if (path === '/about' || path === '#/about') return 'about';
  if (path === '/information' || path === '#/information') return 'information';
  if (path === '/privacy-policy' || path === '#/privacy-policy') return 'privacy-policy';
  if (path === '/community-standards' || path === '#/community-standards') return 'community-standards';
  if (path === '/api-keys' || path === '#/api-keys') return 'api-keys';
  if (path === '/webhooks' || path === '#/webhooks') return 'webhooks';
  if (path === '/configure' || path === '#/configure') return 'configure';
  if (path === '/dev' || path === '#/dev') return 'dev';
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
  if (path === '/tickets' || path === '#/tickets') return 'tickets';
  if (path === '/chat' || path === '#/chat') return 'chat';
  if (path.startsWith('/notifications/') || path.startsWith('#/notifications/')) return 'notification';
  if (path === '/alert' || path === '#/alert') return 'alert';
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

    let scheduledLogoutTimer: number | undefined;
    let idleLogoutTimer: number | undefined;
    let idleLogoutEnabled = false;
    let idleLogoutMinutes = DEFAULT_IDLE_LOGOUT_MINUTES;
    let lastActivityPingAt = 0;
    let hasTriggeredScheduledLogout = false;

    const validateScheduledLogout = () => {
      if (hasTriggeredScheduledLogout) return;

      const scheduledLogout = getScheduledLogout();
      if (scheduledLogout && isScheduledLogoutDue(scheduledLogout)) {
        hasTriggeredScheduledLogout = true;
        setScheduledLogout('');
        forceLogout();
      }
    };

    const scheduleNextLogoutCheck = () => {
      if (scheduledLogoutTimer !== undefined) {
        window.clearTimeout(scheduledLogoutTimer);
      }

      const scheduledLogout = getScheduledLogout();
      if (!scheduledLogout) return;

      const scheduledTime = new Date(scheduledLogout).getTime();
      if (!Number.isFinite(scheduledTime)) return;

      const delay = Math.max(0, scheduledTime - Date.now());
      scheduledLogoutTimer = window.setTimeout(() => {
        validateScheduledLogout();
        scheduleNextLogoutCheck();
      }, Math.min(delay, 2147483647));
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

    const loadIdleLogoutSetting = async () => {
      if (!localStorage.getItem('token')) {
        idleLogoutEnabled = false;
        idleLogoutMinutes = DEFAULT_IDLE_LOGOUT_MINUTES;
        if (idleLogoutTimer !== undefined) {
          window.clearTimeout(idleLogoutTimer);
          idleLogoutTimer = undefined;
        }
        return;
      }

      try {
        const response = await api.get('/api/auth/idle-logout');
        const nextIdleLogoutEnabled = response.data.idleLogoutEnabled === true;
        const nextIdleLogoutMinutes = [5, 10, 15, 30].includes(Number(response.data.idleLogoutMinutes)) ? Number(response.data.idleLogoutMinutes) : DEFAULT_IDLE_LOGOUT_MINUTES;
        const settingChanged = idleLogoutEnabled !== nextIdleLogoutEnabled || idleLogoutMinutes !== nextIdleLogoutMinutes;
        idleLogoutEnabled = nextIdleLogoutEnabled;
        idleLogoutMinutes = nextIdleLogoutMinutes;
        if (settingChanged) {
          resetIdleLogoutTimer();
        }
      } catch {
        if (idleLogoutEnabled) {
          idleLogoutEnabled = false;
          resetIdleLogoutTimer();
        }
      }
    };

    const resetIdleLogoutTimer = () => {
      if (idleLogoutTimer !== undefined) {
        window.clearTimeout(idleLogoutTimer);
      }

      if (!idleLogoutEnabled || !localStorage.getItem('token')) {
        idleLogoutTimer = undefined;
        return;
      }

      idleLogoutTimer = window.setTimeout(() => {
        if (idleLogoutEnabled && localStorage.getItem('token')) {
          forceLogout();
        }
      }, idleLogoutMinutes * 60 * 1000);
    };

    const handleUserActivity = () => {
      resetIdleLogoutTimer();

      const token = localStorage.getItem('token');
      const now = Date.now();
      if (!token || now - lastActivityPingAt < 30000) return;

      lastActivityPingAt = now;
      void api.post('/api/auth/idle-logout/activity').catch(() => {
        // The regular session validation handles expired or invalid sessions.
      });
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleUserActivity, { passive: true }));

    const interval = window.setInterval(() => {
      validateScheduledLogout();
      void validateSession();
      void loadIdleLogoutSetting();
    }, 15000);

    validateScheduledLogout();
    void loadIdleLogoutSetting();

    const connectForceLogoutStream = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        return null;
      }

      const stream = new EventSource(`${API_BASE_URL}/api/auth/force-logout/stream?token=${encodeURIComponent(token)}`, {
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

    const handleScheduledLogoutChange = () => {
      hasTriggeredScheduledLogout = false;
      scheduleNextLogoutCheck();
      validateScheduledLogout();
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('ke:force-logout', syncAuthState);
    window.addEventListener('ke:scheduled-logout-change', handleScheduledLogoutChange);

    scheduleNextLogoutCheck();
    void validateSession();

    return () => {
      window.clearInterval(interval);
      if (scheduledLogoutTimer !== undefined) {
        window.clearTimeout(scheduledLogoutTimer);
      }
      if (idleLogoutTimer !== undefined) {
        window.clearTimeout(idleLogoutTimer);
      }
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleUserActivity));
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('ke:force-logout', syncAuthState);
      window.removeEventListener('ke:scheduled-logout-change', handleScheduledLogoutChange);
      forceLogoutStream?.close();
    };
  }, []);

  const appContent = useMemo(() => {
    if (displayedRouteKey === 'signup') return <SignupPage />;
    if (displayedRouteKey === 'signup-confirmation-sent') return <SignupConfirmationSentPage />;
    if (displayedRouteKey === 'verify-email') return <VerifyEmailPage />;
    if (displayedRouteKey === 'account-confirmed') return <AccountConfirmedPage />;
    if (displayedRouteKey === 'signin') return <SigninPage />;
    if (displayedRouteKey === 'admin-home') return <AdminHomePage />;
    if (displayedRouteKey === 'admin-settings') return <AdminSettingsPage />;
    if (displayedRouteKey === 'admin-users') return <AdminUsersPage />;
    if (displayedRouteKey === 'admin-deposits') return <AdminDepositsPage />;
    if (displayedRouteKey === 'admin-deposit-stats') return <AdminDepositStatsPage />;
    if (displayedRouteKey === 'admin-alert') return <AdminAlertPage />;
    if (displayedRouteKey === 'admin-alert-send') return <AdminAlertSendPage />;
    if (displayedRouteKey === 'admin-funds') return <AdminFundsPage />;
    if (displayedRouteKey === 'admin-funds-send') return <AdminFundsSendPage />;
    if (displayedRouteKey === 'admin-user-stats') return <AdminUserStatsPage />;
    if (displayedRouteKey === 'admin-withdrawals') return <AdminWithdrawalsPage />;
    if (displayedRouteKey === 'admin-withdrawal-stats') return <AdminWithdrawalStatsPage />;
    if (displayedRouteKey === 'admin-tickets') return <AdminTicketsPage />;
    if (displayedRouteKey === 'admin-chat') return <AdminChatPage />;
    if (displayedRouteKey === 'admin-chat-user') return <AdminChatUserPage />;
    if (displayedRouteKey === 'admin-ticket-stats') return <AdminTicketStatsPage />;
    if (displayedRouteKey === 'forgot-password') return <ForgotPasswordPage />;
    if (displayedRouteKey === 'home') return <ProtectedRoute><HomePage /></ProtectedRoute>;
    if (displayedRouteKey === 'details') return <ProtectedRoute><DetailsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'manage') return <ProtectedRoute><ManagePage /></ProtectedRoute>;
    if (displayedRouteKey === 'theme') return <ProtectedRoute><ThemePage /></ProtectedRoute>;
    if (displayedRouteKey === 'nowbar') return <ProtectedRoute><NowBarPage /></ProtectedRoute>;
    if (displayedRouteKey === 'voice-commands') return <ProtectedRoute><VoiceCommandsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'nowbar-color') return <ProtectedRoute><NowBarColorPage /></ProtectedRoute>;
    if (displayedRouteKey === 'nowbar-button-color') return <ProtectedRoute><NowBarButtonColorPage /></ProtectedRoute>;
    if (displayedRouteKey === 'profile') return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
    if (displayedRouteKey === 'exit') return <ProtectedRoute><ExitPage /></ProtectedRoute>;
    if (displayedRouteKey === 'auto-exit') return <ProtectedRoute><AutoExitPage /></ProtectedRoute>;
    if (displayedRouteKey === 'manual-exit') return <ProtectedRoute><ManualExitPage /></ProtectedRoute>;
    if (displayedRouteKey === 'statistics') return <ProtectedRoute><StatisticsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'agent') return <ProtectedRoute><AgentPage /></ProtectedRoute>;
    if (displayedRouteKey === 'tools') return <ProtectedRoute><ToolsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'stats') return <ProtectedRoute><StatsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'menu') return <ProtectedRoute><MenuPage /></ProtectedRoute>;
    if (displayedRouteKey === 'trade') return <ProtectedRoute><TradePage /></ProtectedRoute>;
    if (displayedRouteKey === 'chart') return <ProtectedRoute><Chart /></ProtectedRoute>;
    if (displayedRouteKey === 'market') return <ProtectedRoute><Market /></ProtectedRoute>;
    if (displayedRouteKey === 'creation') return <ProtectedRoute><Creation /></ProtectedRoute>;
    if (displayedRouteKey === 'rentals') return <ProtectedRoute><RentalsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'portfolio') return <ProtectedRoute><Portfolio /></ProtectedRoute>;
    if (displayedRouteKey === 'trade-history') return <ProtectedRoute><TradeHistory /></ProtectedRoute>;
    if (displayedRouteKey === 'logs') return <ProtectedRoute><LogsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'help') return <ProtectedRoute><HelpPage /></ProtectedRoute>;
    if (displayedRouteKey === 'faq') return <ProtectedRoute><FAQPage /></ProtectedRoute>;
    if (displayedRouteKey === 'options') return <ProtectedRoute><OptionsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'store') return <ProtectedRoute><StorePage /></ProtectedRoute>;
    if (displayedRouteKey === 'about') return <ProtectedRoute><AboutPage /></ProtectedRoute>;
    if (displayedRouteKey === 'information') return <ProtectedRoute><InformationPage /></ProtectedRoute>;
    if (displayedRouteKey === 'privacy-policy') return <ProtectedRoute><PrivacyPolicyPage /></ProtectedRoute>;
    if (displayedRouteKey === 'community-standards') return <ProtectedRoute><CommunityStandardsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'api-keys') return <ProtectedRoute><ApiKeysPage /></ProtectedRoute>;
    if (displayedRouteKey === 'webhooks') return <ProtectedRoute><WebhooksPage /></ProtectedRoute>;
    if (displayedRouteKey === 'configure') return <ProtectedRoute><ConfigurePage /></ProtectedRoute>;
    if (displayedRouteKey === 'dev') return <ProtectedRoute><DevPage /></ProtectedRoute>;
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
    if (displayedRouteKey === 'tickets') return <ProtectedRoute><TicketsPage /></ProtectedRoute>;
    if (displayedRouteKey === 'chat') return <ProtectedRoute><ChatPage /></ProtectedRoute>;
    if (displayedRouteKey === 'notification') return <ProtectedRoute><NotificationPage /></ProtectedRoute>;
    if (displayedRouteKey === 'alert') return <ProtectedRoute><AlertPage /></ProtectedRoute>;
    if (displayedRouteKey === 'app-usage') return <ProtectedRoute><AppUsagePage /></ProtectedRoute>;

    if (!isAuthenticated && ['home', 'details', 'manage', 'theme', 'nowbar', 'voice-commands', 'nowbar-color', 'nowbar-button-color', 'profile', 'exit', 'auto-exit', 'manual-exit', 'statistics', 'agent', 'tools', 'stats', 'menu', 'trade', 'chart', 'market', 'creation', 'rentals', 'portfolio', 'trade-history', 'logs', 'help', 'faq', 'options', 'store', 'about', 'dev', 'api-keys', 'webhooks', 'configure', 'asset', 'danger', 'security', 'withdrawals', 'transfer', 'deposit', 'transactions', 'notifications', 'tickets', 'chat', 'alert', 'app-usage'].includes(displayedRouteKey)) {
      return <LandingPage />;
    }

    return <LandingPage />;
  }, [displayedRouteKey, isAuthenticated]);

  const showNowBar = displayedRouteKey === 'admin-users' || displayedRouteKey === 'admin-chat' || displayedRouteKey === 'admin-deposits' || displayedRouteKey === 'admin-deposit-stats' || displayedRouteKey === 'admin-alert' || displayedRouteKey === 'admin-tickets' || displayedRouteKey === 'admin-ticket-stats' || displayedRouteKey === 'admin-alert-send' || displayedRouteKey === 'admin-funds' || displayedRouteKey === 'admin-funds-send' || displayedRouteKey === 'admin-user-stats' || displayedRouteKey === 'home' || displayedRouteKey === 'details' || displayedRouteKey === 'manage' || displayedRouteKey === 'voice-commands' || displayedRouteKey === 'theme' || displayedRouteKey === 'nowbar' || displayedRouteKey === 'nowbar-color' || displayedRouteKey === 'nowbar-button-color' || displayedRouteKey === 'profile' || displayedRouteKey === 'exit' || displayedRouteKey === 'auto-exit' || displayedRouteKey === 'manual-exit' || displayedRouteKey === 'statistics' || displayedRouteKey === 'agent' || displayedRouteKey === 'tools' || displayedRouteKey === 'stats' || displayedRouteKey === 'menu' || displayedRouteKey === 'trade' || displayedRouteKey === 'chart' || displayedRouteKey === 'market' || displayedRouteKey === 'creation' || displayedRouteKey === 'rentals' || displayedRouteKey === 'portfolio' || displayedRouteKey === 'trade-history' || displayedRouteKey === 'logs' || displayedRouteKey === 'help' || displayedRouteKey === 'faq' || displayedRouteKey === 'options' || displayedRouteKey === 'store' || displayedRouteKey === 'about' || displayedRouteKey === 'dev' || displayedRouteKey === 'api-keys' || displayedRouteKey === 'webhooks' || displayedRouteKey === 'configure' || displayedRouteKey === 'asset' || displayedRouteKey === 'withdrawals' || displayedRouteKey === 'transfer' || displayedRouteKey === 'deposit' || displayedRouteKey === 'transactions' || displayedRouteKey === 'notifications' || displayedRouteKey === 'tickets' || displayedRouteKey === 'notification' || displayedRouteKey === 'alert' || displayedRouteKey === 'app-usage';
  const isProtectedPage = ['admin-users', 'admin-chat', 'admin-chat-user', 'admin-deposits', 'admin-deposit-stats', 'admin-alert', 'admin-tickets', 'admin-ticket-stats', 'admin-alert-send', 'admin-funds', 'admin-funds-send', 'admin-user-stats', 'home', 'details', 'manage', 'theme', 'nowbar', 'voice-commands', 'nowbar-color', 'nowbar-button-color', 'profile', 'exit', 'auto-exit', 'manual-exit', 'statistics', 'agent', 'tools', 'stats', 'menu', 'trade', 'chart', 'market', 'creation', 'rentals', 'portfolio', 'trade-history', 'logs', 'help', 'faq', 'options', 'store', 'about', 'information', 'privacy-policy', 'community-standards', 'dev', 'api-keys', 'webhooks', 'configure', 'asset', 'danger', 'pending-deletion', 'security', 'withdrawals', 'transfer', 'deposit', 'transactions', 'notifications', 'tickets', 'chat', 'notification', 'alert', 'app-usage'].includes(displayedRouteKey);
  const usagePagePath = displayedRouteKey === 'exit' ? '/exit' : displayedRouteKey === 'statistics' ? '/statistics' : displayedRouteKey === 'tools' ? '/tools' : displayedRouteKey === 'stats' ? '/stats' : displayedRouteKey === 'menu' ? '/menu' : displayedRouteKey === 'nowbar' ? '/nowbar' : displayedRouteKey === 'nowbar-color' ? '/nowbar-color' : displayedRouteKey === 'nowbar-button-color' ? '/nowbar-button-color' : `/${displayedRouteKey}`;

  useEffect(() => {
    if (!showNowBar) disableVoiceMode();
  }, [showNowBar]);

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
    </div>
  );
};

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AppThemeProvider>
        <InitialSplashCleanup />
        <VoiceNavigation />
        <RouteTransition />
      </AppThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);
