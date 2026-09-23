import React, { useEffect, useState } from 'react';
import { Copy, Trophy, Users, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type Dashboard = { agent: { enabled: boolean; code: string | null; link: string | null }; stats: { referrals: number; totalEarned: number; firstDeposits: number; investments: number }; commissions: Array<{ event: string; amount: number; createdAt: string }>; challenges: Array<{ title: string; description: string; progress: number; target: number; percentage: number }> };

const AgentPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    try { setData((await api.get('/api/referrals/dashboard')).data); } catch (err: any) { setError(err?.response?.data?.message || 'Unable to load your agent dashboard.'); }
  };
  useEffect(() => { void load(); }, []);
  const enable = async () => { try { await api.post('/api/referrals/enable'); await load(); } catch (err: any) { setError(err?.response?.data?.message || 'Unable to enable the agent system.'); } };
  const copy = async () => { if (data?.agent.link) await navigator.clipboard.writeText(data.agent.link); };

  return <HybridTheme><div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}><main style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 18px' }}><h1 style={{ marginBottom: 8 }}>Agent hub</h1><p style={{ color: theme.textMuted }}>Invite people, track their activity, and earn automatic USDT commissions.</p>{error && <p style={{ color: '#f87171' }}>{error}</p>}{!data?.agent.enabled ? <section style={{ ...card(theme), textAlign: 'center' }}><Users size={40} /><h2>Become an agent</h2><p style={{ color: theme.textMuted }}>This is optional. Enable it when you are ready to build your referral community.</p><button style={button(theme)} onClick={() => void enable()}>Enable agent system</button></section> : <><div style={grid}><Metric theme={theme} icon={<Users />} label="Referrals" value={data.stats.referrals} /><Metric theme={theme} icon={<Wallet />} label="Earned USDT" value={data.stats.totalEarned.toFixed(2)} /><Metric theme={theme} icon={<Trophy />} label="First deposits" value={data.stats.firstDeposits} /></div><section style={card(theme)}><h2>Your invite kit</h2><p>Code: <strong>{data.agent.code}</strong> <button style={iconButton(theme)} onClick={() => void navigator.clipboard.writeText(data.agent.code || '')}><Copy size={16} /></button></p><p style={{ wordBreak: 'break-all', color: theme.textMuted }}>{data.agent.link}</p><button style={button(theme)} onClick={() => void copy()}><Copy size={16} /> Copy referral link</button>{data.agent.link && <div style={{ marginTop: 18 }}><QRCodeSVG value={data.agent.link} size={150} /></div>}</section><section style={card(theme)}><h2>Challenges</h2>{data.challenges?.map((challenge) => <div key={challenge.title} style={{ marginBottom: 16 }}><strong>{challenge.title}</strong><p style={{ color: theme.textMuted }}>{challenge.description}</p><div style={{ height: 8, background: theme.surfaceMuted, borderRadius: 8 }}><div style={{ width: `${challenge.percentage}%`, height: '100%', background: theme.primary, borderRadius: 8 }} /></div><small>{challenge.progress} / {challenge.target}</small></div>)}</section><section style={card(theme)}><h2>Commission activity</h2>{data.commissions.length === 0 ? <p style={{ color: theme.textMuted }}>Your first commission will appear here after a referred user completes an eligible action.</p> : data.commissions.map((item, index) => <div key={`${item.createdAt}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${theme.borderGlass}` }}><span>{item.event.replace('_', ' ')}</span><strong>+{item.amount.toFixed(2)} USDT</strong></div>)}</section></>}</main><NowBar /></div></HybridTheme>;
};
const card = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ padding: 22, borderRadius: 18, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, marginTop: 18 });
const button = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', border: 0, borderRadius: 10, background: theme.primary, color: '#fff', cursor: 'pointer' });
const iconButton = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ ...button(theme), padding: 6 });
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 22 };
const Metric = ({ theme, icon, label, value }: { theme: typeof HYBRID_THEME_TOKENS.dark; icon: React.ReactNode; label: string; value: string | number }) => <div style={card(theme)}><div>{icon}</div><strong style={{ display: 'block', fontSize: 24, marginTop: 8 }}>{value}</strong><span style={{ color: theme.textMuted }}>{label}</span></div>;
export default AgentPage;
