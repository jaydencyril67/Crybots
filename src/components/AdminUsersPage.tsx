import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, Users, Eye } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string; accountStatus?: string };
type UserResponse = { users: UserSummary[]; pagination: { page: number; pages: number; total: number } };

const AdminUsersPage = () => {
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
  return <HybridTheme mode={themeMode}>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 132px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: theme.primary, color: theme.textInverse }}><ShieldCheck size={28} /></div>
          <div><p style={{ margin: 0, color: theme.textMuted, fontSize: 12, fontWeight: 800, letterSpacing: '0.18em' }}>KINGSHALL ADMIN</p><h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Users</h1></div>
        </header>
        <section style={{ border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, borderRadius: 22, padding: 18, backdropFilter: 'blur(24px) saturate(1.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '10px 14px', marginBottom: 20, background: theme.surfaceMuted }}>
            <Search size={19} color={theme.textMuted} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by email" aria-label="Search users by email" style={{ border: 0, outline: 0, background: 'transparent', color: theme.text, width: '100%', fontSize: 16 }} />
          </div>
          {error && <p style={{ color: theme.danger }}>{error}</p>}
          {loading ? <p style={{ color: theme.textMuted }}>Loading users…</p> : users.length === 0 ? <p style={{ color: theme.textMuted }}>No users found.</p> : <div style={{ display: 'grid', gap: 10 }}>
            {users.map((user) => <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', border: `1px solid ${theme.borderGlass}`, borderRadius: 14, padding: 16, background: theme.surfaceMuted }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Users size={20} color={theme.primary} /><div><strong>{user.email}</strong><div style={{ color: theme.textMuted, fontSize: 13 }}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'} · {user.accountStatus || 'active'}</div></div></div>
              <button type="button" onClick={() => navigate(`/admin/user-stats/${user._id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '10px 14px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 700 }}><Eye size={16} /> View</button>
            </div>)}
          </div>}
        </section>
      </div>
    </main>
    <NowBar admin />
  </HybridTheme>;
};

export default AdminUsersPage;
