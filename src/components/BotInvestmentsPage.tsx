import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, PauseCircle, PlayCircle, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';

type Investment = {
  principal: number;
  currentCapital: number;
  totalProfit: number;
  totalLoss: number;
  active: boolean;
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
  minTradeAmount?: number;
  maxTradeAmount?: number;
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

  const card: React.CSSProperties = { padding: 13, borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const button: React.CSSProperties = { border: 0, borderRadius: 999, padding: '9px 13px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', font: 'inherit' };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/bot-investments/mine');
      setBots(response.data?.bots || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load your bots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

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
    if (!window.confirm(`Deactivate ${bot.name}? Its current capital will be returned to your USDT balance.`)) return;
    setBusyBotId(bot.botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/bot-investments/${bot.botId}/deactivate`);
      setMessage(response.data?.message || 'Bot deactivated successfully.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to deactivate this bot.');
    } finally {
      setBusyBotId('');
    }
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>My Bots | KingsHall</title></Helmet>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 90 }}>
      <div style={{ width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={17} /> Market</button>
        {selectedBot ? <section style={{ minHeight: 'calc(100vh - 170px)', marginTop: 22, padding: 'clamp(16px, 4vw, 30px)', borderRadius: 18, border: `1px solid ${theme.primary}`, background: theme.surfaceGlass, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button type="button" onClick={() => { setSelectedBot(null); setAmount(''); setError(''); }} style={{ ...button, background: theme.surfaceGlass, color: theme.text, border: `1px solid ${theme.borderGlass}`, padding: '8px 11px' }}><ArrowLeft size={16} /> Back to My Bots</button>
          </div>
          {error && <NotificationBanner tone="error" title="Bot action unavailable" message={error} />}
          <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 'clamp(18px, 7vh, 70px)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Bot size={34} color={theme.primary} />
              <h2 style={{ margin: '10px 0 4px', fontSize: '1.35rem', fontWeight: 900 }}>Activate {selectedBot.name}</h2>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.84rem', lineHeight: 1.5 }}>Set the USDT capital this bot should use before activating it.</p>
            </div>
            <div style={{ ...card, display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Source</small><strong style={{ textTransform: 'capitalize' }}>{selectedBot.source}</strong></div>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Symbol</small><strong>{selectedBot.symbol || '—'}</strong></div>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Efficiency</small><strong>{selectedBot.efficiency ?? 0}%</strong></div>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Direction</small><strong style={{ textTransform: 'capitalize' }}>{selectedBot.tradeDirection || 'long'}</strong></div>
              </div>
              <label style={{ display: 'grid', gap: 7, fontSize: '0.84rem', fontWeight: 800 }}>Investment amount (USDT)
                <input autoFocus type="number" min={selectedBot.minTradeAmount || 0.01} max={selectedBot.maxTradeAmount || undefined} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit', fontSize: '1rem' }} />
              </label>
              <small style={{ color: theme.textMuted }}>Allowed range: {money(selectedBot.minTradeAmount || 0)} – {money(selectedBot.maxTradeAmount || 0)}</small>
              <button type="button" disabled={busyBotId === selectedBot.botId} onClick={() => void activate()} style={{ ...button, width: '100%', padding: '12px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {busyBotId === selectedBot.botId ? <InlineLoadingDots /> : <><TrendingUp size={16} /> Confirm Investment</>}
              </button>
            </div>
          </div>
        </section> : <>
        <section style={{ marginTop: 22, padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
          <div style={{ padding: '3px 4px 12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850, display: 'flex', alignItems: 'center', gap: 8 }}><Bot size={20} color={theme.primary} /> My Bots</h2>
            <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: '0.8rem', lineHeight: 1.45 }}>Activate a bot with USDT, monitor its capital and earnings, or deactivate it to return its current capital to your balance.</p>
          </div>
          {error && <NotificationBanner tone="error" title="Bot action unavailable" message={error} />}
          {message && <NotificationBanner tone="success" title="Bot updated" message={message} />}
          {loading ? <div style={{ padding: 30, textAlign: 'center' }}><InlineLoadingDots /></div> : bots.length ? <div style={{ display: 'grid', gap: 10 }}>{bots.map((bot) => {
            const investment = bot.investment;
            const active = investment?.active === true;
            const profit = Number(investment?.totalProfit || 0) - Number(investment?.totalLoss || 0);
            return <article key={bot.botId} style={{ ...card, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bot size={20} color={theme.primary} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 850 }}>{bot.name}</h3>
                  <small style={{ color: theme.textMuted }}>{bot.symbol || 'No symbol'} · ID {bot.botId} · {bot.source === 'rented' ? 'Rented' : 'Owned'}</small>
                </div>
                <span style={{ borderRadius: 999, padding: '5px 9px', fontSize: '0.7rem', fontWeight: 850, background: active ? theme.success : theme.surfaceGlass, color: active ? theme.textInverse : theme.textMuted }}>{active ? 'ACTIVE' : 'READY'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Efficiency</small><strong>{bot.efficiency ?? 0}%</strong></div>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Direction</small><strong style={{ textTransform: 'capitalize' }}>{bot.tradeDirection || 'long'}</strong></div>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Investment</small><strong>{investment ? money(investment.principal) : 'Not activated'}</strong></div>
                <div><small style={{ display: 'block', color: theme.textMuted }}>Current capital</small><strong>{investment ? money(investment.currentCapital) : '—'}</strong></div>
                {investment ? <><div><small style={{ display: 'block', color: theme.textMuted }}>Net result</small><strong style={{ color: profit >= 0 ? theme.success : theme.danger }}>{profit >= 0 ? '+' : ''}{money(profit)}</strong></div><div><small style={{ display: 'block', color: theme.textMuted }}>Started</small><strong>{investment.activatedAt ? new Date(investment.activatedAt).toLocaleDateString() : '—'}</strong></div></> : null}
              </div>
              {bot.source === 'rented' && bot.rentalExpiresAt ? <small style={{ color: theme.textMuted }}>Rental ends {new Date(bot.rentalExpiresAt).toLocaleString()}</small> : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!active ? <button type="button" style={button} disabled={busyBotId === bot.botId} onClick={() => { setSelectedBot(bot); setAmount(String(bot.minTradeAmount || '')); setError(''); }}>{busyBotId === bot.botId ? <InlineLoadingDots /> : <><PlayCircle size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Activate Bot</>}</button> : <button type="button" style={{ ...button, background: theme.surfaceGlass, color: theme.text, border: `1px solid ${theme.borderGlass}` }} disabled={busyBotId === bot.botId} onClick={() => void deactivate(bot)}>{busyBotId === bot.botId ? <InlineLoadingDots /> : <><PauseCircle size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Deactivate</>}</button>}
              </div>
            </article>;
          })}</div> : <div style={{ ...card, color: theme.textMuted }}>You do not have any created, purchased, or rented bots yet.</div>}
        </section>
        </>}
      </div>
      <NowBar />
    </main>
  </HybridTheme>;
};

export default BotInvestmentsPage;
