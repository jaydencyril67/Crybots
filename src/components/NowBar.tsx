import React, { useEffect, useMemo, useState } from 'react';
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
  dockExpanded: {
    width: 'min(560px, calc(100vw - 24px))',
    maxHeight: 'min(72vh, 620px)',
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
  },
  barExpanded: {
    alignItems: 'stretch',
    flexWrap: 'wrap' as const,
    gap: '10px',
    padding: '14px',
    borderRadius: '26px',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    whiteSpace: 'normal' as const,
    alignContent: 'flex-start' as const,
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
    flex: '1 1 calc(50% - 5px)',
    minWidth: 'calc(50% - 5px)',
    justifyContent: 'stretch',
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
    minHeight: '56px',
    padding: '12px 14px',
    borderRadius: '20px',
    justifyContent: 'flex-start',
    gap: '12px',
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
  const [mode, setMode] = useState<NowBarMode>('compact');
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);
  const [currentPath, setCurrentPath] = useState(getActivePath());
  const resolvedActions = useMemo(() => actions || createDefaultActions(), [actions]);
  const currentPageTitle = getCurrentPageTitle(currentPath);
  const isExpanded = mode === 'expanded';

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
    if (holdTimer) {
      window.clearTimeout(holdTimer);
    }
  }, [holdTimer]);

  const startHold = () => {
    setPressing(true);
    const timer = window.setTimeout(() => {
      setMode((currentMode) => (currentMode === 'compact' ? 'expanded' : 'compact'));
    }, 380);
    setHoldTimer(timer);
  };

  const stopHold = () => {
    setPressing(false);
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  return (
    <div style={{ ...styles.dock, ...(isExpanded ? styles.dockExpanded : {}) }} aria-label="Quick navigation bar">
      <div
        style={{ ...styles.bar, ...(isExpanded ? styles.barExpanded : {}) }}
        role="button"
        tabIndex={0}
        aria-label={view === 'title' ? `${currentPageTitle} page. Tap to show navigation buttons.` : 'Navigation buttons. Tap to show current page.'}
        onClick={() => {
          if (!pressing) {
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
