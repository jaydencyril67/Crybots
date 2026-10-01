import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Info, ShieldAlert, Trash2, WalletCards } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { notifyNotificationsChanged } from '../utils/notificationEvents';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'transaction' | 'security' | 'account';
  readAt: string | null;
  createdAt: string;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  section: { display: 'grid', gap: 10, marginTop: 18 },
  title: { margin: 0, fontSize: 'clamp(1.45rem, 4vw, 2rem)', fontWeight: 900 },
  card: { display: 'grid', gap: 16, padding: '18px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' },
  icon: { width: 24, height: 24, color: theme.primary },
  message: { margin: 0, color: theme.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' as const },
  date: { margin: 0, color: theme.textMuted, fontSize: '0.82rem' },
  delete: { width: '100%', boxSizing: 'border-box' as const, borderRadius: 999, border: `1px solid ${theme.danger || theme.borderGlass}`, padding: '8px 13px', fontSize: '0.82rem', fontWeight: 800, color: theme.danger || theme.text, background: theme.surfaceMuted, cursor: 'pointer', justifySelf: 'stretch', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  deleteMenu: { display: 'grid', gap: 10, padding: 12, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, maxWidth: 360 },
  deletePrompt: { margin: 0, color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.45 },
  deleteActions: { display: 'flex', gap: 8, width: '100%' },
  cancel: { flex: 1, borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '8px 13px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceGlass, cursor: 'pointer' },
  confirmDelete: { flex: 1, borderRadius: 999, border: `1px solid ${theme.danger || theme.borderGlass}`, padding: '8px 13px', fontSize: '0.82rem', fontWeight: 800, color: theme.danger || theme.text, background: theme.surfaceGlass, cursor: 'pointer' },
  empty: { padding: 28, border: `1px solid ${theme.borderGlass}`, borderRadius: 14, color: theme.textMuted, textAlign: 'center' as const, background: theme.surfaceMuted },
});

const iconForType = (type: NotificationItem['type']) => type === 'security' ? ShieldAlert : type === 'transaction' ? WalletCards : type === 'account' ? Bell : Info;

const NotificationPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const id = window.location.pathname.split('/').filter(Boolean).pop() || '';

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/api/notifications/${id}`);
        setNotification(response.data.notification);
        notifyNotificationsChanged({ unreadCount: response.data.unreadCount });
        setError('');
      } catch {
        setError('Unable to load this notification.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const deleteNotification = async () => {
    if (!notification) return;
    try {
      await api.delete(`/api/notifications/${notification.id}`);
      setShowDeleteConfirm(false);
      notifyNotificationsChanged();
      navigate('/notifications');
    } catch {
      setError('Unable to delete this notification.');
    }
  };

  return <HybridTheme mode={themeMode}>
    <main style={styles.page}><div style={styles.shell}>
      <button type="button" style={styles.back} onClick={() => navigate('/notifications')}><ArrowLeft size={17} /> Notifications</button>
      <section style={styles.section}>
        <h1 style={styles.title}>Notification</h1>
        {error ? <NotificationBanner tone="error" title="Notification unavailable" message={error} /> : null}
        {loading ? <div style={styles.empty}><LoadingDots /></div> : null}
        {!loading && notification ? (() => { const Icon = iconForType(notification.type); return <article style={styles.card}><Icon style={styles.icon} /><h2 style={styles.title}>{notification.title}</h2><p style={styles.message}>{notification.message}</p><p style={styles.date}>{new Date(notification.createdAt).toLocaleString()}</p>{showDeleteConfirm ? <div style={styles.deleteMenu} role="alertdialog" aria-label="Confirm notification deletion"><p style={styles.deletePrompt}>Delete this notification permanently?</p><div style={styles.deleteActions}><button type="button" style={styles.cancel} onClick={() => setShowDeleteConfirm(false)}>Cancel</button><button type="button" style={styles.confirmDelete} onClick={() => void deleteNotification()}>Delete</button></div></div> : <button type="button" style={styles.delete} onClick={() => setShowDeleteConfirm(true)}><Trash2 size={15} /> Delete</button>}</article>; })() : null}
      </section>
    </div></main><NowBar />
  </HybridTheme>;
};

export default NotificationPage;
