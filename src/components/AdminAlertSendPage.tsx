import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, Send } from 'lucide-react';
import api from '../api/axios';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string };
type UserResponse = { user: UserSummary };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '18px', marginTop: '18px' },
  section: { display: 'grid', gap: '10px' },
  title: { margin: 0, fontSize: '1.45rem', fontWeight: 900 },
  text: { margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7 },
  card: { display: 'grid', gap: 14, padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' },
  field: { display: 'grid', gap: 8, position: 'relative' as const },
  label: { fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem', font: 'inherit' },
  textarea: { minHeight: 130, resize: 'vertical' as const },
  selectTrigger: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, borderRadius: 14, padding: '10px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 1000, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: 6, padding: 8, borderRadius: 16, background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, maxHeight: 260, overflowY: 'auto' as const, boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)' },
  selectOption: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: 12, padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer' },
  button: { border: 0, borderRadius: 999, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontWeight: 850, color: theme.textInverse, background: theme.primary, cursor: 'pointer' },
});

const AdminAlertSendPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [type, setType] = useState('system');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const targetUserId = window.location.pathname.split('/').filter(Boolean).pop() || 'all';
  const isEveryone = targetUserId === 'all';

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    if (!isEveryone) {
      api.get<UserResponse>(`/api/admin/users/${targetUserId}`)
        .then(({ data }) => setUser(data.user))
        .catch(() => setError('Unable to load the selected user.'));
    }
  }, [isEveryone, targetUserId]);

  const sendAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true); setError(''); setStatus('');
    try {
      const response = await api.post<{ sent: number }>('/api/admin/notifications', { targetUserId, subject, details, type });
      setStatus(`Notification sent to ${response.data.sent} user${response.data.sent === 1 ? '' : 's'}.`);
      setSubject(''); setDetails('');
    } catch { setError('Unable to send the notification. Please check the form and try again.'); }
    finally { setSending(false); }
  };

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  const recipient = isEveryone ? 'Everyone' : user ? user.email : 'Selected user';
  const typeLabel = type === 'account' ? 'Account' : type === 'security' ? 'Security' : type === 'transaction' ? 'Transaction' : 'System';
  return <HybridTheme mode={themeMode}>
    <div style={styles.page}><div style={styles.shell}><div style={styles.content}>
      <section style={styles.section}><button type="button" onClick={() => navigate('/admin/alert')} style={{ justifySelf: 'start', border: 0, padding: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800 }}><ArrowLeft size={15} /> Back to alerts</button><h2 style={styles.title}>Send Alert</h2><p style={styles.text}>Send an in-app notification to {recipient}.</p></section>
      {error ? <NotificationBanner tone="error" title="Unable to send alert" message={error} /> : null}
      {status ? <NotificationBanner tone="success" title="Alert sent" message={status} /> : null}
      <form style={styles.card} onSubmit={(event) => void sendAlert(event)}>
        <div style={styles.field}><span style={styles.label}>Recipient</span><div style={styles.input}>{recipient}</div></div>
        <div style={styles.field}><span style={styles.label}>Notification type</span><button type="button" style={styles.selectTrigger} onClick={() => setTypeMenuOpen((current) => !current)}><span>{typeLabel}</span><ChevronDown size={17} style={{ transform: typeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} /></button>{typeMenuOpen ? <div style={styles.selectMenu}>{(['system', 'account', 'security', 'transaction'] as const).map((option) => <button key={option} type="button" style={styles.selectOption} onClick={() => { setType(option); setTypeMenuOpen(false); }}>{option === 'account' ? 'Account' : option === 'security' ? 'Security' : option === 'transaction' ? 'Transaction' : 'System'}</button>)}</div> : null}</div>
        <label style={styles.field}><span style={styles.label}>Subject</span><input required maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Enter the notification subject" style={styles.input} /></label>
        <label style={styles.field}><span style={styles.label}>Details</span><textarea required maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Write the notification details" style={{ ...styles.input, ...styles.textarea }} /></label>
        <button type="submit" disabled={sending || (!isEveryone && !user)} style={{ ...styles.button, opacity: sending ? 0.65 : 1 }}>{sending ? <InlineLoadingDots /> : <><Send size={16} /> Send notification</>}</button>
      </form>
    </div></div><NowBar admin /></div>
  </HybridTheme>;
};

export default AdminAlertSendPage;
