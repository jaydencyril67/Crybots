import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  ArrowUpRight,
  Bitcoin,
  CandlestickChart,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Coins,
  Globe2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type MarketCoin = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  color: string;
};

type AdviceCard = {
  title: string;
  text: string;
  accent: string;
  icon: React.ReactNode;
};

const marketCoins: MarketCoin[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68421.42, change24h: 2.14, color: '#f59e0b' },
  { symbol: 'ETH', name: 'Ethereum', price: 3528.17, change24h: 1.88, color: '#a78bfa' },
  { symbol: 'BNB', name: 'BNB', price: 598.26, change24h: 0.96, color: '#fbbf24' },
  { symbol: 'SOL', name: 'Solana', price: 178.32, change24h: 4.61, color: '#22d3ee' },
  { symbol: 'XRP', name: 'XRP', price: 0.62, change24h: -0.84, color: '#60a5fa' },
  { symbol: 'ADA', name: 'Cardano', price: 0.74, change24h: 3.12, color: '#38bdf8' },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.14, change24h: 5.04, color: '#fde68a' },
  { symbol: 'MATIC', name: 'Polygon', price: 0.96, change24h: 1.25, color: '#c084fc' },
];

const dashboardMetrics = [
  { label: 'Market sentiment', value: 'Bullish momentum', icon: <ChartNoAxesColumnIncreasing size={18} /> },
  { label: 'Live watchlist', value: '8 tracked assets', icon: <Coins size={18} /> },
  { label: 'Signal cadence', value: 'Updated every minute', icon: <Activity size={18} /> },
  { label: 'Risk posture', value: 'Balanced and alert', icon: <ShieldCheck size={18} /> },
];

