import React, { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type Withdrawal = { id: string; destinationValue?: string; user?: { email?: string; firstName?: string; lastName?: string }; createdAt?: string };
type Response = { withdrawals: Withdrawal[]; pagination: { total: number } };

const AdminWithdrawalsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    Promise.all([
      api.get<Response>('/api/admin/withdrawals', { params: { limit: 100, status: 'pending' } }),
      api.get<Response>('/api/admin/withdrawals', { params: { limit: 100, status: 'processing' } }),
    ])
      .then(([pendingResponse, processingResponse]) => {
        setWithdrawals([...pendingResponse.data.withdrawals, ...processingResponse.data.withdrawals]);
        setError('');
      })
      .catch(() => setError('Unable to load withdrawals. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = withdrawals.filter((withdrawal) => {
    const text = `${withdrawal.user?.email || ''} ${withdrawal.destinationValue || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });
  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}><div style={{ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }}><div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' }}><div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
    <section style={{ display: 'grid', gap: 8 }}><h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>Admin Withdrawals</h2><p style={{ margin: 0, color: theme.textMuted, fontSize: '0.92rem' }}>Review submitted user withdrawals.</p></section>
    <section style={{ display: 'grid', gap: 10 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass }}><Search size={18} color={theme.textMuted} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email or wallet address" aria-label="Search withdrawals" style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: theme.text, fontSize: '0.92rem' }} /></div>
      {error ? <NotificationBanner tone="error" title="Unable to load withdrawals" message={error} /> : loading ? <NotificationBanner title="Loading withdrawals" message="Loading submitted withdrawals…" /> : visible.length === 0 ? <NotificationBanner title="No withdrawals found" message="No submitted withdrawals match your search." /> : <div style={{ display: 'grid', gap: 10 }}>{visible.map((withdrawal) => <article key={withdrawal.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><div><h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>{withdrawal.user?.email || 'Unknown user'}</h3><p style={{ margin: 0, color: theme.textMuted, fontSize: '0.84rem' }}>{withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleString() : 'Unknown date'}</p></div><button type="button" onClick={() => navigate(`/admin/withdrawal-stats/${withdrawal.id}`)} style={{ borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Eye size={15} /> View</button></article>)}</div>}
    </section></div></div><NowBar admin /></div></HybridTheme>;
};
export default AdminWithdrawalsPage;
