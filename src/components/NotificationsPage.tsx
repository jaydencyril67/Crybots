import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Bell, Info, ShieldAlert, WalletCards, CheckCheck } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
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
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  heading: { margin: '20px 0 8px', fontSize: 'clamp(1.45rem, 4vw, 2rem)', fontWeight: 900 },
  intro: { margin: '8px 0 22px', color: theme.textMuted, lineHeight: 1.6 },
  section: { display: 'grid', gap: '10px' },
  list: { display: 'grid', gap: 10, marginTop: 6 },
  item: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, boxSizing: 'border-box' as const, backdropFilter: 'blur(24px) saturate(1.15)' },
  unread: { border: `1px solid ${theme.primary}`, background: theme.primarySoft },
  icon: { width: '20px', height: '20px', color: theme.primary, flexShrink: 0 },
  title: { margin: 0, fontSize: '0.95rem', fontWeight: 850, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  date: { margin: 0, color: theme.textMuted, fontSize: '0.76rem' },
  view: { borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 6 },
  markAll: { borderRadius: 999, border: `1px solid ${theme.primary}`, padding: '8px 13px', fontSize: '0.82rem', fontWeight: 800, color: theme.primary, background: theme.primarySoft, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  empty: { padding: '28px 16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '14px', color: theme.textMuted, textAlign: 'center' as const, background: theme.surfaceMuted },
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
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const loadNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    if (!localStorage.getItem('token')) {
      setHasLoadedNotifications(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await api.get('/api/notifications');
      const nextNotifications = response.data.notifications || [];
      setNotifications(nextNotifications);
      setHasLoadedNotifications(true);
      setError('');

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
      setHasLoadedNotifications(true);
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

  const markAllAsRead = async () => {
    if (markingAllRead || !notifications.some((notification) => !notification.readAt)) return;
    setMarkingAllRead(true);
    try {
      await api.post('/api/notifications/read-all');
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })));
      notifyNotificationsChanged({ unreadCount: 0 });
      setError('');
    } catch {
      setError('Unable to mark notifications as read right now.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/home')}><ArrowLeft size={17} /> Home</button>
          <h1 style={styles.heading}>Notifications</h1>
          <p style={styles.intro}>Stay up to date with account, security and transaction activity.</p>
          {notifications.some((notification) => !notification.readAt) ? <button type="button" style={styles.markAll} onClick={() => void markAllAsRead()} disabled={markingAllRead}>{markingAllRead ? <LoadingDots /> : <><CheckCheck size={15} /> Mark all as read</>}</button> : null}
          {refreshing ? <NotificationBanner tone="info" title="Updating notifications" message="Checking for new in-app alerts." /> : null}
          {error ? <NotificationBanner tone="error" title="Notifications unavailable" message={error} /> : null}
          <div style={styles.list}>
            {loading ? <div style={styles.empty}><LoadingDots /></div> : null}
            {!loading && hasLoadedNotifications && !error && !notifications.length ? <div style={styles.empty}>No notifications yet.</div> : null}
            {notifications.map((notification) => {
              const Icon = iconForType(notification.type);
              return (
                <article key={notification.id} style={{ ...styles.item, ...(notification.readAt ? {} : styles.unread) }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}><Icon style={styles.icon} /><div style={{ minWidth: 0 }}><h2 style={styles.title}>{notification.title}</h2><p style={styles.date}>{new Date(notification.createdAt).toLocaleString()}</p></div></div>
                  <button type="button" style={styles.view} onClick={() => navigate(`/notifications/${notification.id}`)}><Eye size={15} /> View</button>
                </article>
              );
            })}
          </div>
        </div>
      </main>
      <NowBar />
    </HybridTheme>
  );
};

export default NotificationsPage;