const advicePool: AdviceCard[] = [
  {
    title: 'Keep dry powder ready',
    text: 'A portion of your capital should always stay liquid so you can act when the market gives a clean setup instead of chasing spikes.',
    accent: '#22c55e',
    icon: <ShieldCheck />,
  },
  {
    title: 'Scale into positions',
    text: 'Consider splitting entries into smaller tranches. It smooths emotional decisions and reduces the pressure of timing one perfect price.',
    accent: '#38bdf8',
    icon: <TrendingUp />,
  },
  {
    title: 'Watch volatility windows',
    text: 'Big moves often cluster around major session opens, macro data, or exchange-specific catalysts. Plan around events, not just candles.',
    accent: '#c084fc',
    icon: <CandlestickChart />,
  },
  {
    title: 'Protect winners',
    text: 'If a trade is moving in your favor, move part of the risk off the table. Locking some gains can keep your account growing steadily.',
    accent: '#f59e0b',
    icon: <Coins />,
  },
  {
    title: 'Prefer high-conviction setups',
    text: 'Trade fewer ideas, but make sure the ones you take have a strong thesis, a clear invalidation point, and enough upside to justify risk.',
    accent: '#67e8f9',
    icon: <Activity />,
  },
  {
    title: 'Respect the trend',
    text: 'The market pays the most to traders who align with momentum. When the trend is strong, fighting it usually costs more than waiting.',
    accent: '#fb7185',
    icon: <ArrowUpRight />,
  },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflow: 'hidden',
  },
  shell: {
    position: 'relative' as const,
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(20px, 3vw, 32px) clamp(16px, 2.5vw, 24px) 40px',
  },
  glow: {
    position: 'absolute' as const,
    inset: 0,
    background:
      'radial-gradient(circle at top left, rgba(34,211,238,0.16), transparent 30%), radial-gradient(circle at 82% 18%, rgba(168,85,247,0.18), transparent 26%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.12), transparent 24%), linear-gradient(180deg, #09111f 0%, #050816 100%)',
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    insetInline: 0,
    top: 0,
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.6), transparent)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap' as const,
    position: 'relative' as const,
    zIndex: 1,
    marginBottom: '24px',
  },
  brandBlock: {
    minWidth: 0,
    flex: '1 1 260px',
  },
  brandKicker: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: '#67e8f9',
  },
  brandSub: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.62)',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.82)',
    fontSize: '13px',
    fontWeight: 600,
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 'clamp(20px, 4vw, 28px)',
    alignItems: 'stretch',
    position: 'relative' as const,
    zIndex: 1,
  },
  heroCard: {
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    padding: 'clamp(22px, 4vw, 30px)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  greeting: {
    margin: 0,
    color: '#67e8f9',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.24em',
    fontWeight: 800,
  },
  title: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.9rem, 3.4vw, 3.2rem)',
    lineHeight: 1.06,
    letterSpacing: '-0.04em',
  },
  titleAccent: {
    display: 'block',
    background: 'linear-gradient(90deg, #67e8f9 0%, #ffffff 45%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: {
    margin: '14px 0 0',
    maxWidth: '62ch',
    color: 'rgba(255,255,255,0.72)',
    fontSize: '15px',
    lineHeight: 1.75,
  },
  metricRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    marginTop: '24px',
  },
  metricCard: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(8,12,24,0.72)',
    padding: '16px',
  },
  metricLabel: {
    margin: '10px 0 0',
    color: 'rgba(255,255,255,0.64)',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.16em',
    fontWeight: 700,
  },
  metricValue: {
    margin: '8px 0 0',
    fontSize: 'clamp(1.2rem, 2vw, 1.7rem)',
    fontWeight: 800,
  },
  panel: {
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    padding: 'clamp(22px, 4vw, 30px)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
  },
  panelTitle: {
    margin: 0,
    fontSize: '20px',
    letterSpacing: '-0.02em',
  },
  panelSub: {
    margin: '8px 0 0',
    color: 'rgba(255,255,255,0.66)',
    lineHeight: 1.6,
    fontSize: '14px',
  },
  liveHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '18px',
  },
  pulse: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(34,211,238,0.16)',
    background: 'rgba(34,211,238,0.08)',
    color: '#67e8f9',
    fontSize: '13px',
    fontWeight: 700,
  },
  coinGrid: {
    display: 'grid',
    gap: '12px',
  },
  coinCard: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(9,14,28,0.72)',
  },
  coinBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#ffffff',
  },
  coinName: {
    margin: 0,
    fontWeight: 800,
    fontSize: '15px',
  },
  coinSymbol: {
    margin: '4px 0 0',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
  },
  coinPrice: {
    margin: 0,
    textAlign: 'right' as const,
    fontWeight: 800,
    fontSize: '15px',
  },
  coinChange: {
    margin: '4px 0 0',
    textAlign: 'right' as const,
    fontSize: '13px',
    fontWeight: 700,
  },
  adviceWrap: {
    display: 'grid',
    gap: '14px',
  },
  adviceCard: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(8,12,24,0.74)',
    padding: '18px',
    display: 'grid',
    gap: '12px',
  },
  adviceTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adviceIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 800,
  },
  adviceText: {
    margin: 0,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    fontSize: '14px',
  },
  sectionGrid: {
    marginTop: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 'clamp(20px, 3vw, 24px)',
    position: 'relative' as const,
    zIndex: 1,
  },
  featureList: {
    display: 'grid',
    gap: '12px',
    marginTop: '18px',
  },
  featureItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '14px 16px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  featureText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.65,
    color: 'rgba(255,255,255,0.72)',
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginTop: '18px',
  },
  pill: {
    padding: '10px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    fontWeight: 600,
  },
  footerNote: {
    margin: '18px 0 0',
    color: 'rgba(255,255,255,0.55)',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  icon: {
    width: '20px',
    height: '20px',
    color: '#67e8f9',
    flexShrink: 0,
  },
  iconLarge: {
    width: '24px',
    height: '24px',
    color: '#67e8f9',
    flexShrink: 0,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);

const formatChange = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getFirstName = () => {
  const stored = window.localStorage.getItem('kingshall_first_name') || window.localStorage.getItem('firstName');
  if (stored?.trim()) return stored.trim().split(/\s+/)[0];
  return 'Trader';
};

const getAdviceIndex = () => Math.floor(Date.now() / (1000 * 60 * 60)) % advicePool.length;

const DashboardPage = () => {
  const [now, setNow] = useState(new Date());
  const [hourlyAdviceIndex, setHourlyAdviceIndex] = useState(getAdviceIndex());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    const adviceTimer = window.setInterval(() => setHourlyAdviceIndex(getAdviceIndex()), 60_000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(adviceTimer);
    };
  }, []);

  const greeting = useMemo(() => getGreeting(), [now]);
  const firstName = useMemo(() => getFirstName(), []);
  const advice = advicePool[hourlyAdviceIndex];
  const marketSummary = useMemo(() => {
    const winners = marketCoins.filter((coin) => coin.change24h >= 0).length;
    const avgMove = marketCoins.reduce((sum, coin) => sum + coin.change24h, 0) / marketCoins.length;
    const topMover = [...marketCoins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0];

    return {
      winners,
      avgMove,
      topMover,
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Dashboard</title>
      </Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.glow} />
          <div style={styles.topLine} />

          <header style={styles.header}>
            <div style={styles.brandBlock}>
              <p style={styles.brandKicker}>KingsHall Exchange</p>
              <p style={styles.brandSub}>Your market home for fast checks, clear context, and focused execution.</p>
            </div>
            <div style={styles.headerMeta}>
              <Clock3 style={styles.icon} />
              <span>{now.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          </header>

          <div style={styles.heroGrid}>
            <section style={styles.heroCard}>
              <p style={styles.greeting}>{greeting}</p>
              <h1 style={styles.title}>
                Welcome back,
                <span style={styles.titleAccent}> {firstName}</span>
              </h1>
              <p style={styles.lead}>
                This is your market home base — live prices, market context, and a fresh hourly insight to help you stay sharp without showing personal account details.
              </p>

              <div style={styles.metricRow}>
                <div style={styles.metricCard}>
                  <Globe2 style={styles.iconLarge} />
                  <p style={styles.metricLabel}>Market mode</p>
                  <p style={styles.metricValue}>Live</p>
                </div>
                <div style={styles.metricCard}>
                  <Sparkles style={styles.iconLarge} />
                  <p style={styles.metricLabel}>Hourly advice</p>
                  <p style={styles.metricValue}>Fresh</p>
                </div>
                <div style={styles.metricCard}>
                  <ChartNoAxesColumnIncreasing style={styles.iconLarge} />
                  <p style={styles.metricLabel}>Coins tracking</p>
                  <p style={styles.metricValue}>{marketCoins.length}</p>
                </div>
                <div style={styles.metricCard}>
                  <Wallet style={styles.iconLarge} />
                  <p style={styles.metricLabel}>Focus</p>
                  <p style={styles.metricValue}>Strategy</p>
                </div>
              </div>

              <div style={styles.badgeRow}>
                <span style={styles.pill}>Fast access to markets</span>
                <span style={styles.pill}>Built for mobile and desktop</span>
                <span style={styles.pill}>No account details shown here</span>
              </div>
            </section>

            <section style={styles.panel}>
              <div style={styles.liveHeader}>
                <div>
                  <p style={styles.panelTitle}>Live market watch</p>
                  <p style={styles.panelSub}>A quick snapshot of major coins with 24h movement and a clean market pulse.</p>
                </div>
                <span style={styles.pulse}>
                  <Activity style={styles.icon} />
                  Live feed
                </span>
              </div>

              <div style={styles.coinGrid}>
                {marketCoins.map((coin) => (
                  <article key={coin.symbol} style={styles.coinCard}>
                    <div style={{ ...styles.coinBadge, background: `linear-gradient(135deg, ${coin.color}, rgba(255,255,255,0.15))` }}>
                      {coin.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <p style={styles.coinName}>{coin.name}</p>
                      <p style={styles.coinSymbol}>{coin.symbol}</p>
                    </div>
                    <div>
                      <p style={styles.coinPrice}>{formatCurrency(coin.price)}</p>
                      <p style={{ ...styles.coinChange, color: coin.change24h >= 0 ? '#4ade80' : '#fb7185' }}>
                        {formatChange(coin.change24h)} 24h
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div style={styles.sectionGrid}>
            <section style={styles.panel}>
              <p style={styles.panelTitle}>Market pulse</p>
              <p style={styles.panelSub}>A simple read on breadth and momentum across the coins in view.</p>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <TrendingUp style={styles.icon} />
                  <p style={styles.featureText}>
                    {marketSummary.winners} of {marketCoins.length} coins are positive over the last 24 hours.
                  </p>
                </div>
                <div style={styles.featureItem}>
                  <CandlestickChart style={styles.icon} />
                  <p style={styles.featureText}>
                    Average move across this watchlist is {marketSummary.avgMove >= 0 ? '+' : ''}{marketSummary.avgMove.toFixed(2)}% — steady enough for trend-traders, but still active.
                  </p>
                </div>
                <div style={styles.featureItem}>
                  <Coins style={styles.icon} />
                  <p style={styles.featureText}>
                    Biggest mover right now: {marketSummary.topMover.name} ({marketSummary.topMover.symbol}) at {formatChange(marketSummary.topMover.change24h)}.
                  </p>
                </div>
                <div style={styles.featureItem}>
                  <Bitcoin style={styles.icon} />
                  <p style={styles.featureText}>
                    Use this dashboard as your launchpad for market checks, then move into trade screens when you’re ready.
                  </p>
                </div>
              </div>
            </section>

            <section style={styles.panel}>
              <p style={styles.panelTitle}>Hourly financial advice</p>
              <p style={styles.panelSub}>A rotating insight updates every hour to keep the guidance fresh and relevant.</p>

              <div style={styles.adviceWrap}>
                <article style={styles.adviceCard}>
                  <div style={styles.adviceTop}>
                    <div style={{ ...styles.adviceIconWrap, background: `${advice.accent}22`, color: advice.accent }}>
                      {advice.icon}
                    </div>
                    <div>
                      <p style={styles.adviceTitle}>{advice.title}</p>
                      <p style={{ ...styles.panelSub, marginTop: '4px' }}>{new Date().toLocaleString([], { hour: 'numeric', minute: '2-digit' })} update</p>
                    </div>
                  </div>
                  <p style={styles.adviceText}>{advice.text}</p>
                </article>

                <div style={styles.featureItem}>
                  <Sparkles style={styles.icon} />
                  <p style={styles.featureText}>
                    Advice rotates on the hour, so every visit can surface a different mindset reminder or market principle.
                  </p>
                </div>
              </div>
            </section>

            <section style={styles.panel}>
              <p style={styles.panelTitle}>What’s next</p>
              <p style={styles.panelSub}>Useful shortcuts for the next step in the app, without exposing user-specific data.</p>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <ShieldCheck style={styles.icon} />
                  <p style={styles.featureText}>Complete identity and security setup once you wire the full auth flow.</p>
                </div>
                <div style={styles.featureItem}>
                  <Globe2 style={styles.icon} />
                  <p style={styles.featureText}>Add Google sign-in as an alternate entry path for faster onboarding.</p>
                </div>
                <div style={styles.featureItem}>
                  <Wallet style={styles.icon} />
                  <p style={styles.featureText}>Keep this page as a neutral home screen that can lead into trading, deposits, and portfolio features later.</p>
                </div>
              </div>

              <p style={styles.footerNote}>
                This dashboard is intentionally clean: it gives users a market overview, a personal-feeling greeting, and a rotating insight — without showing balances, profile data, or account history.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
