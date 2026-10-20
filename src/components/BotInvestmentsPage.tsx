import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, BatteryCharging, Bot, PauseCircle, PlayCircle, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';

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
  creationCost?: number;
  rechargeStatus?: 'recharging' | 'completed';
  rechargeInitialEfficiency?: number;
  rechargeTargetEfficiency?: number;
  rechargeStartedAt?: string;
  rechargeCompletedAt?: string;
  rechargePaidAmount?: number;
  tradeDirection?: string;
  minTradeAmount?: number;
  maxTradeAmount?: number;
  retainerAmount?: number;
  source: 'owned' | 'rented';
  rentalExpiresAt?: string | null;
  investment?: Investment | null;
};

const money = (value: number) => `${Number(value || 0).toFixed(2)} USDT`;

const BotInvestmentsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [amount, setAmount] = useState('');
  const [busyBotId, setBusyBotId] = useState('');
  const [confirmingBotId, setConfirmingBotId] = useState('');
  const [expandedBotId, setExpandedBotId] = useState('');
  const [withdrawBot, setWithdrawBot] = useState<Bot | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [rechargeBot, setRechargeBot] = useState<Bot | null>(null);
  const [rechargePoints, setRechargePoints] = useState(1);
  const [rechargeQuote, setRechargeQuote] = useState<any>(null);

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      overflowX: 'hidden' as const,
      background: theme.background,
      color: theme.text,
      paddingBottom: '90px',
    },
    shell: {
      width: '100%',
      maxWidth: '920px',
      margin: '0 auto',
      padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
      boxSizing: 'border-box' as const,
    },
    content: {
      display: 'grid',
      gap: '14px',
      marginTop: '14px',
    },
    back: {
      display: 'inline-flex',
      alignItems: 'center',
      alignSelf: 'start',
      justifySelf: 'start',
      width: 'fit-content',
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
      padding: '16px',
      borderRadius: '22px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      display: 'grid',
      gap: '14px',
      boxSizing: 'border-box' as const,
    },
    row: {
      display: 'grid',
      gap: '10px',
      width: '100%',
      padding: '10px 0',
      borderRadius: 0,
      border: 'none',
      background: 'transparent',
      boxSizing: 'border-box' as const,
      minWidth: 0,
    },
    label: {
      margin: 0,
      color: theme.textMuted,
      fontSize: '0.74rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    value: {
      margin: 0,
      color: theme.text,
      fontSize: '0.94rem',
      fontWeight: 800,
      lineHeight: 1.5,
      wordBreak: 'break-word' as const,
      overflowWrap: 'anywhere' as const,
    },
    note: {
      margin: 0,
      color: theme.textMuted,
      fontSize: '0.82rem',
      lineHeight: 1.4,
    },
    control: {
      display: 'grid',
      gap: '10px',
      marginTop: '8px',
      width: '100%',
      minWidth: 0,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      color: theme.text,
      padding: '10px 12px',
      outline: 'none',
      fontSize: '0.9rem',
      font: 'inherit',
    },
    button: {
      border: 'none',
      borderRadius: '999px',
      padding: '11px 16px',
      fontWeight: 700,
      cursor: 'pointer',
      width: '100%',
      minWidth: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      background: theme.primary,
      color: theme.textInverse,
      fontSize: '0.88rem',
      font: 'inherit',
    },
    mutedButton: {
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
      color: theme.text,
    },
  };

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/bot-investments/mine');
      setBots(response.data?.bots || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load your bots.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(false); }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activate = async () => {
    if (!selectedBot) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid investment amount.');
      return;
    }
    setBusyBotId(selectedBot.botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/bot-investments/${selectedBot.botId}/activate`, { amount: value });
      setMessage(response.data?.message || 'Bot activated successfully.');
      setSelectedBot(null);
      setAmount('');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to activate this bot.');
    } finally {
      setBusyBotId('');
    }
  };

  const deactivate = async (bot: Bot) => {
    setBusyBotId(bot.botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/bot-investments/${bot.botId}/deactivate`);
      setMessage(response.data?.message || 'Bot deactivated successfully.');
      setConfirmingBotId('');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to deactivate this bot.');
    } finally {
      setBusyBotId('');
    }
  };

  const withdraw = async () => {
    if (!withdrawBot) return;
    const value = Number(withdrawAmount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid withdrawal amount.');
      return;
    }
    setBusyBotId(withdrawBot.botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/bot-investments/${withdrawBot.botId}/withdraw`, { amount: value });
      setMessage(response.data?.message || 'Funds withdrawn successfully.');
      setWithdrawBot(null);
      setWithdrawAmount('');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to withdraw funds from this bot.');
    } finally {
      setBusyBotId('');
    }
  };


  const openRecharge = async (bot: Bot) => {
    setError('');
    setMessage('');
    setRechargeBot(bot);
    setRechargeQuote(null);
    setRechargePoints(1);
    setBusyBotId(bot.botId);
    try {
      const response = await api.get(`/api/bot-investments/${bot.botId}/recharge-quote`);
      const maxPoints = Math.max(0, Number(response.data?.availablePoints || 0));
      const initialPoints = Math.min(10, maxPoints) || 1;
      setRechargePoints(initialPoints);
      const quote = await api.get(`/api/bot-investments/${bot.botId}/recharge-quote`, { params: { points: initialPoints } });
      setRechargeQuote({ ...response.data, ...quote.data });
    } catch (requestError: any) {
      setRechargeBot(null);
      setError(requestError?.response?.data?.message || 'Unable to prepare bot recharge.');
    } finally {
      setBusyBotId('');
    }
  };

  const updateRechargePoints = async (points: number) => {
    if (!rechargeBot) return;
    setRechargePoints(points);
    try {
      const response = await api.get(`/api/bot-investments/${rechargeBot.botId}/recharge-quote`, { params: { points } });
      setRechargeQuote((current: any) => ({ ...current, ...response.data }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to update recharge cost.');
    }
  };

  const startRecharge = async () => {
    if (!rechargeBot) return;
    setBusyBotId(rechargeBot.botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/bot-investments/${rechargeBot.botId}/recharge`, { points: rechargePoints });
      setMessage(response.data?.message || 'Bot recharge started.');
      setRechargeBot(null);
      setRechargeQuote(null);
      await load(false);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to start bot recharge.');
    } finally {
      setBusyBotId('');
    }
  };

  const renderActivation = () => (
    <>
      <button
        type="button"
        onClick={() => { setSelectedBot(null); setAmount(''); setError(''); }}
        style={styles.back}
      >
        <ArrowLeft size={17} /> My Bots
      </button>

      <div style={styles.card}>
        <div style={styles.row}>
          <p style={styles.label}><Bot size={16} /> Bot activation</p>
          <p style={styles.value}>{selectedBot?.name}</p>
          <p style={styles.note}>
            {selectedBot?.symbol || 'No symbol'} · {selectedBot?.source === 'rented' ? 'Rented' : 'Owned'}
          </p>
        </div>

        {error && <NotificationBanner tone="error" title="Bot action unavailable" message={error} />}

        <div style={{ ...styles.row, marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <div>
              <p style={styles.label}>Efficiency</p>
              <p style={{ ...styles.value, marginTop: 6 }}>{selectedBot?.efficiency ?? 0}%</p>
            </div>
            <div>
              <p style={styles.label}>Direction</p>
              <p style={{ ...styles.value, marginTop: 6, textTransform: 'capitalize' }}>{selectedBot?.tradeDirection || 'long'}</p>
            </div>
          </div>

          <div style={styles.control}>
            <label style={{ ...styles.note, fontWeight: 700 }} htmlFor="bot-investment-amount">
              Investment amount (USDT)
            </label>
            <input
              id="bot-investment-amount"
              autoFocus
              type="number"
              min={selectedBot?.minTradeAmount || 0.01}
              max={selectedBot?.maxTradeAmount || undefined}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              style={styles.input}
            />
            <p style={styles.note}>
              Allowed range: {money(selectedBot?.minTradeAmount || 0)} – {money(selectedBot?.maxTradeAmount || 0)}
            </p>
            <div style={{ display: 'grid', width: '100%' }}>
              <button
                type="button"
                disabled={busyBotId === selectedBot?.botId}
                onClick={() => void activate()}
                style={styles.button}
              >
                {busyBotId === selectedBot?.botId ? <LoadingDots /> : <><TrendingUp size={16} /> Confirm investment</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <HybridTheme mode={themeMode}>
      <Helmet><title>My Bots | CryBots</title></Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" onClick={() => navigate('/market')} style={styles.back}>
            <ArrowLeft size={17} /> Market
          </button>

          <div style={styles.content}>
            {selectedBot ? (
              renderActivation()
            ) : (
              <div style={styles.card}>
                {error && <NotificationBanner tone="error" title="Bot action unavailable" message={error} />}
                {message && <NotificationBanner tone="success" title="Bot updated" message={message} />}

                {loading ? (
                  <div style={styles.row}>
                    <div style={{ textAlign: 'center' }}>
                      <LoadingDots />
                    </div>
                  </div>
                ) : bots.length ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {bots.map((bot) => {
                      const investment = bot.investment;
                      const active = investment?.active === true;
                      const lifecycleStatus = investment?.lifecycleStatus || (active ? 'active' : 'inactive');
                      const lifecyclePending = lifecycleStatus === 'activating' || lifecycleStatus === 'deactivating';
                      const profit = Number(investment?.totalProfit || 0) - Number(investment?.totalLoss || 0);

                      return (
                        <article key={bot.botId} style={styles.row}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <Bot size={20} color={theme.primary} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ ...styles.value, fontSize: '0.95rem' }}>{bot.name}</p>
                              <p style={{ ...styles.note, marginTop: 3 }}>ID {bot.botId}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedBotId((current) => current === bot.botId ? '' : bot.botId)}
                              style={{ flexShrink: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '7px 12px', background: theme.surfaceGlass, color: theme.primary, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              {expandedBotId === bot.botId ? 'Hide' : 'View'}
                            </button>
                          </div>

                          {expandedBotId === bot.botId && (
                          <div style={{ display: 'grid', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <p style={{ ...styles.note, margin: 0 }}>{bot.symbol || 'No symbol'} · {bot.source === 'rented' ? 'Rented' : 'Owned'}</p>
                              <span style={{
                                borderRadius: 999,
                                padding: '5px 9px',
                                fontSize: '0.7rem',
                                fontWeight: 850,
                                background: lifecycleStatus === 'active' ? theme.success : bot.rechargeStatus === 'recharging' ? theme.primary : theme.surfaceGlass,
                                color: lifecycleStatus === 'active' || bot.rechargeStatus === 'recharging' ? theme.textInverse : theme.textMuted,
                                flexShrink: 0,
                              }}>
                                {bot.rechargeStatus === 'recharging' ? 'RECHARGING' : lifecycleStatus === 'active' ? 'ACTIVE' : lifecycleStatus === 'activating' ? 'ACTIVATING' : lifecycleStatus === 'deactivating' ? 'DEACTIVATING' : 'READY'}
                              </span>
                            </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                            <div><p style={styles.label}>Efficiency</p><p style={{ ...styles.value, marginTop: 6 }}>{bot.efficiency ?? 0}%</p></div>
                            <div><p style={styles.label}>Direction</p><p style={{ ...styles.value, marginTop: 6, textTransform: 'capitalize' }}>{bot.tradeDirection || 'long'}</p></div>
                            <div><p style={styles.label}>Investment</p><p style={{ ...styles.value, marginTop: 6 }}>{investment ? money(investment.principal) : 'Not activated'}</p></div>
                            <div><p style={styles.label}>Current capital</p><p style={{ ...styles.value, marginTop: 6 }}>{investment ? money(investment.currentCapital) : '—'}</p></div>
                            {investment ? (
                              <>
                                <div>
                                  <p style={styles.label}>Net result</p>
                                  <p style={{ ...styles.value, marginTop: 6, color: profit >= 0 ? theme.success : theme.danger }}>
                                    {profit >= 0 ? '+' : ''}{money(profit)}
                                  </p>
                                </div>
                                <div>
                                  <p style={styles.label}>Started</p>
                                  <p style={{ ...styles.value, marginTop: 6 }}>
                                    {investment.activatedAt ? new Date(investment.activatedAt).toLocaleDateString() : '—'}
                                  </p>
                                </div>
                              </>
                            ) : null}
                          </div>

                          {lifecyclePending && investment?.lifecycleAvailableAt ? (
                            <p style={styles.note}>
                              {lifecycleStatus === 'activating' ? 'Activation' : 'Return'} is processing until {new Date(investment.lifecycleAvailableAt).toLocaleString()}.
                            </p>
                          ) : null}

                          {bot.source === 'rented' && bot.rentalExpiresAt ? (
                            <p style={styles.note}>Rental ends {new Date(bot.rentalExpiresAt).toLocaleString()}</p>
                          ) : null}


                          {rechargeBot?.botId === bot.botId && (
                            <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: '1px solid ' + theme.borderGlass, background: theme.surfaceGlass }}>
                              <div style={{ display: 'grid', gap: 5 }}>
                                <p style={{ ...styles.value, fontSize: '0.9rem' }}><BatteryCharging size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Recharge {bot.name}</p>
                                <p style={styles.note}>Recharge restores 1 percentage point per hour. The bot must stay inactive, and it will not automatically reactivate.</p>
                              </div>
                              {rechargeQuote ? (
                                <>
                                  <label style={{ ...styles.note, fontWeight: 700 }} htmlFor="recharge-points">
                                    Efficiency to restore: {rechargePoints}% · Target: {Number(rechargeQuote.currentEfficiency || bot.efficiency || 0) + rechargePoints}%
                                  </label>
                                  <input id="recharge-points" type="range" min="1" max={Math.max(1, Number(rechargeQuote.availablePoints || 1))} step="1" value={Math.min(rechargePoints, Math.max(1, Number(rechargeQuote.availablePoints || 1)))} onChange={(event) => void updateRechargePoints(Number(event.target.value))} style={{ width: '100%', accentColor: theme.primary, cursor: 'grab' }} />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, fontSize: '0.72rem' }}><span>1%</span><span>{Number(rechargeQuote.availablePoints || 0)}% max</span></div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                    <div><p style={styles.label}>Recharge cost</p><p style={{ ...styles.value, marginTop: 5 }}>{money(Number(rechargeQuote.cost ?? (Number(rechargeQuote.costPerPoint || 0.01) * rechargePoints)))}</p></div>
                                    <div><p style={styles.label}>Time required</p><p style={{ ...styles.value, marginTop: 5 }}>{rechargePoints} hour{rechargePoints === 1 ? '' : 's'}</p></div>
                                  </div>
                                  <p style={styles.note}>Cost is based on the bot's original creation cost. Available efficiency: {Number(rechargeQuote.currentEfficiency ?? bot.efficiency ?? 0)}% to 100%.</p>
                                </>
                              ) : <LoadingDots />}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                <button type="button" disabled={busyBotId === bot.botId} onClick={() => { setRechargeBot(null); setRechargeQuote(null); }} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Cancel</button>
                                <button type="button" disabled={busyBotId === bot.botId || !rechargeQuote || Number(rechargeQuote.cost ?? 0) <= 0} onClick={() => void startRecharge()} style={{ ...styles.button, borderRadius: 10 }}>{busyBotId === bot.botId ? <LoadingDots /> : 'Pay & Recharge'}</button>
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'grid', width: '100%', marginTop: 2 }}>
                            {lifecycleStatus === 'activating' || lifecycleStatus === 'deactivating' ? (
                              <div style={{ ...styles.note, padding: '10px 12px', borderRadius: 10, border: '1px solid ' + theme.borderGlass, background: theme.surfaceGlass }}>
                                {lifecycleStatus === 'activating'
                                  ? 'Activation is being processed. The reserved funds are not active in the bot until processing completes.'
                                  : 'Deactivation is being processed. The bot has stopped earning and the return will be credited when processing completes.'}
                              </div>
                            ) : bot.rechargeStatus === 'recharging' ? (
                              <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, border: '1px solid ' + theme.borderGlass, background: theme.surfaceGlass }}>
                                <p style={{ ...styles.value, fontSize: '0.88rem' }}><BatteryCharging size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Recharging · {Math.min(Number(bot.rechargeTargetEfficiency || 100), Number(bot.rechargeInitialEfficiency || 0) + Math.max(0, Math.floor((Date.now() - new Date(bot.rechargeStartedAt || Date.now()).getTime()) / 3600000)))}%</p>
                                <p style={styles.note}>Target {bot.rechargeTargetEfficiency}% · 1% per hour · Paid {money(Number(bot.rechargePaidAmount || 0))}</p>
                                <p style={styles.note}>Estimated completion: {bot.rechargeStartedAt && bot.rechargeTargetEfficiency !== undefined ? new Date(new Date(bot.rechargeStartedAt).getTime() + Math.max(0, Number(bot.rechargeTargetEfficiency) - Number(bot.rechargeInitialEfficiency || 0)) * 3600000).toLocaleString() : 'Calculating…'}. Trading remains paused.</p>
                              </div>
                            ) : !active ? (
                              <div style={{ display: 'grid', gap: 8 }}>
                              {bot.rechargeStatus === 'completed' && <p style={styles.note}>Recharge complete. Your bot remains inactive; activate it when you are ready.</p>}
                              <button
                                type="button"
                                style={styles.button}
                                disabled={busyBotId === bot.botId}
                                onClick={() => {
                                  setSelectedBot(bot);
                                  setAmount(String(bot.minTradeAmount || ''));
                                  setError('');
                                  setMessage('');
                                }}
                              >
                                {busyBotId === bot.botId ? <LoadingDots /> : <><PlayCircle size={15} /> Activate Bot</>}
                              </button>
                              {bot.source === 'owned' && Number(bot.efficiency || 0) < 100 && (
                                <button type="button" style={{ ...styles.button, ...styles.mutedButton }} disabled={busyBotId === bot.botId} onClick={() => void openRecharge(bot)}>
                                  {busyBotId === bot.botId ? <LoadingDots /> : <><BatteryCharging size={15} /> Recharge Efficiency</>}
                                </button>
                              )}
                              </div>
                            ) : withdrawBot?.botId === bot.botId ? (
                              <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: '1px solid ' + theme.borderGlass, background: theme.surfaceGlass }}>
                                <div style={{ display: 'grid', gap: 5 }}>
                                  <p style={{ ...styles.value, fontSize: '0.88rem' }}>Withdraw from {bot.name}</p>
                                  <p style={styles.note}>
                                    The bot stays active. Required retainer: {money(bot.retainerAmount || 0)}.
                                  </p>
                                </div>
                                <input
                                  type="number"
                                  min="0.01"
                                  max={Math.max(0, Number(investment?.currentCapital || 0) - Number(bot.retainerAmount || 0))}
                                  step="0.01"
                                  value={withdrawAmount}
                                  onChange={(event) => setWithdrawAmount(event.target.value)}
                                  style={styles.input}
                                  placeholder="Amount in USDT"
                                  autoFocus
                                />
                                <p style={styles.note}>
                                  Maximum withdrawable: {money(Math.max(0, Number(investment?.currentCapital || 0) - Number(bot.retainerAmount || 0)))}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                  <button
                                    type="button"
                                    disabled={busyBotId === bot.botId}
                                    onClick={() => { setWithdrawBot(null); setWithdrawAmount(''); }}
                                    style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10, padding: '7px 10px', fontSize: '0.84rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyBotId === bot.botId}
                                    onClick={() => void withdraw()}
                                    style={{ ...styles.button, borderRadius: 10, padding: '7px 10px', fontSize: '0.84rem' }}
                                  >
                                    {busyBotId === bot.botId ? <LoadingDots /> : 'Withdraw'}
                                  </button>
                                </div>
                              </div>
                            ) : confirmingBotId === bot.botId ? (
                              <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: '1px solid ' + theme.danger, background: theme.surfaceGlass }}>
                                <div style={{ display: 'grid', gap: 5 }}>
                                  <p style={{ ...styles.value, fontSize: '0.88rem' }}>Deactivate {bot.name}?</p>
                                  <p style={styles.note}>Its current capital will be returned to your USDT balance.</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                  <button
                                    type="button"
                                    disabled={busyBotId === bot.botId}
                                    onClick={() => setConfirmingBotId('')}
                                    style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyBotId === bot.botId}
                                    onClick={() => void deactivate(bot)}
                                    style={{ ...styles.button, background: theme.danger, borderRadius: 10 }}
                                  >
                                    {busyBotId === bot.botId ? <LoadingDots /> : 'Deactivate'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                <button
                                  type="button"
                                  style={{ ...styles.button, ...styles.mutedButton }}
                                  disabled={busyBotId === bot.botId || Boolean(confirmingBotId)}
                                  onClick={() => { setWithdrawBot(bot); setWithdrawAmount(''); setError(''); setMessage(''); }}
                                >
                                  {busyBotId === bot.botId ? <LoadingDots /> : <><ArrowDownToLine size={15} /> Withdraw</>}
                                </button>
                              <button
                                type="button"
                                style={{ ...styles.button, ...styles.mutedButton }}
                                disabled={busyBotId === bot.botId || Boolean(confirmingBotId)}
                                onClick={() => setConfirmingBotId(bot.botId)}
                              >

                                {busyBotId === bot.botId ? <LoadingDots /> : <><PauseCircle size={15} /> Deactivate</>}
                                </button>
                              </div>
                            )}
                          </div>
                          </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.row}>
                    <p style={styles.note}>You do not have any created, purchased, or rented bots yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default BotInvestmentsPage;
