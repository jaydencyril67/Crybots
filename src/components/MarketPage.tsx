import React from 'react';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

const MAX_MARKET_PERCENT = 4;
const UPDATE_INTERVAL_MS = 60_000;

type MarketPoint = { timestamp: number; percent: number };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  section: { display: 'grid', gap: '10px', marginTop: '16px' },
  sectionTitle: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
  card: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '12px' },
  chart: { minHeight: 'clamp(260px, 58vw, 440px)', display: 'grid', gridTemplateRows: 'minmax(0, 1fr)', gap: '12px', padding: '14px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.textMuted, fontSize: '0.82rem', boxSizing: 'border-box' as const },
  chartWave: { display: 'grid', gridTemplateRows: 'minmax(0, 1fr) auto', gap: '12px', padding: '18px 12px 10px', borderBottom: `1px solid ${theme.borderGlass}`, boxSizing: 'border-box' as const, overflow: 'hidden' },
  chartSvg: { display: 'block', width: '100%', height: '100%', minHeight: 0, overflow: 'visible' as const },
  chartFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', margin: 0, color: theme.textMuted, fontSize: '0.76rem' },
  chartValue: { color: theme.text, fontWeight: 900 },
  note: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.76rem', lineHeight: 1.45 },
  movementGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' },
  movement: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '9px' },
  movementInner: { display: 'grid', gap: '9px', padding: '12px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  movementLabel: { display: 'flex', alignItems: 'center', gap: '7px', margin: 0, fontSize: '0.82rem', fontWeight: 850 },
  movementValue: { margin: 0, fontSize: '1.2rem', fontWeight: 900 },
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
    <svg viewBox="0 0 620 240" preserveAspectRatio="none" aria-hidden="true" style={styles.chartSvg}>
      <defs><linearGradient id="market-wave-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={theme.primary} stopOpacity="0.35" /><stop offset="100%" stopColor={theme.primary} stopOpacity="0" /></linearGradient></defs>
      <line x1="0" x2="620" y1="188" y2="188" stroke={theme.borderGlass} strokeWidth="1" />
      <line x1="0" x2="620" y1="66" y2="66" stroke={theme.borderGlass} strokeWidth="1" strokeDasharray="4 8" />
      <path d={areaPath} fill="url(#market-wave-fill)" /><path d={linePath} fill="none" stroke={theme.primary} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={620} cy={188 - (current / MAX_MARKET_PERCENT) * 122} r="7" fill={theme.primary} stroke={theme.surfaceMuted} strokeWidth="4" />
    </svg>
    <p style={styles.chartFooter}><span>Live market · updates every minute</span><span style={styles.chartValue}>{current.toFixed(2)}%</span></p>
  </div>;
};

const MarketPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [marketPoints, setMarketPoints] = React.useState<MarketPoint[]>([]);

  React.useEffect(() => {
    let active = true;
    const loadMarketPerformance = async () => {
      try {
        const response = await api.get<{ points: MarketPoint[] }>('/api/market/performance');
        if (active) {
          setMarketPoints(response.data.points);
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

  const current = marketPoints[marketPoints.length - 1]?.percent ?? 0;
  const high = Math.max(...marketPoints.map((point) => point.percent));
  const low = Math.min(...marketPoints.map((point) => point.percent));

  return <HybridTheme><Helmet><title>Market | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market performance</h2><div style={styles.card}><div style={styles.chart}><MarketChart points={marketPoints} theme={theme} /></div></div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market movement</h2><div style={styles.movementGrid}>
      <div style={styles.movement}><div style={styles.movementInner}><p style={styles.movementLabel}><TrendingUp size={17} /> Session high</p><p style={styles.movementValue}>{high.toFixed(2)}%</p><p style={styles.note}>Maximum movement in the current live window</p></div></div>
      <div style={styles.movement}><div style={styles.movementInner}><p style={styles.movementLabel}><TrendingDown size={17} /> Session low</p><p style={styles.movementValue}>{low.toFixed(2)}%</p><p style={styles.note}>Minimum movement in the current live window</p></div></div>
    </div></section>
    <section style={styles.section}><h2 style={styles.sectionTitle}>Market information</h2><div style={styles.card}><p style={styles.note}>The market moves gradually between 0% and 4%. A new fluctuation is calculated once every minute.</p><p style={styles.note}>Current movement: {current.toFixed(2)}%</p></div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default MarketPage;
