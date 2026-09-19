import React, { useEffect, useRef, useState } from 'react';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const styles = {
  header: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: '28px',
    border: '1.5px solid rgba(255,255,255,0.16)',
    background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(8,14,26,0.92) 100%)',
    boxShadow: '0 14px 30px rgba(0,0,0,0.24)',
    position: 'fixed' as const,
    top: '12px',
    left: '50%',
    width: 'min(420px, calc(100% - 32px))',
    transform: 'translateX(-50%)',
    boxSizing: 'border-box' as const,
    zIndex: 50,
  },
  headerIcon: {
    width: '30px',
    height: '30px',
    display: 'block',
    objectFit: 'contain' as const,
    flexShrink: 0,
  },
  brand: {
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  brandCopy: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
    textAlign: 'center' as const,
  },
  brandTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
    whiteSpace: 'nowrap',
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
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const previousCount = useRef(0);
  const hasLoadedCount = useRef(false);
  const alertTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const loadUnreadCount = async () => {
      if (!localStorage.getItem('token')) {
        previousCount.current = 0;
        hasLoadedCount.current = false;
        window.clearTimeout(alertTimeout.current);
        if (mounted) {
          setUnreadCount(0);
          setIsAlertActive(false);
        }
        return;
      }
      try {
        const response = await api.get('/api/notifications');
        const nextCount = Number(response.data?.unreadCount || 0);
        if (mounted && hasLoadedCount.current && nextCount > previousCount.current) {
          setIsAlertActive(true);
          window.clearTimeout(alertTimeout.current);
          alertTimeout.current = window.setTimeout(() => setIsAlertActive(false), 10000);
        }
        if (mounted) {
          previousCount.current = nextCount;
          hasLoadedCount.current = true;
          setUnreadCount(nextCount);
        }
      } catch {
        // Notification availability should not block the global header.
      }
    };

    void loadUnreadCount();
    const interval = window.setInterval(() => { void loadUnreadCount(); }, 15000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.clearTimeout(alertTimeout.current);
      alertTimeout.current = undefined;
    };
  }, []);

  const handleHeaderClick = () => navigate('/notifications');

  const headerStyle = isAlertActive
    ? { ...styles.header, borderColor: theme.danger, animation: 'ke-header-alert 1.2s ease-in-out infinite' }
    : styles.header;
  const headerTitle = isAlertActive && unreadCount > 0
    ? `${unreadCount} New Notification${unreadCount === 1 ? '' : 's'}`
    : 'KingsHall Exchange';

  return (
    <>
      <style>{`@keyframes ke-header-alert { 0%, 100% { opacity: 1; } 50% { opacity: 0.72; } }`}</style>
      <header
        style={headerStyle}
        onClick={handleHeaderClick}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleHeaderClick(); }}
        role="button"
        tabIndex={0}
        aria-label={headerTitle}
      >
      <img src="/icons/ke-icon.svg" alt="KingsHall Exchange" style={styles.headerIcon} />

      <div style={styles.brand}>
        <div style={styles.brandCopy}>
          <p style={styles.brandTitle}>{headerTitle}</p>
        </div>
      </div>

        <img src="/icons/ke-icon.svg" alt="KingsHall Exchange" style={styles.headerIcon} />
      </header>
    </>
  );
};

export default AppHeader;
