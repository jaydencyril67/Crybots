import React, { useEffect, useRef, useState } from 'react';
import { navigate } from '../utils/navigate';
import api, { API_BASE_URL } from '../api/axios';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import KHLogo from './KHLogo';
import AppUpdateMonitor from './AppUpdateMonitor';
import { NOTIFICATIONS_CHANGED_EVENT, AUTH_CHANGED_EVENT } from '../utils/notificationEvents';
import { getVoiceModeEnabled, VOICE_MODE_CHANGED_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

const NOTIFICATION_COLOR_STORAGE_KEY = 'kingshall_notification_color';
const DEFAULT_NOTIFICATION_COLOR = '#ef4444';

const styles = {
  header: {
    display: 'grid',
    gridTemplateColumns: 'auto max-content auto',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 16px',
    borderRadius: '28px',
    border: '1px solid rgba(220,226,234,0.18)',
    background: 'rgba(12,13,15,0.92)',
    boxShadow: '0 12px 26px rgba(0,0,0,0.32), 0 0 18px rgba(210,218,228,0.035)',
    position: 'fixed' as const,
    top: '12px',
    left: '50%',
    width: 'max-content',
    maxWidth: 'calc(100% - 20px)',
    transform: 'translateX(-50%)',
    boxSizing: 'border-box' as const,
    zIndex: 50,
    transition: 'width 180ms ease, border-color 180ms ease',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  artworkContainer: {
    position: 'relative' as const,
    width: '30px',
    height: '30px',
    flexShrink: 0,
  },
  headerLogo: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'block',
    flexShrink: 0,
  },
  unreadArtwork: {
    position: 'absolute' as const,
    top: '-8px',
    left: '18px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    boxSizing: 'border-box' as const,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '999px',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '0.02em',
  },
  brand: {
    minWidth: 'max-content',
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
    maxWidth: 'calc(100vw - 112px)',
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  voiceTranscript: {
    margin: 0,
    maxWidth: 'min(70vw, 420px)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.72)',
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
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(getVoiceModeEnabled);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [notificationColor, setNotificationColor] = useState(DEFAULT_NOTIFICATION_COLOR);
  const previousCount = useRef(0);
  const hasLoadedCount = useRef(false);
  const alertTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const handleVoiceStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ listening?: boolean; transcript?: string }>).detail;
      setIsListening(Boolean(detail?.listening));
      setVoiceTranscript(detail?.transcript || '');
      setVoiceModeEnabled(getVoiceModeEnabled());
    };
    const handleVoiceMode = () => {
      setVoiceModeEnabled(getVoiceModeEnabled());
      if (!getVoiceModeEnabled()) setVoiceTranscript('');
    };
    window.addEventListener(VOICE_STATUS_EVENT, handleVoiceStatus);
    window.addEventListener(VOICE_MODE_CHANGED_EVENT, handleVoiceMode);
    return () => {
      window.removeEventListener(VOICE_STATUS_EVENT, handleVoiceStatus);
      window.removeEventListener(VOICE_MODE_CHANGED_EVENT, handleVoiceMode);
    };
  }, []);

  useEffect(() => {
    const readNotificationColor = () => {
      try {
        const stored = window.localStorage.getItem(NOTIFICATION_COLOR_STORAGE_KEY);
        if (!stored) return DEFAULT_NOTIFICATION_COLOR;

        // NotificationColorPage stores the setting as JSON: { color: '#38bdf8' }.
        // Keep raw-hex support too so older saved values continue to work.
        try {
          const parsed = JSON.parse(stored) as { color?: unknown };
          if (typeof parsed?.color === 'string' && /^#[0-9a-f]{6}$/i.test(parsed.color)) {
            return parsed.color;
          }
        } catch {
          // Fall through to the legacy raw-hex format.
        }

        return /^#[0-9a-f]{6}$/i.test(stored) ? stored : DEFAULT_NOTIFICATION_COLOR;
      } catch {
        return DEFAULT_NOTIFICATION_COLOR;
      }
    };

    setNotificationColor(readNotificationColor());

    const handleColorChanged = () => {
      setNotificationColor(readNotificationColor());
    };

    window.addEventListener('kingshall-notification-color-changed', handleColorChanged);
    return () => window.removeEventListener('kingshall-notification-color-changed', handleColorChanged);
  }, []);

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
    let eventSource: EventSource | undefined;
    if (!isPublicPage && localStorage.getItem('token')) {
      eventSource = new EventSource(`${API_BASE_URL}/api/notifications/stream?token=${encodeURIComponent(localStorage.getItem('token') || '')}`);
      eventSource.addEventListener('notification', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { unreadCount?: number; notification?: { title: string; message: string; channels?: string[] } };
          const nextCount = Number(payload.unreadCount || 0);
          if (payload.notification?.title === 'CryBots update available') {
            window.dispatchEvent(new Event('ke:app-update-check-now'));
          }
          if (payload.notification?.channels?.includes('push') && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.notification.title, { body: payload.notification.message, icon: '/icons/ke-icon.svg?v=3' });
          }
          // Every notification event is new by definition. Do not depend on the
          // unread-count comparison, because another tab can mark it as read
          // before this header processes the event.
          activateAlert();
          previousCount.current = nextCount;
          hasLoadedCount.current = true;
          setUnreadCount(nextCount);
        } catch {
          // Ignore malformed stream events and keep the header available.
        }
      });
      eventSource.onerror = () => {
        // EventSource automatically reconnects when the network is restored.
      };
    }
    window.addEventListener('ke:force-logout', clearNotificationState);
    const handleNotificationsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof detail?.unreadCount === 'number' && mounted) {
        previousCount.current = detail.unreadCount;
        hasLoadedCount.current = true;
        setUnreadCount(detail.unreadCount);
        if (detail.unreadCount === 0) {
          setIsAlertActive(false);
        }
        return;
      }
      void loadUnreadCount();
    };
    const handleAuthChanged = () => { void loadUnreadCount(); };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      mounted = false;
      eventSource?.close();
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

  // Keep the edge visible while unread notifications exist, and pulse it for
  // ten seconds whenever a realtime notification arrives. This also covers
  // notifications created before the header/SSE connection finished loading.
  const isEdgeLit = voiceModeEnabled || isAlertActive || unreadCount > 0;
  const headerStyle = isEdgeLit
    ? {
      ...styles.header,
      borderColor: `${notificationColor}b8`,
      boxShadow: isAlertActive
        ? `0 0 0 1px color-mix(in srgb, ${notificationColor} 72%, transparent), 0 0 8px color-mix(in srgb, ${notificationColor} 38%, transparent), 0 14px 30px rgba(0,0,0,0.24)`
        : `0 0 0 1px color-mix(in srgb, ${notificationColor} 42%, transparent), 0 0 6px color-mix(in srgb, ${notificationColor} 20%, transparent), 0 14px 30px rgba(0,0,0,0.24)`,
      animation: voiceModeEnabled || isAlertActive ? 'ke-header-alert 1.2s ease-in-out infinite' : 'none',
      filter: 'none',
      ['--notification-color' as string]: notificationColor,
    }
    : styles.header;
  const headerTitle = !isOnline ? 'No Internet' : voiceModeEnabled ? (isListening ? 'Listening..' : 'AI MODE') : unreadCount > 0 ? 'New Alert' : 'CryBots';
  const headerSubtitle = !isOnline ? 'Check your connection' : voiceModeEnabled && voiceTranscript ? `“${voiceTranscript}”` : null;
  const artworkStyle = {
    ...styles.unreadArtwork,
    color: theme.textInverse,
    background: notificationColor,
    border: `2px solid ${theme.surfaceElevated}`,
    boxShadow: `0 2px 8px ${notificationColor}66`,
  };
  const renderArtwork = () => (
    <span style={styles.artworkContainer}>
      <span style={styles.headerLogo}><KHLogo size={30} label="CryBots" /></span>
      {unreadCount > 0 ? <span style={artworkStyle} aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span> : null}
    </span>
  );

  return (
    <>
      <AppUpdateMonitor />
      <style>{`@keyframes ke-header-alert { 0%, 100% { opacity: 1; } 50% { opacity: .94; } }</style>
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
          {headerSubtitle ? <p style={styles.voiceTranscript}>{headerSubtitle}</p> : null}
        </div>
      </div>

      <div style={styles.rightArtwork}>
        <span style={styles.headerLogo}><KHLogo size={30} label="CryBots" /></span>
      </div>

      </header>
    </>
  );
};

export default AppHeader;
