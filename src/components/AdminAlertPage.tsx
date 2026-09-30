import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../api/axios';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string };
type UserResponse = { users: UserSummary[] };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '18px', marginTop: '18px' },
  section: { display: 'grid', gap: '10px' },
  title: { margin: 0, fontSize: '1.45rem', fontWeight: 900 },
  text: { margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7 },
  card: { display: 'grid', gap: 14, padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' },
  label: { display: 'grid', gap: 6, fontSize: '0.84rem', fontWeight: 800 },
  input: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', outline: 0, background: theme.surfaceMuted, color: theme.text, font: 'inherit' },
  textarea: { minHeight: 130, resize: 'vertical' as const },
  button: { border: 0, borderRadius: 999, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontWeight: 850, color: theme.textInverse, background: theme.primary, cursor: 'pointer' },
});

const AdminAlertPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [targetUserId, setTargetUserId] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('system');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    api.get<UserResponse>('/api/admin/users', { params: { limit: 100 } })
      .then(({ data }) => setUsers(data.users))
      .catch(() => setError('Unable to load users.'));
  }, []);

  const sendAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true); setError(''); setStatus('');
    try {
      const response = await api.post<{ sent: number }>('/api/admin/notifications', { targetUserId, title, message, type });
      setStatus(`Notification sent to ${response.data.sent} user${response.data.sent === 1 ? '' : 's'}.`);
      setTitle(''); setMessage('');
    } catch { setError('Unable to send the notification. Please check the form and try again.'); }
    finally { setSending(false); }
  };

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}>
    <div style={styles.page}><div style={styles.shell}><div style={styles.content}>
      <section style={styles.section}><h2 style={styles.title}>Admin Alert</h2><p style={styles.text}>Send an in-app notification to one user or broadcast an alert to every user.</p></section>
      {error ? <NotificationBanner tone="error" title="Unable to send alert" message={error} /> : null}
      {status ? <NotificationBanner tone="success" title="Alert sent" message={status} /> : null}
      <form style={styles.card} onSubmit={(event) => void sendAlert(event)}>
        <label style={styles.label}>Recipient<select value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} style={styles.input}><option value="all">All users</option>{users.map((user) => <option key={user._id} value={user._id}>{user.email}{user.firstName ? ` — ${user.firstName} ${user.lastName || ''}` : ''}</option>)}</select></label>
        <label style={styles.label}>Notification type<select value={type} onChange={(event) => setType(event.target.value)} style={styles.input}><option value="system">System</option><option value="account">Account</option><option value="security">Security</option><option value="transaction">Transaction</option></select></label>
        <label style={styles.label}>Title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter an alert title" style={styles.input} /></label>
        <label style={styles.label}>Message<textarea required maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the notification message" style={{ ...styles.input, ...styles.textarea }} /></label>
        <button type="submit" disabled={sending} style={{ ...styles.button, opacity: sending ? 0.65 : 1 }}><Send size={16} /> {sending ? 'Sending…' : 'Send notification'}</button>
      </form>
    </div></div><NowBar admin /></div>
  </HybridTheme>;
};

export default AdminAlertPage;
