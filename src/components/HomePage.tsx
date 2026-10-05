import React, { useEffect, useMemo, useState } from 'react';
import LoadingDots from './LoadingDots';
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
import NowBar from './NowBar';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type MarketCoin = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  id: string;
};

type AdviceCard = {
  title: string;
  text: string;
  accent: 'primary' | 'success' | 'warning' | 'danger' | 'highlight';
  icon: React.ReactNode;
};

const marketCoins: MarketCoin[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, id: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, id: 'ethereum' },
  { symbol: 'BNB', name: 'BNB', price: 0, change24h: 0, id: 'binancecoin' },
  { symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, id: 'solana' },
  { symbol: 'XRP', name: 'XRP', price: 0, change24h: 0, id: 'ripple' },
  { symbol: 'ADA', name: 'Cardano', price: 0, change24h: 0, id: 'cardano' },
];

const marketCoinIds = marketCoins.map((coin) => coin.id).join(',');

const dashboardMetrics = [
  { label: 'Market sentiment', value: 'Bullish momentum', icon: <ChartNoAxesColumnIncreasing size={18} /> },
  { label: 'Live watchlist', value: '6 tracked assets', icon: <Coins size={18} /> },
  { label: 'Signal cadence', value: 'Updated every minute', icon: <Activity size={18} /> },
  { label: 'Risk posture', value: 'Balanced and alert', icon: <ShieldCheck size={18} /> },
];

