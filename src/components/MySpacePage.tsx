import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CircleDollarSign, PieChart, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type StatData = {
  finance: {
    balance: number;
    totalDeposits: number;
    depositCount: number;
    totalWithdrawals: number;
    withdrawalCount: number;
    totalTransfers: number;
    transferCount: number;
    totalInvested: number;
    investmentCount: number;
    totalProfit: number;
  };
};

type MetricCardProps = {
  label: string;
  value: string | null;
  note: string;
  icon: React.ReactNode;
  accent: string;
  styles: ReturnType<typeof getStyles>;
};

const formatUsdt = (value: number) => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(16px, 3vw, 30px) clamp(12px, 2.5vw, 24px) 28px', boxSizing: 'border-box' as const },
  header: { marginBottom: '18px' },
  eyebrow: { margin: 0, color: theme.primary, fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' as const },
  title: { margin: '5px 0 4px', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 900 },
  subtitle: { margin: 0, color: theme.textMuted, fontSize: '0.88rem', lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' },
  card: { minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '16px', padding: '16px', background: theme.surfaceGlass, backdropFilter: 'blur(18px)' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  label: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', fontWeight: 700 },
  value: { margin: '12px 0 4px', fontSize: 'clamp(1.15rem, 3vw, 1.55rem)', fontWeight: 900, overflowWrap: 'anywhere' as const },
  note: { margin: 0, color: theme.textMuted, fontSize: '0.72rem' },
  section: { marginTop: '18px', border: `1px solid ${theme.borderGlass}`, borderRadius: '16px', padding: '16px', background: theme.surfaceGlass, backdropFilter: 'blur(18px)' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '14px' },
  sectionTitle: { margin: 0, fontSize: '1rem', fontWeight: 900 },
  selectorGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  select: { border: `1px solid ${theme.borderGlass}`, borderRadius: '9px', padding: '8px 10px', background: theme.surfaceMuted, color: theme.text, fontSize: '0.78rem', fontWeight: 700 },
  rows: { display: 'grid', gap: '8px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '11px 12px', borderRadius: '11px', background: theme.surfaceMuted },
  rowLabel: { display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, color: theme.textMuted, fontSize: '0.8rem' },
  rowValue: { margin: 0, fontSize: '0.86rem', fontWeight: 900, textAlign: 'right' as const },
  insightGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' },
});

const MetricCard = ({ label, value, note, icon, accent, styles }: MetricCardProps) => (
  <div style={{ ...styles.card, borderTop: `2px solid ${accent}` }}>
    <div style={styles.cardTop}><p style={styles.label}>{label}</p><span style={{ color: accent }}>{icon}</span></div>
    {value ? <p style={styles.value}>{value}</p> : <div style={{ margin: '18px 0' }}><LoadingDots /></div>}
    <p style={styles.note}>{note}</p>
  </div>
);

const MySpacePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [data, setData] = useState<StatData | null>(null);
  const [error, setError] = useState('');
  const [resultType, setResultType] = useState<'profit' | 'loss'>('profit');
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    let active = true;
    api.get<StatData>('/api/statistics/me')
      .then((response) => { if (active) setData(response.data); })
      .catch(() => { if (active) setError('Unable to load your fund statistics.'); });
    return () => { active = false; };
  }, []);

  const finance = data?.finance;
  const selectedValue = resultType === 'profit' ? finance?.totalProfit || 0 : 0;
  const cards: MetricCardProps[] = [
    { label: 'Total holdings', value: finance ? formatUsdt(finance.balance) : null, note: 'Available USDT across your account', icon: <WalletCards size={21} />, accent: theme.primary, styles },
    { label: 'Total invested', value: finance ? formatUsdt(finance.totalInvested) : null, note: finance ? `${finance.investmentCount} completed investments` : '', icon: <PieChart size={21} />, accent: '#a78bfa', styles },
    { label: 'Total profit', value: finance ? formatUsdt(finance.totalProfit) : null, note: 'Rewards credited to your account', icon: <TrendingUp size={21} />, accent: '#22c55e', styles },
    { label: 'Total losses', value: finance ? formatUsdt(0) : null, note: 'No recorded investment losses', icon: <TrendingDown size={21} />, accent: '#f59e0b', styles },
  ];

  return <HybridTheme><Helmet><title>My Space | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <header style={styles.header}><p style={styles.eyebrow}>Personal funds dashboard</p><h1 style={styles.title}>My Space</h1><p style={styles.subtitle}>A clear view of your holdings, pool participation, and investment performance.</p></header>
    {error ? <div style={{ ...styles.card, marginBottom: '10px' }}>{error}</div> : null}
    <div style={styles.grid}>{cards.map((card) => <MetricCard {...card} key={card.label} />)}</div>
    <section style={styles.section}><div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>Holding stats</h2></div><div style={styles.rows}>
      <div style={styles.row}><span style={styles.rowLabel}><ArrowDownToLine size={17} color={theme.primary} /> Total deposits</span><p style={styles.rowValue}>{finance ? `${formatUsdt(finance.totalDeposits)} · ${finance.depositCount} deposits` : <LoadingDots />}</p></div>
      <div style={styles.row}><span style={styles.rowLabel}><ArrowUpFromLine size={17} color="#f59e0b" /> Total withdrawals</span><p style={styles.rowValue}>{finance ? `${formatUsdt(finance.totalWithdrawals)} · ${finance.withdrawalCount} withdrawals` : <LoadingDots />}</p></div>
      <div style={styles.row}><span style={styles.rowLabel}><CircleDollarSign size={17} color="#a78bfa" /> Pool capital deployed</span><p style={styles.rowValue}>{finance ? formatUsdt(finance.totalInvested) : <LoadingDots />}</p></div>
    </div></section>
    <section style={styles.section}><div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>Total profit and losses</h2><div style={styles.selectorGroup}>
      <select aria-label="Profit or loss" value={resultType} onChange={(event) => setResultType(event.target.value as 'profit' | 'loss')} style={styles.select}><option value="profit">Profit</option><option value="loss">Loss</option></select>
      <select aria-label="Performance period" value={period} onChange={(event) => setPeriod(event.target.value as 'week' | 'month' | 'year')} style={styles.select}><option value="week">Week</option><option value="month">Month</option><option value="year">Year</option></select>
    </div></div><div style={styles.insightGrid}><div style={styles.card}><p style={styles.label}>{resultType === 'profit' ? 'Profit' : 'Loss'} · {period}</p><p style={{ ...styles.value, color: resultType === 'profit' ? '#22c55e' : '#f59e0b' }}>{data ? formatUsdt(selectedValue) : <LoadingDots />}</p><p style={styles.note}>Based on completed ledger records</p></div><div style={styles.card}><p style={styles.label}>Net position</p><p style={styles.value}>{data ? formatUsdt((finance?.totalProfit || 0) - 0) : <LoadingDots />}</p><p style={styles.note}>Profit less recorded losses</p></div></div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default MySpacePage;
