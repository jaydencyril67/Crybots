import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CandlestickChart, ChevronDown, CircleHelp, CircleUserRound, Coins, DoorOpen, HandCoins, History, Home, Info, LifeBuoy, MessageCircle, Settings, ShieldCheck, SlidersHorizontal, Store, Terminal, UserRound, Users, WalletCards } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { NOWBAR_COMMAND_EVENT, PAGE_ROUTES } from '../utils/voiceNavigation';

const EDGE_LIGHT_COLORS = {
  blue: '#38bdf8',
  purple: '#a855f7',
  pink: '#ec4899',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
} as const;

type EdgeLightColor = keyof typeof EDGE_LIGHT_COLORS;
type EdgeLightMode = 'stable-light' | 'stable' | 'blink-light' | 'blink' | 'pulse-light' | 'pulse' | 'color-light' | 'color';
type EdgeLightSettings = { enabled: boolean; color: string; mode: EdgeLightMode };

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const BUTTON_COLOR_STORAGE_KEY = 'nowbar_button_color';
const BUTTON_COLOR_ENABLED_STORAGE_KEY = 'nowbar_button_color_enabled';
const SWIPE_NAVIGATION_STORAGE_KEY = 'nowbar_swipe_navigation_enabled';
const EXPAND_MODE_STORAGE_KEY = 'nowbar_expand_mode_enabled';
const DEFAULT_BUTTON_COLOR = '#38bdf8';
const EDGE_LIGHT_MODES: EdgeLightMode[] = ['stable-light', 'stable', 'blink-light', 'blink', 'pulse-light', 'pulse', 'color-light', 'color'];

const getButtonColor = () => {
  if (typeof window === 'undefined') return DEFAULT_BUTTON_COLOR;

  try {
    const stored = window.localStorage.getItem(BUTTON_COLOR_STORAGE_KEY);
    return stored && /^#[0-9a-f]{6}$/i.test(stored) ? stored : DEFAULT_BUTTON_COLOR;
  } catch {
    return DEFAULT_BUTTON_COLOR;
  }
};

const getFeatureEnabled = (key: string) => {
  if (typeof window === 'undefined') return true;

  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
};

const getButtonColorEnabled = () => {
  if (typeof window === 'undefined') return false;

  try {
    const stored = window.localStorage.getItem(BUTTON_COLOR_ENABLED_STORAGE_KEY);
    return stored === null ? false : stored === 'true';
  } catch {
    return false;
  }
};

const getEdgeLightSettings = (): EdgeLightSettings => {
  if (typeof window === 'undefined') {
    return { enabled: false, color: EDGE_LIGHT_COLORS.blue, mode: 'stable' as EdgeLightMode }; 
  }

  try {
    const raw = window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY);
    if (!raw) {
      return { enabled: false, color: EDGE_LIGHT_COLORS.blue, mode: 'stable' as EdgeLightMode };
    }

    const parsed = JSON.parse(raw) as { enabled?: boolean; color?: string | EdgeLightColor; mode?: EdgeLightMode };
    const legacyColor = parsed.color && parsed.color in EDGE_LIGHT_COLORS
      ? EDGE_LIGHT_COLORS[parsed.color as EdgeLightColor]
      : parsed.color;
    return {
      enabled: Boolean(parsed.enabled),
      color: typeof legacyColor === 'string' && /^#[0-9a-f]{6}$/i.test(legacyColor) ? legacyColor : EDGE_LIGHT_COLORS.blue,
      mode: parsed.mode && EDGE_LIGHT_MODES.includes(parsed.mode) ? parsed.mode : 'stable',
    }; 
  } catch {
    return { enabled: false, color: EDGE_LIGHT_COLORS.blue, mode: 'stable' };
  }
};

