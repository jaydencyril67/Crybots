import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Info, ShieldAlert, WalletCards } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import LoadingDots from './LoadingDots';
import api from '../api/axios';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'transaction' | 'security' | 'account';
  readAt: string | null;
  createdAt: string;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '120px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  heading: { margin: 0, fontSize: 'clamp(1.45rem, 4vw, 2rem)', fontWeight: 900 },
  intro: { margin: '8px 0 22px', color: theme.textMuted, lineHeight: 1.6 },
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' },
  markButton: { border: `1px solid ${theme.borderStrong}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '999px', padding: '9px 13px', display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer' },
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

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setError('');
    } catch {
      setError('Unable to load notifications right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  const markRead = async (id: string) => {
    const item = notifications.find((notification) => notification.id === id);
    if (!item || item.readAt) return;
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification));
    try { await api.patch(`/api/notifications/${id}/read`); } catch { void loadNotifications(); }
  };

  const markAllRead = async () => {
    if (!notifications.some((notification) => !notification.readAt)) return;
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })));
    try { await api.post('/api/notifications/read-all'); } catch { void loadNotifications(); }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <h1 style={styles.heading}>Notifications</h1>
          <p style={styles.intro}>Stay up to date with account, security and transaction activity.</p>
          <div style={styles.toolbar}>
            <button type="button" style={styles.markButton} onClick={() => void markAllRead()}><CheckCheck size={16} /> Mark all as read</button>
          </div>
          {loading ? <LoadingDots /> : null}
          {error ? <p style={{ color: theme.danger }}>{error}</p> : null}
          {!loading && !notifications.length ? <div style={styles.empty}>You are all caught up.</div> : null}
          <div style={styles.list}>
            {notifications.map((notification) => {
              const Icon = iconForType(notification.type);
              return (
                <button type="button" key={notification.id} onClick={() => void markRead(notification.id)} style={{ ...styles.item, ...(notification.readAt ? {} : styles.unread) }}>
                  <Icon style={styles.icon} />
                  <span>
                    <h2 style={styles.title}>{notification.title}</h2>
                    <p style={styles.message}>{notification.message}</p>
                    <p style={styles.date}>{new Date(notification.createdAt).toLocaleString()}</p>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </HybridTheme>
  );
};

export default NotificationsPage;
