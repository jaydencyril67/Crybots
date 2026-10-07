import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, ChevronDown, Info, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';

type SymbolOption = { value: string; label: string };
type TradingViewResult = { symbol: string; description: string; exchange: string; type: string };
type CreatedBot = { _id?: string; botId: string; name: string; symbolType?: string; symbol?: string; efficiency?: number; tradeDirection?: string; minTradeAmount?: number; maxTradeAmount?: number; retainerAmount?: number; creationCost?: number; createdAt?: string; updatedAt?: string; };

const symbolOptions: SymbolOption[] = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'funds', label: 'Funds' },
  { value: 'futures', label: 'Futures' },
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
];


type CustomSelectProps = { options: string[]; value: string; onChange: (value: string) => void; theme: typeof HYBRID_THEME_TOKENS.dark; formatOption?: (option: string) => string };

const CustomSelect = ({ options, value, onChange, theme, formatOption = (option) => option }: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = formatOption(value);
  return <div style={{ position: 'relative' }}>
    <button type="button" onClick={() => setOpen((current) => !current)} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, font: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer', textAlign: 'left' }}><span>{selected}</span><ChevronDown size={16} /></button>
    {open && <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: 6, padding: 8, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)', maxHeight: 240, overflowY: 'auto' }}>{options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} style={{ border: `1px solid ${option === value ? theme.primary : theme.borderGlass}`, borderRadius: 9, padding: '9px 10px', background: option === value ? theme.surfaceGlass : theme.surfaceMuted, color: theme.text, cursor: 'pointer', textAlign: 'left' }}>{formatOption(option)}</button>)}</div>}
  </div>;
};

