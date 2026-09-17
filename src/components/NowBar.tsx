import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowUpDown, Banknote, BarChart3, CalendarClock, ChevronDown, CircleUserRound, Coins, Home, Landmark, Settings2, UserRound, WalletCards } from 'lucide-react';
import { navigate } from '../utils/navigate';

const EDGE_LIGHT_COLORS = {
  blue: 'rgba(56, 189, 248, 0.9)',
  purple: 'rgba(168, 85, 247, 0.9)',
  pink: 'rgba(236, 72, 153, 0.9)',
  green: 'rgba(34, 197, 94, 0.9)',
  amber: 'rgba(245, 158, 11, 0.9)',
  red: 'rgba(239, 68, 68, 0.9)',
} as const;

type EdgeLightColor = keyof typeof EDGE_LIGHT_COLORS;

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';

const getEdgeLightSettings = () => {
  if (typeof window === 'undefined') {
    return { enabled: false, color: 'blue' as EdgeLightColor };
  }

  try {
    const raw = window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY);
    if (!raw) {
      return { enabled: false, color: 'blue' as EdgeLightColor };
    }

    const parsed = JSON.parse(raw) as { enabled?: boolean; color?: EdgeLightColor };
    return {
      enabled: Boolean(parsed.enabled),
      color: parsed.color && EDGE_LIGHT_COLORS[parsed.color] ? parsed.color : ('blue' as EdgeLightColor),
    };
  } catch {
    return { enabled: false, color: 'blue' as EdgeLightColor };
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
    borderRadius: '28px',
    border: '1.5px solid rgba(255,255,255,0.28)',
    background: 'linear-gradient(180deg, rgba(20,24,40,0.88), rgba(10,14,24,0.82))',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 24px var(--edge-light), 0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
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
    border: 'none',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.04)',
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
  if (path === '/withdrawals') return 'WITHDRAW';
  if (path === '/transfer') return 'TRANSFER';
  if (path === '/deposit') return 'DEPOSIT';
  if (path === '/transactions') return 'TRANSACTIONS';
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
  const edgeLightColor = EDGE_LIGHT_COLORS[edgeLight.color];
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
    <div style={{ ...styles.dock, ...(isExpanded ? styles.dockExpanded : {}) }} aria-label="Quick navigation bar">
      <div
        ref={barRef}
        style={{
          ...styles.bar,
          ...(edgeLight.enabled ? { '--edge-light': edgeLightColor } : {}),
          ...(isExpanded ? styles.barExpanded : {}),
        }}
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
  );
};

export default NowBar;
