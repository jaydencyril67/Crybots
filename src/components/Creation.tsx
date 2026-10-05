import React, { useState } from 'react';
import { ArrowLeft, Info, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type SymbolOption = { value: string; label: string; tradingViewSymbol: string };
type TradingViewResult = { symbol: string; description: string; exchange: string; type: string };

const symbolOptions: SymbolOption[] = [
  { value: 'stocks', label: 'Stocks', tradingViewSymbol: 'NASDAQ:AAPL' },
  { value: 'funds', label: 'Funds', tradingViewSymbol: 'AMEX:SPY' },
  { value: 'futures', label: 'Futures', tradingViewSymbol: 'CME_MINI:ES1!' },
  { value: 'forex', label: 'Forex', tradingViewSymbol: 'FX:EURUSD' },
  { value: 'crypto', label: 'Crypto', tradingViewSymbol: 'BINANCE:BTCUSDT' },
];

const payoutOptions = ['Manual', 'Automatic'];
const percentageOptions = ['0.5', '1', '2', '3', '5', '10'];

const Creation = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [name, setName] = useState('');
  const [botId, setBotId] = useState('');
  const [useAutomaticId, setUseAutomaticId] = useState(true);
  const [symbol, setSymbol] = useState('crypto');
  const selectedSymbol = symbolOptions.find((option) => option.value === symbol) || symbolOptions[0];
  const [symbolSearch, setSymbolSearch] = useState('');
  const [selectedTradingSymbol, setSelectedTradingSymbol] = useState(selectedSymbol.tradingViewSymbol);
  const [duration, setDuration] = useState('');
  const [payoutSystem, setPayoutSystem] = useState('Manual');
  const [takeProfit, setTakeProfit] = useState('2');
  const [stopLoss, setStopLoss] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedSymbol = symbolOptions.find((option) => option.value === symbol) || symbolOptions[0];
  const [tradingViewResults, setTradingViewResults] = useState<TradingViewResult[]>([]);
  const [searchingSymbols, setSearchingSymbols] = useState(false);
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, font: 'inherit' };
  const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: theme.text, fontWeight: 750, fontSize: '0.85rem' };

  const createBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!name.trim()) { setError('Enter a name for your trading bot.'); return; }
    if (!useAutomaticId && !/^\d{6}$/.test(botId)) { setError('A manual bot ID must be exactly 6 digits.'); return; }
    if (!selectedTradingSymbol) { setError('Search for and select a TradingView symbol.'); return; }
    if (!duration || Number(duration) <= 0) { setError('Enter a run duration greater than zero.'); return; }

    setSaving(true);
    try {
      await api.post('/api/trading-bots', {
        name: name.trim(),
        botId: useAutomaticId ? undefined : botId,
        autoGenerateId: useAutomaticId,
        symbolType: symbol,
        symbol: selectedTradingSymbol,
        runDuration: Number(duration),
        payoutSystem: payoutSystem.toLowerCase(),
        takeProfitPercent: Number(takeProfit),
        stopLossPercent: Number(stopLoss),
      });
      setMessage('Your trading bot was created successfully.');
      setName(''); setBotId(''); setDuration('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to create the trading bot. Please try again.');
    } finally { setSaving(false); }
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>Create trading bot | KingsHall</title></Helmet>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 90 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) 16px' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Market</button>
        <header style={{ margin: '24px 0 18px' }}><p style={{ margin: 0, color: theme.primary, fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.73rem' }}>TRADING TOOLS</p><h1 style={{ margin: '6px 0', fontSize: 'clamp(1.55rem, 4vw, 2.2rem)' }}>Create a trading bot</h1><p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.5 }}>Set your bot’s strategy and let the backend assign a unique six-digit ID automatically.</p></header>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.85fr)', gap: 18, alignItems: 'start' }}>
          <form onSubmit={createBot} style={{ display: 'grid', gap: 16, padding: 18, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
            <label style={labelStyle}>Bot name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="My momentum bot" style={inputStyle} maxLength={80} /></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>Bot ID</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input value={useAutomaticId ? '' : botId} onChange={(event) => setBotId(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={useAutomaticId} inputMode="numeric" placeholder={useAutomaticId ? 'Created automatically' : 'Six digits'} style={{ ...inputStyle, flex: 1 }} /><button type="button" onClick={() => setUseAutomaticId(!useAutomaticId)} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', background: useAutomaticId ? theme.primary : theme.surfaceMuted, color: useAutomaticId ? theme.textInverse : theme.text, cursor: 'pointer', whiteSpace: 'nowrap' }}>{useAutomaticId ? 'Auto' : 'Manual'}</button></div><small style={{ color: theme.textMuted }}>Choose Auto to have the backend create an unused unique six-digit number.</small></div>
            <label style={labelStyle}>Market category<select value={symbol} onChange={(event) => { setSymbol(event.target.value); setTradingViewResults([]); setSelectedTradingSymbol(''); }} style={inputStyle}>{symbolOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>TradingView symbol<Search size={15} /><input value={symbolSearch} onChange={(event) => setSymbolSearch(event.target.value)} placeholder={`Search ${selectedSymbol.label.toLowerCase()} symbols`} style={inputStyle} /></label><button type="button" disabled={searchingSymbols || !symbolSearch.trim()} onClick={async () => { setSearchingSymbols(true); try { const response = await api.get('/api/market/symbols', { params: { category: symbol, search: symbolSearch.trim() } }); setTradingViewResults(response.data?.symbols || response.data || []); } catch (requestError) { setError('Unable to load TradingView symbols. Please try again.'); } finally { setSearchingSymbols(false); } }} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}>{searchingSymbols ? 'Searching…' : 'Search symbols'}</button>{tradingViewResults.length > 0 && <div style={{ display: 'grid', gap: 6 }}>{tradingViewResults.map((result) => <button key={`${result.exchange}:${result.symbol}`} type="button" onClick={() => setSelectedTradingSymbol(`${result.exchange}:${result.symbol}`)} style={{ textAlign: 'left', border: `1px solid ${selectedTradingSymbol === `${result.exchange}:${result.symbol}` ? theme.primary : theme.borderGlass}`, borderRadius: 9, padding: '9px 10px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}><strong>{result.symbol}</strong><small style={{ display: 'block', color: theme.textMuted }}>{result.description || result.exchange} · {result.type}</small></button>)}</div>}<small style={{ color: theme.textMuted }}>Powered by the backend’s TradingView symbol catalog. Selected: {selectedTradingSymbol || 'None'}</small></div>
            <label style={labelStyle}>Run duration (minutes)<input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="60" style={inputStyle} /></label>
            <label style={labelStyle}>Payout system<select value={payoutSystem} onChange={(event) => setPayoutSystem(event.target.value)} style={inputStyle}>{payoutOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label style={labelStyle}>Take profit<select value={takeProfit} onChange={(event) => setTakeProfit(event.target.value)} style={inputStyle}>{percentageOptions.map((option) => <option key={option} value={option}>{option}%</option>)}</select></label><label style={labelStyle}>Stop loss<select value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} style={inputStyle}>{percentageOptions.map((option) => <option key={option} value={option}>{option}%</option>)}</select></label></div>
            {error && <p role="alert" style={{ margin: 0, color: theme.danger }}>{error}</p>}{message && <p role="status" style={{ margin: 0, color: theme.success }}>{message}</p>}
            <button type="submit" disabled={saving} style={{ border: 0, borderRadius: 999, padding: '12px 16px', background: theme.primary, color: theme.textInverse, fontWeight: 850, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Creating…' : 'Create bot'}</button>
          </form>
          <aside style={{ display: 'grid', gap: 14 }}><section style={{ padding: 14, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}><Info size={17} color={theme.primary} /> TradingView symbol selector</div><p style={{ color: theme.textMuted, fontSize: '0.83rem', lineHeight: 1.5, marginBottom: 0 }}>Choose a market category, search the available TradingView symbols, then select the exact instrument your bot should trade. No chart is shown on this page.</p></section><p style={{ display: 'flex', gap: 7, margin: 0, color: theme.textMuted, fontSize: '0.76rem', lineHeight: 1.4 }}><Info size={15} /> Selected category: {selectedSymbol.label}. Confirm the exchange and symbol before creating the bot.</p></aside>
        </div>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default Creation;
