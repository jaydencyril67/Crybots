import React from 'react';
import { LogOut } from 'lucide-react';

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 18px',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(8,14,26,0.92) 100%)',
    boxShadow: '0 14px 30px rgba(0,0,0,0.24)',
    position: 'relative' as const,
    zIndex: 2,
  },
  brand: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  brandBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, rgba(6,11,22,0.95) 0%, rgba(17,24,39,0.98) 100%)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.28)',
    flexShrink: 0,
  },
  brandBadgeInner: {
    width: '26px',
    height: '26px',
    borderRadius: '9px',
    position: 'relative' as const,
    background: 'linear-gradient(135deg, rgba(248,250,252,0.95) 0%, rgba(167,139,250,0.82) 55%, rgba(103,232,249,0.9) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.22), 0 8px 18px rgba(139,92,246,0.18)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  brandBadgeInnerCut: {
    position: 'absolute' as const,
    inset: '6px 5px 6px 5px',
    borderRadius: '6px',
    background: 'linear-gradient(180deg, rgba(6,11,22,0.96) 0%, rgba(17,24,39,0.96) 100%)',
    clipPath: 'polygon(0 0, 58% 0, 58% 38%, 100% 38%, 100% 62%, 58% 62%, 58% 100%, 0 100%, 0 62%, 42% 62%, 42% 38%, 0 38%)',
    opacity: 0.98,
  },
  brandCopy: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  brandTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
  },
  brandSub: {
    margin: 0,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.62)',
  },
  logoutButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    cursor: 'pointer',
    flexShrink: 0,
  },
};

const AppHeader = () => {
  const handleLogout = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('kingshall_user');
    window.localStorage.removeItem('firstName');
    window.localStorage.removeItem('kingshall_first_name');
    window.location.pathname = '/';
  };

  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <div style={styles.brandBadge} aria-hidden="true">
          <div style={styles.brandBadgeInner}>
            <div style={styles.brandBadgeInnerCut} />
          </div>
        </div>
        <div style={styles.brandCopy}>
          <p style={styles.brandTitle}>KE</p>
          <p style={styles.brandSub}>KingsHall Exchange</p>
        </div>
      </div>

      <button type="button" aria-label="Log out" title="Log out" onClick={handleLogout} style={styles.logoutButton}>
        <LogOut size={18} />
      </button>
    </header>
  );
};

export default AppHeader;
