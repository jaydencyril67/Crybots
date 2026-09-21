import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, CalendarDays, CheckCircle2, CircleDollarSign, LockKeyhole, LogIn, ShieldAlert, ShieldCheck, TrendingUp, Users } from 'lucide-react';
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
  page: { minHeight: '100vh', paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1280px', margin: '0 auto', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px', boxSizing: 'border-box' as const },
  header: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '22px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '7px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '9px 12px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' },
  title: { margin: 0, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900 },
  subtitle: { margin: '5px 0 0', color: theme.textMuted },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' },
  card: { border: `1px solid ${theme.borderGlass}`, borderRadius: '18px', padding: '17px', background: theme.surfaceGlass, backdropFilter: 'blur(20px)' },
  cardLabel: { margin: 0, color: theme.textMuted, fontSize: '0.82rem' },
  value: { margin: '8px 0 3px', fontSize: '1.35rem', fontWeight: 900 },
  small: { margin: 0, color: theme.textMuted, fontSize: '0.78rem' },
  section: { marginTop: '22px' },
  sectionTitle: { margin: '0 0 11px', fontSize: '1.05rem', fontWeight: 900 },
  security: { display: 'grid', gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(240px, 1.2fr)', gap: '12px' },
  securityScore: { display: 'flex', alignItems: 'center', gap: '16px' },
  score: { fontSize: '2.3rem', fontWeight: 900, color: theme.primary },
  progress: { height: '8px', marginTop: '10px', borderRadius: '99px', background: theme.borderGlass, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 'inherit', background: theme.primary },
  securityList: { display: 'grid', gap: '9px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '9px', color: theme.text },
  muted: { color: theme.textMuted },
});

const formatUsdt = (value: number) => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available';

const PortfolioStatisticsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [data, setData] = useState<StatData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<StatData>('/api/statistics/me')
      .then((response) => { if (active) setData(response.data); })
      .catch(() => { if (active) setError('Unable to load your account statistics.'); });
    return () => { active = false; };
  }, []);

  const cards = data ? [
    { label: 'Total deposits', value: formatUsdt(data.finance.totalDeposits), note: `${data.finance.depositCount} completed deposits`, icon: <ArrowDownToLine size={19} /> },
    { label: 'Total withdrawals', value: formatUsdt(data.finance.totalWithdrawals), note: `${data.finance.withdrawalCount} completed withdrawals`, icon: <ArrowUpFromLine size={19} /> },
    { label: 'Total transfers', value: formatUsdt(data.finance.totalTransfers), note: `${data.finance.transferCount} completed transfers`, icon: <Users size={19} /> },
    { label: 'Total invested', value: formatUsdt(data.finance.totalInvested), note: `${data.finance.investmentCount} investments`, icon: <TrendingUp size={19} /> },
    { label: 'Profit earned', value: formatUsdt(data.finance.totalProfit), note: 'Completed rewards', icon: <CircleDollarSign size={19} /> },
    { label: 'Current balance', value: formatUsdt(data.finance.balance), note: 'Available USDT balance', icon: <CircleDollarSign size={19} /> },
  ] : [];

  return <HybridTheme><Helmet><title>Account statistics | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <div style={styles.header}><button type="button" style={styles.back} onClick={() => navigate('/portfolio')}><ArrowLeft size={17} /> Portfolio</button><div><h1 style={styles.title}>Account statistics</h1><p style={styles.subtitle}>A complete overview of your account activity and security.</p></div></div>
    {error ? <div style={styles.card}>{error}</div> : !data ? <div style={styles.card}><LoadingDots /></div> : <>
      <div style={styles.grid}>{cards.map((card) => <div style={styles.card} key={card.label}><div style={{ display: 'flex', justifyContent: 'space-between', color: theme.primary }}>{card.icon}</div><p style={styles.cardLabel}>{card.label}</p><p style={styles.value}>{card.value}</p><p style={styles.small}>{card.note}</p></div>)}</div>
      <section style={styles.section}><h2 style={styles.sectionTitle}>Account activity</h2><div style={styles.grid}><div style={styles.card}><CalendarDays size={19} color={theme.primary} /><p style={styles.cardLabel}>Account created</p><p style={styles.value}>{formatDate(data.account.createdAt)}</p></div><div style={styles.card}><LogIn size={19} color={theme.primary} /><p style={styles.cardLabel}>Total logins</p><p style={styles.value}>{data.account.totalLogins.toLocaleString()}</p><p style={styles.small}>{data.account.activeSessions} active sessions</p></div><div style={styles.card}><CheckCircle2 size={19} color={theme.primary} /><p style={styles.cardLabel}>Email confirmation</p><p style={styles.value}>{formatDate(data.account.confirmedAt)}</p></div></div></section>
      <section style={styles.section}><h2 style={styles.sectionTitle}>Security level</h2><div style={styles.security}><div style={{ ...styles.card, ...styles.securityScore }}><ShieldCheck size={35} color={theme.primary} /><div><div style={styles.score}>{data.security.score}%</div><p style={styles.small}>Protection enabled</p><div style={styles.progress}><div style={{ ...styles.progressFill, width: `${data.security.score}%` }} /></div></div></div><div style={{ ...styles.card, ...styles.securityList }}>{data.security.enabled.map((item) => <div style={styles.securityItem} key={item.key}><CheckCircle2 size={17} color="#22c55e" />{item.label}</div>)}{data.security.needed.map((item) => <div style={{ ...styles.securityItem, ...styles.muted }} key={item.key}><ShieldAlert size={17} color="#f59e0b" />{item.label} needed</div>)}{data.security.needed.length === 0 ? <div style={styles.securityItem}><LockKeyhole size={17} color={theme.primary} />Your security setup is complete.</div> : null}</div></div></section>
    </>}
  </div><NowBar /></div></HybridTheme>;
};

export default PortfolioStatisticsPage;
