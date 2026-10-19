import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import VerificationBadge from './VerificationBadge';

type TicketSummary = { id: string; subject: string; status: string; user?: { email?: string; firstName?: string; lastName?: string; verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected' } };

type TicketResponse = { tickets: TicketSummary[] };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: 18, marginTop: 18 },
  title: { margin: 0, fontSize: '1.45rem', fontWeight: 900 },
  description: { margin: 0, color: theme.textMuted, lineHeight: 1.7 },
  cardGrid: { display: 'grid', gap: 10, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' as const },
  card: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  subject: { margin: 0, fontSize: '0.95rem', fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  user: { margin: '5px 0 0', color: theme.textMuted, fontSize: '0.84rem' },
  button: { borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
});

const AdminTicketsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    api.get<TicketResponse>('/api/admin/tickets')
      .then(({ data }) => setTickets(data.tickets || []))
      .catch(() => setError('Unable to load open tickets. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}>
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.content}>
          <section>
            <h2 style={styles.title}>Admin Tickets</h2>
            <p style={styles.description}>Review and respond to users with open support tickets.</p>
          </section>
          {error ? <NotificationBanner tone="error" title="Unable to load tickets" message={error} /> : loading ? <NotificationBanner title="Loading tickets" message="Loading open support tickets…" /> : tickets.length === 0 ? <NotificationBanner title="No open tickets" message="There are no open user tickets right now." /> : <div style={styles.cardGrid}>{tickets.map((ticket) => <article key={ticket.id} style={styles.card}><div><h3 style={styles.subject}>{ticket.subject}</h3><p style={styles.user}>{[ticket.user?.firstName, ticket.user?.lastName].filter(Boolean).join(' ') || ticket.user?.email || 'Unknown user'} {ticket.user?.verificationStatus === 'verified' && <VerificationBadge size={16} />} · {ticket.status}</p></div><button type="button" style={styles.button} onClick={() => navigate(`/admin/ticket-stats/${ticket.id}`)}><Eye size={15} /> View</button></article>)}</div>}
        </div>
      </div>
      <NowBar admin />
    </div>
  </HybridTheme>;
};

export default AdminTicketsPage;
