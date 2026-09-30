import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Users, Eye } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string; accountStatus?: string; createdAt?: string };
type UserResponse = { users: UserSummary[]; pagination: { page: number; pages: number; total: number } };

const AdminUsersPage = () => {
  const { themeMode } = useAppTheme();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isDark = themeMode === 'dark';
  const colors = useMemo(() => ({ background: isDark ? '#10131a' : '#f4f7fb', surface: isDark ? '#191f2b' : '#fff', text: isDark ? '#f5f7fb' : '#172033', muted: isDark ? '#aab4c5' : '#62708a', border: isDark ? '#30394a' : '#e0e7f0' }), [isDark]);

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
  return <>
    <main style={{ minHeight: '100vh', background: colors.background, color: colors.text, padding: 'clamp(24px, 5vw, 64px)', paddingBottom: 132 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: '#2563eb', color: '#fff' }}><ShieldCheck size={28} /></div>
          <div><p style={{ margin: 0, color: '#2563eb', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em' }}>KINGSHALL ADMIN</p><h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Users</h1></div>
        </header>
        <section style={{ background: colors.surface, borderRadius: 24, padding: 24, boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '10px 14px', marginBottom: 20 }}>
            <Search size={19} color={colors.muted} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by email" aria-label="Search users by email" style={{ border: 0, outline: 0, background: 'transparent', color: colors.text, width: '100%', fontSize: 16 }} />
          </div>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {loading ? <p style={{ color: colors.muted }}>Loading users…</p> : users.length === 0 ? <p style={{ color: colors.muted }}>No users found.</p> : <div style={{ display: 'grid', gap: 10 }}>
            {users.map((user) => <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', border: `1px solid ${colors.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Users size={20} color="#2563eb" /><div><strong>{user.email}</strong><div style={{ color: colors.muted, fontSize: 13 }}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'} · {user.accountStatus || 'active'}</div></div></div>
              <button type="button" onClick={() => navigate(`/admin/user-stats/${user._id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, borderRadius: 10, padding: '10px 14px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }}><Eye size={16} /> View</button>
            </div>)}
          </div>}
        </section>
      </div>
    </main>
    <NowBar admin />
  </>;
};

export default AdminUsersPage;
