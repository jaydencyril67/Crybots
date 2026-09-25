import React from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Coins, TrendingDown, TrendingUp, UserPlus, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import api, { API_BASE_URL } from '../api/axios';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { ...createHybridCardStyles(theme).card },
  performanceCard: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '12px' },
  chart: { minHeight: 'clamp(260px, 58vw, 440px)', display: 'grid', gap: '12px', padding: '14px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.textMuted, fontSize: '0.82rem', boxSizing: 'border-box' as const },
  chartHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const },
  chartValue: { margin: '3px 0 0', color: theme.text, fontSize: 'clamp(1.35rem, 4vw, 1.8rem)', fontWeight: 900 },
  chartBars: { minHeight: 'clamp(210px, 42vw, 340px)', display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', alignItems: 'end', gap: 'clamp(8px, 2vw, 18px)', padding: '24px 8px 4px', borderBottom: `1px solid ${theme.borderGlass}`, boxSizing: 'border-box' as const },
  chartBarGroup: { minWidth: 0, height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', alignItems: 'end', justifyItems: 'center', gap: '8px' },
  chartBarValue: { margin: 0, color: theme.text, fontSize: 'clamp(0.62rem, 1.8vw, 0.78rem)', fontWeight: 800, whiteSpace: 'nowrap' as const },
  chartBarTrack: { position: 'relative' as const, width: '100%', height: '100%', minHeight: '120px', borderRadius: '8px', background: theme.surfaceGlass, overflow: 'hidden' },
  chartBarZeroLine: { position: 'absolute' as const, zIndex: 1, top: '50%', left: 0, right: 0, borderTop: `1px solid ${theme.borderGlass}` },
  chartBar: { position: 'absolute' as const, zIndex: 2, left: '50%', width: 'min(34px, 68%)', minHeight: 0, transform: 'translateX(-50%)', background: theme.primary, transition: 'top 0.8s ease, height 0.8s ease' },
  chartBarDate: { margin: 0, color: theme.textMuted, fontSize: 'clamp(0.62rem, 1.8vw, 0.76rem)' },
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
type PoolResponse = { current: { value: number; dailyChangePercent: number; progressPercent: number; date: string }; history: PoolPoint[]; overview: { poolCapital: number; totalHolders: number }; activities: PoolActivity[] };
type PoolApiResponse = Partial<PoolResponse> & { current: PoolResponse['current'] };

const formatPoolValue = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

const POOL_BAR_MIN_PERCENT = -5;
const POOL_BAR_MAX_PERCENT = 5;

const PoolChart = ({ history, current, direction, theme }: { history: PoolPoint[]; current: PoolResponse['current']; direction: 'up' | 'down' | 'flat'; theme: typeof HYBRID_THEME_TOKENS.dark }) => {
  const safeHistory = history.filter((point) => Number.isFinite(point.value) && typeof point.date === 'string').slice(-7).map((point) => point.date === current.date ? { ...point, value: current.value, dailyChangePercent: current.progressPercent } : point);
  if (!safeHistory.length) return null;

  return <div role="img" aria-label="KingsPool seven most recent days vertical bar chart with a centered zero baseline, scaled from -5% to 5%" style={getStyles(theme).chartBars}>
    {safeHistory.map((point) => {
      const boundedPercent = Math.min(POOL_BAR_MAX_PERCENT, Math.max(POOL_BAR_MIN_PERCENT, point.dailyChangePercent));
      const barHeight = (Math.abs(boundedPercent) / POOL_BAR_MAX_PERCENT) * 50;
      const isPositive = boundedPercent >= 0;
      const isCurrent = point.date === current.date;
      return <div key={point.date} style={getStyles(theme).chartBarGroup}>
        <p style={getStyles(theme).chartBarValue}>{point.dailyChangePercent >= 0 ? '+' : ''}{point.dailyChangePercent.toFixed(2)}%</p>
        <div style={getStyles(theme).chartBarTrack}>
          <div aria-hidden="true" style={getStyles(theme).chartBarZeroLine} />
          <div title={`${point.dailyChangePercent.toFixed(2)}%`} style={{ ...getStyles(theme).chartBar, top: isPositive ? `${50 - barHeight}%` : '50%', height: `${barHeight}%`, borderRadius: isPositive ? '8px 8px 0 0' : '0 0 8px 8px', background: point.dailyChangePercent < 0 ? '#dc2626' : isCurrent ? (direction === 'up' ? '#16a34a' : theme.primary) : '#ffffff', opacity: 1 }} />
        </div>
        <p style={getStyles(theme).chartBarDate}>{point.date.slice(5)}</p>
      </div>;
    })}
  </div>;
};

const KingsPoolPage = () => {
  const { themeMode } = useAppTheme();
  const [movementPeriod, setMovementPeriod] = React.useState<'week' | 'month' | 'year'>('week');
  const [isMovementMenuOpen, setIsMovementMenuOpen] = React.useState(false);
  const [poolData, setPoolData] = React.useState<PoolResponse | null>(null);
  const [poolError, setPoolError] = React.useState('');
  const [movementDirection, setMovementDirection] = React.useState<'up' | 'down' | 'flat'>('flat');
  const previousProgressRef = React.useRef<number | null>(null);
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);
  const theme = HYBRID_THEME_TOKENS[themeMode];

  React.useEffect(() => {
    let active = true;
    const applyCurrentPerformance = (current: PoolResponse['current']) => {
      const nextProgress = Number(current.progressPercent ?? 0);
      const normalizedCurrent = { ...current, progressPercent: Number(nextProgress.toFixed(2)) };
      const previousProgress = previousProgressRef.current;
      setMovementDirection(previousProgress === null || nextProgress === previousProgress ? 'flat' : nextProgress > previousProgress ? 'up' : 'down');
      previousProgressRef.current = nextProgress;
      setPoolData((previous) => previous ? { ...previous, current: normalizedCurrent, history: previous.history.map((point) => point.date === normalizedCurrent.date ? { ...point, value: normalizedCurrent.value, dailyChangePercent: normalizedCurrent.progressPercent } : point) } : previous);
      setPoolError('');
    };

    const loadPoolPerformance = async () => {
      try {
        const { data } = await api.get<PoolApiResponse>('/api/pool');
        if (active) {
          applyCurrentPerformance(data.current);
          setPoolData((previous) => ({
            ...previous,
            ...data,
            current: { ...data.current, progressPercent: Number(Number(data.current.progressPercent ?? 0).toFixed(2)) },
            history: Array.isArray(data.history) ? data.history : [],
            overview: data.overview || { poolCapital: data.current?.value || 0, totalHolders: 0 },
            activities: Array.isArray(data.activities) ? data.activities : [],
          }));
        }
      } catch {
        if (active) {
          setPoolError('Unable to load pool performance right now.');
        }
      }
    };

    void loadPoolPerformance();
    // Keep a polling fallback for browsers, proxies, or service workers that do
    // not deliver the EventSource response promptly.
    const refreshTimer = window.setInterval(() => { void loadPoolPerformance(); }, 15_000);
    const token = localStorage.getItem('token');
    const stream = token ? new EventSource(`${API_BASE_URL}/api/pool/stream?token=${encodeURIComponent(token)}`) : null;
    stream?.addEventListener('performance', (event) => {
      if (!active) return;
      try {
        applyCurrentPerformance(JSON.parse((event as MessageEvent).data) as PoolResponse['current']);
      } catch {
        setPoolError('Unable to read live pool performance.');
      }
    });
    stream?.addEventListener('error', () => {
      if (active && stream.readyState === EventSource.CLOSED) setPoolError('Live pool performance disconnected.');
    });
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      stream?.close();
    };
  }, []);

  return <HybridTheme><Helmet><title>KingsPool | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool performance</h2><div style={styles.performanceCard}><div style={styles.chart}>
      {poolError ? <p style={styles.note}>{poolError}</p> : poolData ? <><div style={styles.chartHeader}><p style={styles.chartValue}>{formatPoolValue(poolData.current.value)}</p></div><PoolChart history={poolData.history} current={poolData.current} direction={movementDirection} theme={theme} /></> : <div style={styles.chartMessage}><LoadingDots /></div>}
    </div></div></section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool overview</h2><div style={styles.listCard}>
      <div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.label}>Total pool capital</p><p style={styles.note}>Capital currently held in user pool positions</p></div><Coins size={19} style={styles.icon} /><p style={styles.value}>{poolData?.overview ? formatPoolValue(poolData.overview.poolCapital) : <LoadingDots />}</p></div>
      <div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.label}>Total holders</p><p style={styles.note}>Active KingsPool participants</p></div><Users size={19} style={styles.icon} /><p style={styles.value}>{poolData?.overview ? poolData.overview.totalHolders.toLocaleString() : <LoadingDots />}</p></div>
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
        {poolData?.activities?.length ? poolData.activities.map((activity) => <div style={styles.activityItem} key={`${activity.date}-${activity.type}-${activity.amount}`}>
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
