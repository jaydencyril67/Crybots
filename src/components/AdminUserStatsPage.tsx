import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
    if (!id) return;
    api.get<{ user: UserDetails }>(`/api/admin/users/${id}`).then(({ data }) => setUser(data.user)).catch(() => setError('Unable to load this user.'));
  }, [id]);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 132px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/admin/users')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontWeight: 700 }}><ArrowLeft size={17} /> Back to users</button>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}><div style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: theme.primary, color: theme.textInverse }}><ShieldCheck size={28} /></div><div><p style={{ margin: 0, color: theme.textMuted, fontSize: 12, fontWeight: 800, letterSpacing: '0.18em' }}>KINGSHALL ADMIN</p><h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>User-Stats</h1></div></header>
        <section style={{ border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, borderRadius: 22, padding: 18, backdropFilter: 'blur(24px) saturate(1.15)' }}>{error ? <p style={{ color: theme.danger }}>{error}</p> : !user ? <p style={{ color: theme.textMuted }}>Loading user details…</p> : <><h2 style={{ marginTop: 0 }}>{user.email}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>{Object.entries(user).map(([key, value]) => <div key={key} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 14, padding: 14, background: theme.surfaceMuted }}><strong style={{ display: 'block', marginBottom: 7 }}>{key}</strong><pre style={{ margin: 0, color: theme.textMuted, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', fontSize: 13 }}>{formatValue(value)}</pre></div>)}</div></>}</section>
      </div>
    </main>
    <NowBar admin />
  </HybridTheme>;
};

export default AdminUserStatsPage;
