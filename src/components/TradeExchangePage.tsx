import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

const MARKET_SERVICE_URL = process.env.REACT_APP_MARKET_SERVICE_URL || 'https://market-matb.onrender.com';

const TradeExchangePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [symbol, setSymbol] = React.useState('KRN/USD');
  const [side, setSide] = React.useState<'buy' | 'sell'>('buy');
  const [type, setType] = React.useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = React.useState('');
  const [limitPrice, setLimitPrice] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/api/trading/orders', { symbol, side, type, quantity: Number(quantity), ...(type === 'limit' ? { limitPrice: Number(limitPrice) } : {}) });
      setQuantity('');
      setLimitPrice('');
      setMessage('Order accepted and added to your open orders.');
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(apiMessage || 'Unable to submit the order.');
    } finally {
      setSubmitting(false);
    }
  };

  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 11px', borderRadius: 9, border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text };

  return <HybridTheme><Helmet><title>Exchange | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '18px 14px 28px', boxSizing: 'border-box' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Exchange</h1>
    <p style={{ color: theme.textMuted }}>Live market data from Market. Orders and account records remain managed by KingsHall.</p>
    <section style={{ ...card, marginTop: 16 }}><iframe title="KingsHall live market chart" src={MARKET_SERVICE_URL} style={{ width: '100%', height: 'clamp(360px, 62vw, 620px)', border: 0, borderRadius: 10, display: 'block' }} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></section>
    <form onSubmit={submitOrder} style={{ ...card, display: 'grid', gap: 10, marginTop: 16 }}>
      <h2 style={{ margin: 0, fontSize: '1rem' }}>Place order</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <select value={symbol} onChange={(event) => setSymbol(event.target.value)} style={input}><option>KRN/USD</option><option>BTC/USDT</option><option>ETH/USDT</option></select>
        <select value={side} onChange={(event) => setSide(event.target.value as 'buy' | 'sell')} style={input}><option value="buy">Buy</option><option value="sell">Sell</option></select>
        <select value={type} onChange={(event) => setType(event.target.value as 'market' | 'limit')} style={input}><option value="market">Market</option><option value="limit">Limit</option></select>
      </div>
      <input required min="0" step="any" type="number" placeholder="Quantity" value={quantity} onChange={(event) => setQuantity(event.target.value)} style={input} />
      {type === 'limit' ? <input required min="0" step="any" type="number" placeholder="Limit price" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} style={input} /> : null}
      <button type="submit" disabled={submitting} style={{ padding: 11, border: 0, borderRadius: 9, background: side === 'buy' ? theme.primary : theme.danger, color: theme.textInverse, fontWeight: 800 }}>{submitting ? 'Submitting…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}</button>
      {message ? <NotificationBanner tone={message.startsWith('Order') ? 'success' : 'error'} title="Trading" message={message} /> : null}
    </form>
  </main><NowBar /></div></HybridTheme>;
};

export default TradeExchangePage;
