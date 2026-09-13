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
  brandBadgeText: {
    margin: 0,
    fontSize: '16px',
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: '-0.08em',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #C7D2FE 22%, #A78BFA 52%, #67E8F9 82%, #E2E8F0 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
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
          <p style={styles.brandBadgeText}>KE</p>
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
