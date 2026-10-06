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
        {selectedBot ? <section style={{ marginTop: 14, padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <button type="button" onClick={() => { setSelectedBot(null); setAmount(''); setError(''); }} style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={17} /> My Bots</button>
            <div style={{ ...card, display: 'grid', gap: 12 }}>
              <div style={{ ...card, background: theme.surfaceMuted }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 8 }}><Bot size={16} /> Bot activation</p>
                  <p style={{ margin: 0, color: theme.text, fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.5 }}>{selectedBot.name}</p>
                  <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 }}>{selectedBot.symbol || 'No symbol'} · {selectedBot.source === 'rented' ? 'Rented' : 'Owned'}</p>
                </div>
              </div>
              {error && <NotificationBanner tone="error" title="Bot action unavailable" message={error} />}
              <div style={{ ...card, display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                  <div><p style={{ margin: 0, color: theme.textMuted, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Efficiency</p><p style={{ margin: '6px 0 0', color: theme.text, fontSize: '0.94rem', fontWeight: 800 }}>{selectedBot.efficiency ?? 0}%</p></div>
                  <div><p style={{ margin: 0, color: theme.textMuted, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Direction</p><p style={{ margin: '6px 0 0', color: theme.text, fontSize: '0.94rem', fontWeight: 800, textTransform: 'capitalize' }}>{selectedBot.tradeDirection || 'long'}</p></div>
                </div>
                <label style={{ display: 'grid', gap: 10, marginTop: 8, fontSize: '0.82rem', color: theme.textMuted, fontWeight: 700 }}>Investment amount (USDT)
                  <input autoFocus type="number" min={selectedBot.minTradeAmount || 0.01} max={selectedBot.maxTradeAmount || undefined} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem' }} />
                </label>
                <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 }}>Allowed range: {money(selectedBot.minTradeAmount || 0)} – {money(selectedBot.maxTradeAmount || 0)}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" disabled={busyBotId === selectedBot.botId} onClick={() => void activate()} style={{ border: 'none', borderRadius: 999, padding: '11px 16px', fontWeight: 700, cursor: 'pointer', minWidth: 108, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: theme.primary, color: theme.textInverse, fontSize: '0.88rem' }}>
                    {busyBotId === selectedBot.botId ? <InlineLoadingDots /> : <><TrendingUp size={16} /> Confirm investment</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section> : <>

      </div>
      <NowBar />
    </main>
  </HybridTheme>;
};

export default BotInvestmentsPage;
