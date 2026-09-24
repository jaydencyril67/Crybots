import React from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Coins, TrendingDown, TrendingUp, UserPlus, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { ...createHybridCardStyles(theme).card },
  performanceCard: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '12px' },
  chart: { minHeight: 'clamp(260px, 58vw, 440px)', display: 'grid', gap: '12px', padding: '14px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.textMuted, fontSize: '0.82rem', boxSizing: 'border-box' as const },
  chartHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const },
  chartValue: { margin: '3px 0 0', color: theme.text, fontSize: 'clamp(1.35rem, 4vw, 1.8rem)', fontWeight: 900 },
  chartChange: { margin: 0, color: theme.primary, fontSize: '0.8rem', fontWeight: 850 },
  chartCanvas: { width: '100%', minWidth: 0, height: 'clamp(210px, 42vw, 340px)', overflow: 'visible' },
  chartMessage: { minHeight: '220px', display: 'grid', placeItems: 'center', textAlign: 'center' as const },
  chartTitle: { margin: 0, color: theme.text, fontSize: '1rem', fontWeight: 900 },
  listCard: { display: 'grid', gap: '8px', minWidth: 0, padding: '10px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', minWidth: 0, padding: '12px 13px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  listItemContent: { minWidth: 0 },
  movementHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const },
  selectWrap: { position: 'relative' as const, minWidth: '150px' },
  selectTrigger: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '10px 12px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  movementGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' },
  movementCard: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '9px' },
  movementInner: { display: 'grid', gap: '9px', padding: '12px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  movementLabel: { display: 'flex', alignItems: 'center', gap: '7px', margin: 0, fontSize: '0.82rem', fontWeight: 850 },
  movementValue: { margin: 0, fontSize: '1.2rem', fontWeight: 900 },
  activityList: { display: 'grid', gap: '8px', padding: '10px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  activityItem: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, padding: '12px 13px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  activityIcon: { display: 'inline-flex', flexShrink: 0, padding: '8px', borderRadius: '10px', color: theme.primary, background: theme.surfaceGlass },
  activityContent: { minWidth: 0, flex: 1 },
  activityLabel: { margin: 0, fontSize: '0.8rem', fontWeight: 800 },
  activityNote: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.7rem' },
  activityValue: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', fontWeight: 800 },
  label: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.3 },
  value: { margin: 0, fontSize: 'clamp(0.96rem, 2.5vw, 1.12rem)', fontWeight: 900, textAlign: 'right' as const, overflowWrap: 'anywhere' as const },
  note: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.7rem', lineHeight: 1.35 },
  icon: { display: 'inline-flex', flexShrink: 0, color: theme.primary },
  section: { display: 'grid', gap: '10px', marginTop: '16px' },
  sectionTitle: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
  disclaimer: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.5 },
});

type PoolPoint = { date: string; value: number; dailyChangePercent: number };
type PoolActivity = { type: 'deposit' | 'withdrawal'; amount: number; date: string };
type PoolResponse = { current: { value: number; dailyChangePercent: number; date: string }; history: PoolPoint[]; overview: { poolCapital: number; totalHolders: number }; activities: PoolActivity[] };

const formatPoolValue = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

const PoolChart = ({ history, theme }: { history: PoolPoint[]; theme: typeof HYBRID_THEME_TOKENS.dark }) => {
  if (history.length < 2) return null;

  const values = history.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const points = history.map((point, index) => {
    const x = (index / (history.length - 1)) * 800;
    const y = 270 - ((point.value - minimum) / range) * 230;
    return { x, y };
  });
  const wormPath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    const previous = points[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint.toFixed(2)} ${previous.y.toFixed(2)}, ${midpoint.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, '');
  const areaPath = `${wormPath} L 800 300 L 0 300 Z`;
  const labelIndexes = [0, Math.floor((history.length - 1) / 2), history.length - 1];

  return <svg viewBox="0 0 800 320" role="img" aria-label="KingsPool performance line chart" style={getStyles(theme).chartCanvas} preserveAspectRatio="none">
    <defs><linearGradient id="poolChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={theme.primary} stopOpacity="0.28" /><stop offset="100%" stopColor={theme.primary} stopOpacity="0" /></linearGradient></defs>
    {[50, 105, 160, 215, 270].map((y) => <line key={y} x1="0" x2="800" y1={y} y2={y} stroke={theme.borderGlass} strokeDasharray="5 8" />)}
    <path d={areaPath} fill="url(#poolChartFill)" />
    <path d={wormPath} fill="none" stroke={theme.primary} strokeOpacity="0.18" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    <path d={wormPath} fill="none" stroke={theme.primary} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    {points.map((point, index) => <circle key={history[index].date} cx={point.x} cy={point.y} r="4" fill={theme.surfaceMuted} stroke={theme.primary} strokeWidth="3" vectorEffect="non-scaling-stroke" />)}
    {labelIndexes.map((index) => <text key={history[index].date} x={(index / (history.length - 1)) * 800} y="316" fill={theme.textMuted} fontSize="13" textAnchor={index === 0 ? 'start' : index === history.length - 1 ? 'end' : 'middle'}>{history[index].date.slice(5)}</text>)}
  </svg>;
};

