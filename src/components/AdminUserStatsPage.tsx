import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type UserDetails = Record<string, unknown> & { email?: string; firstName?: string; lastName?: string };
const formatValue = (value: unknown) => typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value ?? '—');

const AdminUserStatsPage = () => {
  const { themeMode } = useAppTheme();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [error, setError] = useState('');
  const id = window.location.pathname.split('/').filter(Boolean).pop();
  const isDark = themeMode === 'dark';
  const colors = { background: isDark ? '#10131a' : '#f4f7fb', surface: isDark ? '#191f2b' : '#fff', text: isDark ? '#f5f7fb' : '#172033', muted: isDark ? '#aab4c5' : '#62708a', border: isDark ? '#30394a' : '#e0e7f0' };

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    if (!id) return;
    api.get<{ user: UserDetails }>(`/api/admin/users/${id}`).then(({ data }) => setUser(data.user)).catch(() => setError('Unable to load this user.'));
  }, [id]);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <>
    <main style={{ minHeight: '100vh', background: colors.background, color: colors.text, padding: 'clamp(24px, 5vw, 64px)', paddingBottom: 132 }}><div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button type="button" onClick={() => navigate('/admin/users')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 0, background: 'transparent', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}><ArrowLeft size={17} /> Back to users</button>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0 28px' }}><div style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: '#2563eb', color: '#fff' }}><ShieldCheck size={28} /></div><div><p style={{ margin: 0, color: '#2563eb', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em' }}>KINGSHALL ADMIN</p><h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>User-Stats</h1></div></header>
      <section style={{ background: colors.surface, borderRadius: 24, padding: 24, boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)' }}>{error ? <p style={{ color: '#dc2626' }}>{error}</p> : !user ? <p style={{ color: colors.muted }}>Loading user details…</p> : <><h2 style={{ marginTop: 0 }}>{user.email}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>{Object.entries(user).map(([key, value]) => <div key={key} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><strong style={{ display: 'block', marginBottom: 7 }}>{key}</strong><pre style={{ margin: 0, color: colors.muted, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', fontSize: 13 }}>{formatValue(value)}</pre></div>)}</div></>}</section>
    </div></main><NowBar admin />
  </>;
};
export default AdminUserStatsPage;
