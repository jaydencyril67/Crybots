import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, BarChart3, Medal, Trophy, Users, Wallet } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type Challenge = { title: string; description: string; progress: number; target: number; percentage: number; reward?: number };
type Dashboard = { stats: { referrals: number; totalEarned: number; firstDeposits: number; investments: number }; challenges: Challenge[] };
type Analytics = { byEvent: Array<{ _id: string; count: number; earned: number }> };
type Ranking = { rank: number; code: string; name?: string; referrals: number; earned: number };

const AgentStatsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<Dashboard | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<Dashboard>('/api/referrals/dashboard'), api.get<Analytics>('/api/referrals/analytics'), api.get<{ rankings: Ranking[] }>('/api/referrals/rankings')]).then(([dashboard, stats, rankingData]) => { setData(dashboard.data); setAnalytics(stats.data); setRankings(rankingData.data.rankings || []); }).catch((err: any) => setError(err?.response?.data?.message || 'Unable to load your agent statistics.')).finally(() => setLoading(false));
  }, []);

  return <HybridTheme><div style={styles.page(theme)}><main style={styles.shell}><button type="button" style={styles.back(theme)} onClick={() => navigate('/agent')}><ArrowLeft size={16} /> Agent</button>{error && <p style={{ ...styles.text(theme), color: '#f87171' }}>{error}</p>}<div style={styles.content}><div style={styles.rowList(theme)}><div style={styles.metrics}><Metric theme={theme} icon={<Users />} label="Referrals" value={data?.stats.referrals ?? '—'} loading={loading} /><Metric theme={theme} icon={<Wallet />} label="Earnings" value={data ? `${data.stats.totalEarned.toFixed(2)} USDT` : '—'} loading={loading} /><Metric theme={theme} icon={<BarChart3 />} label="First deposits" value={data?.stats.firstDeposits ?? '—'} loading={loading} /><Metric theme={theme} icon={<Trophy />} label="Investments" value={data?.stats.investments ?? '—'} loading={loading} /></div><section style={styles.panel(theme)}><h2 style={styles.cardTitle}><BarChart3 size={18} /> Referral records</h2>{loading ? <LoadingDots /> : analytics?.byEvent?.length ? analytics.byEvent.map((item) => <div key={item._id} style={styles.itemRow(theme)}><span>{item._id.replace('_', ' ')}<small style={styles.muted(theme)}>{item.count} record{item.count === 1 ? '' : 's'}</small></span><strong>{item.earned.toFixed(2)} USDT</strong></div>) : <p style={styles.text(theme)}>No referral activity yet.</p>}</section><section style={styles.panel(theme)}><h2 style={styles.cardTitle}><Medal size={18} /> Agent ranking</h2>{loading ? <LoadingDots /> : rankings.slice(0, 10).map((item) => <div key={item.code} style={styles.itemRow(theme)}><span>#{item.rank} {item.name || item.code}<small style={styles.muted(theme)}>{item.referrals} referrals</small></span><strong>{item.earned.toFixed(2)} USDT</strong></div>)}</section><section style={styles.panel(theme)}><h2 style={styles.cardTitle}><Trophy size={18} /> Progress and achievements</h2>{loading ? <LoadingDots /> : data?.challenges?.length ? data.challenges.map((challenge) => <div key={challenge.title} style={styles.challenge}><div style={styles.itemRow(theme)}><strong>{challenge.title}</strong><span>{challenge.percentage}%</span></div><p style={styles.text(theme)}>{challenge.description}</p><div style={styles.track(theme)}><div style={{ ...styles.fill(theme), width: `${Math.min(100, challenge.percentage)}%` }} /></div><small style={styles.muted(theme)}>{challenge.progress} / {challenge.target}{challenge.reward ? ` · ${challenge.reward} USDT reward` : ''}</small></div>) : <p style={styles.text(theme)}>New achievements will appear here soon.</p>}</section></div></div></main></div></HybridTheme>;
};

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '8px 12px', background: theme.surfaceGlass, color: theme.text, fontSize: '0.86rem', cursor: 'pointer', fontWeight: 700 }),
  text: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, maxWidth: '62ch', color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }),
  content: { display: 'grid', gap: 14, marginTop: 18 },
  rowList: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, width: '100%', padding: 18, borderRadius: 22, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const }),
  metrics: { display: 'grid', gridTemplateColumns: '1fr', gap: 10 },
  card: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, padding: 18, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }),
  panel: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }),
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1rem', fontWeight: 800 },
  value: { fontSize: '1.12rem' },
  itemRow: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: `1px solid ${theme.borderGlass}`, textTransform: 'capitalize' as const }),
  muted: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'block', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.6 }),
  challenge: { display: 'grid', gap: 6 },
  track: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ height: 8, overflow: 'hidden' as const, borderRadius: 8, background: theme.surfaceMuted }),
  fill: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ height: '100%', borderRadius: 8, background: theme.primary }),
  loading: { display: 'flex', justifyContent: 'center', padding: 32 },
};

const Metric = ({ theme, icon, label, value, loading }: { theme: typeof HYBRID_THEME_TOKENS.dark; icon: ReactNode; label: string; value: string | number; loading: boolean }) => <div style={styles.card(theme)}><div>{icon}</div>{loading ? <LoadingDots /> : <strong style={styles.value}>{value}</strong>}<span style={styles.muted(theme)}>{label}</span></div>;

export default AgentStatsPage;