const KingsPoolPage = () => {
  const { themeMode } = useAppTheme();
  const [movementPeriod, setMovementPeriod] = React.useState<'week' | 'month' | 'year'>('week');
  const [isMovementMenuOpen, setIsMovementMenuOpen] = React.useState(false);
  const [poolData, setPoolData] = React.useState<PoolResponse | null>(null);
  const [poolError, setPoolError] = React.useState('');
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);
  const theme = HYBRID_THEME_TOKENS[themeMode];

  React.useEffect(() => {
    let active = true;
    const loadPoolPerformance = async () => {
      try {
        const { data } = await api.get<PoolResponse>('/api/pool');
        if (active) {
          setPoolData(data);
          setPoolError('');
        }
      } catch {
        if (active) setPoolError('Unable to load pool performance right now.');
      }
    };
    void loadPoolPerformance();
    const refreshTimer = window.setInterval(() => { void loadPoolPerformance(); }, 60_000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return <HybridTheme><Helmet><title>KingsPool | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool performance</h2><div style={styles.performanceCard}><div style={styles.chart}>
      {poolError ? null : poolData ? <><div style={styles.chartHeader}><div><p style={styles.chartTitle}>KingsPool performance</p><p style={styles.chartValue}>{formatPoolValue(poolData.current.value)}</p></div><p style={{ ...styles.chartChange, color: poolData.current.dailyChangePercent >= 0 ? theme.primary : theme.danger }}><TrendingUp size={15} /> {poolData.current.dailyChangePercent >= 0 ? '+' : ''}{poolData.current.dailyChangePercent.toFixed(2)}% target today</p></div><PoolChart history={poolData.history} theme={theme} /></> : null}
    </div></div></section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool overview</h2><div style={styles.listCard}>
      <div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.label}>Total pool capital</p><p style={styles.note}>Capital currently held in user pool positions</p></div><Coins size={19} style={styles.icon} /><p style={styles.value}>{poolData ? formatPoolValue(poolData.overview.poolCapital) : '—'}</p></div>
      <div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.label}>Total holders</p><p style={styles.note}>Active KingsPool participants</p></div><Users size={19} style={styles.icon} /><p style={styles.value}>{poolData ? poolData.overview.totalHolders.toLocaleString() : '—'}</p></div>
    </div></section>

    <section style={styles.section}>
      <div style={styles.movementHeader}>
        <h2 style={styles.sectionTitle}>Biggest market moves</h2>
        <div style={styles.selectWrap}>
          <button type="button" aria-label="Select market move period" style={styles.selectTrigger} onClick={() => setIsMovementMenuOpen((current) => !current)}>
            <span>{movementPeriod === 'week' ? 'This week' : movementPeriod === 'month' ? 'This month' : 'This year'}</span>
            <span style={{ transform: isMovementMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
          </button>
          {isMovementMenuOpen ? <div style={styles.selectMenu}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <button key={period} type="button" style={styles.selectOption} onClick={() => { setMovementPeriod(period); setIsMovementMenuOpen(false); }}>
                {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year'}
              </button>
            ))}
          </div> : null}
        </div>
      </div>
      <div style={styles.movementGrid}>
        <div style={styles.movementCard}>
          <div style={styles.movementInner}>
            <p style={styles.movementLabel}><TrendingUp size={17} /> Biggest rise</p>
            <p style={styles.movementValue}>—</p>
            <p style={styles.note}>Highest move in the selected {movementPeriod}</p>
          </div>
        </div>
        <div style={styles.movementCard}>
          <div style={styles.movementInner}>
            <p style={styles.movementLabel}><TrendingDown size={17} /> Biggest fall</p>
            <p style={styles.movementValue}>—</p>
            <p style={styles.note}>Largest drop in the selected {movementPeriod}</p>
          </div>
        </div>
      </div>
    </section>

    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>Recent pool activity</h2>
      <div style={styles.activityList}>
        {poolData?.activities.length ? poolData.activities.map((activity) => <div style={styles.activityItem} key={`${activity.date}-${activity.type}-${activity.amount}`}>
          <span style={styles.activityIcon}>{activity.type === 'deposit' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span>
          <div style={styles.activityContent}><p style={styles.activityLabel}>{activity.type === 'deposit' ? 'Pool deposit' : 'Pool withdrawal'}</p><p style={styles.activityNote}>{new Date(activity.date).toLocaleString()}</p></div>
          <p style={styles.activityValue}>{activity.type === 'deposit' ? '+' : '-'}{formatPoolValue(activity.amount)}</p>
        </div>) : <div style={styles.activityItem}><span style={styles.activityIcon}><UserPlus size={17} /></span><div style={styles.activityContent}><p style={styles.activityLabel}>No pool activity yet</p><p style={styles.activityNote}>Deposits and withdrawals will appear here.</p></div></div>}
      </div>
    </section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Risk notice</h2><div style={styles.card}><div style={styles.movementInner}><p style={styles.disclaimer}><TrendingDown size={16} /> Investment value can rise or fall. Returns are not guaranteed, and users may lose part or all of their invested funds.</p></div></div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default KingsPoolPage;
