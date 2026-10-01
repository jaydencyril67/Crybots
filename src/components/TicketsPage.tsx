import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, Eye, Plus, Send } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: 'open' | 'replied' | 'closed';
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  repliedAt: string | null;
  closedAt: string | null;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '980px', margin: '0 auto', padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  heading: { margin: '20px 0 8px', fontSize: 'clamp(1.45rem, 4vw, 2rem)', fontWeight: 900 },
  intro: { margin: '8px 0 22px', color: theme.textMuted, lineHeight: 1.6 },
  createButton: { width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, border: `1px solid ${theme.primary}`, borderRadius: 12, padding: '13px 16px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 900, fontSize: '0.95rem' },
  form: { display: 'grid', gap: 12, padding: 16, border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass },
  label: { display: 'grid', gap: 6, color: theme.text, fontSize: '0.86rem', fontWeight: 800 },
  input: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '11px 12px', background: theme.surfaceMuted, color: theme.text, fontSize: '0.92rem', outline: 'none' },
  textarea: { width: '100%', minHeight: 170, resize: 'vertical' as const, boxSizing: 'border-box' as const, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '11px 12px', background: theme.surfaceMuted, color: theme.text, fontSize: '0.92rem', outline: 'none' },
  formActions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  detailActions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  secondaryButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 14px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontWeight: 800 },
  formButton: { width: '100%' },
  detailButton: { width: '100%' },
  submitButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${theme.primary}`, borderRadius: 10, padding: '10px 16px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 900 },
  disabled: { opacity: 0.6, cursor: 'not-allowed' },
  tableWrap: { marginTop: 20, overflowX: 'auto' as const, border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass },
  table: { width: '100%', minWidth: 520, borderCollapse: 'collapse' as const },
  th: { padding: '13px 14px', textAlign: 'left' as const, color: theme.textMuted, fontSize: '0.78rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: `1px solid ${theme.borderGlass}` },
  td: { padding: '14px', borderBottom: `1px solid ${theme.borderGlass}`, fontSize: '0.9rem', verticalAlign: 'middle' as const },
  status: { display: 'inline-flex', borderRadius: 999, padding: '5px 10px', fontSize: '0.76rem', fontWeight: 900, textTransform: 'capitalize' as const },
  viewButton: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '7px 11px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontWeight: 800 },
  empty: { padding: '30px 16px', textAlign: 'center' as const, color: theme.textMuted },
  detail: { display: 'grid', gap: 16, padding: 18, border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass },
  detailHeading: { margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.65rem)', fontWeight: 900, overflowWrap: 'anywhere' as const },
  meta: { margin: 0, color: theme.textMuted, fontSize: '0.82rem' },
  body: { margin: 0, whiteSpace: 'pre-wrap' as const, lineHeight: 1.7, overflowWrap: 'anywhere' as const },
  reply: { padding: 14, borderRadius: 12, background: theme.primarySoft, border: `1px solid ${theme.primary}` },
  error: { margin: 0, color: '#f87171', fontSize: '0.86rem' },
});

const formatDate = (date: string) => new Date(date).toLocaleString();

const statusStyle = (status: Ticket['status'], theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  color: status === 'open' ? '#15803d' : status === 'replied' ? theme.primary : theme.textMuted,
  background: status === 'open' ? '#dcfce7' : status === 'replied' ? theme.primarySoft : theme.surfaceMuted,
});

const TicketsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await api.get<{ tickets: Ticket[] }>('/api/tickets');
        setTickets(response.data.tickets || []);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.message || 'Unable to load your tickets right now.');
      } finally {
        setLoading(false);
      }
    };
    void loadTickets();
  }, []);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextSubject = subject.trim();
    const nextBody = body.trim();
    if (!nextSubject || !nextBody) {
      setError('Subject and body are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await api.post<{ ticket: Ticket }>('/api/tickets', { subject: nextSubject, body: nextBody });
      setTickets((current) => [response.data.ticket, ...current]);
      setSubject('');
      setBody('');
      setShowForm(false);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to submit your ticket right now.');
    } finally {
      setSaving(false);
    }
  };

  const viewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const response = await api.get<{ ticket: Ticket }>(`/api/tickets/${ticket.id}`);
      setSelectedTicket(response.data.ticket);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load this ticket right now.');
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket || selectedTicket.status === 'closed') return;
    setClosing(true);
    setError('');
    try {
      const response = await api.patch<{ ticket: Ticket }>(`/api/tickets/${selectedTicket.id}/close`);
      setSelectedTicket(response.data.ticket);
      setTickets((current) => current.map((ticket) => ticket.id === response.data.ticket.id ? response.data.ticket : ticket));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to close this ticket right now.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/help')}><ArrowLeft size={17} /> Help</button>
          <h1 style={styles.heading}>Tickets</h1>
          <p style={styles.intro}>Send a message or report to the admin and track your support tickets here.</p>
          {error ? <p style={styles.error}>{error}</p> : null}
          {selectedTicket ? (
            <section style={styles.detail}>
              <div>
                <h2 style={styles.detailHeading}>{selectedTicket.subject}</h2>
                <p style={styles.meta}>Status: <strong>{selectedTicket.status}</strong></p>
                <p style={styles.meta}>Created: {formatDate(selectedTicket.createdAt)}</p>
                <p style={styles.meta}>Last updated: {formatDate(selectedTicket.updatedAt)}</p>
              </div>
              <p style={styles.body}>{selectedTicket.body}</p>
              {selectedTicket.adminReply ? <div style={styles.reply}><strong>Admin reply</strong><p style={styles.body}>{selectedTicket.adminReply}</p></div> : null}
              <div style={styles.detailActions}>
                <button type="button" style={{ ...styles.secondaryButton, ...styles.detailButton }} onClick={() => { setSelectedTicket(null); setError(''); }}><ChevronLeft size={16} /> Back to Tickets</button>
                {selectedTicket.status !== 'closed' ? <button type="button" style={{ ...styles.submitButton, ...styles.detailButton, ...(closing ? styles.disabled : {}) }} onClick={() => { if (window.confirm('Close this ticket?')) void closeTicket(); }} disabled={closing}><Check size={16} /> {closing ? 'Closing...' : 'Close Ticket'}</button> : null}
              </div>
            </section>
          ) : (
            <>
              {!showForm ? <button type="button" style={styles.createButton} onClick={() => { setShowForm(true); setError(''); }}><Plus size={18} /> Create New Ticket</button> : (
                <form style={styles.form} onSubmit={(event) => void submitTicket(event)}>
                  <label style={styles.label}>Subject<input style={styles.input} value={subject} maxLength={60} onChange={(event) => setSubject(event.target.value)} placeholder="What can we help with?" /></label>
                  <label style={styles.label}>Body<textarea style={styles.textarea} value={body} maxLength={10000} onChange={(event) => setBody(event.target.value)} placeholder="Write your message or report here..." /></label>
                  <div style={styles.formActions}>
                    <button type="button" style={{ ...styles.secondaryButton, ...styles.formButton }} onClick={() => { setShowForm(false); setError(''); }} disabled={saving}>Cancel</button>
                    <button type="submit" style={{ ...styles.submitButton, ...styles.formButton, ...(saving ? styles.disabled : {}) }} disabled={saving}><Send size={16} /> {saving ? 'Submitting...' : 'Submit Ticket'}</button>
                  </div>
                </form>
              )}
              <div style={styles.tableWrap}>
                {loading ? <div style={styles.empty}><LoadingDots /></div> : tickets.length === 0 ? <div style={styles.empty}>No tickets yet.</div> : (
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Subject</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead>
                    <tbody>{tickets.map((ticket) => <tr key={ticket.id}><td style={styles.td}>{ticket.subject}</td><td style={styles.td}><span style={{ ...styles.status, ...statusStyle(ticket.status, theme) }}>{ticket.status}</span></td><td style={styles.td}><button type="button" style={styles.viewButton} onClick={() => void viewTicket(ticket)}><Eye size={15} /> View</button></td></tr>)}</tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <NowBar />
    </HybridTheme>
  );
};

export default TicketsPage;
