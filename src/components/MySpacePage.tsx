import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { useAppTheme } from './AppTheme';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type PointPosition = { points: number; cost: number; purchasedAt: string; activeFrom: string; active: boolean; value: number };
type MarketPointsData = { points: number; value: number; pendingPoints: number; current: number; positions: PointPosition[] };
type TransactionEntry = { id: string; title: string; direction: 'inbound' | 'outbound'; amountValue: number; date: string; time: string; points?: number; source: string; status: 'completed' | 'pending' | 'failed' | 'cancelled' };
type PointSummary = { totalBoughtPoints: number; totalSoldPoints: number; totalBoughtValue: number; totalSoldValue: number; buyCount: number; sellCount: number };
type TransactionsData = { transactions: TransactionEntry[]; pointSummary: PointSummary };

const formatUsdt = (value: number) => `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDT`;

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
  historyWrap: { width: '100%', maxHeight: '360px', overflowX: 'auto' as const, overflowY: 'auto' as const },
  historyTable: { width: '100%', minWidth: '560px', borderCollapse: 'collapse' as const, fontSize: '0.78rem' },
  historyHeader: { padding: '10px 12px', borderBottom: `1px solid ${theme.borderGlass}`, color: theme.textMuted, fontSize: '0.72rem', fontWeight: 800, textAlign: 'left' as const, whiteSpace: 'nowrap' as const },
  historyCell: { padding: '12px', borderBottom: `1px solid ${theme.borderGlass}`, color: theme.text, whiteSpace: 'nowrap' as const },
  historyCellMuted: { padding: '12px', borderBottom: `1px solid ${theme.borderGlass}`, color: theme.textMuted, whiteSpace: 'nowrap' as const },
  historyEmpty: { margin: 0, padding: '16px 12px', color: theme.textMuted, fontSize: '0.78rem' },
  section: { display: 'grid', gap: '10px' },
  sectionTitle: { margin: 0, fontSize: '0.94rem', fontWeight: 900 },
});

const MySpacePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [marketPoints, setMarketPoints] = useState<MarketPointsData | null>(null);
  const [pointTransactions, setPointTransactions] = useState<TransactionEntry[]>([]);
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<MarketPointsData>('/api/market/points'),
      api.get<TransactionsData>('/api/transactions/me'),
    ]).then(([pointsResponse, transactionsResponse]) => {
      if (!active) return;
      setMarketPoints(pointsResponse.data);
      setPointTransactions(transactionsResponse.data.transactions.filter((transaction) => transaction.source === 'trade' && typeof transaction.points === 'number'));
      setPointSummary(transactionsResponse.data.pointSummary);
    }).catch(() => { if (active) setError('Unable to load your account statistics.'); });
    return () => { active = false; };
  }, []);

  const boughtPoints = pointSummary?.totalBoughtPoints || 0;
  const soldPoints = pointSummary?.totalSoldPoints || 0;
  const recentPointTransactions = pointTransactions.slice(0, 10);
  return <HybridTheme><Helmet><title>My Space | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}><div style={styles.content}>
    <button type="button" style={styles.back} onClick={() => navigate('/trade')}><ArrowLeft size={17} /> Trade</button>
    {error ? <NotificationBanner tone="error" title="My Space unavailable" message={error} /> : null}
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market points</h2><div style={styles.listCard}>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Total bought</p><p style={styles.note}>{pointSummary ? `${pointSummary.buyCount} purchases · ${formatUsdt(pointSummary.totalBoughtValue)}` : 'Lifetime points purchased'}</p></div><p style={styles.value}>{pointSummary ? boughtPoints.toFixed(6) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Total sold</p><p style={styles.note}>{pointSummary ? `${pointSummary.sellCount} sales · ${formatUsdt(pointSummary.totalSoldValue)}` : 'Lifetime points sold'}</p></div><p style={styles.value}>{pointSummary ? soldPoints.toFixed(6) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Active points</p><p style={styles.note}>Recorded points currently available</p></div><p style={styles.value}>{marketPoints ? marketPoints.points.toFixed(6) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Pending points</p><p style={styles.note}>Points becoming active next day</p></div><p style={styles.value}>{marketPoints ? marketPoints.pendingPoints.toFixed(6) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.itemContent}><p style={styles.label}>Active value</p><p style={styles.note}>{marketPoints ? `${marketPoints.current.toFixed(2)}% market movement` : 'Current market value'}</p></div><p style={styles.value}>{marketPoints ? formatUsdt(marketPoints.value) : <LoadingDots />}</p></div>
    </div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Purchase and sell history</h2><div style={styles.listCard}>
      {recentPointTransactions.length ? <div style={styles.historyWrap}><table style={styles.historyTable}><thead><tr><th style={styles.historyHeader}>Action</th><th style={styles.historyHeader}>Points</th><th style={styles.historyHeader}>Value</th><th style={styles.historyHeader}>Date</th><th style={styles.historyHeader}>Status</th></tr></thead><tbody>{recentPointTransactions.map((transaction) => <tr key={transaction.id}><td style={styles.historyCell}>{transaction.title}</td><td style={styles.historyCell}>{transaction.points?.toFixed(6) || '0.000000'}</td><td style={styles.historyCell}>{formatUsdt(transaction.amountValue)}</td><td style={styles.historyCellMuted}>{transaction.date} · {transaction.time}</td><td style={styles.historyCell}>{transaction.status}</td></tr>)}</tbody></table></div> : <p style={styles.historyEmpty}>No point purchases or sales recorded yet.</p>}
    </div></section>
  </div></div><NowBar /></div></HybridTheme>;
};

export default MySpacePage;