const styles = {
  dock: {
    zIndex: 40,
    width: 'min(560px, calc(100vw - 32px))',
    pointerEvents: 'none' as const,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'fixed' as const,
    left: '50%',
    bottom: '18px',
    transform: 'translateX(-50%)',
  },
  dockExpanded: {
    width: 'fit-content',
    maxWidth: 'calc(100vw - 32px)',
    height: 'calc(2.5 * 72px)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 24px var(--edge-light), 0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '20px',
    border: '2.5px solid rgba(255,255,255,0.88)',
    position: 'relative' as const,
    background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(8,14,26,0.92) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 0 24px var(--edge-light), 0 18px 50px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.12)',
    backdropFilter: 'blur(18px) saturate(120%)',
    WebkitBackdropFilter: 'blur(18px) saturate(120%)',
    pointerEvents: 'auto' as const,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
    scrollbarWidth: 'none' as const,
    WebkitOverflowScrolling: 'touch' as const,
    alignSelf: 'stretch',
  },
  barExpanded: {
    display: 'grid',
    width: 'fit-content',
    maxWidth: '100%',
    gridTemplateColumns: 'repeat(3, minmax(112px, max-content))',
    gridAutoRows: 'minmax(54px, auto)',
    alignItems: 'stretch',
    alignSelf: 'flex-end',
    gap: '8px',
    padding: '12px',
    borderRadius: '26px',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    height: '100%',
    minHeight: 0,
    whiteSpace: 'normal' as const,
    alignContent: 'start' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  rail: {
    position: 'absolute' as const,
    inset: '50% 10px auto',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
  },
  slot: {
    flex: '0 0 auto',
    minWidth: '92px',
    display: 'flex',
    justifyContent: 'center',
  },
  slotExpanded: {
    minWidth: 0,
    width: 'max-content',
    justifyContent: 'center',
    minHeight: 0,
  },
  button: {
    width: '100%',
    minHeight: '40px',
    padding: '7px 6px 6px',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(8,14,26,0.92) 100%)',
    color: '#e5eefc',
    cursor: 'pointer',
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'transform 180ms ease, background 180ms ease, border-color 180ms ease',
  },
  buttonExpanded: {
    width: '100%',
    minWidth: '112px',
    maxWidth: '100%',
    minHeight: '40px',
    padding: '9px 10px 8px',
    borderRadius: '12px',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  buttonEmpty: {
    opacity: 0.7,
    border: '1px dashed rgba(255,255,255,0.12)',
  },
  iconOnly: {
    width: '20px',
    height: '20px',
    display: 'grid',
    placeItems: 'center',
  },
  labelCompact: {
    maxWidth: '100%',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    lineHeight: 1,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  labelExpanded: {
    minWidth: 0,
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    lineHeight: 1,
    overflow: 'hidden' as const,
  },
  marqueeViewport: {
    minWidth: 0,
    overflow: 'hidden' as const,
    flex: 1,
  },
  marqueeTrack: {
    display: 'inline-flex',
    whiteSpace: 'nowrap' as const,
    animation: 'nowbar-label-marquee 7s ease-in-out infinite',
    willChange: 'transform',
  },
  iconWrap: {
    width: '18px',
    height: '18px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  icon: {
    width: '18px',
    height: '18px',
  },
  orb: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #7dd3fc, #a78bfa)',
    boxShadow: '0 0 18px rgba(125, 211, 252, 0.55)',
    flexShrink: 0,
  },
};

export type NowBarAction = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  active?: boolean;
};

type NowBarProps = {
  actions?: NowBarAction[];
  admin?: boolean;
};

type NowBarView = 'title' | 'actions';

type NowBarMode = 'compact' | 'expanded';

type NavigationGroup = {
  routes: string[];
};

const parentRoutes = [
  '/home',
  '/profile',
  '/agent',
  '/trade',
  '/logs',
  '/asset',
  '/help',
  '/options',
  '/store',
  '/about',
  '/dev',
  '/exit',
];

const childNavigationGroups: NavigationGroup[] = [
  { routes: ['/details', '/statistics', '/security', '/danger'] },
  { routes: ['/stats', '/tools', '/menu'] },
  { routes: ['/market', '/my-space', '/control-center'] },
  { routes: ['/transactions', '/app-usage'] },
  { routes: ['/faq', '/tickets', '/chat'] },
  { routes: ['/theme', '/nowbar', '/alert'] },
  { routes: ['/deposit', '/withdrawals', '/transfer', '/manage'] },
  { routes: ['/information', '/privacy-policy', '/community-standards'] },
  { routes: ['/api-keys', '/webhooks', '/configure'] },
  { routes: ['/nowbar-color', '/nowbar-button-color'] },
];

