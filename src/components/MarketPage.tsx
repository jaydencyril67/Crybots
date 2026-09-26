import React from 'react';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import NotificationBanner, { type NotificationTone } from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

const MAX_MARKET_PERCENT = 4;
const UPDATE_INTERVAL_MS = 60_000;

type MarketPoint = { timestamp: number; percent: number };

type MarketNotification = { tone: NotificationTone; message: string };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  section: { display: 'grid', gap: '10px', marginTop: '16px' },
  sectionTitle: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
  card: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '12px' },
  chart: { width: '100%', minHeight: 'clamp(260px, 58vw, 440px)', display: 'grid', gridTemplateRows: 'minmax(0, 1fr)', gap: '12px', padding: '14px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.textMuted, fontSize: '0.82rem', boxSizing: 'border-box' as const },
  chartWave: { display: 'grid', gridTemplateRows: 'minmax(0, 1fr) auto', gap: '12px', padding: '18px 12px 10px', borderBottom: `1px solid ${theme.borderGlass}`, boxSizing: 'border-box' as const, overflow: 'hidden' },
  chartSvg: { display: 'block', width: '100%', height: '100%', minHeight: 0, overflow: 'visible' as const },
  chartFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', margin: 0, color: theme.textMuted, fontSize: '0.76rem' },
  chartValue: { color: theme.text, fontWeight: 900 },
  note: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.76rem', lineHeight: 1.45 },
  movementGrid: { width: '100%', display: 'grid', gap: '8px', padding: '10px', boxSizing: 'border-box' as const },
  movementInner: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', minWidth: 0, padding: '12px 13px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', background: theme.surfaceMuted, boxSizing: 'border-box' as const },
  movementSubject: { display: 'grid', gap: '3px', minWidth: 0 },
  movementLabel: { display: 'flex', alignItems: 'center', gap: '7px', margin: 0, fontSize: '0.82rem', fontWeight: 850 },
  movementValue: { margin: 0, fontSize: 'clamp(0.96rem, 2.5vw, 1.12rem)', fontWeight: 900, textAlign: 'right' as const, flexShrink: 0 },
  pointsGrid: { width: '100%', display: 'grid', gap: '12px', padding: '14px', boxSizing: 'border-box' as const },
  metricLabel: { margin: 0, color: theme.textMuted, fontSize: '0.75rem' },
  buyForm: { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'end', gap: '9px' },
  inputGroup: { display: 'grid', gap: '5px', flex: '1 1 180px' },
  input: { width: '100%', boxSizing: 'border-box' as const, padding: '10px 11px', borderRadius: '9px', border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text, fontSize: '0.9rem' },
  buyButton: { border: `1px solid ${theme.primary}`, borderRadius: '9px', padding: '11px 16px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer' },
  disabledButton: { opacity: 0.55, cursor: 'not-allowed' },
  status: { margin: 0, fontSize: '0.8rem', color: theme.textMuted },
});

