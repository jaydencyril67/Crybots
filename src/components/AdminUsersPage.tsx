import React, { useEffect, useState } from 'react';
import { Eye, Search, Users } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type UserSummary = { _id: string; email: string; firstName?: string; lastName?: string; accountStatus?: string };
type UserResponse = { users: UserSummary[]; pagination: { page: number; pages: number; total: number } };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '18px', marginTop: '18px' },
  section: { display: 'grid', gap: '10px' },
  sectionTitle: { margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em' },
  sectionText: { margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7 },
  search: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' },
  input: { width: '100%', border: 0, outline: 0, background: 'transparent', color: theme.text, fontSize: '0.92rem' },
  cardGrid: { display: 'grid', gap: 10, marginTop: 6 },
  card: { display: 'grid', gridTemplateColumns: 'minmax(110px, 0.35fr) minmax(0, 1fr) auto', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, boxSizing: 'border-box' as const, backdropFilter: 'blur(24px) saturate(1.15)' },
  title: { margin: 0, fontSize: '0.95rem', fontWeight: 850, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  subtext: { margin: 0, color: theme.textMuted, fontSize: '0.84rem', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  button: { borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 6 },
});

const AdminUsersPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
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
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Admin Users</h2>
            <p style={styles.sectionText}>Search and view registered user accounts.</p>
          </section>
          <section style={styles.section}>
            <div style={styles.search}><Search size={18} color={theme.textMuted} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by email" aria-label="Search users by email" style={styles.input} /></div>
            {error && <p style={{ ...styles.sectionText, color: theme.danger }}>{error}</p>}
            {loading ? <p style={styles.sectionText}>Loading users…</p> : users.length === 0 ? <p style={styles.sectionText}>No users found.</p> : <div style={styles.cardGrid}>{users.map((user) => <article key={user._id} style={styles.card}><Users size={18} color={theme.primary} /><div><h3 style={styles.title}>{user.email}</h3><p style={styles.subtext}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'} · {user.accountStatus || 'active'}</p></div><button type="button" onClick={() => navigate(`/admin/user-stats/${user._id}`)} style={styles.button}><Eye size={15} /> View</button></article>)}</div>}
          </section>
        </div>
      </div>
      <NowBar admin />
    </div>
  </HybridTheme>;
};

export default AdminUsersPage;
