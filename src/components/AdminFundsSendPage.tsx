import React, { useEffect, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import api from '../api/axios';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string };

const AdminFundsSendPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const targetUserId = window.location.pathname.split('/').filter(Boolean).pop() || 'all';
  const isEveryone = targetUserId === 'all';
  const [user, setUser] = useState<UserSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    if (!isEveryone) api.get<{ user: UserSummary }>(`/api/admin/users/${targetUserId}`).then(({ data }) => setUser(data.user)).catch(() => setError('Unable to load the selected user.'));
  }, [isEveryone, targetUserId]);

  const sendFunds = async (event: React.FormEvent) => {
    event.preventDefault(); setSending(true); setError(''); setStatus('');
    try {
      const response = await api.post<{ sent: number }>('/api/admin/funds', { targetUserId, amount: Number(amount), description: description.trim() || undefined });
      setStatus(`Funds sent to ${response.data.sent} user${response.data.sent === 1 ? '' : 's'}.`); setAmount(''); setDescription('');
    } catch { setError('Unable to send funds. Please check the amount and try again.'); } finally { setSending(false); }
  };

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  const recipient = isEveryone ? 'Everyone' : user?.email || 'Selected user';
  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem', font: 'inherit' };
  return <HybridTheme mode={themeMode}><div style={{ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }}><div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px)' }}><div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
    <section><button type="button" onClick={() => navigate('/admin/funds')} style={{ border: 0, padding: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800 }}><ArrowLeft size={15} /> Back to funds</button><h2 style={{ margin: '14px 0 0', fontSize: '1.45rem', fontWeight: 900 }}>Send Funds</h2><p style={{ margin: '8px 0 0', color: theme.textMuted }}>Send funds to {recipient}.</p></section>
    {error ? <NotificationBanner tone="error" title="Unable to send funds" message={error} /> : null}{status ? <NotificationBanner tone="success" title="Funds sent" message={status} /> : null}
    <form onSubmit={(event) => void sendFunds(event)} style={{ display: 'grid', gap: 14, padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
      <label style={{ display: 'grid', gap: 8 }}><span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Recipient</span><div style={inputStyle}>{recipient}</div></label>
      <label style={{ display: 'grid', gap: 8 }}><span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Amount (USDT)</span><input required min="0.000001" step="0.000001" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" style={inputStyle} /></label>
      <label style={{ display: 'grid', gap: 8 }}><span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Transaction description (optional)</span><textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this funds transfer" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' as const }} /></label>
      <button type="submit" disabled={sending || (!isEveryone && !user)} style={{ border: 0, borderRadius: 999, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontWeight: 850, color: theme.textInverse, background: theme.primary, cursor: 'pointer', opacity: sending ? 0.65 : 1 }}>{sending ? <InlineLoadingDots /> : <><Send size={16} /> Send funds</>}</button>
    </form>
  </div></div><NowBar admin /></div></HybridTheme>;
};

export default AdminFundsSendPage;
