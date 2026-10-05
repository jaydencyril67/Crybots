import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Info, Search } from 'lucide-react';
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

const fallbackTradingViewSymbols: Record<string, TradingViewResult[]> = {
  stocks: [
    { symbol: 'AAPL', description: 'Apple Inc.', exchange: 'NASDAQ', type: 'stock' },
    { symbol: 'MSFT', description: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'stock' },
    { symbol: 'TSLA', description: 'Tesla, Inc.', exchange: 'NASDAQ', type: 'stock' },
    { symbol: 'NVDA', description: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'stock' },
  ],
  funds: [
    { symbol: 'SPY', description: 'SPDR S&P 500 ETF Trust', exchange: 'AMEX', type: 'fund' },
    { symbol: 'QQQ', description: 'Invesco QQQ Trust', exchange: 'NASDAQ', type: 'fund' },
    { symbol: 'VTI', description: 'Vanguard Total Stock Market ETF', exchange: 'AMEX', type: 'fund' },
  ],
  futures: [
    { symbol: 'ES1!', description: 'E-mini S&P 500 Futures', exchange: 'CME_MINI', type: 'futures' },
    { symbol: 'NQ1!', description: 'E-mini Nasdaq-100 Futures', exchange: 'CME_MINI', type: 'futures' },
    { symbol: 'CL1!', description: 'Crude Oil Futures', exchange: 'NYMEX', type: 'futures' },
  ],
  forex: [
    { symbol: 'EURUSD', description: 'Euro / U.S. Dollar', exchange: 'FX', type: 'forex' },
    { symbol: 'GBPUSD', description: 'British Pound / U.S. Dollar', exchange: 'FX', type: 'forex' },
    { symbol: 'USDJPY', description: 'U.S. Dollar / Japanese Yen', exchange: 'FX', type: 'forex' },
  ],
  crypto: [
    { symbol: 'BTCUSDT', description: 'Bitcoin / TetherUS', exchange: 'BINANCE', type: 'crypto' },
    { symbol: 'ETHUSDT', description: 'Ethereum / TetherUS', exchange: 'BINANCE', type: 'crypto' },
    { symbol: 'SOLUSDT', description: 'Solana / TetherUS', exchange: 'BINANCE', type: 'crypto' },
    { symbol: 'XRPUSDT', description: 'XRP / TetherUS', exchange: 'BINANCE', type: 'crypto' },
  ],
};

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
  const [name, setName] = useState('');
  const [botId, setBotId] = useState('');
  const [generatingBotId, setGeneratingBotId] = useState(false);
  const [symbol, setSymbol] = useState('crypto');
  const selectedSymbol = symbolOptions.find((option) => option.value === symbol) || symbolOptions[0];
  const [symbolSearch, setSymbolSearch] = useState('');
  const [selectedTradingSymbol, setSelectedTradingSymbol] = useState(selectedSymbol.tradingViewSymbol);
  const [duration, setDuration] = useState('');
  const [payoutSystem, setPayoutSystem] = useState('Manual');
  const [takeProfit, setTakeProfit] = useState('2');
  const [stopLoss, setStopLoss] = useState('1');
  const [minTradeAmount, setMinTradeAmount] = useState('');
  const [maxTradeAmount, setMaxTradeAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [tradingViewResults, setTradingViewResults] = useState<TradingViewResult[]>([]);
  const [searchingSymbols, setSearchingSymbols] = useState(false);
  const outerCardStyle: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const innerCardStyle: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit' };
  const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: theme.text, fontWeight: 750, fontSize: '0.85rem' };

  const createBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!name.trim()) { setError('Enter a name for your trading bot.'); return; }
    if (!/^\d{6}$/.test(botId)) { setError('Bot ID must be exactly 6 digits.'); return; }
    if (!selectedTradingSymbol) { setError('Search for and select a TradingView symbol.'); return; }
    if (!duration || Number(duration) <= 0) { setError('Enter a run duration greater than zero.'); return; }
    const minimumTrade = Number(minTradeAmount);
    const maximumTrade = Number(maxTradeAmount);
    if (!minTradeAmount || !Number.isFinite(minimumTrade) || minimumTrade <= 0) { setError('Enter a minimum trade amount greater than zero.'); return; }
    if (!maxTradeAmount || !Number.isFinite(maximumTrade) || maximumTrade <= 0) { setError('Enter a maximum trade amount greater than zero.'); return; }
    if (minimumTrade > maximumTrade) { setError('Maximum trade amount must be greater than or equal to minimum trade amount.'); return; }

    setSaving(true);
    try {
      await api.post('/api/market', {
        name: name.trim(),
        botId,
        symbolType: symbol,
        symbol: selectedTradingSymbol,
        runDuration: Number(duration),
        payoutSystem: payoutSystem.toLowerCase(),
        takeProfitPercent: Number(takeProfit),
        stopLossPercent: Number(stopLoss),
        minTradeAmount: minimumTrade,
        maxTradeAmount: maximumTrade,
      });
      setMessage('Your trading bot was created successfully.');
      setName(''); setBotId(''); setDuration('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to create the trading bot. Please try again.');
    } finally { setSaving(false); }
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>Create trading bot | KingsHall</title></Helmet>
    <main style={{ minHeight: '100vh', overflowX: 'hidden', background: theme.background, color: theme.text, paddingBottom: 90 }}>
      <div style={{ width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={16} /> Market</button>
        <section style={{ display: 'grid', gap: 10, marginTop: 18 }}><h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Create a trading bot</h1><p style={{ margin: 0, maxWidth: '62ch', color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }}>Configure the strategy settings for your new bot.</p></section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 18, alignItems: 'start', marginTop: 18 }}>
          <div style={outerCardStyle}>
          <form onSubmit={createBot} style={innerCardStyle}>
            <label style={labelStyle}>Bot name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="My momentum bot" style={inputStyle} maxLength={80} /></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>Bot ID</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input value={botId} onChange={(event) => setBotId(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Six digits" style={{ ...inputStyle, flex: 1 }} /><button type="button" disabled={generatingBotId} onClick={async () => { setGeneratingBotId(true); setError(''); try { const response = await api.get('/api/market/generate-id'); setBotId(String(response.data?.botId || '').replace(/\D/g, '').slice(0, 6)); } catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to generate a unique bot ID. Please try again.'); } finally { setGeneratingBotId(false); } }} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', background: theme.primary, color: theme.textInverse, cursor: generatingBotId ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>{generatingBotId ? 'Generating…' : 'Auto'}</button></div><small style={{ color: theme.textMuted }}>Enter six digits or use Auto to generate an unused six-digit bot ID.</small></div>
            <label style={labelStyle}>Market category<CustomSelect options={symbolOptions.map((option) => option.value)} value={symbol} onChange={(value) => { setSymbol(value); setTradingViewResults([]); setSelectedTradingSymbol(''); }} theme={theme} formatOption={(value) => symbolOptions.find((option) => option.value === value)?.label || value} /></label>
            <div style={{ display: 'grid', gap: 8 }}><label style={labelStyle}>TradingView symbol<Search size={15} /><input value={symbolSearch} onChange={(event) => setSymbolSearch(event.target.value)} placeholder={`Search ${selectedSymbol.label.toLowerCase()} symbols`} style={inputStyle} /></label><button type="button" disabled={searchingSymbols || !symbolSearch.trim()} onClick={async () => { setSearchingSymbols(true); setError(''); const query = symbolSearch.trim().toLowerCase(); const fallbackResults = (fallbackTradingViewSymbols[symbol] || []).filter((result) => `${result.symbol} ${result.description} ${result.exchange}`.toLowerCase().includes(query)); try { const response = await api.get('/api/market/symbols', { params: { category: symbol, search: symbolSearch.trim() } }); const remoteResults = response.data?.symbols || response.data || []; setTradingViewResults(Array.isArray(remoteResults) && remoteResults.length > 0 ? remoteResults : fallbackResults); } catch { setTradingViewResults(fallbackResults); } finally { setSearchingSymbols(false); } }} style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '10px 12px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}>{searchingSymbols ? 'Searching…' : 'Search symbols'}</button>{tradingViewResults.length > 0 && <div style={{ display: 'grid', gap: 6 }}>{tradingViewResults.map((result) => <button key={`${result.exchange}:${result.symbol}`} type="button" onClick={() => setSelectedTradingSymbol(`${result.exchange}:${result.symbol}`)} style={{ textAlign: 'left', border: `1px solid ${selectedTradingSymbol === `${result.exchange}:${result.symbol}` ? theme.primary : theme.borderGlass}`, borderRadius: 9, padding: '9px 10px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}><strong>{result.symbol}</strong><small style={{ display: 'block', color: theme.textMuted }}>{result.description || result.exchange} · {result.type}</small></button>)}</div>}<small style={{ color: theme.textMuted }}>Selected: {selectedTradingSymbol || 'None'}</small></div>
            <label style={labelStyle}>Run duration (minutes)<input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="60" style={inputStyle} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}><label style={labelStyle}>Min trade amount<input type="number" min="0.01" step="0.01" value={minTradeAmount} onChange={(event) => setMinTradeAmount(event.target.value)} placeholder="10" style={inputStyle} /></label><label style={labelStyle}>Max trade amount<input type="number" min="0.01" step="0.01" value={maxTradeAmount} onChange={(event) => setMaxTradeAmount(event.target.value)} placeholder="100" style={inputStyle} /></label></div>
            <label style={labelStyle}>Payout system<CustomSelect options={payoutOptions} value={payoutSystem} onChange={setPayoutSystem} theme={theme} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label style={labelStyle}>Take profit<CustomSelect options={percentageOptions} value={takeProfit} onChange={setTakeProfit} theme={theme} formatOption={(option) => `${option}%`} /></label><label style={labelStyle}>Stop loss<CustomSelect options={percentageOptions} value={stopLoss} onChange={setStopLoss} theme={theme} formatOption={(option) => `${option}%`} /></label></div>
            {error && <p role="alert" style={{ margin: 0, color: theme.danger }}>{error}</p>}{message && <p role="status" style={{ margin: 0, color: theme.success }}>{message}</p>}
            <button type="submit" disabled={saving} style={{ border: 0, borderRadius: 999, padding: '12px 16px', background: theme.primary, color: theme.textInverse, fontWeight: 850, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Creating…' : 'Create bot'}</button>
          </form>
          </div>
          <div style={outerCardStyle}>
          <aside style={{ display: 'grid', gap: 10 }}><section style={innerCardStyle}><div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}><Info size={17} color={theme.primary} /> TradingView symbol selector</div><p style={{ color: theme.textMuted, fontSize: '0.83rem', lineHeight: 1.5, marginBottom: 0 }}>Choose a market category, search the available TradingView symbols, then select the exact instrument your bot should trade. No chart is shown on this page.</p></section><div style={innerCardStyle}><p style={{ display: 'flex', gap: 7, margin: 0, color: theme.textMuted, fontSize: '0.76rem', lineHeight: 1.4 }}><Info size={15} /> Selected category: {selectedSymbol.label}. Confirm the exchange and symbol before creating the bot.</p></div></aside>
          </div>
        </div>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default Creation;
