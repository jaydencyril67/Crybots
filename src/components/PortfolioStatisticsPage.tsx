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
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  header: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const, marginBottom: '16px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', fontWeight: 900 },
  subtitle: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 155px), 1fr))', gap: '8px' },
  card: { minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '13px', padding: '11px', background: theme.surfaceGlass, backdropFilter: 'blur(20px)' },
  cardLabel: { margin: 0, color: theme.textMuted, fontSize: '0.74rem', lineHeight: 1.3 },
  value: { margin: '5px 0 2px', fontSize: 'clamp(0.96rem, 2.5vw, 1.12rem)', fontWeight: 900, overflowWrap: 'anywhere' as const },
  small: { margin: 0, color: theme.textMuted, fontSize: '0.7rem', lineHeight: 1.35 },
  section: { marginTop: '16px' },
  sectionTitle: { margin: '0 0 8px', fontSize: '0.94rem', fontWeight: 900 },
  security: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '8px' },
  securityScore: { display: 'flex', alignItems: 'center', gap: '10px' },
  score: { fontSize: '1.75rem', fontWeight: 900, color: theme.primary },
  progress: { height: '6px', marginTop: '7px', borderRadius: '99px', background: theme.borderGlass, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 'inherit', background: theme.primary },
  securityList: { display: 'grid', gap: '7px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '7px', color: theme.text, fontSize: '0.78rem', lineHeight: 1.35 },
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

  const cards = [
    { label: 'Total deposits', value: data ? formatUsdt(data.finance.totalDeposits) : null, note: data ? `${data.finance.depositCount} completed deposits` : '', icon: <ArrowDownToLine size={19} /> },
    { label: 'Total withdrawals', value: data ? formatUsdt(data.finance.totalWithdrawals) : null, note: data ? `${data.finance.withdrawalCount} completed withdrawals` : '', icon: <ArrowUpFromLine size={19} /> },
    { label: 'Total transfers', value: data ? formatUsdt(data.finance.totalTransfers) : null, note: data ? `${data.finance.transferCount} completed transfers` : '', icon: <Users size={19} /> },
    { label: 'Total invested', value: data ? formatUsdt(data.finance.totalInvested) : null, note: data ? `${data.finance.investmentCount} investments` : '', icon: <TrendingUp size={19} /> },
    { label: 'Profit earned', value: data ? formatUsdt(data.finance.totalProfit) : null, note: data ? 'Completed rewards' : '', icon: <CircleDollarSign size={19} /> },
    { label: 'Current balance', value: data ? formatUsdt(data.finance.balance) : null, note: data ? 'Available USDT balance' : '', icon: <CircleDollarSign size={19} /> },
  ];

  return <HybridTheme><Helmet><title>Account statistics | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <div style={styles.header}><button type="button" style={styles.back} onClick={() => navigate('/portfolio')}><ArrowLeft size={17} /> Portfolio</button><div><h1 style={styles.title}>Account statistics</h1><p style={styles.subtitle}>A complete overview of your account activity and security.</p></div></div>
    {error ? <div style={styles.card}>{error}</div> : null}
    <div style={styles.grid}>{cards.map((card) => <div style={styles.card} key={card.label}><div style={{ display: 'flex', justifyContent: 'space-between', color: theme.primary }}>{card.icon}</div><p style={styles.cardLabel}>{card.label}</p>{card.value ? <><p style={styles.value}>{card.value}</p><p style={styles.small}>{card.note}</p></> : <div style={{ padding: '8px 0' }}><LoadingDots /></div>}</div>)}</div>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Account activity</h2>{data ? <div style={styles.grid}><div style={styles.card}><CalendarDays size={19} color={theme.primary} /><p style={styles.cardLabel}>Account created</p><p style={styles.value}>{formatDate(data.account.createdAt)}</p></div><div style={styles.card}><LogIn size={19} color={theme.primary} /><p style={styles.cardLabel}>Total logins</p><p style={styles.value}>{data.account.totalLogins.toLocaleString()}</p><p style={styles.small}>{data.account.activeSessions} active sessions</p></div><div style={styles.card}><CheckCircle2 size={19} color={theme.primary} /><p style={styles.cardLabel}>Email confirmation</p><p style={styles.value}>{formatDate(data.account.confirmedAt)}</p></div></div> : <div style={styles.card}><LoadingDots /></div>}</section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Security level</h2>{data ? <div style={styles.security}><div style={{ ...styles.card, ...styles.securityScore }}><ShieldCheck size={35} color={theme.primary} /><div><div style={styles.score}>{data.security.score}%</div><p style={styles.small}>Protection enabled</p><div style={styles.progress}><div style={{ ...styles.progressFill, width: `${data.security.score}%` }} /></div></div></div><div style={{ ...styles.card, ...styles.securityList }}>{data.security.enabled.map((item) => <div style={styles.securityItem} key={item.key}><CheckCircle2 size={17} color="#22c55e" />{item.label}</div>)}{data.security.needed.map((item) => <div style={{ ...styles.securityItem, ...styles.muted }} key={item.key}><ShieldAlert size={17} color="#f59e0b" />{item.label} needed</div>)}{data.security.needed.length === 0 ? <div style={styles.securityItem}><LockKeyhole size={17} color={theme.primary} />Your security setup is complete.</div> : null}</div></div> : <div style={styles.card}><LoadingDots /></div>}</section>
  </div><NowBar /></div></HybridTheme>;
};

export default PortfolioStatisticsPage;
