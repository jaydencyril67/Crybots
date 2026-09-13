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
    flexDirection: 'column' as const,
    gap: '2px',
  },
  brandTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    background: 'linear-gradient(135deg, #F8FAFC 0%, #C7D2FE 18%, #A78BFA 48%, #67E8F9 78%, #E2E8F0 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    textShadow: '0 0 14px rgba(139,92,246,0.16)',
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
        <p style={styles.brandTitle}>KE</p>
        <p style={styles.brandSub}>KingsHall Exchange</p>
      </div>

      <button type="button" aria-label="Log out" title="Log out" onClick={handleLogout} style={styles.logoutButton}>
        <LogOut size={18} />
      </button>
    </header>
  );
};

export default AppHeader;
