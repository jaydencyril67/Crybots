import React, { useEffect, useState } from 'react';
import { BarChart3, Check, Copy, Gift, Medal, Share2, Trophy, Users, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type Challenge = { title: string; description: string; progress: number; target: number; percentage: number; reward?: number };
type Commission = { event: string; amount: number; createdAt: string };
type Dashboard = { agent: { enabled: boolean; code: string | null; link: string | null }; stats: { referrals: number; totalEarned: number; firstDeposits: number; investments: number }; commissions: Commission[]; challenges: Challenge[] };
type Analytics = { byEvent: Array<{ _id: string; earned: number }> };
type Ranking = { rank: number; code: string; name?: string; earned: number };
type Section = 'Stats' | 'Tools' | 'Menu';

const sectionButtons: Array<{ label: Section; description: string }> = [
  { label: 'Stats', description: 'Review your referrals, earnings, performance, and agent rankings.' },
  { label: 'Tools', description: 'Share your referral code, invite link, and QR code.' },
  { label: 'Menu', description: 'View challenges, recent commissions, and agent resources.' },
];

const AgentPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [section, setSection] = useState<Section>('Stats');
  const [data, setData] = useState<Dashboard | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    void load();
  }, []);

  const openSection = (nextSection: Section) => {
    if (nextSection === 'Stats') navigate('/agent/stats');
    if (nextSection === 'Tools') navigate('/agent/tools');
    if (nextSection === 'Menu') navigate('/agent/menu');
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const share = async () => {
    if (!data?.agent.link) return;
    if (navigator.share) await navigator.share({ title: 'Join KingsHall Exchange', text: 'Join me on KingsHall Exchange.', url: data.agent.link });
    else await copy(data.agent.link, 'link');
  };

  return (
    <HybridTheme>
      <div style={styles.page(theme)}>
        <main style={styles.shell}>
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle(theme)}>Agent</h2>
              <p style={styles.sectionText(theme)}>Manage your agent performance, referral tools, and rewards.</p>
            </section>
            {error && <p style={{ ...styles.sectionText(theme), color: '#f87171' }}>{error}</p>}
            <div style={styles.buttonList}>
              {sectionButtons.map(({ label, description }) => (
                <button key={label} type="button" style={{ ...styles.cardButton(theme), ...(section === label ? styles.activeCard(theme) : {}) }} onClick={() => openSection(label)}>
                  <h3 style={styles.cardTitle}>{label}</h3>
                  <p style={styles.cardSubtext(theme)}>{description}</p>
                </button>
              ))}
            </div>
            {loading ? <div style={styles.loading} role="status" aria-label="Loading agent workspace"><LoadingDots /></div> : data ? <AgentSection section={section} data={data} analytics={analytics} rankings={rankings} copied={copied} copy={copy} share={share} theme={theme} /> : null}
          </div>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

const AgentSection = ({ section, data, analytics, rankings, copied, copy, share, theme }: { section: Section; data: Dashboard; analytics: Analytics | null; rankings: Ranking[]; copied: string; copy: (value: string, label: string) => Promise<void>; share: () => Promise<void>; theme: typeof HYBRID_THEME_TOKENS.dark }) => {
  if (section === 'Stats') return <div style={styles.content}><div style={styles.metricGrid}><Metric theme={theme} icon={<Users />} label="Referrals" value={data.stats.referrals} /><Metric theme={theme} icon={<Wallet />} label="Earned USDT" value={data.stats.totalEarned.toFixed(2)} /><Metric theme={theme} icon={<Gift />} label="First deposits" value={data.stats.firstDeposits} /><Metric theme={theme} icon={<BarChart3 />} label="Investments" value={data.stats.investments} /></div><section style={styles.panel(theme)}><h3 style={styles.panelTitle}><BarChart3 size={18} /> Performance</h3>{analytics?.byEvent?.length ? analytics.byEvent.map((item) => <div key={item._id} style={styles.row(theme)}><span>{item._id.replace('_', ' ')}</span><strong>{item.earned.toFixed(2)} USDT</strong></div>) : <p style={styles.cardSubtext(theme)}>No commission activity yet.</p>}</section><section style={styles.panel(theme)}><h3 style={styles.panelTitle}><Medal size={18} /> Top agents</h3>{rankings.slice(0, 5).map((item) => <div key={item.code} style={styles.row(theme)}><span>#{item.rank} {item.name || item.code}</span><strong>{item.earned.toFixed(2)} USDT</strong></div>)}</section></div>;
  if (section === 'Tools') return <section style={styles.panel(theme)}><h3 style={styles.panelTitle}>Invite tools</h3><p style={styles.cardSubtext(theme)}>Share your personal code or scan the QR code to invite a new member.</p><div style={styles.invite}><div><strong style={styles.code}>{data.agent.code}</strong><button style={styles.smallButton(theme)} onClick={() => void copy(data.agent.code || '', 'code')}><Copy size={15} /> {copied === 'code' ? 'Copied' : 'Copy code'}</button></div>{data.agent.link && <QRCodeSVG value={data.agent.link} size={142} bgColor="transparent" fgColor={theme.text} />}</div><p style={styles.link(theme)}>{data.agent.link}</p><div style={styles.actions}>{data.agent.link && <button style={styles.primaryButton(theme)} onClick={() => void copy(data.agent.link || '', 'link')}>{copied === 'link' ? <Check size={16} /> : <Copy size={16} />} {copied === 'link' ? 'Copied' : 'Copy link'}</button>}<button style={styles.secondaryButton(theme)} onClick={() => void share()}><Share2 size={16} /> Share invite</button></div></section>;
  return <div style={styles.content}><section style={styles.panel(theme)}><h3 style={styles.panelTitle}><Trophy size={18} /> Challenges</h3>{data.challenges?.length ? data.challenges.map((challenge) => <div key={challenge.title} style={{ marginBottom: 16 }}><div style={styles.row(theme)}><strong>{challenge.title}</strong><span>{challenge.percentage}%</span></div><p style={styles.cardSubtext(theme)}>{challenge.description}</p><small>{challenge.progress} / {challenge.target}{challenge.reward ? ` · ${challenge.reward} USDT reward` : ''}</small></div>) : <p style={styles.cardSubtext(theme)}>New challenges will appear here soon.</p>}</section><section style={styles.panel(theme)}><h3 style={styles.panelTitle}>Recent commissions</h3>{data.commissions.length === 0 ? <p style={styles.cardSubtext(theme)}>Your first commission will appear here after a referred user completes an eligible action.</p> : data.commissions.slice(0, 20).map((item, index) => <div key={`${item.createdAt}-${index}`} style={styles.row(theme)}><span>{item.event.replace('_', ' ')}<small style={{ display: 'block', color: theme.textMuted }}>{new Date(item.createdAt).toLocaleDateString()}</small></span><strong>+{item.amount.toFixed(2)} USDT</strong></div>)}</section></div>;
};

const Metric = ({ theme, icon, label, value }: { theme: typeof HYBRID_THEME_TOKENS.dark; icon: React.ReactNode; label: string; value: string | number }) => <div style={styles.panel(theme)}><div>{icon}</div><strong style={styles.metricValue}>{value}</strong><span style={styles.muted(theme)}>{label}</span></div>;

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', overflowX: 'hidden' as const, paddingBottom: 132, background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: 18, marginTop: 18 },
  section: { display: 'grid', gap: 10 },
  sectionTitle: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: theme.text }),
  sectionText: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7 }),
  buttonList: { display: 'grid', gap: 10, marginTop: 6 },
  cardButton: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 6, width: '100%', padding: '16px 18px', borderRadius: 18, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, textAlign: 'left' as const, boxSizing: 'border-box' as const, cursor: 'pointer' }),
  activeCard: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ borderColor: theme.primary, boxShadow: `0 0 0 1px ${theme.primary}` }),
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: 800 },
  cardSubtext: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, fontSize: '0.86rem', color: theme.textMuted, lineHeight: 1.6 }),
  loading: { display: 'flex', justifyContent: 'center', padding: 24 },
  panel: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, padding: 18, borderRadius: 18, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }),
  panelTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.05rem', fontWeight: 800 },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 10 },
  metricValue: { display: 'block', fontSize: '1.12rem' },
  muted: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ color: theme.textMuted, fontSize: '0.74rem' }),
  row: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: `1px solid ${theme.borderGlass}`, textTransform: 'capitalize' as const }),
  invite: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const },
  code: { fontSize: '1.5rem', letterSpacing: '0.04em' },
  link: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, wordBreak: 'break-all' as const, color: theme.textMuted }),
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  primaryButton: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, border: `1px solid ${theme.primary}`, borderRadius: 999, background: theme.primary, color: theme.textInverse, fontWeight: 700, cursor: 'pointer' }),
  secondaryButton: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, background: theme.surfaceMuted, color: theme.text, fontWeight: 700, cursor: 'pointer' }),
  smallButton: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 10px', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }),
};

export default AgentPage;
