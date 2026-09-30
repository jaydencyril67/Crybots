import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type UserDetails = Record<string, unknown> & { email?: string };
const formatValue = (value: unknown) => typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value ?? '—');

const AdminUserStatsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [user, setUser] = useState<UserDetails | null>(null);
  const [error, setError] = useState('');
  const id = window.location.pathname.split('/').filter(Boolean).pop();
  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    if (id) api.get<{ user: UserDetails }>(`/api/admin/users/${id}`).then(({ data }) => setUser(data.user)).catch(() => setError('Unable to load this user.'));
  }, [id]);
  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}>
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}>
      <div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
          <section style={{ display: 'grid', gap: 10 }}><button type="button" onClick={() => navigate('/admin/users')} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, padding: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 800 }}><ArrowLeft size={15} /> Back to users</button><h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>User-Stats</h2><p style={{ margin: 0, fontSize: '0.92rem', color: theme.textMuted }}>{user?.email || 'Account details'}</p></section>
          <section style={{ display: 'grid', gap: 10 }}>{error ? <p style={{ color: theme.danger }}>{error}</p> : !user ? <p style={{ color: theme.textMuted }}>Loading user details…</p> : <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>{Object.entries(user).map(([key, value]) => <article key={key} style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' }}><strong style={{ display: 'block', fontSize: '0.84rem' }}>{key}</strong><pre style={{ margin: '6px 0 0', color: theme.textMuted, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', fontSize: '0.8rem' }}>{formatValue(value)}</pre></article>)}</div>}</section>
        </div>
      </div>
      <NowBar admin />
    </div>
  </HybridTheme>;
};
export default AdminUserStatsPage;