const MarketChart = ({ points, theme }: { points: MarketPoint[]; theme: typeof HYBRID_THEME_TOKENS.dark }) => {
  const current = points[points.length - 1]?.percent ?? 0;
  const chartPoints = points.length > 1 ? points : [{ timestamp: Date.now() - UPDATE_INTERVAL_MS, percent: current }, ...points];
  const linePath = chartPoints.map((point, index) => {
    const x = (index / Math.max(1, chartPoints.length - 1)) * 620;
    const y = 188 - (point.percent / MAX_MARKET_PERCENT) * 122;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const areaPath = `${linePath} L 620 230 L 0 230 Z`;
  const styles = getStyles(theme);

  return <div role="img" aria-label={`Market performance: ${current.toFixed(2)} percent`} style={styles.chartWave}>
    {points.length ? <svg viewBox="0 0 620 240" preserveAspectRatio="none" aria-hidden="true" style={styles.chartSvg}>
      <defs><linearGradient id="market-wave-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={theme.primary} stopOpacity="0.35" /><stop offset="100%" stopColor={theme.primary} stopOpacity="0" /></linearGradient></defs>
      <line x1="0" x2="620" y1="188" y2="188" stroke={theme.borderGlass} strokeWidth="1" />
      <line x1="0" x2="620" y1="66" y2="66" stroke={theme.borderGlass} strokeWidth="1" strokeDasharray="4 8" />
      <path d={areaPath} fill="url(#market-wave-fill)" /><path d={linePath} fill="none" stroke={theme.primary} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={620} cy={188 - (current / MAX_MARKET_PERCENT) * 122} r="7" fill={theme.primary} stroke={theme.surfaceMuted} strokeWidth="4" />
    </svg> : <LoadingDots />}
    <p style={styles.chartFooter}><span>Live market · updates every minute</span><span style={styles.chartValue}>{points.length ? `${current.toFixed(2)}%` : <LoadingDots />}</span></p>
  </div>;
};

const MarketPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [marketPoints, setMarketPoints] = React.useState<MarketPoint[]>([]);
  const [buyPoints, setBuyPoints] = React.useState('');
  const [sellPoints, setSellPoints] = React.useState('');
  const [buying, setBuying] = React.useState(false);
  const [selling, setSelling] = React.useState(false);
  const [buyStatus, setBuyStatus] = React.useState<MarketNotification | null>(null);
  const [sellStatus, setSellStatus] = React.useState<MarketNotification | null>(null);

  React.useEffect(() => {
    let active = true;
    const loadMarketPerformance = async () => {
      try {
        const performanceResponse = await api.get<{ points: MarketPoint[] }>('/api/market/performance');
        if (active) {
          setMarketPoints(performanceResponse.data.points);
        }
      } catch (error) {
        console.error('Unable to load market performance.', error);
      }
    };

    loadMarketPerformance();
    const timer = window.setInterval(loadMarketPerformance, UPDATE_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const high = Math.max(...marketPoints.map((point) => point.percent));
  const low = Math.min(...marketPoints.map((point) => point.percent));
  const formatUsdt = (amount: number) => `${amount.toFixed(2)} USDT`;
  const handleBuy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const points = Number(buyPoints);
    if (!Number.isFinite(points) || points < 1) {
      setBuyStatus({ tone: 'warning', message: 'Enter at least 1 point.' });
      return;
    }

    setBuying(true);
    setBuyStatus(null);
    setSellStatus(null);
    try {
      await api.post('/api/market/points/buy', { points });
      setBuyPoints('');
      setBuyStatus({ tone: 'success', message: 'Points purchased. They begin following market performance tomorrow.' });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setBuyStatus({ tone: 'error', message: message || 'Unable to purchase points right now.' });
    } finally {
      setBuying(false);
    }
  };

  const handleSell = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const points = Number(sellPoints);
    if (!Number.isFinite(points) || points < 1) {
      setSellStatus({ tone: 'warning', message: 'Enter at least 1 point.' });
      return;
    }

    setSelling(true);
    setSellStatus(null);
    setBuyStatus(null);
    try {
      const response = await api.post<{ value: number }>('/api/market/points/sell', { points });
      setSellPoints('');
      setSellStatus({ tone: 'success', message: `${points.toFixed(2)} points sold for ${formatUsdt(response.data.value)}.` });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSellStatus({ tone: 'error', message: message || 'Unable to sell points right now.' });
    } finally {
      setSelling(false);
    }
  };

  return <HybridTheme><Helmet><title>Market | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market performance</h2><div style={styles.card}><div style={styles.chart}><MarketChart points={marketPoints} theme={theme} /></div></div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Buy and sell points</h2><div style={styles.card}><div style={styles.pointsGrid}>
      <form style={styles.buyForm} onSubmit={handleBuy}>
        <label style={styles.inputGroup}><span style={styles.metricLabel}>Points to buy (1 point = 1 USDT)</span><input style={styles.input} type="number" min="1" step="0.01" value={buyPoints} onChange={(event) => setBuyPoints(event.target.value)} placeholder="e.g. 100" /></label>
        <button type="submit" style={{ ...styles.buyButton, ...(buying || selling ? styles.disabledButton : {}) }} disabled={buying || selling}>{buying ? 'Buying…' : 'Buy points'}</button>
      </form>
      <form style={styles.buyForm} onSubmit={handleSell}>
        <label style={styles.inputGroup}><span style={styles.metricLabel}>Points to sell at current market value</span><input style={styles.input} type="number" min="1" step="0.01" value={sellPoints} onChange={(event) => setSellPoints(event.target.value)} placeholder="e.g. 100" /></label>
        <button type="submit" style={{ ...styles.buyButton, ...(buying || selling ? styles.disabledButton : {}) }} disabled={buying || selling}>{selling ? 'Selling…' : 'Sell points'}</button>
      </form>
      {buyStatus || sellStatus ? <NotificationBanner tone={(buyStatus || sellStatus)?.tone} title="Market points update" message={(buyStatus || sellStatus)?.message || ''} /> : <p style={styles.status}>New purchases start following the market from the next UTC day. Unsold points reset to their original value at the next daily reset.</p>}
    </div></div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market movement</h2><div style={styles.card}><div style={styles.movementGrid}>
      <div style={styles.movementInner}><div style={styles.movementSubject}><p style={styles.movementLabel}><TrendingUp size={17} /> Session high</p></div><p style={styles.movementValue}>{marketPoints.length ? `${high.toFixed(2)}%` : <LoadingDots />}</p></div>
      <div style={styles.movementInner}><div style={styles.movementSubject}><p style={styles.movementLabel}><TrendingDown size={17} /> Session low</p></div><p style={styles.movementValue}>{marketPoints.length ? `${low.toFixed(2)}%` : <LoadingDots />}</p></div>
    </div></div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default MarketPage;
