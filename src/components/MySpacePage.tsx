import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { useAppTheme } from './AppTheme';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type StatData = { finance: { balance: number; totalDeposits: number; depositCount: number; totalWithdrawals: number; withdrawalCount: number; totalInvested: number; investmentCount: number; totalProfit: number } };
type PointPosition = { points: number; cost: number; activeFrom: string; active: boolean; value: number };
type MarketPointsData = { points: number; value: number; current: number; positions: PointPosition[] };
type TransactionEntry = { id: string; title: string; direction: 'inbound' | 'outbound'; amountValue: number; date: string; time: string; points?: number; source: string };
type PointSummary = { totalBoughtPoints: number; totalSoldPoints: number; totalBoughtValue: number; totalSoldValue: number; buyCount: number; sellCount: number };
type TransactionsData = { transactions: TransactionEntry[]; pointSummary: PointSummary };
type ResultType = 'profit' | 'loss';
type Period = 'week' | 'month' | 'year';
type PickerName = 'result' | 'period';

const formatUsdt = (value: number) => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '14px', marginTop: '10px' },
  back: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'max-content', maxWidth: '100%', boxSizing: 'border-box' as const, gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { ...createHybridCardStyles(theme).card },
  listCard: { display: 'grid', gap: '8px', minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '16px', padding: '10px', background: theme.surfaceGlass, backdropFilter: 'blur(20px)' },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '12px 13px', background: theme.surfaceMuted },
  itemContent: { minWidth: 0 },
  label: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.3 },
  value: { margin: 0, fontSize: 'clamp(0.96rem, 2.5vw, 1.12rem)', fontWeight: 900, textAlign: 'right' as const, overflowWrap: 'anywhere' as const },
  note: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.7rem', lineHeight: 1.35 },
  pointGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' },
  pointMetric: { display: 'grid', gap: '4px', padding: '12px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', background: theme.surfaceMuted },
  pointActivity: { display: 'grid', gap: '8px' },
  section: { display: 'grid', gap: '10px' },
  sectionTitle: { margin: 0, fontSize: '0.94rem', fontWeight: 900 },
  selectorGroup: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: '10px' },
  picker: { position: 'relative' as const, minWidth: 0 },
  selectTrigger: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '10px 12px', fontSize: '0.82rem', fontWeight: 700, width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 5, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}` },
  selectOption: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer' },
});

const MySpacePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [data, setData] = useState<StatData | null>(null);
  const [marketPoints, setMarketPoints] = useState<MarketPointsData | null>(null);
  const [pointTransactions, setPointTransactions] = useState<TransactionEntry[]>([]);
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null);
  const [error, setError] = useState('');
  const [resultType, setResultType] = useState<ResultType>('profit');
  const [period, setPeriod] = useState<Period>('month');
  const [openPicker, setOpenPicker] = useState<PickerName | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<StatData>('/api/statistics/me'),
      api.get<MarketPointsData>('/api/market/points'),
      api.get<TransactionsData>('/api/transactions/me'),
    ]).then(([statisticsResponse, pointsResponse, transactionsResponse]) => {
      if (!active) return;
      setData(statisticsResponse.data);
      setMarketPoints(pointsResponse.data);
      setPointTransactions(transactionsResponse.data.transactions.filter((transaction) => transaction.source === 'trade' && transaction.points));
      setPointSummary(transactionsResponse.data.pointSummary);
    }).catch(() => { if (active) setError('Unable to load your account statistics.'); });
    return () => { active = false; };
  }, []);

  const finance = data?.finance;
  const selectedValue = resultType === 'profit' ? finance?.totalProfit || 0 : 0;
  const resultOptions: ResultType[] = ['profit', 'loss'];
  const periodOptions: Period[] = ['week', 'month', 'year'];
  const renderPicker = <T extends string>(name: PickerName, value: T, options: T[], setValue: (next: T) => void) => (
    <div style={styles.picker}>
      <button type="button" aria-expanded={openPicker === name} style={styles.selectTrigger} onClick={() => setOpenPicker(openPicker === name ? null : name)}>
        <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span><ChevronDown size={16} />
      </button>
      {openPicker === name ? <div style={styles.selectMenu}>{options.map((option) => <button type="button" style={styles.selectOption} key={option} onClick={() => { setValue(option); setOpenPicker(null); }}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>)}</div> : null}
    </div>
  );
  const boughtPoints = pointSummary?.totalBoughtPoints || 0;
  const soldPoints = pointSummary?.totalSoldPoints || 0;
  const recentPointTransactions = pointTransactions.slice(0, 5);
  const cards = [
    ['Total holdings', finance ? formatUsdt(finance.balance) : null, 'Available USDT across your account'],
    ['Total invested', finance ? formatUsdt(finance.totalInvested) : null, finance ? `${finance.investmentCount} completed investments` : ''],
    ['Total profit', finance ? formatUsdt(finance.totalProfit) : null, 'Rewards credited to your account'],
    ['Total losses', finance ? formatUsdt(0) : null, 'No recorded investment losses'],
  ];

  return <HybridTheme><Helmet><title>My Space | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}><div style={styles.content}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>
    {error ? <div style={styles.card}>{error}</div> : null}
    <div style={styles.listCard}>{cards.map(([label, value, note]) => <div style={styles.listItem} key={label}><div style={styles.itemContent}><p style={styles.label}>{label}</p><p style={styles.note}>{note}</p></div>{value ? <p style={styles.value}>{value}</p> : <LoadingDots />}</div>)}</div>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market points</h2><div style={styles.listCard}>
      <div style={styles.pointGrid}>
        <div style={styles.pointMetric}><p style={styles.label}>Total bought</p><p style={styles.value}>{pointSummary ? boughtPoints.toFixed(2) : <LoadingDots />}</p><p style={styles.note}>{pointSummary ? `${pointSummary.buyCount} purchases · ${formatUsdt(pointSummary.totalBoughtValue)}` : 'Lifetime points purchased'}</p></div>
        <div style={styles.pointMetric}><p style={styles.label}>Total sold</p><p style={styles.value}>{pointSummary ? soldPoints.toFixed(2) : <LoadingDots />}</p><p style={styles.note}>{pointSummary ? `${pointSummary.sellCount} sales · ${formatUsdt(pointSummary.totalSoldValue)}` : 'Lifetime points sold'}</p></div>
        <div style={styles.pointMetric}><p style={styles.label}>Current holding</p><p style={styles.value}>{marketPoints ? marketPoints.points.toFixed(2) : <LoadingDots />}</p><p style={styles.note}>Active and pending points</p></div>
        <div style={styles.pointMetric}><p style={styles.label}>Current value</p><p style={styles.value}>{marketPoints ? formatUsdt(marketPoints.value) : <LoadingDots />}</p><p style={styles.note}>{marketPoints ? `${marketPoints.current.toFixed(2)}% market movement` : 'Current market value'}</p></div>
      </div>
      <div style={styles.pointActivity}>
        <p style={styles.label}>Recent point activity</p>
        {recentPointTransactions.length ? recentPointTransactions.map((transaction) => <div style={styles.listItem} key={transaction.id}><div style={styles.itemContent}><p style={styles.label}>{transaction.title}</p><p style={styles.note}>{transaction.date} · {transaction.time}</p></div><p style={styles.value}>{transaction.points?.toFixed(2)} points</p></div>) : <p style={styles.note}>No point activity recorded yet.</p>}
      </div>
    </div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Holding stats</h2><div style={styles.listCard}>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Total deposits</p><p style={styles.note}>{finance ? `${finance.depositCount} completed deposits` : ''}</p></div><p style={styles.value}>{finance ? formatUsdt(finance.totalDeposits) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Total withdrawals</p><p style={styles.note}>{finance ? `${finance.withdrawalCount} completed withdrawals` : ''}</p></div><p style={styles.value}>{finance ? formatUsdt(finance.totalWithdrawals) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Pool capital deployed</p><p style={styles.note}>Funds allocated to investments</p></div><p style={styles.value}>{finance ? formatUsdt(finance.totalInvested) : <LoadingDots />}</p></div>
    </div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Total profit and losses</h2><div style={styles.selectorGroup}>{renderPicker('result', resultType, resultOptions, setResultType)}{renderPicker('period', period, periodOptions, setPeriod)}</div><div style={styles.listCard}><div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>{resultType === 'profit' ? 'Profit' : 'Loss'} · {period}</p><p style={styles.note}>Based on completed ledger records</p></div><p style={styles.value}>{data ? formatUsdt(selectedValue) : <LoadingDots />}</p></div><div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Net position</p><p style={styles.note}>Profit less recorded losses</p></div><p style={styles.value}>{data ? formatUsdt(finance?.totalProfit || 0) : <LoadingDots />}</p></div></div></section>
  </div></div><NowBar /></div></HybridTheme>;
};

export default MySpacePage;
