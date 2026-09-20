import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowUpDown, Banknote, BarChart3, CalendarClock, ChevronDown, CircleUserRound, Coins, Home, Landmark, Settings2, UserRound, WalletCards } from 'lucide-react';
import { navigate } from '../utils/navigate';

const EDGE_LIGHT_COLORS = {
  blue: '#38bdf8',
  purple: '#a855f7',
  pink: '#ec4899',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
} as const;

type EdgeLightColor = keyof typeof EDGE_LIGHT_COLORS;
type EdgeLightMode = 'stable-light' | 'stable' | 'blink-light' | 'blink' | 'pulse-light' | 'pulse' | 'sweep-light' | 'sweep' | 'color-light' | 'color';
type EdgeLightSettings = { enabled: boolean; color: string; mode: EdgeLightMode };

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const EDGE_LIGHT_MODES: EdgeLightMode[] = ['stable-light', 'stable', 'blink-light', 'blink', 'pulse-light', 'pulse', 'sweep-light', 'sweep', 'color-light', 'color'];

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
    width: 'min(560px, calc(100vw - 16px))',
    height: 'calc(1.6 * 72px)',
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
    background: '#000000',
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
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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
    width: '100%',
    justifyContent: 'stretch',
    minHeight: 0,
  },
  button: {
    width: '100%',
    minHeight: '44px',
    padding: '10px',
    border: '2px solid rgba(255,255,255,0.78)',
    borderRadius: '12px',
    background: '#000000',
    color: '#e5eefc',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 180ms ease, background 180ms ease, border-color 180ms ease',
  },
  buttonExpanded: {
    minHeight: '48px',
    padding: '10px 12px',
    borderRadius: '18px',
    justifyContent: 'flex-start',
    gap: '10px',
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
  labelExpanded: {
    fontSize: '0.92rem',
    fontWeight: 700,
    letterSpacing: '0.01em',
    textAlign: 'left' as const,
    whiteSpace: 'normal' as const,
    lineHeight: 1.1,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
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

type NowBarAction = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  active?: boolean;
};

type NowBarProps = {
  actions?: NowBarAction[];
};

type NowBarView = 'title' | 'actions';

type NowBarMode = 'compact' | 'expanded';

const getActivePath = () => window.location.pathname || window.location.hash.replace('#', '') || '/dashboard';

const getCurrentPageTitle = (path: string) => {
  if (path === '/dashboard') return 'DASHBOARD';
  if (path === '/profile') return 'DETAILS';
  if (path === '/staking') return 'STAKING';
  if (path === '/settings') return 'SETTINGS';
  if (path === '/portfolio') return 'PORTFOLIO';
  if (path === '/danger') return 'DANGER';
  if (path === '/security') return 'SECURITY';
  if (path === '/withdrawals') return 'WITHDRAW';
  if (path === '/transfer') return 'TRANSFER';
  if (path === '/deposit') return 'DEPOSIT';
  if (path === '/transactions') return 'TRANSACTIONS';
  if (path === '/notifications') return 'NOTIFICATIONS';
  return 'NOWBAR';
};

const createDefaultActions = (): NowBarAction[] => [
  {
    label: 'Deposit',
    icon: <Banknote size={18} />,
    onClick: () => {
      navigate('/deposit');
    },
    active: getActivePath() === '/deposit',
  },
  {
    label: 'Dashboard',
    icon: <Home size={18} />,
    onClick: () => {
      navigate('/dashboard');
    },
    active: getActivePath() === '/dashboard',
  },
  {
    label: 'Portfolio',
    icon: <BarChart3 size={18} />,
    onClick: () => {
      navigate('/portfolio');
    },
    active: getActivePath() === '/portfolio',
  },
  {
    label: 'Staking',
    icon: <Coins size={18} />,
    onClick: () => {
      navigate('/staking');
    },
    active: getActivePath() === '/staking',
  },
  {
    label: 'Withdraw',
    icon: <ArrowUpDown size={18} />,
    onClick: () => {
      navigate('/withdrawals');
    },
    active: getActivePath() === '/withdrawals',
  },
  {
    label: 'Transfer',
    icon: <ArrowLeftRight size={18} />,
    onClick: () => {
      navigate('/transfer');
    },
    active: getActivePath() === '/transfer',
  },
  {
    label: 'Transactions',
    icon: <CalendarClock size={18} />,
    onClick: () => {
      navigate('/transactions');
    },
    active: getActivePath() === '/transactions',
  },
  {
    label: 'Settings',
    icon: <Settings2 size={18} />,
    onClick: () => {
      navigate('/settings');
    },
    active: getActivePath() === '/settings',
  },
];

const NowBar = ({ actions }: NowBarProps) => {
  const [edgeLightVersion, setEdgeLightVersion] = useState(0);
  const edgeLight = useMemo(() => getEdgeLightSettings(), [edgeLightVersion]);
  const edgeLightColor = edgeLight.color;
  const [view, setView] = useState<NowBarView>('title');
  const [mode, setMode] = useState<NowBarMode>('compact');
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [idleTimer, setIdleTimer] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const [currentPath, setCurrentPath] = useState(getActivePath());
  const resolvedActions = useMemo(() => actions || createDefaultActions(), [actions]);
  const currentPageTitle = getCurrentPageTitle(currentPath);
  const isExpanded = mode === 'expanded';

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(getActivePath());
      setView('title');
      setMode('compact');
    };

    const syncEdgeLight = () => {
      setEdgeLightVersion((current) => current + 1);
    };

    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    window.addEventListener('ke:navigation-start', syncPath as EventListener);
    window.addEventListener('storage', syncEdgeLight);
    window.addEventListener('nowbar-edge-light-changed', syncEdgeLight as EventListener);


    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
      window.removeEventListener('ke:navigation-start', syncPath as EventListener);
      window.removeEventListener('storage', syncEdgeLight);
      window.removeEventListener('nowbar-edge-light-changed', syncEdgeLight as EventListener);

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

    const timer = window.setTimeout(() => {
      setView('title');
    }, 10000);

    setIdleTimer(timer);
  };

  const startHold = () => {
    setPressing(true);
    resetIdleTimer();
    const timer = window.setTimeout(() => {
      setMode((currentMode) => (currentMode === 'compact' ? 'expanded' : 'compact'));
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

  return (
    <>
      <style>{`@keyframes nowbar-edge-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
[data-nowbar-edge-light="sweep-light"]::before, [data-nowbar-edge-light="sweep"]::before { content: ''; position: absolute; inset: -2.5px; border-radius: inherit; padding: 2.5px; background: conic-gradient(from -90deg, transparent 0deg 350deg, var(--edge-light) 354deg, rgba(255,255,255,.98) 358deg, transparent 360deg); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; pointer-events: none; z-index: 3; animation: nowbar-edge-orbit 2.4s linear infinite; }
[data-nowbar-edge-light="sweep"]::before { filter: drop-shadow(0 0 7px var(--edge-light)) drop-shadow(0 0 13px var(--edge-light)); }
@keyframes nowbar-edge-blink-light { 0%, 42%, 100% { border-color: var(--edge-light); box-shadow: 0 18px 50px rgba(0,0,0,.82); } 48%, 94% { border-color: rgba(255,255,255,.88); box-shadow: 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-blink { 0%, 42%, 100% { border-color: var(--edge-light); box-shadow: 0 0 0 1px var(--edge-light), 0 0 26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 48%, 94% { border-color: rgba(255,255,255,.88); box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 0 2px transparent, 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-pulse-light { 0%, 100% { border-color: var(--edge-light); filter: saturate(1); box-shadow: 0 0 0 1px var(--edge-light), 0 0 7px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 50% { border-color: var(--edge-light); filter: saturate(1.25); box-shadow: 0 0 0 2px var(--edge-light), 0 0 16px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-pulse { 0%, 100% { border-color: var(--edge-light); filter: saturate(1); box-shadow: 0 0 0 1px var(--edge-light), 0 0 15px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 50% { border-color: var(--edge-light); filter: saturate(1.8); box-shadow: 0 0 0 3px var(--edge-light), 0 0 38px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-sweep-light { 0% { border-color: var(--edge-light); box-shadow: inset 28px 0 0 -26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 25% { border-color: var(--edge-light); box-shadow: inset 0 28px 0 -26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 50% { border-color: var(--edge-light); box-shadow: inset -28px 0 0 -26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 75% { border-color: var(--edge-light); box-shadow: inset 0 -28px 0 -26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 100% { border-color: var(--edge-light); box-shadow: inset 28px 0 0 -26px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } }
@keyframes nowbar-edge-sweep { 0% { border-color: var(--edge-light); box-shadow: inset 34px 0 10px -25px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 25% { border-color: var(--edge-light); box-shadow: inset 0 34px 10px -25px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 50% { border-color: var(--edge-light); box-shadow: inset -34px 0 10px -25px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 75% { border-color: var(--edge-light); box-shadow: inset 0 -34px 10px -25px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } 100% { border-color: var(--edge-light); box-shadow: inset 34px 0 10px -25px var(--edge-light), 0 18px 50px rgba(0,0,0,.82); } }
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
            ...(['stable-light', 'sweep-light'].includes(edgeLight.mode) ? { boxShadow: '0 18px 50px rgba(0,0,0,.82)' } : {}),
            animation: edgeLight.mode === 'stable' || edgeLight.mode === 'stable-light' || edgeLight.mode === 'sweep' || edgeLight.mode === 'sweep-light' ? undefined : `nowbar-edge-${edgeLight.mode} ${edgeLight.mode === 'blink' || edgeLight.mode === 'blink-light' || edgeLight.mode === 'pulse' || edgeLight.mode === 'pulse-light' ? '3.2s' : edgeLight.mode === 'color' || edgeLight.mode === 'color-light' ? '6s' : '2.8s'} ease-in-out infinite`,
            animationFillMode: 'both',
            willChange: 'border-color, box-shadow, filter',
          } : {}),
          ...(isExpanded ? styles.barExpanded : {}),
        }}
        data-nowbar-edge-light={edgeLight.enabled ? edgeLight.mode : undefined}
        role="button"
        tabIndex={0}
        aria-label={view === 'title' ? `${currentPageTitle} page. Tap to show navigation buttons.` : 'Navigation buttons. Tap to show current page.'}
        onClick={() => {
          if (!pressing) {
            handleInteraction();
            setView(view === 'title' ? 'actions' : 'title');
          }
        }}
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        onTouchCancel={stopHold}
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
                onClick={action.onClick}
                style={{
                  ...styles.button,
                  ...(isExpanded ? styles.buttonExpanded : {}),
                  ...(action.active ? { background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.18)' } : styles.buttonEmpty),
                }}
              >
                <span style={styles.iconOnly}>{action.icon || <CircleUserRound style={styles.icon} />}</span>
                {isExpanded ? <span style={styles.labelExpanded}>{action.label}</span> : null}
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
