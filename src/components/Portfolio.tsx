import React from 'react';
import { ArrowLeft, Bot, CircleDollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

type Investment = {
  principal: number;
  currentCapital: number;
  totalProfit: number;
  totalLoss: number;
  totalWithdrawn: number;
  active: boolean;
  lifecycleStatus?: 'inactive' | 'activating' | 'active' | 'deactivating';
  lifecycleAvailableAt?: string;
  activatedAt?: string;
  deactivatedAt?: string;
};

type Bot = {
  botId: string;
  name: string;
  symbol?: string;
  symbolType?: string;
  efficiency?: number;
  tradeDirection?: string;
  source: 'owned' | 'rented';
  rentalExpiresAt?: string | null;
  investment?: Investment | null;
};

const money = (value: number) => `${Number(value || 0).toFixed(2)} USDT`;

const Portfolio = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [bots, setBots] = React.useState<Bot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/bot-investments/mine');
      setBots(Array.isArray(response.data?.bots) ? response.data.bots : []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load your bot portfolio.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const summary = React.useMemo(() => {
    const investedBots = bots.filter((bot) => bot.investment);
    const activeBots = investedBots.filter((bot) => bot.investment?.lifecycleStatus === 'active' || (bot.investment?.active && !bot.investment?.lifecycleStatus));
    const activatingBots = investedBots.filter((bot) => bot.investment?.lifecycleStatus === 'activating');
    const deactivatingBots = investedBots.filter((bot) => bot.investment?.lifecycleStatus === 'deactivating');
    const totalInvested = investedBots.reduce((sum, bot) => sum + Number(bot.investment?.principal || 0), 0);
    const currentCapital = investedBots.reduce((sum, bot) => sum + Number(bot.investment?.currentCapital || 0), 0);
    const grossProfit = investedBots.reduce((sum, bot) => sum + Number(bot.investment?.totalProfit || 0), 0);
    const grossLoss = investedBots.reduce((sum, bot) => sum + Number(bot.investment?.totalLoss || 0), 0);
    const totalWithdrawn = investedBots.reduce((sum, bot) => sum + Number(bot.investment?.totalWithdrawn || 0), 0);
    const netResult = grossProfit - grossLoss;

    return {
      totalBots: bots.length,
      investedBots: investedBots.length,
      activeBots: activeBots.length,
      activatingBots: activatingBots.length,
      deactivatingBots: deactivatingBots.length,
      totalInvested,
      currentCapital,
      grossProfit,
      grossLoss,
      totalWithdrawn,
      netResult,
      ownedBots: bots.filter((bot) => bot.source === 'owned').length,
      rentedBots: bots.filter((bot) => bot.source === 'rented').length,
    };
  }, [bots]);

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      overflowX: 'hidden',
      background: theme.background,
      color: theme.text,
      paddingBottom: '90px',
    },
    shell: {
      width: '100%',
      maxWidth: '920px',
      margin: '0 auto',
      padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
      boxSizing: 'border-box',
    },
    back: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      border: `1px solid ${theme.borderGlass}`,
      borderRadius: '10px',
      padding: '7px 10px',
      background: theme.surfaceGlass,
      color: theme.text,
      cursor: 'pointer',
      fontSize: '0.84rem',
    },
    card: {
      marginTop: '14px',
      padding: '10px',
      borderRadius: '16px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
    },
    row: {
      display: 'grid',
      gap: '8px',
      padding: '13px 14px',
      borderRadius: '15px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceMuted,
      minWidth: 0,
    },
    label: {
      margin: 0,
      color: theme.textMuted,
      fontSize: '0.72rem',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    },
    value: {
      margin: 0,
      fontSize: '0.96rem',
      fontWeight: 850,
      lineHeight: 1.35,
    },
    note: {
      margin: 0,
      color: theme.textMuted,
      fontSize: '0.78rem',
      lineHeight: 1.4,
    },
  };

  return (
    <HybridTheme mode={themeMode}>
      <Helmet><title>Portfolio | CryBots</title></Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/trade')}>
            <ArrowLeft size={17} /> Trade
          </button>

          <section style={styles.card}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850 }}>Portfolio</h2>
            <p style={{ margin: '6px 0 14px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 }}>
              Summary of your trading bot activity, capital and performance.
            </p>

            {error && <NotificationBanner tone="error" title="Portfolio unavailable" message={error} />}

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <div style={styles.row}>
                  <p style={styles.label}><Bot size={14} /> Total bots</p>
                  <p style={styles.value}>{loading ? <LoadingDots /> : summary.totalBots}</p>
                  <p style={styles.note}>{loading ? <LoadingDots /> : `${summary.ownedBots} owned · ${summary.rentedBots} rented`}</p>
                </div>
                <div style={styles.row}>
                  <p style={styles.label}>Active bots</p>
                  <p style={styles.value}>{loading ? <LoadingDots /> : summary.activeBots}</p>
                  <p style={styles.note}>{loading ? <LoadingDots /> : `${summary.activatingBots} activating · ${summary.deactivatingBots} deactivating`}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <div style={styles.row}>
                  <p style={styles.label}><Wallet size={14} /> Current bot capital</p>
                  <p style={styles.value}>{loading ? <LoadingDots /> : money(summary.currentCapital)}</p>
                </div>
                <div style={styles.row}>
                  <p style={styles.label}><CircleDollarSign size={14} /> Total invested</p>
                  <p style={styles.value}>{loading ? <LoadingDots /> : money(summary.totalInvested)}</p>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.label}>Performance</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <div>
                    <p style={styles.note}>Profit</p>
                    <p style={{ ...styles.value, marginTop: 4, color: theme.success }}>{loading ? <LoadingDots /> : `+${money(summary.grossProfit)}`}</p>
                  </div>
                  <div>
                    <p style={styles.note}>Loss</p>
                    <p style={{ ...styles.value, marginTop: 4, color: summary.grossLoss > 0 ? theme.danger : theme.text }}>{loading ? <LoadingDots /> : `-${money(summary.grossLoss)}`}</p>
                  </div>
                  <div>
                    <p style={styles.note}>Net result</p>
                    <p style={{ ...styles.value, marginTop: 4, color: summary.netResult >= 0 ? theme.success : theme.danger }}>
                      {loading ? <LoadingDots /> : `${summary.netResult >= 0 ? '+' : '-'}${money(Math.abs(summary.netResult))}`}
                    </p>
                  </div>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.label}><TrendingDown size={14} /> Withdrawn from bots</p>
                <p style={styles.value}>{loading ? <LoadingDots /> : money(summary.totalWithdrawn)}</p>
                <p style={styles.note}>Funds already returned to your USDT balance while bots remained active.</p>
              </div>

              <div style={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={16} color={theme.primary} />
                  <p style={{ ...styles.value, fontSize: '0.9rem' }}>Bot activity</p>
                </div>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 14 }}><LoadingDots /></div>
                ) : summary.investedBots === 0 ? (
                  <p style={styles.note}>No bot investments yet. Activate a created, purchased or rented bot to start tracking activity here.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {bots.filter((bot) => bot.investment).map((bot) => {
                      const investment = bot.investment!;
                      const net = Number(investment.totalProfit || 0) - Number(investment.totalLoss || 0);
                      const status = investment.lifecycleStatus || (investment.active ? 'active' : 'inactive');
                      return (
                        <div key={bot.botId} style={{ ...styles.row, padding: '11px 12px', background: theme.surfaceGlass }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ ...styles.value, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bot.name}</p>
                              <p style={{ ...styles.note, marginTop: 2 }}>ID {bot.botId} · {bot.source === 'rented' ? 'Rented' : 'Owned'}</p>
                            </div>
                            <span style={{ borderRadius: 999, padding: '5px 8px', fontSize: '0.66rem', fontWeight: 850, background: status === 'active' ? theme.success : theme.surfaceGlass, color: status === 'active' ? theme.textInverse : theme.textMuted, flexShrink: 0 }}>
                              {status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                            <div><p style={styles.note}>Capital</p><p style={{ ...styles.value, marginTop: 3, fontSize: '0.8rem' }}>{money(investment.currentCapital)}</p></div>
                            <div><p style={styles.note}>Invested</p><p style={{ ...styles.value, marginTop: 3, fontSize: '0.8rem' }}>{money(investment.principal)}</p></div>
                            <div><p style={styles.note}>Net</p><p style={{ ...styles.value, marginTop: 3, fontSize: '0.8rem', color: net >= 0 ? theme.success : theme.danger }}>{net >= 0 ? '+' : '-'}{money(Math.abs(net))}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
                </div>
              </>
            )}
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default Portfolio;