const Creation = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [activeView, setActiveView] = useState<'create' | 'creation'>('create');
  const [createdBots, setCreatedBots] = useState<CreatedBot[]>([]);
  const [loadingCreatedBots, setLoadingCreatedBots] = useState(false);
  const [createdBotsError, setCreatedBotsError] = useState('');
  const [deletingBotId, setDeletingBotId] = useState('');
  const [expandedBotId, setExpandedBotId] = useState('');
  const [confirmingBotId, setConfirmingBotId] = useState('');
  const [name, setName] = useState('');
  const [botId, setBotId] = useState('');
  const [generatingBotId, setGeneratingBotId] = useState(false);
  const [botIdStatus, setBotIdStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [botIdMessage, setBotIdMessage] = useState('');
  const [symbol, setSymbol] = useState('crypto');
  const selectedSymbol = symbolOptions.find((option) => option.value === symbol) || symbolOptions[0];
  const [symbolSearch, setSymbolSearch] = useState('');
  const [selectedTradingSymbol, setSelectedTradingSymbol] = useState('');
  const [tradeDirection, setTradeDirection] = useState('Long');
  const [efficiency, setEfficiency] = useState(100);
  const [minTradeAmount, setMinTradeAmount] = useState('');
  const [maxTradeAmount, setMaxTradeAmount] = useState('');
  const [retainerAmount, setRetainerAmount] = useState('');
  useEffect(() => {
    const maximum = Number(maxTradeAmount);
    const current = Number(retainerAmount);
    if (Number.isFinite(maximum) && maximum > 0 && Number.isFinite(current) && current > Math.min(maximum, 100)) {
      setRetainerAmount(String(Math.min(maximum, 100)));
    }
  }, [maxTradeAmount, retainerAmount]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [creationPricing, setCreationPricing] = useState<{ creationCost: number; balance: number; canAfford: boolean } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [tradingViewResults, setTradingViewResults] = useState<TradingViewResult[]>([]);
  const [searchingSymbols, setSearchingSymbols] = useState(false);
  const outerCardStyle: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const innerCardStyle: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit' };
  const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: theme.text, fontWeight: 750, fontSize: '0.85rem' };

  useEffect(() => {
    let active = true;
    setLoadingCreatedBots(true);
    setCreatedBotsError('');
    api.get('/api/market/mine').then((response) => {
      if (!active) return;
      const data = response.data;
      const bots = data?.bots || data || [];
      setCreatedBots(Array.isArray(bots) ? bots : []);
    }).catch((requestError: any) => {
      if (active) setCreatedBotsError(requestError?.response?.data?.message || 'Unable to load your created bots. Please try again.');
    }).finally(() => {
      if (active) setLoadingCreatedBots(false);
    });
    return () => { active = false; };
  }, [activeView]);

  useEffect(() => {
    if (!selectedTradingSymbol) {
      setCreationPricing(null);
      return;
    }
    let active = true;
    setPricingLoading(true);
    api.get('/api/market/pricing', { params: { symbolType: symbol, symbol: selectedTradingSymbol, tradeDirection, efficiency, minTradeAmount, maxTradeAmount, retainerAmount } })
      .then((response) => {
        if (active) setCreationPricing(response.data || null);
      })
      .catch(() => {
        if (active) setCreationPricing(null);
      })
      .finally(() => {
        if (active) setPricingLoading(false);
      });
    return () => { active = false; };
  }, [selectedTradingSymbol, symbol, tradeDirection, efficiency, minTradeAmount, maxTradeAmount, retainerAmount]);

  useEffect(() => {
    if (!/^\d{6}$/.test(botId)) {
      setBotIdStatus('idle');
      setBotIdMessage(botId ? 'Enter all 6 digits to check availability.' : '');
      return;
    }

    let active = true;
    setBotIdStatus('checking');
    setBotIdMessage('Checking bot ID…');
    api.get('/api/market/check-id', { params: { botId } }).then((response) => {
      if (!active) return;
      const available = response.data?.available === true;
      setBotIdStatus(available ? 'available' : 'unavailable');
      setBotIdMessage(response.data?.message || (available ? 'Bot ID is available.' : 'This bot ID is already in use.'));
    }).catch(() => {
      if (!active) return;
      setBotIdStatus('unavailable');
      setBotIdMessage('Unable to validate this bot ID. Please try again.');
    });

    return () => { active = false; };
  }, [botId]);

  const deleteBot = async (bot: CreatedBot) => {
    setCreatedBotsError('');
    setDeletingBotId(bot.botId);
    try {
      await api.delete(`/api/market/${bot.botId}`);
      setCreatedBots((current) => current.filter((item) => item.botId !== bot.botId));
    } catch (requestError: any) {
      setCreatedBotsError(requestError?.response?.data?.message || 'Unable to delete this bot. Please try again.');
    } finally {
      setDeletingBotId('');
      setConfirmingBotId('');
    }
  };

  const createBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!name.trim()) { setError('Enter a name for your trading bot.'); return; }
    if (!/^\d{6}$/.test(botId)) { setError('Bot ID must be exactly 6 digits.'); return; }
    if (botIdStatus !== 'available') { setError(botIdStatus === 'checking' ? 'Wait for the bot ID availability check to finish.' : botIdMessage || 'Enter an available bot ID.'); return; }
    if (!selectedTradingSymbol) { setError('Search for and select a trading symbol.'); return; }
    const minimumTrade = Number(minTradeAmount);
    const maximumTrade = Number(maxTradeAmount);
    if (!minTradeAmount || !Number.isFinite(minimumTrade) || minimumTrade <= 0) { setError('Enter a minimum trade amount greater than zero.'); return; }
    if (!maxTradeAmount || !Number.isFinite(maximumTrade) || maximumTrade <= 0) { setError('Enter a maximum trade amount greater than zero.'); return; }
    if (minimumTrade > maximumTrade) { setError('Maximum trade amount must be greater than or equal to minimum trade amount.'); return; }
    const retainer = Number(retainerAmount);
    if (!retainerAmount || !Number.isFinite(retainer) || retainer <= 0) { setError('Enter a retainer amount greater than zero.'); return; }
    if (retainer > maximumTrade) { setError('Retainer amount cannot be greater than maximum trade amount.'); return; }

    setSaving(true);
    try {
      const response = await api.post('/api/market', {
        name: name.trim(),
        botId,
        symbolType: symbol,
        symbol: selectedTradingSymbol,
        tradeDirection: tradeDirection.toLowerCase(),
        efficiency,
        minTradeAmount: minimumTrade,
        maxTradeAmount: maximumTrade,
        retainerAmount: retainer,
      });
      setMessage('Your trading bot was created successfully.');
      if (response.data?.bot) setCreatedBots((current) => [response.data.bot, ...current]);
      setName(''); setBotId('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to create the trading bot. Please try again.');
    } finally { setSaving(false); }
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>Creation | CryBots</title></Helmet>
    <main style={{ minHeight: '100vh', overflowX: 'hidden', background: theme.background, color: theme.text, paddingBottom: 90 }}>
      <div style={{ width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={16} /> Market</button>
        <div style={{ ...outerCardStyle, display: 'flex', gap: 8, marginTop: 18, padding: 5 }}>
          {(['create', 'creation'] as const).map((view) => (
            <button key={view} type="button" onClick={() => setActiveView(view)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}`, borderRadius: '9px', padding: '8px 10px', background: theme.surfaceGlass, color: theme.text, fontSize: '0.84rem', lineHeight: 'normal', cursor: 'pointer', ...(activeView === view ? { borderColor: theme.primary, color: theme.primary } : {}) }}>
              {view === 'create' ? 'Create' : 'Gallery'}
            </button>
          ))}
        </div>
        {activeView === 'create' ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 18, alignItems: 'start', marginTop: 18 }}>
          <div style={outerCardStyle}>
          <form onSubmit={createBot} style={innerCardStyle}>
            <label style={labelStyle}>Bot name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="My momentum bot" style={inputStyle} maxLength={80} /></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>Bot ID</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input value={botId} onChange={(event) => { setBotId(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Six digits" style={{ ...inputStyle, flex: 1, borderColor: botIdStatus === 'available' ? theme.success : botIdStatus === 'unavailable' ? theme.danger : theme.borderGlass }} /><button type="button" disabled={generatingBotId} onClick={async () => { setGeneratingBotId(true); setError(''); try { const response = await api.get('/api/market/generate-id'); setBotId(String(response.data?.botId || '').replace(/\D/g, '').slice(0, 6)); } catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to generate a unique bot ID. Please try again.'); } finally { setGeneratingBotId(false); } }} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', background: theme.primary, color: theme.textInverse, cursor: generatingBotId ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>{generatingBotId ? <InlineLoadingDots /> : 'Auto'}</button></div><small style={{ color: botIdStatus === 'available' ? theme.success : botIdStatus === 'unavailable' ? theme.danger : theme.textMuted }}>{botIdMessage || 'Enter six digits or use Auto to generate an unused six-digit bot ID.'}</small></div>
            <label style={labelStyle}>Market category<CustomSelect options={symbolOptions.map((option) => option.value)} value={symbol} onChange={(value) => { setSymbol(value); setTradingViewResults([]); setSelectedTradingSymbol(''); }} theme={theme} formatOption={(value) => symbolOptions.find((option) => option.value === value)?.label || value} /></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>Trading symbol<Search size={15} /><input value={symbolSearch} onChange={(event) => setSymbolSearch(event.target.value.toUpperCase())} placeholder={`Search ${selectedSymbol.label.toLowerCase()} symbols`} style={inputStyle} /></label><button type="button" disabled={searchingSymbols || !symbolSearch.trim()} onClick={async () => { setSearchingSymbols(true); setError(''); try { const response = await api.get('/api/market/symbols', { params: { category: symbol, search: symbolSearch.trim() } }); const remoteResults = response.data?.symbols || response.data || []; setTradingViewResults(Array.isArray(remoteResults) ? remoteResults : []); if (!Array.isArray(remoteResults) || remoteResults.length === 0) setError('No TradingView symbols matched your search.'); } catch (requestError: any) { setTradingViewResults([]); setError(requestError?.response?.data?.message || 'Unable to search TradingView symbols right now.'); } finally { setSearchingSymbols(false); } }} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}>{searchingSymbols ? <InlineLoadingDots /> : 'Search symbols'}</button>{tradingViewResults.length > 0 && <div style={{ display: 'grid', gap: 6 }}>{tradingViewResults.map((result) => <button key={`${result.exchange}:${result.symbol}`} type="button" onClick={() => setSelectedTradingSymbol(`${result.exchange}:${result.symbol}`)} style={{ textAlign: 'left', border: `1px solid ${selectedTradingSymbol === `${result.exchange}:${result.symbol}` ? theme.primary : theme.borderGlass}`, borderRadius: 9, padding: '9px 10px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}><strong>{result.symbol}</strong><small style={{ display: 'block', color: theme.textMuted }}>{result.description || result.exchange} · {result.type}</small></button>)}</div>}<small style={{ color: theme.textMuted }}>Selected: {selectedTradingSymbol || 'None'}</small></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}><label style={labelStyle}>Min activation amount<input type="number" min="0.01" step="0.01" value={minTradeAmount} onChange={(event) => setMinTradeAmount(event.target.value)} placeholder="10" style={inputStyle} /></label><label style={labelStyle}>Max activation amount<input type="number" min="0.01" step="0.01" value={maxTradeAmount} onChange={(event) => setMaxTradeAmount(event.target.value)} placeholder="100" style={inputStyle} /></label></div>
            <label style={labelStyle}>Retainer amount<input type="number" min="0.01" step="0.01" max={maxTradeAmount ? Math.min(Number(maxTradeAmount), 100) : 100} value={retainerAmount} onChange={(event) => setRetainerAmount(event.target.value)} placeholder="5" style={inputStyle} /><small style={{ color: theme.textMuted }}>This amount remains in the bot when funds are withdrawn while the bot stays active.</small></label>
            <label style={labelStyle}>Trade direction<CustomSelect options={['Long', 'Short']} value={tradeDirection} onChange={setTradeDirection} theme={theme} /></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>Starting efficiency <strong style={{ color: theme.primary }}>{efficiency}%</strong></label><input type="range" min="0" max="100" step="10" value={efficiency} onChange={(event) => setEfficiency(Number(event.target.value))} list="efficiency-steps" style={{ width: '100%', accentColor: theme.primary, cursor: 'grab' }} /><datalist id="efficiency-steps">{Array.from({ length: 11 }, (_, index) => <option key={index} value={index * 10} label={`${index * 10}%`} />)}</datalist><div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, fontSize: '0.72rem' }}><span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span><span>100%</span></div></div>
            {creationPricing && <section style={{ ...innerCardStyle, gap: 6 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>Creation cost</strong><strong style={{ color: theme.primary }}>{pricingLoading ? 'Checking…' : `${creationPricing.creationCost.toFixed(2)} USDT`}</strong></div><small style={{ color: creationPricing.canAfford ? theme.success : theme.danger }}>{creationPricing.canAfford ? `Available balance: ${Number(creationPricing.balance || 0).toFixed(2)} USDT` : `Insufficient balance. You need ${creationPricing.creationCost.toFixed(2)} USDT.`}</small></section>}{error && <NotificationBanner tone="error" title="Unable to create trading bot" message={error} />}{message && <NotificationBanner tone="success" title="Trading bot created" message={message} />}
            {createdBots.length >= 10 && <small style={{ color: theme.danger }}>You have reached the maximum of 10 created bots. Delete a bot before creating another.</small>}
            <button type="submit" disabled={saving || createdBots.length >= 10 || (creationPricing !== null && !creationPricing.canAfford)} style={{ border: 0, borderRadius: 999, padding: '12px 16px', background: theme.primary, color: theme.textInverse, fontWeight: 850, cursor: saving || createdBots.length >= 10 ? 'not-allowed' : 'pointer', opacity: createdBots.length >= 10 ? 0.55 : 1 }}>{saving ? <InlineLoadingDots /> : 'Create bot'}</button>
          </form>
          </div>
          <div style={outerCardStyle}>
          <aside style={{ display: 'grid', gap: 10 }}><section style={innerCardStyle}><div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}><Info size={17} color={theme.primary} /> Trading symbol selector</div><p style={{ color: theme.textMuted, fontSize: '0.83rem', lineHeight: 1.5, marginBottom: 0 }}>Choose a market category, search the available trading symbols, then select the exact instrument your bot should trade. No chart is shown on this page.</p></section><div style={innerCardStyle}><p style={{ display: 'flex', gap: 7, margin: 0, color: theme.textMuted, fontSize: '0.76rem', lineHeight: 1.4 }}><Info size={15} /> Selected category: {selectedSymbol.label}. Confirm the exchange and symbol before creating the bot.</p></div></aside>
          </div>
        </div> : <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
          {createdBotsError && <NotificationBanner tone="error" title="Unable to load created bots" message={createdBotsError} />}
          {loadingCreatedBots ? (
            <div style={{ padding: 30, textAlign: 'center' }}>
              <InlineLoadingDots />
            </div>
          ) : createdBots.length ? (
            createdBots.map((bot) => (
              <article key={bot._id || bot.botId} style={outerCardStyle}>
                <section style={{ ...innerCardStyle, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}`, color: theme.primary }}>
                      <Bot size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 850, overflowWrap: 'anywhere' }}>{bot.name}</h3>
                      <small style={{ color: theme.textMuted, overflowWrap: 'anywhere' }}>ID {bot.botId}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedBotId((current) => current === bot.botId ? '' : bot.botId)}
                      style={{ flexShrink: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '7px 12px', background: theme.surfaceMuted, color: theme.primary, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {expandedBotId === bot.botId ? 'Hide' : 'View'}
                    </button>
                  </div>

                  {expandedBotId === bot.botId && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, paddingTop: 10, borderTop: `1px solid ${theme.borderGlass}` }}>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Market category</small>
                        <strong style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{bot.symbolType || 'crypto'}</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Trading symbol</small>
                        <strong style={{ fontSize: '0.88rem', overflowWrap: 'anywhere' }}>{bot.symbol || 'Not set'}</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Min activation</small>
                        <strong style={{ fontSize: '0.88rem' }}>{Number(bot.minTradeAmount ?? 0).toFixed(2)} USDT</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Max activation</small>
                        <strong style={{ fontSize: '0.88rem' }}>{Number(bot.maxTradeAmount ?? 0).toFixed(2)} USDT</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Retainer</small>
                        <strong style={{ fontSize: '0.88rem' }}>{Number(bot.retainerAmount ?? 0).toFixed(2)} USDT</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Trade direction</small>
                        <strong style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{bot.tradeDirection || 'long'}</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Active efficiency</small>
                        <strong style={{ fontSize: '0.88rem' }}>{bot.efficiency ?? 0}%</strong>
                      </div>
                      <div>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Creation cost</small>
                        <strong style={{ fontSize: '0.88rem' }}>{bot.creationCost !== undefined ? Number(bot.creationCost).toFixed(2) + ' USDT' : '—'}</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Created</small>
                        <strong style={{ fontSize: '0.82rem' }}>{bot.createdAt ? new Date(bot.createdAt).toLocaleString() : '—'}</strong>
                      </div>

                      {confirmingBotId === bot.botId ? (
                        <div role="alertdialog" aria-label={`Confirm deletion of ${bot.name}`} style={{ gridColumn: '1 / -1', display: 'grid', gap: 8, padding: 10, borderRadius: 10, border: `1px solid ${theme.danger}`, background: theme.surfaceGlass }}>
                          <p style={{ margin: 0, color: theme.text, fontSize: '0.8rem', lineHeight: 1.4 }}>
                            Delete <strong>{bot.name}</strong> permanently? This cannot be undone.
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={() => setConfirmingBotId('')} disabled={deletingBotId === bot.botId} style={{ flex: 1, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 10px', background: theme.surfaceMuted, color: theme.text, fontWeight: 800, cursor: 'pointer' }}>
                              Cancel
                            </button>
                            <button type="button" onClick={() => void deleteBot(bot)} disabled={deletingBotId === bot.botId} style={{ flex: 1, border: `1px solid ${theme.danger}`, borderRadius: 9, padding: '8px 10px', background: 'transparent', color: theme.danger, fontWeight: 800, cursor: deletingBotId === bot.botId ? 'wait' : 'pointer' }}>
                              {deletingBotId === bot.botId ? <InlineLoadingDots /> : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmingBotId(bot.botId)} disabled={Boolean(deletingBotId) || Boolean(confirmingBotId)} style={{ gridColumn: '1 / -1', border: `1px solid ${theme.danger}`, borderRadius: 10, padding: '8px 10px', background: 'transparent', color: theme.danger, fontWeight: 800, cursor: 'pointer', opacity: confirmingBotId && confirmingBotId !== bot.botId ? 0.55 : 1 }}>
                          Delete bot
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </article>
            ))
          ) : (
            <p style={{ color: theme.textMuted, fontSize: '0.82rem' }}>You have not created any bots yet.</p>
          )}        </div>}
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default Creation;
