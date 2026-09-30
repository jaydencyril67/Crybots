import React, { useEffect, useState } from 'react';
import { Search, Send } from 'lucide-react';
import api from '../api/axios';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string; accountStatus?: string };
type UserResponse = { users: UserSummary[]; pagination: { page: number; pages: number; total: number } };

const AdminFundsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.get<UserResponse>('/api/admin/users', { params: { search, limit: 50 } })
        .then(({ data }) => { setUsers(data.users); setError(''); })
        .catch(() => setError('Unable to load users. Please try again.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  const cardStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text };
  const buttonStyle = { borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer' as const, display: 'inline-flex', alignItems: 'center', gap: 6 };
  return <HybridTheme mode={themeMode}>
    <div style={{ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }}><div style={{ maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px)' }}>
      <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
        <section><h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>Admin Funds</h2><p style={{ margin: '8px 0 0', color: theme.textMuted }}>Choose a recipient to send funds.</p></section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass }}><Search size={18} color={theme.textMuted} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by email" aria-label="Search users by email" style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: theme.text, fontSize: '0.92rem' }} /></div>
        {error ? <NotificationBanner tone="error" title="Unable to load users" message={error} /> : loading ? <NotificationBanner title="Loading users" message="Loading registered user accounts…" /> : <div style={{ display: 'grid', gap: 10 }}>
          <article style={cardStyle}><div><h3 style={{ margin: 0, fontSize: '0.95rem' }}>Everyone</h3><p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.84rem' }}>Send funds to every user</p></div><button type="button" onClick={() => navigate('/admin/funds/send/all')} style={buttonStyle}><Send size={15} /> Send</button></article>
          {users.map((user) => <article key={user._id} style={cardStyle}><div><h3 style={{ margin: 0, fontSize: '0.95rem' }}>{user.email}</h3><p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.84rem' }}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'} · {user.accountStatus || 'active'}</p></div><button type="button" onClick={() => navigate(`/admin/funds/send/${user._id}`)} style={buttonStyle}><Send size={15} /> Send</button></article>)}
        </div>}
      </div>
    </div><NowBar admin /></div>
  </HybridTheme>;
};

export default AdminFundsPage;
