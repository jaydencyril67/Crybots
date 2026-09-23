import React, { useEffect, useState } from 'react';
import { BarChart3, Check, Copy, Gift, Medal, Share2, Trophy, Users, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type Challenge = { title: string; description: string; progress: number; target: number; percentage: number; reward?: number };
type Commission = { event: string; amount: number; baseAmount?: number; createdAt: string };
type Dashboard = {
  agent: { enabled: boolean; code: string | null; link: string | null };
  stats: { referrals: number; totalEarned: number; firstDeposits: number; investments: number };
  commissions: Commission[];
  referrals?: Array<{ firstName?: string; lastName?: string; createdAt: string }>;
  challenges: Challenge[];
};
type Analytics = { byEvent: Array<{ _id: string; count: number; earned: number; volume: number }>; byMonth: Array<{ _id: string; count: number; earned: number }> };
type Ranking = { rank: number; code: string; name?: string; referrals: number; earned: number };

const AgentPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<Dashboard | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dashboard, stats, rankingData] = await Promise.all([
        api.get<Dashboard>('/api/referrals/dashboard'),
        api.get<Analytics>('/api/referrals/analytics'),
        api.get<{ rankings: Ranking[] }>('/api/referrals/rankings'),
      ]);
      setData(dashboard.data);
      setAnalytics(stats.data);
      setRankings(rankingData.data.rankings || []);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load your agent dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const enable = async () => {
    try {
      await api.post('/api/referrals/enable');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to enable the agent system.');
    }
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const share = async () => {
    if (!data?.agent.link) return;
    if (navigator.share) {
      await navigator.share({ title: 'Join KingsHall Exchange', text: 'Join me on KingsHall Exchange.', url: data.agent.link });
    } else {
      await copy(data.agent.link, 'link');
    }
  };

  return <HybridTheme><div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}><main style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 18px' }}>
    <h1 style={{ marginBottom: 8 }}>Agent hub</h1>
    <p style={{ color: theme.textMuted }}>Build your community, track performance, and earn automatic USDT commissions.</p>
    {error && <p style={{ color: '#f87171' }}>{error}</p>}
    {loading && !data ? <p style={{ color: theme.textMuted }}>Loading your agent workspace…</p> : !data?.agent.enabled ? <section style={{ ...card(theme), textAlign: 'center' }}><Users size={40} /><h2>Become an agent</h2><p style={{ color: theme.textMuted }}>The agent system is optional. Enable it when you are ready to invite your community.</p><button style={button(theme)} onClick={() => void enable()}>Enable agent system</button></section> : <>
      <div style={grid}><Metric theme={theme} icon={<Users />} label="Referrals" value={data.stats.referrals} /><Metric theme={theme} icon={<Wallet />} label="Earned USDT" value={data.stats.totalEarned.toFixed(2)} /><Metric theme={theme} icon={<Gift />} label="First deposits" value={data.stats.firstDeposits} /><Metric theme={theme} icon={<BarChart3 />} label="Investments" value={data.stats.investments} /></div>
      <section style={card(theme)}><h2>Invite kit</h2><p style={{ color: theme.textMuted }}>Share your personal code or scan the QR code to invite a new member.</p><div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}><div><strong style={{ fontSize: 24 }}>{data.agent.code}</strong><div><button style={smallButton(theme)} onClick={() => void copy(data.agent.code || '', 'code')}><Copy size={15} /> {copied === 'code' ? 'Copied' : 'Copy code'}</button></div></div>{data.agent.link && <QRCodeSVG value={data.agent.link} size={142} bgColor="transparent" fgColor={theme.text} />}</div><p style={{ wordBreak: 'break-all', color: theme.textMuted }}>{data.agent.link}</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{data.agent.link && <button style={button(theme)} onClick={() => void copy(data.agent.link || '', 'link')}>{copied === 'link' ? <Check size={16} /> : <Copy size={16} />} {copied === 'link' ? 'Copied' : 'Copy link'}</button>}<button style={secondaryButton(theme)} onClick={() => void share()}><Share2 size={16} /> Share invite</button></div></section>
      <section style={card(theme)}><h2><Trophy size={21} /> Challenges</h2>{data.challenges?.length ? data.challenges.map((challenge) => <div key={challenge.title} style={{ marginBottom: 18 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{challenge.title}</strong><span style={{ color: theme.primary }}>{challenge.percentage}%</span></div><p style={{ color: theme.textMuted, margin: '6px 0' }}>{challenge.description}</p><div style={{ height: 8, background: theme.surfaceMuted, borderRadius: 8 }}><div style={{ width: `${Math.min(100, challenge.percentage)}%`, height: '100%', background: theme.primary, borderRadius: 8 }} /></div><small>{challenge.progress} / {challenge.target}{challenge.reward ? ` · ${challenge.reward} USDT reward` : ''}</small></div>) : <p style={{ color: theme.textMuted }}>New challenges will appear here soon.</p>}</section>
      <div style={twoColumn}><section style={card(theme)}><h2><BarChart3 size={21} /> Performance</h2>{analytics?.byEvent?.length ? analytics.byEvent.map((item) => <div key={item._id} style={row(theme)}><span>{item._id.replace('_', ' ')}</span><strong>{item.earned.toFixed(2)} USDT</strong></div>) : <p style={{ color: theme.textMuted }}>No commission activity yet.</p>}</section><section style={card(theme)}><h2><Medal size={21} /> Top agents</h2>{rankings.slice(0, 5).map((item) => <div key={item.code} style={row(theme)}><span>#{item.rank} {item.name || item.code}</span><strong>{item.earned.toFixed(2)} USDT</strong></div>)}</section></div>
      <section style={card(theme)}><h2>Recent commissions</h2>{data.commissions.length === 0 ? <p style={{ color: theme.textMuted }}>Your first commission will appear here after a referred user completes an eligible action.</p> : data.commissions.slice(0, 20).map((item, index) => <div key={`${item.createdAt}-${index}`} style={row(theme)}><span>{item.event.replace('_', ' ')}<small style={{ display: 'block', color: theme.textMuted }}>{new Date(item.createdAt).toLocaleDateString()}</small></span><strong>+{item.amount.toFixed(2)} USDT</strong></div>)}</section>
    </>}
  </main><NowBar /></div></HybridTheme>;
};

const card = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ padding: 22, borderRadius: 18, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, marginTop: 18 });
const button = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', border: 0, borderRadius: 10, background: theme.primary, color: '#fff', cursor: 'pointer' });
const secondaryButton = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ ...button(theme), background: theme.surfaceMuted, color: theme.text });
const smallButton = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ ...secondaryButton(theme), padding: '7px 10px', marginTop: 8 });
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 22 };
const twoColumn = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 };
const row = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: `1px solid ${theme.borderGlass}`, textTransform: 'capitalize' as const });
const Metric = ({ theme, icon, label, value }: { theme: typeof HYBRID_THEME_TOKENS.dark; icon: React.ReactNode; label: string; value: string | number }) => <div style={card(theme)}><div>{icon}</div><strong style={{ display: 'block', fontSize: 24, marginTop: 8 }}>{value}</strong><span style={{ color: theme.textMuted }}>{label}</span></div>;
export default AgentPage;
