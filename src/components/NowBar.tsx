import React from 'react';
import { CircleUserRound, Coins, Home, Settings2, UserRound, Wallet } from 'lucide-react';
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
    padding: '12px 14px',
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
    minWidth: '104px',
    display: 'flex',
    justifyContent: 'center',
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

const getActivePath = () => window.location.pathname || window.location.hash.replace('#', '') || '/dashboard';

const createDefaultActions = (): NowBarAction[] => [
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
    icon: <Coins size={18} />,
    onClick: () => {
      navigate('/staking');
    },
    active: getActivePath() === '/staking',
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
    label: 'Settings',
    icon: <Settings2 size={18} />,
    onClick: () => {
      navigate('/settings');
    },
    active: getActivePath() === '/settings',
  },
];

const NowBar = ({ actions }: NowBarProps) => {
  const resolvedActions = actions || createDefaultActions();
  return (
    <div style={styles.dock} aria-label="Quick navigation bar">
      <div style={styles.bar}>
        <div style={styles.rail} />
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
};

export default NowBar;