const advicePool: AdviceCard[] = [
  { title: 'Keep dry powder ready', text: 'Keep some capital liquid so you can act when a clean setup appears instead of chasing noise.', accent: 'success', icon: <ShieldCheck /> },
  { title: 'Scale into positions', text: 'Split entries into smaller tranches to reduce emotional pressure and avoid chasing one perfect price.', accent: 'primary', icon: <TrendingUp /> },
  { title: 'Watch volatility windows', text: 'Big moves often cluster around major session opens, macro data, or exchange-specific catalysts.', accent: 'highlight', icon: <CandlestickChart /> },
  { title: 'Protect winners', text: 'When a trade works in your favor, reduce some risk so gains can compound more steadily.', accent: 'warning', icon: <Coins /> },
  { title: 'Prefer high-conviction setups', text: 'Take fewer ideas, but make sure each one has a strong thesis, a clear invalidation point, and real upside.', accent: 'primary', icon: <Activity /> },
  { title: 'Respect the trend', text: 'Momentum often pays more than prediction. When the trend is strong, patience can be more profitable than fighting it.', accent: 'danger', icon: <ArrowUpRight /> },
  { title: 'Manage risk first', text: 'A good trade idea still needs a hard stop and a clear sizing plan before capital goes in.', accent: 'warning', icon: <ShieldCheck /> },
  { title: 'Let winners breathe', text: 'If your plan allows it, avoid cutting strong trades too early just because the next candle looks noisy.', accent: 'success', icon: <TrendingUp /> },
  { title: 'Track catalysts', text: 'Earnings, unlocks, and macro headlines can matter more than short-term chart patterns.', accent: 'highlight', icon: <CandlestickChart /> },
  { title: 'Avoid revenge trading', text: 'If you take a loss, step back and reset before forcing the next position.', accent: 'danger', icon: <Coins /> },
  { title: 'Use confirmations', text: 'Wait for structure, volume, or momentum to confirm the thesis before committing size.', accent: 'primary', icon: <Activity /> },
  { title: 'Keep a watchlist', text: 'A focused watchlist helps you spot the best setups without staring at everything at once.', accent: 'danger', icon: <ArrowUpRight /> },
  { title: 'Be patient with entries', text: 'The market gives multiple chances. Sometimes the best move is waiting for your zone.', accent: 'success', icon: <ShieldCheck /> },
  { title: 'Take profits in layers', text: 'Partial exits can balance upside participation with real gains in the account.', accent: 'primary', icon: <TrendingUp /> },
  { title: 'Favor quality over quantity', text: 'One well-planned trade can beat several random ones that were taken out of boredom.', accent: 'highlight', icon: <Coins /> },
  { title: 'Use structure breaks', text: 'When price breaks important levels, let the market prove the move before you size up.', accent: 'warning', icon: <CandlestickChart /> },
  { title: 'Stay consistent', text: 'The edge comes from repeating the same risk rules, not from trying to catch every move.', accent: 'success', icon: <Activity /> },
  { title: 'Avoid crowded entries', text: 'If everyone is talking about the same move, wait for a better risk-reward window.', accent: 'primary', icon: <ArrowUpRight /> },
  { title: 'Protect mental capital', text: 'If the day gets choppy, stepping away can preserve both focus and discipline.', accent: 'highlight', icon: <ShieldCheck /> },
  { title: 'Think in scenarios', text: 'Before entering, know what you’ll do if price breaks up, fails, or goes sideways.', accent: 'danger', icon: <Coins /> },
];

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
    overflow: 'hidden',
    paddingBottom: '118px',
  },
  shell: {
    position: 'relative' as const,
    maxWidth: '1160px',
    margin: '0 auto',
    padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px',
  },
  glow: {
    position: 'absolute' as const,
    inset: 0,
    background: theme.surfaceShine,
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    insetInline: 0,
    top: 0,
    height: '1px',
    background: theme.primarySoft,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'wrap' as const,
    position: 'relative' as const,
    zIndex: 1,
    marginBottom: '12px',
  },
  brandBlock: {
    minWidth: 0,
    flex: '1 1 260px',
  },
  brandKicker: {
    margin: 0,
    fontSize: '0.74rem',
    fontWeight: 800,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: theme.primary,
  },
  brandSub: {
    margin: '3px 0 0',
    fontSize: '0.82rem',
    color: theme.textMuted,
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '999px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    color: theme.text,
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  cardList: {
    display: 'grid',
    gap: '14px',
    width: '100%',
    minWidth: 0,
  },
  card: {
    padding: '10px',
    borderRadius: '16px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    minWidth: 0,
    boxSizing: 'border-box' as const,
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
    borderRadius: '15px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    padding: 'clamp(12px, 2.5vw, 16px)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  greeting: {
    margin: 0,
    color: theme.primary,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.24em',
    fontWeight: 800,
  },
  title: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.65rem, 2.9vw, 2.6rem)',
    lineHeight: 1.06,
    letterSpacing: '-0.04em',
  },
  titleAccent: {
    display: 'block',
    color: theme.primary,
  },
  lead: {
    margin: '8px 0 0',
    maxWidth: '62ch',
    color: theme.textMuted,
    fontSize: '0.82rem',
    lineHeight: 1.4,
  },
  metricRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  metricCard: {
    borderRadius: '13px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceElevated,
    padding: '11px',
  },
  metricLabel: {
    margin: '6px 0 0',
    color: theme.textMuted,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.16em',
    fontWeight: 700,
  },
  metricValue: {
    margin: '8px 0 0',
    fontSize: 'clamp(1.08rem, 1.8vw, 1.45rem)',
    fontWeight: 800,
  },
  panel: {
    borderRadius: '15px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    padding: 'clamp(12px, 2.5vw, 16px)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
  },
  panelTitle: {
    margin: 0,
    fontSize: '0.96rem',
    letterSpacing: '-0.02em',
  },
  panelSub: {
    margin: '8px 0 0',
    color: theme.textMuted,
    lineHeight: 1.4,
    fontSize: '0.78rem',
  },
  liveHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '10px',
  },
  pulse: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    borderRadius: '999px',
    border: `1px solid ${theme.borderStrong}`,
    background: theme.primarySoft,
    color: theme.primary,
    fontSize: '0.74rem',
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
    gap: '10px',
    padding: '9px 10px',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceElevated,
  },
  coinBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '11px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: theme.textInverse,
  },
  coinName: {
    margin: 0,
    fontWeight: 800,
    fontSize: '0.88rem',
  },
  coinSymbol: {
    margin: '4px 0 0',
    color: theme.textMuted,
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
    border: `1px solid ${theme.border}`,
    background: theme.surfaceElevated,
    padding: '16px',
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
    fontSize: '0.92rem',
    fontWeight: 800,
  },
  adviceText: {
    margin: 0,
    color: theme.textMuted,
    lineHeight: 1.7,
    fontSize: '14px',
  },
  sectionGrid: {
    marginTop: '16px',
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
    padding: '10px 11px',
    borderRadius: '12px',
    background: theme.surfaceMuted,
    border: `1px solid ${theme.border}`,
  },
  featureText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.65,
    color: theme.textMuted,
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
    border: `1px solid ${theme.border}`,
    background: theme.surfaceMuted,
    color: theme.text,
    fontSize: '13px',
    fontWeight: 600,
  },
  footerNote: {
    margin: '18px 0 0',
    color: theme.textMuted,
    fontSize: '13px',
    lineHeight: 1.6,
  },
  icon: {
    width: '20px',
    height: '20px',
    color: theme.primary,
    flexShrink: 0,
  },
  iconLarge: {
    width: '24px',
    height: '24px',
    color: theme.primary,
    flexShrink: 0,
  },
});

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

const getFirstName = (fullName?: string) => {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0];

  const storedName = window.localStorage.getItem('kingshall_first_name') || window.localStorage.getItem('firstName');
  if (storedName?.trim()) return storedName.trim().split(/\s+/)[0];

  const profile = window.localStorage.getItem('kingshall_user') || window.localStorage.getItem('user');
  if (profile) {
    try {
      const parsed = JSON.parse(profile) as {
        firstName?: string;
        fullName?: string;
        name?: string;
      };
      const candidate = parsed.firstName || parsed.fullName || parsed.name;
      if (candidate?.trim()) return candidate.trim().split(/\s+/)[0];
    } catch {
      // ignore malformed profile payloads
    }
  }

  return '';
};

