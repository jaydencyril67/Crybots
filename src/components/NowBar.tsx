import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRightLeft, CalendarClock, ChevronDown, CircleUserRound, Coins, Home, Landmark, Settings2, UserRound, WalletCards } from 'lucide-react';
import { navigate } from '../utils/navigate';

const styles = {
  dock: {
    position: 'fixed' as const,
    left: '50%',
    bottom: '18px',
    transform: 'translateX(-50%)',
    zIndex: 40,
    width: 'min(560px, calc(100vw - 32px))',
    pointerEvents: 'none' as const,
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(180deg, rgba(20,24,40,0.88), rgba(10,14,24,0.82))',
    boxShadow: '0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    pointerEvents: 'auto' as const,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
    scrollbarWidth: 'none' as const,
    scrollBehavior: 'smooth' as const,
    WebkitOverflowScrolling: 'touch' as const,
    touchAction: 'pan-x',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    width: '100%',
    maxHeight: '42vh',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    paddingRight: '4px',
    scrollbarWidth: 'none' as const,
  },
  gridSlot: {
    minWidth: 0,
  },
  button: {
    width: '100%',
    minHeight: '44px',
    padding: '10px',
    border: 'none',
    borderRadius: '18px',
    scrollSnapAlign: 'center' as const,
    background: 'rgba(255,255,255,0.04)',
    color: '#e5eefc',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 180ms ease, background 180ms ease, border-color 180ms ease',
  },
  buttonExpanded: {
    justifyContent: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
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
  buttonLabel: {
    fontSize: '0.9rem',
    fontWeight: 700,
    letterSpacing: '0.01em',
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
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

type LayoutMode = 'compact' | 'expanded';

const getActivePath = () => window.location.pathname || window.location.hash.replace('#', '') || '/dashboard';

const getCurrentPageTitle = (path: string) => {
  if (path === '/dashboard') return 'DASHBOARD';
  if (path === '/profile') return 'PROFILE';
  if (path === '/staking') return 'STAKING';
  if (path === '/settings') return 'SETTINGS';
  if (path === '/withdrawals') return 'WITHDRAWALS';
  if (path === '/transfer') return 'TRANSFER';
  if (path === '/deposit') return 'DEPOSIT';
  if (path === '/transactions') return 'TRANSACTIONS';
  return 'NOWBAR';
};

const createDefaultActions = (): NowBarAction[] => [
  {
    label: 'Deposit',
    icon: <WalletCards size={18} />,
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
    label: 'Staking',
    icon: <Landmark size={18} />,
    onClick: () => {
      navigate('/staking');
    },
    active: getActivePath() === '/staking',
  },
  {
    label: 'Withdraw',
    icon: <ArrowRightLeft size={18} />,
    onClick: () => {
      navigate('/withdrawals');
    },
    active: getActivePath() === '/withdrawals',
  },
  {
    label: 'Transfer',
    icon: <ArrowDownToLine size={18} />,
    onClick: () => {
      navigate('/transfer');
    },
    active: getActivePath() === '/transfer',
  },
  {
    label: 'Profile',
    icon: <UserRound size={18} />,
    onClick: () => {
      navigate('/profile');
    },
    active: getActivePath() === '/profile',
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
  const [view, setView] = useState<NowBarView>('title');
  const [currentPath, setCurrentPath] = useState(getActivePath());
  const holdTimerRef = useRef<number | null>(null);
  const isExpanded = view === 'actions';
  const resolvedActions = useMemo(() => actions || createDefaultActions(), [actions]);
  const currentPageTitle = getCurrentPageTitle(currentPath);

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(getActivePath());
    };

    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    window.addEventListener('ke:navigation-start', syncPath as EventListener);

    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
      window.removeEventListener('ke:navigation-start', syncPath as EventListener);
    };
  }, []);

  useEffect(() => () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
    }
  }, []);

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const toggleLayoutMode = () => {
    setLayoutMode((currentMode) => (currentMode === 'compact' ? 'expanded' : 'compact'));
  };

  const handlePressStart = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
    }

    holdTimerRef.current = window.setTimeout(() => {
      setView((currentView) => (currentView === 'title' ? 'actions' : 'title'));
      holdTimerRef.current = null;
    }, 220);
  };

  const barContent = isExpanded ? (
    <div style={styles.grid}>
      {resolvedActions.map((action, index) => (
        <div key={`now-bar-slot-${index}`} style={styles.gridSlot}>
          <button
            type="button"
            aria-label={action.label}
            onClick={action.onClick}
            style={{
              ...styles.button,
              ...styles.buttonExpanded,
              ...(action.active ? { background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.18)' } : styles.buttonEmpty),
            }}
          >
            <span style={styles.iconOnly}>{action.icon || <CircleUserRound style={styles.icon} />}</span>
            <span style={styles.buttonLabel}>{action.label}</span>
          </button>
        </div>
      ))}
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e5eefc', width: '100%', justifyContent: 'center', padding: '2px 4px' }}>
        <span style={styles.orb} />
        <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em' }}>{currentPageTitle}</span>
        <ChevronDown size={16} style={{ opacity: 0.8 }} />
      </div>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' as const, WebkitOverflowScrolling: 'touch' as const }}>
        {resolvedActions.map((action, index) => (
          <div key={`now-bar-slot-${index}`} style={styles.slot}>
            <button
              type="button"
              aria-label={action.label}
              onClick={action.onClick}
              style={{
                ...styles.button,
                ...(action.active ? { background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.18)' } : styles.buttonEmpty),
              }}
            >
              <span style={styles.iconOnly}>{action.icon || <CircleUserRound style={styles.icon} />}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.dock} aria-label="Quick navigation bar">
      <div
        style={{
          ...styles.bar,
          flexDirection: isExpanded ? 'column' : 'row',
          alignItems: isExpanded ? 'stretch' : 'center',
          overflowX: isExpanded ? 'hidden' : 'auto',
          overflowY: isExpanded ? 'auto' : 'hidden',
          maxHeight: isExpanded ? '42vh' : 'auto',
          borderRadius: isExpanded ? '26px' : '28px',
          padding: isExpanded ? '14px' : '10px 12px',
        }}
        role="button"
        tabIndex={0}
        aria-label={isExpanded ? 'Navigation buttons expanded. Hold again to collapse.' : `${currentPageTitle} page. Hold to expand navigation buttons.`}
        onPointerDown={handlePressStart}
        onPointerUp={clearHoldTimer}
        onPointerLeave={clearHoldTimer}
        onPointerCancel={clearHoldTimer}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setView((currentView) => (currentView === 'title' ? 'actions' : 'title'));
          }
        }}
      >
        <div style={styles.rail} />
        {barContent}
      </div>
    </div>
  );
};

export default NowBar;
