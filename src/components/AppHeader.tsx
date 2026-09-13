import React from 'react';
import { LogOut } from 'lucide-react';

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 16px',
    marginBottom: '10px',
    borderRadius: '14px',
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
  headerIcon: {
    width: '24px',
    height: '24px',
    display: 'block',
    objectFit: 'contain' as const,
    flexShrink: 0,
  },
  brandCopy: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },
  brandTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
  },
  logoutButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
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
        <div style={styles.brandCopy}>
          <p style={styles.brandTitle}>KingsHall Exchange</p>
        </div>
      </div>

      <img src="/icons/ke-icon.svg" alt="KingsHall Exchange" style={styles.headerIcon} />

      <button type="button" aria-label="Log out" title="Log out" onClick={handleLogout} style={styles.logoutButton}>
        <LogOut size={16} />
      </button>
    </header>
  );
};

export default AppHeader;