const getActivePath = () => {
  const rawPath = window.location.pathname || window.location.hash.replace('#', '') || '/home';
  const path = rawPath.split(/[?#]/)[0].replace(/\/$/, '');
  return path || '/home';
};

const getCurrentPageTitle = (path: string) => {
  const catalogEntry = PAGE_ROUTES.find((page) => page.route === path);
  if (catalogEntry) return catalogEntry.label;
  if (path === '/home') return 'HOME';
  if (path === '/admin-home') return 'ADMIN';
  if (path === '/admin/users') return 'USERS';
  if (path === '/admin/chat') return 'CHAT';
  if (path === '/admin/deposits') return 'DEPOSITS';
  if (path.startsWith('/admin/deposit-stats/')) return 'DEPOSIT STATS';
  if (path.startsWith('/admin/alert/send/')) return 'SEND ALERT';
  if (path.startsWith('/admin/funds/send/')) return 'SEND FUNDS';
  if (path === '/admin/funds') return 'FUNDS';
  if (path === '/admin/alert') return 'ALERT';
  if (path === '/admin/withdrawals') return 'WITHDRAW';
  if (path.startsWith('/admin/withdrawal-stats/')) return 'WITHDRAWAL STATS';
  if (path.startsWith('/admin/user-stats/')) return 'USER-STATS';
  if (path.startsWith('/admin/ticket-stats/')) return 'TICKET STATS';
  if (path === '/admin/tickets') return 'TICKETS';
  if (path.startsWith('/notifications/')) return 'NOTIFICATION';
  if (path === '/details') return 'DETAILS';
  if (path === '/manage') return 'MANAGE';
  if (path === '/theme') return 'THEME';
  if (path === '/nowbar') return 'NOWBAR';
  if (path === '/nowbar-color') return 'EDGE LIGHTING';
  if (path === '/nowbar-button-color') return 'BUTTON COLOR';
  if (path === '/statistics') return 'STATISTICS';
  if (path === '/profile') return 'PROFILE';
  if (path === '/exit') return 'EXIT';
  if (path === '/auto-exit') return 'AUTO EXIT';
  if (path === '/manual-exit') return 'MANUAL EXIT';
  if (path === '/agent') return 'AGENT';
  if (path === '/stats') return 'STATS';
  if (path === '/tools') return 'TOOLS';
  if (path === '/menu') return 'MENU';
  if (path === '/trade') return 'TRADE';
  if (path === '/control-center') return 'CONTROL CENTER';
  if (path === '/my-space') return 'MY SPACE';
  if (path === '/market') return 'MARKET';
  if (path === '/logs') return 'LOGS';
  if (path === '/help') return 'HELP';
  if (path === '/faq') return 'FAQ';
  if (path === '/options') return 'OPTION';
  if (path === '/store') return 'STORE';
  if (path === '/about') return 'ABOUT';
  if (path === '/dev') return 'DEV';
  if (path === '/api-keys') return 'API KEYS';
  if (path === '/webhooks') return 'WEBHOOKS';
  if (path === '/configure') return 'CONFIGURE';
  if (path === '/exit') return 'EXIT';
  if (path === '/asset') return 'ASSETS';
  if (path === '/danger') return 'DANGER';
  if (path === '/security') return 'SECURITY';
  if (path === '/withdrawals') return 'WITHDRAW';
  if (path === '/transfer') return 'TRANSFER';
  if (path === '/deposit') return 'DEPOSIT';
  if (path === '/transactions') return 'TRANSACTIONS';
  if (path === '/notifications') return 'NOTIFICATIONS';
  if (path === '/tickets') return 'TICKETS';
  if (path === '/alert') return 'ALERT';
  if (path === '/app-usage') return 'APP USAGE';
  if (path === '/privacy-policy') return 'PRIVACY POLICY';
  if (path === '/information') return 'INFORMATION';
  if (path === '/community-standards') return 'COMMUNITY STANDARDS';
  return 'NOWBAR';
};

const createAdminActions = (): NowBarAction[] => [
  { label: 'DASHBOARD', icon: <ShieldCheck size={18} />, onClick: () => navigate('/admin-home'), active: getActivePath() === '/admin-home' },
  { label: 'USERS', icon: <Users size={18} />, onClick: () => navigate('/admin/users'), active: getActivePath() === '/admin/users' },
  { label: 'TICKETS', icon: <LifeBuoy size={18} />, onClick: () => navigate('/admin/tickets'), active: getActivePath() === '/admin/tickets' || getActivePath().startsWith('/admin/ticket-stats/') },
  { label: 'CHAT', icon: <MessageCircle size={18} />, onClick: () => navigate('/admin/chat'), active: getActivePath() === '/admin/chat' || getActivePath().startsWith('/admin/chat/') },
  { label: 'DEPOSITS', icon: <Coins size={18} />, onClick: () => navigate('/admin/deposits'), active: getActivePath() === '/admin/deposits' },
  { label: 'ALERT', icon: <Bell size={18} />, onClick: () => navigate('/admin/alert'), active: getActivePath() === '/admin/alert' },
  { label: 'FUNDS', icon: <WalletCards size={18} />, onClick: () => navigate('/admin/funds'), active: getActivePath() === '/admin/funds' },
  { label: 'WITHDRAW', icon: <WalletCards size={18} />, onClick: () => navigate('/admin/withdrawals'), active: getActivePath() === '/admin/withdrawals' },
  { label: 'SETTINGS', icon: <Settings size={18} />, onClick: () => {} },
];

const createDefaultActions = (): NowBarAction[] => [
  {
    label: 'HOME',
    icon: <Home size={18} />,
    onClick: () => {
      navigate('/home');
    },
    active: getActivePath() === '/home',
  },
  {
    label: 'PROFILE',
    icon: <UserRound size={18} />,
    onClick: () => {
      navigate('/profile');
    },
    active: getActivePath() === '/profile',
  },
  {
    label: 'AGENT',
    icon: <HandCoins size={18} />,
    onClick: () => {
      navigate('/agent');
    },
    active: getActivePath() === '/agent',
  },
  {
    label: 'TRADE',
    icon: <CandlestickChart size={18} />,
    onClick: () => {
      navigate('/trade');
    },
    active: getActivePath() === '/trade',
  },
  {
    label: 'LOGS',
    icon: <History size={18} />,
    onClick: () => {
      navigate('/logs');
    },
    active: getActivePath() === '/logs',
  },
  {
    label: 'ASSETS',
    icon: <Coins size={18} />,
    onClick: () => {
      navigate('/asset');
    },
    active: getActivePath() === '/asset',
  },
  {
    label: 'HELP',
    icon: <CircleHelp size={18} />,
    onClick: () => {
      navigate('/help');
    },
    active: getActivePath() === '/help',
  },
  {
    label: 'OPTION',
    icon: <SlidersHorizontal size={18} />,
    onClick: () => {
      navigate('/options');
    },
    active: getActivePath() === '/options',
  },
  {
    label: 'STORE',
    icon: <Store size={18} />,
    onClick: () => {
      navigate('/store');
    },
    active: getActivePath() === '/store',
  },
  {
    label: 'ABOUT',
    icon: <Info size={18} />,
    onClick: () => {
      navigate('/about');
    },
    active: getActivePath() === '/about',
  },
  {
    label: 'DEV',
    icon: <Terminal size={18} />,
    onClick: () => {
      navigate('/dev');
    },
    active: getActivePath() === '/dev',
  },
  {
    label: 'EXIT',
    icon: <DoorOpen size={18} />,
    onClick: () => {
      navigate('/exit');
    },
    active: getActivePath() === '/exit',
  },
];

const NowBar = ({ actions, admin = false }: NowBarProps) => {
  const [edgeLightVersion, setEdgeLightVersion] = useState(0);
  const [buttonColorVersion, setButtonColorVersion] = useState(0);
  const [featureSettingsVersion, setFeatureSettingsVersion] = useState(0);
  const edgeLight = useMemo(() => getEdgeLightSettings(), [edgeLightVersion]);
  const buttonColor = useMemo(() => getButtonColor(), [buttonColorVersion]);
  const buttonColorEnabled = useMemo(() => getButtonColorEnabled(), [buttonColorVersion]);
  const swipeNavigationEnabled = useMemo(() => getFeatureEnabled(SWIPE_NAVIGATION_STORAGE_KEY), [featureSettingsVersion]);
  const expandModeEnabled = useMemo(() => getFeatureEnabled(EXPAND_MODE_STORAGE_KEY), [featureSettingsVersion]);
  const edgeLightColor = edgeLight.color;
  const [view, setView] = useState<NowBarView>('title');
  const [mode, setMode] = useState<NowBarMode>('compact');
  const modeRef = React.useRef<NowBarMode>('compact');
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [idleTimer, setIdleTimer] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);
  const holdTriggeredRef = React.useRef(false);
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const swipeStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const swipeHandledRef = React.useRef(false);
  const [currentPath, setCurrentPath] = useState(getActivePath());
  const resolvedActions = useMemo(() => {
    const availableActions = actions || (admin ? createAdminActions() : createDefaultActions());
    if (admin && currentPath.startsWith('/admin/deposit-stats/')) {
      return availableActions.filter((action) => action.label !== 'DEPOSITS');
    }
    return availableActions;
  }, [actions, admin, currentPath]);
  const currentPageTitle = getCurrentPageTitle(currentPath);
  const isExpanded = expandModeEnabled && mode === 'expanded';
  modeRef.current = mode;

  useEffect(() => {
    if (!expandModeEnabled && mode === 'expanded') {
      setMode('compact');
    }
  }, [expandModeEnabled, mode]);

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(getActivePath());
      setView('title');
      setMode('compact');
    };

    const syncEdgeLight = () => {
      setEdgeLightVersion((current) => current + 1);
    };

    const syncButtonColor = () => {
      setButtonColorVersion((current) => current + 1);
    };

    const syncFeatureSettings = () => {
      setFeatureSettingsVersion((current) => current + 1);
    };

    const handleVoiceCommand = (event: Event) => {
      const command = (event as CustomEvent<{ command?: string }>).detail?.command;
      if (!command) return;

      handleInteraction();
      if (command === 'expand') {
        setMode('compact');
        setView('actions');
      } else if (command === 'collapse') {
        setMode((currentMode) => {
          if (currentMode === 'expanded') return 'compact';
          setView('title');
          return currentMode;
        });
      } else if (command === 'left' || command === 'right') {
        if (modeRef.current === 'compact') {
          barRef.current?.scrollBy({
            left: command === 'right' ? Math.round(barRef.current.clientWidth * 0.8) : -Math.round(barRef.current.clientWidth * 0.8),
            behavior: 'smooth',
          });
          return;
        }

        const path = getActivePath();
        const currentIndex = parentRoutes.indexOf(path);
        const childGroup = childNavigationGroups.find((group) => group.routes.includes(path));
        const routes = childGroup ? childGroup.routes : currentIndex >= 0 ? parentRoutes : [];
        const routeIndex = routes.indexOf(path);
        const nextIndex = routeIndex + (command === 'right' ? 1 : -1);
        const nextRoute = routes[nextIndex];
        if (nextRoute) navigate(nextRoute);
      }
    };

    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    window.addEventListener('ke:navigation-start', syncPath as EventListener);
    window.addEventListener('storage', syncEdgeLight);
    window.addEventListener('storage', syncButtonColor);
    window.addEventListener('nowbar-edge-light-changed', syncEdgeLight as EventListener);
    window.addEventListener('nowbar-button-color-changed', syncButtonColor as EventListener);
    window.addEventListener('nowbar-feature-settings-changed', syncFeatureSettings as EventListener);
    window.addEventListener(NOWBAR_COMMAND_EVENT, handleVoiceCommand);

    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
      window.removeEventListener('ke:navigation-start', syncPath as EventListener);
      window.removeEventListener('storage', syncEdgeLight);
      window.removeEventListener('storage', syncButtonColor);
      window.removeEventListener('nowbar-edge-light-changed', syncEdgeLight as EventListener);
      window.removeEventListener('nowbar-button-color-changed', syncButtonColor as EventListener);
      window.removeEventListener('nowbar-feature-settings-changed', syncFeatureSettings as EventListener);
      window.removeEventListener(NOWBAR_COMMAND_EVENT, handleVoiceCommand);

    };
  }, []);

  useEffect(() => () => {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
    }
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }
  }, [holdTimer, idleTimer]);

  const resetIdleTimer = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }

    if (getActivePath() === '/nowbar-button-color' || getActivePath() === '/exit') {
      setIdleTimer(null);
      return;
    }

    const timer = window.setTimeout(() => {
      if (getActivePath() !== '/nowbar-button-color' && getActivePath() !== '/exit') {
        setView('title');
      }
    }, 10000);

    setIdleTimer(timer);
  };

  const startHold = () => {
    holdTriggeredRef.current = false;
    setPressing(true);
    resetIdleTimer();
    const timer = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      if (view === 'title') {
        setView('actions');
      }
      if (expandModeEnabled) {
        setMode((currentMode) => (currentMode === 'compact' ? 'expanded' : 'compact'));
      }
    }, 700);
    setHoldTimer(timer);
  };

  const stopHold = () => {
    setPressing(false);
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleInteraction = () => {
    resetIdleTimer();
  };

  const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeNavigationEnabled || view !== 'title' || event.touches.length !== 1) return;

    swipeStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleSwipeEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!swipeNavigationEnabled || view !== 'title' || !start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    const currentIndex = parentRoutes.indexOf(currentPath);
    const childGroup = childNavigationGroups.find((group) => group.routes.includes(currentPath));
    const routes = childGroup ? childGroup.routes : currentIndex >= 0 ? parentRoutes : [];
    const routeIndex = routes.indexOf(currentPath);
    if (routeIndex < 0) return;

    swipeHandledRef.current = true;
    const nextIndex = deltaX < 0 ? routeIndex + 1 : routeIndex - 1;
    const nextRoute = routes[nextIndex];
    if (nextRoute) navigate(nextRoute);
  };

  return (
    <>
      <style>{`@keyframes nowbar-label-marquee { 0%, 15% { transform: translateX(0); } 45%, 70% { transform: translateX(calc(-100% + 145px)); } 100% { transform: translateX(0); } }
@keyframes nowbar-edge-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@keyframes nowbar-edge-blink-light { 0%, 42%, 100% { border-color: var(--edge-light); box-shadow: 0 18px 50px rgba(0,0,0,.82); } 48%, 94% { border-color: rgba(255,255,255,.88); box-shadow: 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-blink { 0%, 42%, 100% { border-color: var(--edge-light); box-shadow: 0 0 0 1px var(--edge-light), 0 0 26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 48%, 94% { border-color: rgba(255,255,255,.88); box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 0 2px transparent, 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-pulse-light { 0%, 100% { border-color: var(--edge-light); filter: saturate(1); box-shadow: 0 0 0 1px var(--edge-light), 0 0 7px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 50% { border-color: var(--edge-light); filter: saturate(1.25); box-shadow: 0 0 0 2px var(--edge-light), 0 0 16px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-pulse { 0%, 100% { border-color: var(--edge-light); filter: saturate(1); box-shadow: 0 0 0 1px var(--edge-light), 0 0 15px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 50% { border-color: var(--edge-light); filter: saturate(1.8); box-shadow: 0 0 0 3px var(--edge-light), 0 0 38px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } }


[data-nowbar-control] { -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent; } [data-nowbar-control]:focus { outline: none; } [data-nowbar-control]:focus-visible { outline: 2px solid rgba(255,255,255,.72); outline-offset: 2px; } [data-nowbar-control]:active { -webkit-tap-highlight-color: transparent; }
@keyframes nowbar-edge-color-light { 0% { border-color: #38bdf8; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 4% { border-color: #22d3ee; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 8% { border-color: #14b8a6; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 12% { border-color: #10b981; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 16% { border-color: #84cc16; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 20% { border-color: #eab308; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 24% { border-color: #facc15; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 28% { border-color: #f97316; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 32% { border-color: #ef4444; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 36% { border-color: #e11d48; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 40% { border-color: #db2777; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 44% { border-color: #ec4899; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 48% { border-color: #d946ef; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 52% { border-color: #a855f7; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 56% { border-color: #8b5cf6; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 60% { border-color: #6366f1; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 64% { border-color: #4f46e5; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 68% { border-color: #2563eb; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 72% { border-color: #0ea5e9; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 76% { border-color: #06b6d4; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 80% { border-color: #2dd4bf; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 84% { border-color: #34d399; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 88% { border-color: #a3e635; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 92% { border-color: #fbbf24; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 96% { border-color: #fb923c; box-shadow: 0 18px 50px rgba(0,0,0,.82); } 100% { border-color: #38bdf8; box-shadow: 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-color { 0% { border-color: #38bdf8; box-shadow: 0 0 0 2px #38bdf8, 0 0 24px #38bdf8, 0 18px 50px rgba(0,0,0,.82); } 4% { border-color: #22d3ee; box-shadow: 0 0 0 2px #22d3ee, 0 0 24px #22d3ee, 0 18px 50px rgba(0,0,0,.82); } 8% { border-color: #14b8a6; box-shadow: 0 0 0 2px #14b8a6, 0 0 24px #14b8a6, 0 18px 50px rgba(0,0,0,.82); } 12% { border-color: #10b981; box-shadow: 0 0 0 2px #10b981, 0 0 24px #10b981, 0 18px 50px rgba(0,0,0,.82); } 16% { border-color: #84cc16; box-shadow: 0 0 0 2px #84cc16, 0 0 24px #84cc16, 0 18px 50px rgba(0,0,0,.82); } 20% { border-color: #eab308; box-shadow: 0 0 0 2px #eab308, 0 0 24px #eab308, 0 18px 50px rgba(0,0,0,.82); } 24% { border-color: #facc15; box-shadow: 0 0 0 2px #facc15, 0 0 24px #facc15, 0 18px 50px rgba(0,0,0,.82); } 28% { border-color: #f97316; box-shadow: 0 0 0 2px #f97316, 0 0 24px #f97316, 0 18px 50px rgba(0,0,0,.82); } 32% { border-color: #ef4444; box-shadow: 0 0 0 2px #ef4444, 0 0 24px #ef4444, 0 18px 50px rgba(0,0,0,.82); } 36% { border-color: #e11d48; box-shadow: 0 0 0 2px #e11d48, 0 0 24px #e11d48, 0 18px 50px rgba(0,0,0,.82); } 40% { border-color: #db2777; box-shadow: 0 0 0 2px #db2777, 0 0 24px #db2777, 0 18px 50px rgba(0,0,0,.82); } 44% { border-color: #ec4899; box-shadow: 0 0 0 2px #ec4899, 0 0 24px #ec4899, 0 18px 50px rgba(0,0,0,.82); } 48% { border-color: #d946ef; box-shadow: 0 0 0 2px #d946ef, 0 0 24px #d946ef, 0 18px 50px rgba(0,0,0,.82); } 52% { border-color: #a855f7; box-shadow: 0 0 0 2px #a855f7, 0 0 24px #a855f7, 0 18px 50px rgba(0,0,0,.82); } 56% { border-color: #8b5cf6; box-shadow: 0 0 0 2px #8b5cf6, 0 0 24px #8b5cf6, 0 18px 50px rgba(0,0,0,.82); } 60% { border-color: #6366f1; box-shadow: 0 0 0 2px #6366f1, 0 0 24px #6366f1, 0 18px 50px rgba(0,0,0,.82); } 64% { border-color: #4f46e5; box-shadow: 0 0 0 2px #4f46e5, 0 0 24px #4f46e5, 0 18px 50px rgba(0,0,0,.82); } 68% { border-color: #2563eb; box-shadow: 0 0 0 2px #2563eb, 0 0 24px #2563eb, 0 18px 50px rgba(0,0,0,.82); } 72% { border-color: #0ea5e9; box-shadow: 0 0 0 2px #0ea5e9, 0 0 24px #0ea5e9, 0 18px 50px rgba(0,0,0,.82); } 76% { border-color: #06b6d4; box-shadow: 0 0 0 2px #06b6d4, 0 0 24px #06b6d4, 0 18px 50px rgba(0,0,0,.82); } 80% { border-color: #2dd4bf; box-shadow: 0 0 0 2px #2dd4bf, 0 0 24px #2dd4bf, 0 18px 50px rgba(0,0,0,.82); } 84% { border-color: #34d399; box-shadow: 0 0 0 2px #34d399, 0 0 24px #34d399, 0 18px 50px rgba(0,0,0,.82); } 88% { border-color: #a3e635; box-shadow: 0 0 0 2px #a3e635, 0 0 24px #a3e635, 0 18px 50px rgba(0,0,0,.82); } 92% { border-color: #fbbf24; box-shadow: 0 0 0 2px #fbbf24, 0 0 24px #fbbf24, 0 18px 50px rgba(0,0,0,.82); } 96% { border-color: #fb923c; box-shadow: 0 0 0 2px #fb923c, 0 0 24px #fb923c, 0 18px 50px rgba(0,0,0,.82); } 100% { border-color: #38bdf8; box-shadow: 0 0 0 2px #38bdf8, 0 0 24px #38bdf8, 0 18px 50px rgba(0,0,0,.82); } }
`}</style>
      <div style={{ ...styles.dock, ...(isExpanded ? styles.dockExpanded : {}) }} aria-label="Quick navigation bar">
      <div
        ref={barRef}
        style={{
          ...styles.bar,
          ...(edgeLight.enabled ? {
            '--edge-light': edgeLightColor,
            '--edge-light-mode': edgeLight.mode,
            borderColor: edgeLightColor,
            ...(['stable-light'].includes(edgeLight.mode) ? { boxShadow: '0 18px 50px rgba(0,0,0,.82)' } : {}),
            animation: edgeLight.mode === 'stable' || edgeLight.mode === 'stable-light' ? undefined : `nowbar-edge-${edgeLight.mode} ${edgeLight.mode === 'blink' || edgeLight.mode === 'blink-light' || edgeLight.mode === 'pulse' || edgeLight.mode === 'pulse-light' ? '3.2s' : edgeLight.mode === 'color' || edgeLight.mode === 'color-light' ? '6s' : '2.8s'} ease-in-out infinite`,
            animationFillMode: 'both',
            willChange: 'border-color, box-shadow, filter',
          } : {}),
          ...(isExpanded ? styles.barExpanded : {}),
        }}
        data-nowbar-edge-light={edgeLight.enabled ? edgeLight.mode : undefined}
        data-nowbar-control
        role="button"
        tabIndex={0}
        aria-label={view === 'title' ? `${currentPageTitle} page. Tap to show navigation buttons.` : 'Navigation buttons. Tap to show current page.'}
        onClick={() => {
          if (swipeHandledRef.current) {
            swipeHandledRef.current = false;
          } else if (!pressing && !holdTriggeredRef.current) {
            handleInteraction();
            setView(view === 'title' ? 'actions' : 'title');
          }
          holdTriggeredRef.current = false;
        }}
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={(event) => {
          startHold();
          handleSwipeStart(event);
        }}
        onTouchEnd={(event) => {
          stopHold();
          handleSwipeEnd(event);
        }}
        onTouchCancel={() => {
          stopHold();
          swipeStartRef.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleInteraction();
            setView(view === 'title' ? 'actions' : 'title');
          }
        }}
      >
        <div style={styles.rail} />
        {view === 'title' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e5eefc', width: '100%', justifyContent: 'center', padding: '2px 4px' }}>
            <span style={styles.orb} />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em' }}>{currentPageTitle}</span>
            <ChevronDown size={16} style={{ opacity: 0.8 }} />
          </div>
        ) : (
          resolvedActions.map((action, index) => (
            <div key={`now-bar-slot-${index}`} style={{ ...styles.slot, ...(isExpanded ? styles.slotExpanded : {}) }}>
              <button
                type="button"
                aria-label={action.label}
                data-nowbar-control
                onClick={action.onClick}
                style={{
                  ...styles.button,
                  ...(buttonColorEnabled ? { borderColor: buttonColor } : {}),
                  ...(isExpanded ? styles.buttonExpanded : {}),
                }}
              >
                <span style={styles.iconOnly}>{action.icon || <CircleUserRound style={styles.icon} />}</span>
                {!isExpanded && <span style={styles.labelCompact}>{action.label.toUpperCase()}</span>}
                {isExpanded ? (
                  action.label.length > 12 ? (
                    <span style={{ ...styles.labelExpanded, ...styles.marqueeViewport }}>
                      <span style={styles.marqueeTrack}>{action.label.toUpperCase()}&nbsp;&nbsp;•&nbsp;&nbsp;{action.label.toUpperCase()}</span>
                    </span>
                  ) : (
                    <span style={styles.labelExpanded}>{action.label.toUpperCase()}</span>
                  )
                ) : null}
              </button>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};

export default NowBar;
