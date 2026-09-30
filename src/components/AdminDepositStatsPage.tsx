import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type User = { email?: string; firstName?: string; lastName?: string };
type Deposit = { id: string; amount?: number | string; currency?: string; wallet?: string; network?: string; status?: string; createdAt?: string; transactionId?: string };

const AdminDepositStatsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const id = window.location.pathname.split('/').filter(Boolean).pop();
  const [user, setUser] = useState<User | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    if (id) api.get<{ user: User; deposits: Deposit[] }>(`/api/admin/deposits/${id}`)
      .then(({ data }) => { setUser(data.user); setDeposits(data.deposits); })
      .catch(() => setError('Unable to load deposit details.'));
  }, [id]);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  const field = (label: string, value: React.ReactNode) => <div style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 0.35fr) minmax(0, 1fr)', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><strong style={{ fontSize: '0.82rem' }}>{label}</strong><span style={{ overflowWrap: 'anywhere', fontSize: '0.84rem' }}>{value || '—'}</span></div>;
  return <HybridTheme mode={themeMode}><div style={{ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }}><div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' }}><div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
    <section style={{ display: 'grid', gap: 8 }}><button type="button" onClick={() => navigate('/admin/deposits')} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, padding: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 800 }}><ArrowLeft size={15} /> Back to deposits</button><h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>Deposit Stats</h2><p style={{ margin: 0, fontSize: '0.92rem', color: theme.textMuted }}>{user?.email || 'Deposit details'}</p></section>
    {error ? <NotificationBanner tone="error" title="Unable to load deposits" message={error} /> : !user ? <NotificationBanner title="Loading deposit details" message="Loading the selected user's deposits…" /> : deposits.length === 0 ? <NotificationBanner title="No deposit yet" message="This user has not made a deposit yet." /> : <section style={{ display: 'grid', gap: 12 }}>{deposits.map((deposit) => <article key={`${deposit.id}-${deposit.createdAt}`} style={{ display: 'grid', gap: 8, padding: 14, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>{field('Amount', `${deposit.amount ?? '—'} ${deposit.currency || ''}`)}{field('Wallet of deposit', deposit.wallet)}{field('Time and date', deposit.createdAt ? new Date(deposit.createdAt).toLocaleString() : '—')}{field('Deposit status', deposit.status)}{deposit.network && field('Network', deposit.network)}{deposit.transactionId && field('Transaction ID', deposit.transactionId)}</article>)}</section>}
  </div></div><NowBar admin /></div></HybridTheme>;
};

export default AdminDepositStatsPage;
