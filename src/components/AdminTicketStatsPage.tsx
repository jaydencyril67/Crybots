import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Send } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type Ticket = { id: string; subject: string; body: string; status: 'open' | 'replied' | 'closed'; adminReply: string | null; createdAt: string; updatedAt: string; closedAt: string | null; user?: { email?: string; firstName?: string; lastName?: string } };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: 980, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  detail: { display: 'grid', gap: 14, maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' as const, marginTop: 18, padding: 18, border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass },
  title: { margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', fontWeight: 900, overflowWrap: 'anywhere' as const },
  meta: { margin: 0, color: theme.textMuted, fontSize: '0.84rem' },
  body: { margin: 0, whiteSpace: 'pre-wrap' as const, lineHeight: 1.7, overflowWrap: 'anywhere' as const },
  label: { display: 'grid', gap: 7, color: theme.text, fontWeight: 800 },
  textarea: { width: '100%', minHeight: 150, boxSizing: 'border-box' as const, resize: 'vertical' as const, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: 12, background: theme.surfaceMuted, color: theme.text, outline: 'none' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  button: { width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 850 },
  secondary: { background: theme.surfaceMuted, color: theme.text, border: `1px solid ${theme.borderGlass}` },
  primary: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  error: { margin: 0, color: theme.danger },
});

const formatDate = (value: string) => new Date(value).toLocaleString();

const AdminTicketStatsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const id = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    api.get<{ ticket: Ticket }>(`/api/admin/tickets/${id}`)
      .then(({ data }) => { setTicket(data.ticket); setReply(data.ticket.adminReply || ''); })
      .catch(() => setError('Unable to load this ticket.'))
      .finally(() => setLoading(false));
  }, [id]);

  const sendReply = async () => {
    if (!ticket || !reply.trim()) return;
    setSaving(true); setError('');
    try { const { data } = await api.post<{ ticket: Ticket }>(`/api/admin/tickets/${ticket.id}/reply`, { reply: reply.trim() }); setTicket(data.ticket); } catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to send reply.'); } finally { setSaving(false); }
  };

  const closeTicket = async () => {
    if (!ticket || ticket.status === 'closed') return;
    setSaving(true); setError('');
    try { const { data } = await api.patch<{ ticket: Ticket }>(`/api/admin/tickets/${ticket.id}/close`); setTicket(data.ticket); } catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to close ticket.'); } finally { setSaving(false); }
  };

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}><div style={styles.page}><div style={styles.shell}>{loading ? <NotificationBanner title="Loading ticket" message="Loading ticket details…" /> : !ticket ? <NotificationBanner tone="error" title="Ticket unavailable" message={error || 'This ticket could not be found.'} /> : <section style={styles.detail}><button type="button" style={{ ...styles.button, ...styles.secondary }} onClick={() => navigate('/admin/tickets')}><ArrowLeft size={16} /> Back to Tickets</button><div><h1 style={styles.title}>{ticket.subject}</h1><p style={styles.meta}>User: {ticket.user?.email || 'Unknown user'}</p><p style={styles.meta}>Status: <strong>{ticket.status}</strong> · Created: {formatDate(ticket.createdAt)} · Updated: {formatDate(ticket.updatedAt)}</p></div><p style={styles.body}>{ticket.body}</p>{ticket.adminReply ? <div><p style={styles.meta}>Admin reply</p><p style={styles.body}>{ticket.adminReply}</p></div> : null}{error ? <p style={styles.error}>{error}</p> : null}{ticket.status !== 'closed' ? <><label style={styles.label}>Reply<textarea style={styles.textarea} value={reply} maxLength={10000} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply to the user..." /></label><div style={styles.actions}><button type="button" style={{ ...styles.button, ...styles.primary }} disabled={saving || !reply.trim()} onClick={() => void sendReply()}><Send size={16} /> {saving ? 'Sending...' : 'Reply'}</button>{showCloseConfirm ? <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }}><p style={styles.meta}>Close this ticket permanently?</p><div style={styles.actions}><button type="button" style={{ ...styles.button, ...styles.secondary }} onClick={() => setShowCloseConfirm(false)}>Cancel</button><button type="button" style={{ ...styles.button, ...styles.secondary }} disabled={saving} onClick={() => void closeTicket()}><Check size={16} /> {saving ? 'Closing...' : 'Confirm Close'}</button></div></div> : <button type="button" style={{ ...styles.button, ...styles.secondary }} disabled={saving} onClick={() => setShowCloseConfirm(true)}><Check size={16} /> Close Ticket</button>}</div></> : null}</section>}</div><NowBar admin /></div></HybridTheme>;
};

export default AdminTicketStatsPage;
