import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, Info, ShieldAlert, WalletCards } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import api from '../api/axios';
import { AUTH_CHANGED_EVENT, notifyNotificationsChanged } from '../utils/notificationEvents';
import { navigate } from '../utils/navigate';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'transaction' | 'security' | 'account';
  channels?: ('push' | 'inApp')[];
  readAt: string | null;
  createdAt: string;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '120px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  heading: { margin: '20px 0 8px', fontSize: 'clamp(1.45rem, 4vw, 2rem)', fontWeight: 900 },
  intro: { margin: '8px 0 22px', color: theme.textMuted, lineHeight: 1.6 },
  list: { display: 'grid', gap: '10px' },
  item: { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', borderRadius: '18px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, textAlign: 'left' as const, cursor: 'pointer', width: '100%', boxSizing: 'border-box' as const },
  unread: { border: `1px solid ${theme.primary}`, background: theme.primarySoft },
  icon: { width: '20px', height: '20px', color: theme.primary, flexShrink: 0, marginTop: '2px' },
  title: { margin: 0, fontSize: '0.98rem', fontWeight: 800 },
  message: { margin: '5px 0 7px', color: theme.textMuted, lineHeight: 1.55, fontSize: '0.9rem' },
  date: { margin: 0, color: theme.textMuted, fontSize: '0.76rem' },
  empty: { padding: '28px 16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '18px', color: theme.textMuted, textAlign: 'center' as const, background: theme.surfaceGlass },
});

const iconForType = (type: NotificationItem['type']) => {
  if (type === 'security') return ShieldAlert;
  if (type === 'transaction') return WalletCards;
  if (type === 'account') return Bell;
  return Info;
};

const NotificationsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    if (!localStorage.getItem('token')) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await api.get('/api/notifications');
      const nextNotifications = response.data.notifications || [];
      setNotifications(nextNotifications);
      setError('');

      if (nextNotifications.some((notification: NotificationItem) => !notification.readAt)) {
        try {
          await api.post('/api/notifications/read-all');
          setNotifications((current) => current.map((notification) => ({
            ...notification,
            readAt: notification.readAt || new Date().toISOString(),
          })));
          notifyNotificationsChanged();
        } catch {
          // Keep the notifications visible if marking them read fails.
        }
      }
    } catch {
      if (localStorage.getItem('token')) {
        setError('Unable to load notifications right now.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const clearNotifications = () => {
      setNotifications([]);
      setLoading(false);
      setError('');
    };
    const refreshNotifications = () => { void loadNotifications(true); };

    void loadNotifications();
    const interval = window.setInterval(() => { void loadNotifications(); }, 10000);
    window.addEventListener('ke:force-logout', clearNotifications);
    window.addEventListener(AUTH_CHANGED_EVENT, refreshNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('ke:force-logout', clearNotifications);
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshNotifications);
    };
  }, [loadNotifications]);

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/portfolio')}><ArrowLeft size={17} /> Portfolio</button>
          <h1 style={styles.heading}>Notifications</h1>
          <p style={styles.intro}>Stay up to date with account, security and transaction activity.</p>
          {refreshing ? <NotificationBanner tone="info" title="Updating notifications" message="Checking for new in-app alerts." /> : null}
          {error ? <NotificationBanner tone="error" title="Notifications unavailable" message={error} /> : null}
          <div style={styles.list}>
            {loading ? <div style={styles.empty}><LoadingDots /></div> : null}
            {!loading && !notifications.length ? <div style={styles.empty}>You are all caught up.</div> : null}
            {notifications.map((notification) => {
              const Icon = iconForType(notification.type);
              return (
                <div key={notification.id} style={{ ...styles.item, ...(notification.readAt ? {} : styles.unread) }}>
                  <Icon style={styles.icon} />
                  <span>
                    <h2 style={styles.title}>{notification.title}</h2>
                    <p style={styles.message}>{notification.message}</p>
                    <p style={styles.date}>{new Date(notification.createdAt).toLocaleString()}</p>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </HybridTheme>
  );
};

export default NotificationsPage;
