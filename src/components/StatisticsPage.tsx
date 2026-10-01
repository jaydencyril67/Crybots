import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, LockKeyhole, LogIn, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type StatData = {
  account: { createdAt: string; confirmedAt: string | null; totalLogins: number; activeSessions: number };
  finance: { balance: number; totalDeposits: number; depositCount: number; totalWithdrawals: number; withdrawalCount: number; totalTransfers: number; transferCount: number; totalInvested: number; investmentCount: number; totalProfit: number };
  security: { score: number; enabled: Array<{ key: string; label: string }>; needed: Array<{ key: string; label: string }> };
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  header: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const, marginBottom: '16px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', fontWeight: 900 },
  subtitle: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 },
  grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  card: { minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '14px', padding: '12px 14px', background: theme.surfaceGlass, backdropFilter: 'blur(20px)' },
  listCard: { display: 'grid', gap: '8px', minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '16px', padding: '10px', background: theme.surfaceGlass, backdropFilter: 'blur(20px)' },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '12px 13px', background: theme.surfaceMuted },
  listItemContent: { minWidth: 0 },
  cardLabel: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.3 },
  value: { margin: 0, fontSize: 'clamp(0.96rem, 2.5vw, 1.12rem)', fontWeight: 900, textAlign: 'right' as const, overflowWrap: 'anywhere' as const },
  small: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.7rem', lineHeight: 1.35 },
  section: { marginTop: '16px', display: 'grid', gap: '10px' },
  sectionTitle: { margin: '0 0 8px', fontSize: '0.94rem', fontWeight: 900 },
  security: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  securityScore: { display: 'flex', alignItems: 'center', gap: '10px' },
  securityItemCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '11px 13px', background: theme.surfaceMuted },
  score: { fontSize: '1.75rem', fontWeight: 900, color: theme.primary },
  progress: { height: '6px', marginTop: '7px', borderRadius: '99px', background: theme.borderGlass, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 'inherit', background: theme.primary },
  securityList: { display: 'grid', gap: '7px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '7px', color: theme.text, fontSize: '0.78rem', lineHeight: 1.35 },
  muted: { color: theme.textMuted },
});

const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available';

const StatisticsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [data, setData] = useState<StatData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<StatData>('/api/statistics/me')
      .then((response) => { if (active) setData(response.data); })
      .catch(() => { if (active) setError('Unable to load your statistics.'); });
    return () => { active = false; };
  }, []);

  return <HybridTheme><Helmet><title>Statistics | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <div style={styles.header}><button type="button" style={styles.back} onClick={() => navigate('/profile')}><ArrowLeft size={17} /> Profile</button></div>
    {error ? <div style={styles.card}>{error}</div> : null}
    <section style={styles.section}><h2 style={styles.sectionTitle}>Account activity</h2><div style={styles.listCard}><div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.cardLabel}>Account created</p></div><CalendarDays size={19} color={theme.primary} /><p style={styles.value}>{data ? formatDate(data.account.createdAt) : <LoadingDots />}</p></div><div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.cardLabel}>Total logins</p><p style={styles.small}>{data ? `${data.account.activeSessions} active sessions` : <LoadingDots />}</p></div><LogIn size={19} color={theme.primary} /><p style={styles.value}>{data ? data.account.totalLogins.toLocaleString() : <LoadingDots />}</p></div><div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.cardLabel}>Email confirmation</p></div><CheckCircle2 size={19} color={theme.primary} /><p style={styles.value}>{data ? formatDate(data.account.confirmedAt) : <LoadingDots />}</p></div></div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Security level</h2><div style={styles.listCard}><div style={styles.securityItemCard}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}><ShieldCheck size={24} color={theme.primary} /><div style={styles.listItemContent}><p style={styles.cardLabel}>Protection enabled</p><div style={styles.progress}>{data ? <div style={{ ...styles.progressFill, width: `${data.security.score}%` }} /> : <LoadingDots />}</div></div></div><div style={styles.score}>{data ? `${data.security.score}%` : <LoadingDots />}</div></div>{data ? <>{data.security.enabled.map((item) => <div style={styles.securityItemCard} key={item.key}><div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}><CheckCircle2 size={17} color="#22c55e" /><span>{item.label}</span></div><span style={styles.muted}>Enabled</span></div>)}{data.security.needed.map((item) => <div style={{ ...styles.securityItemCard, ...styles.muted }} key={item.key}><div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}><ShieldAlert size={17} color="#f59e0b" /><span>{item.label} needed</span></div><span>Action required</span></div>)}{data.security.needed.length === 0 ? <div style={styles.securityItemCard}><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><LockKeyhole size={17} color={theme.primary} />Your security setup is complete.</div></div> : null}</> : null}</div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default StatisticsPage;