const getSeededAdviceOrder = (hourKey: number) => {
  const order = advicePool.map((_, index) => index);
  let seed = hourKey;

  for (let index = order.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
};

const getAdviceIndex = () => {
  const hourKey = Math.floor(Date.now() / (1000 * 60 * 60));
  return getSeededAdviceOrder(hourKey)[hourKey % advicePool.length];
};

const HomePage = () => {
  const [hourlyAdviceIndex, setHourlyAdviceIndex] = useState(getAdviceIndex());
  const [authName, setAuthName] = useState('');
  const [isAuthNameLoaded, setIsAuthNameLoaded] = useState(false);
  const [liveCoins, setLiveCoins] = useState(marketCoins);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false);
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  useEffect(() => {
    const adviceTimer = window.setInterval(() => setHourlyAdviceIndex(getAdviceIndex()), 60_000);

    return () => {
      window.clearInterval(adviceTimer);
    };
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getFirstName(authName), [authName]);

  useEffect(() => {
    try {
      const profile = window.localStorage.getItem('kingshall_user') || window.localStorage.getItem('user');
      if (profile) {
        const parsed = JSON.parse(profile) as { firstName?: string; lastName?: string; fullName?: string; name?: string };
        setAuthName(parsed.firstName || parsed.fullName || parsed.name || '');
      } else {
        setAuthName('');
      }
    } catch {
      setAuthName('');
    } finally {
      setIsAuthNameLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLiveCoins = async () => {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${marketCoinIds}&vs_currencies=usd&include_24hr_change=true`);
        if (!response.ok) throw new Error('Failed to load live prices');

        const data = await response.json() as Record<string, { usd?: number; usd_24h_change?: number }>;
        const updatedCoins = marketCoins.map((coin) => {
          const live = data[coin.id];
          return {
            ...coin,
            price: live?.usd ?? coin.price,
            change24h: live?.usd_24h_change ?? coin.change24h,
          };
        });

        if (!cancelled) {
          setLiveCoins(updatedCoins);
          setIsCoinsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setLiveCoins(marketCoins);
          setIsCoinsLoaded(true);
        }
      }
    };

    loadLiveCoins();
    const interval = window.setInterval(loadLiveCoins, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);
  const advice = advicePool[hourlyAdviceIndex];
  const marketSummary = useMemo(() => {
    const winners = liveCoins.filter((coin) => coin.change24h >= 0).length;
    const avgMove = liveCoins.reduce((sum, coin) => sum + coin.change24h, 0) / liveCoins.length;
    const topMover = [...liveCoins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0];

    return {
      winners,
      avgMove,
      topMover,
    };
  }, [liveCoins]);

  return (
    <HybridTheme mode={themeMode}>
      <Helmet>
        <title>KingsHall Exchange | Home</title>
      </Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.glow} />
          <div style={styles.topLine} />

          <div style={styles.cardList}>
            <div style={styles.card}>
            <section style={styles.heroCard}>
              <p style={styles.greeting}>{greeting}</p>
              <h2 style={styles.title}>
                Welcome back,
                <span style={styles.titleAccent}> {isAuthNameLoaded ? (firstName || 'Trader') : <LoadingDots />}</span>
              </h2>
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
                  <p style={styles.metricValue}>{isCoinsLoaded ? liveCoins.length : <LoadingDots />}</p>
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
            </div>

            <div style={styles.card}>
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
                {isCoinsLoaded ? liveCoins.map((coin) => (
                  <article key={coin.symbol} style={styles.coinCard}>
                    <div style={{ ...styles.coinBadge, background: theme.primarySoft }}>
                      {coin.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <p style={styles.coinName}>{coin.name}</p>
                      <p style={styles.coinSymbol}>{coin.symbol}</p>
                    </div>
                    <div>
                      <p style={styles.coinPrice}>{formatCurrency(coin.price)}</p>
                      <p style={{ ...styles.coinChange, color: coin.change24h >= 0 ? theme.success : theme.danger }}>
                        {formatChange(coin.change24h)} 24h
                      </p>
                    </div>
                  </article>
                )) : (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
                    <LoadingDots />
                  </div>
                )}
              </div>
            </section>
            </div>

            <div style={styles.card}>
            <section style={styles.panel}>
            <section style={styles.panel}>
              <p style={styles.panelTitle}>Market pulse</p>
              <p style={styles.panelSub}>A simple read on breadth and momentum across the coins in view.</p>

              <div style={styles.featureList}>
                {!isCoinsLoaded ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
                    <LoadingDots />
                  </div>
                ) : (
                <>
                <div style={styles.featureItem}>
                  <TrendingUp style={styles.icon} />
                  <p style={styles.featureText}>
                    {marketSummary.winners} of {liveCoins.length} coins are positive over the last 24 hours.
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
                </>
                )}
              </div>
            </section>

            <div style={styles.card}>
            <section style={styles.panel}>
              <p style={styles.panelTitle}>Financial advice</p>
              <p style={styles.panelSub}>A rotating insight keeps the guidance fresh and relevant.</p>

              <div style={styles.adviceWrap}>
                <article style={styles.adviceCard}>
                  <div style={styles.adviceTop}>
                    <div style={{ ...styles.adviceIconWrap, background: theme.primarySoft, color: theme[advice.accent] }}>
                      {advice.icon}
                    </div>
                    <div>
                      <p style={styles.adviceTitle}>{advice.title}</p>
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
            </div>
          </div>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default HomePage;
