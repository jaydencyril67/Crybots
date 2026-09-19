import React, { useEffect, useRef, useState } from 'react';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import KHLogo from './KHLogo';
import { NOTIFICATIONS_CHANGED_EVENT, AUTH_CHANGED_EVENT } from '../utils/notificationEvents';

const styles = {
  header: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 16px',
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
  unreadArtwork: {
    width: '30px',
    height: '30px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '999px',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '0.02em',
  },
  brand: {
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  rightArtwork: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexShrink: 0,
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

type AppHeaderProps = {
  isPublicPage?: boolean;
};

const AppHeader = ({ isPublicPage = false }: AppHeaderProps) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const previousCount = useRef(0);
  const hasLoadedCount = useRef(false);
  const alertTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const clearNotificationState = () => {
      previousCount.current = 0;
      hasLoadedCount.current = false;
      window.clearTimeout(alertTimeout.current);
      if (mounted) {
        setUnreadCount(0);
        setIsAlertActive(false);
      }
    };

    const activateAlert = () => {
      if (!mounted) return;
      setIsAlertActive(true);
      window.clearTimeout(alertTimeout.current);
      alertTimeout.current = window.setTimeout(() => setIsAlertActive(false), 10000);
    };

    const loadUnreadCount = async () => {
      if (isPublicPage || !localStorage.getItem('token')) {
        clearNotificationState();
        return;
      }
      try {
        const response = await api.get('/api/notifications');
        if (!mounted || isPublicPage || !localStorage.getItem('token')) {
          clearNotificationState();
          return;
        }
        const nextCount = Number(response.data?.unreadCount || 0);
        if (hasLoadedCount.current && nextCount > previousCount.current) {
          activateAlert();
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

    if (isPublicPage) {
      clearNotificationState();
    } else {
      void loadUnreadCount();
    }
    const interval = window.setInterval(() => { void loadUnreadCount(); }, 15000);
    window.addEventListener('ke:force-logout', clearNotificationState);
    const handleNotificationsChanged = () => {
      activateAlert();
      void loadUnreadCount();
    };
    const handleAuthChanged = () => { void loadUnreadCount(); };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.clearTimeout(alertTimeout.current);
      alertTimeout.current = undefined;
      window.removeEventListener('ke:force-logout', clearNotificationState);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [isPublicPage]);

  const handleHeaderClick = () => {
    if (!isPublicPage && localStorage.getItem('token')) navigate('/notifications');
  };

  const headerStyle = isAlertActive
    ? {
      ...styles.header,
      borderColor: '#ef4444',
      boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.9), 0 0 22px rgba(239, 68, 68, 0.85), 0 14px 30px rgba(0,0,0,0.24)',
      animation: 'ke-header-alert 1.2s ease-in-out infinite',
    }
    : styles.header;
  const headerTitle = unreadCount > 0
    ? `${unreadCount} New Notification${unreadCount === 1 ? '' : 's'}`
    : 'KingsHall Exchange';
  const artworkStyle = {
    ...styles.unreadArtwork,
    color: theme.primary,
    background: theme.primarySoft,
    border: `1px solid ${theme.primary}`,
  };
  const renderArtwork = () => unreadCount > 0
    ? <span style={artworkStyle} aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>
    : <KHLogo size={30} label="KingsHall" />;

  return (
    <>
      <style>{`@keyframes ke-header-alert {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.9), 0 0 22px rgba(239, 68, 68, 0.85), 0 14px 30px rgba(0,0,0,0.24); }
        50% { opacity: 0.72; box-shadow: 0 0 0 3px rgba(239, 68, 68, 1), 0 0 34px rgba(239, 68, 68, 1), 0 14px 30px rgba(0,0,0,0.24); }
      }`}</style>
      <header
        style={headerStyle}
        onClick={handleHeaderClick}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleHeaderClick(); }}
        role="button"
        tabIndex={0}
        aria-label={headerTitle}
      >
      {renderArtwork()}

      <div style={styles.brand}>
        <div style={styles.brandCopy}>
          <p style={styles.brandTitle}>{headerTitle}</p>
        </div>
      </div>

      <div style={styles.rightArtwork}>
        <KHLogo size={30} label="KingsHall" />
      </div>

      </header>
    </>
  );
};

export default AppHeader;
