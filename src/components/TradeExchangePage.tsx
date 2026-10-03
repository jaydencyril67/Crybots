import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

const MARKET_SERVICE_URL = process.env.REACT_APP_MARKET_SERVICE_URL || process.env.MARKET_SERVICE_URL || 'https://market-matb.onrender.com';
const DEFAULT_TRADING_FEE_RATE = 0.001;

const TradeExchangePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [quantity, setQuantity] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageTone, setMessageTone] = React.useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = React.useState(false);
  const [feeRate, setFeeRate] = React.useState(DEFAULT_TRADING_FEE_RATE);
  const [estimatedFee, setEstimatedFee] = React.useState<number | null>(null);

  const submitOrder = async (side: 'buy' | 'sell') => {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setMessageTone('error');
      setMessage('Enter a valid KRN quantity first.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const clientOrderId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const response = await api.post<{ prediction: 'rise' | 'fall'; feeRate?: number; estimatedFee?: number }>('/api/trading/orders', {
        symbol: 'KRN/USDT',
        clientOrderId,
        side,
        type: 'market',
        quantity: parsedQuantity,
      });
      const appliedFeeRate = Number(response.data.feeRate);
      if (Number.isFinite(appliedFeeRate) && appliedFeeRate >= 0) setFeeRate(appliedFeeRate);
      setEstimatedFee(Number.isFinite(response.data.estimatedFee) ? response.data.estimatedFee || 0 : null);
      setQuantity('');
      setMessageTone('success');
      setMessage(`${side === 'buy' ? 'Buy' : 'Sell'} prediction created: market price is expected to ${response.data.prediction === 'rise' ? 'rise' : 'fall'}. Trading fee: ${((Number.isFinite(appliedFeeRate) ? appliedFeeRate : feeRate) * 100).toFixed(2)}%. View it in Open trades.`);
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessageTone('error');
      setMessage(apiMessage || 'Unable to create the prediction order.');
    } finally {
      setSubmitting(false);
    }
  };

  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 11px', borderRadius: 9, border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text };

  return <HybridTheme><Helmet><title>Exchange | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ width: '100%', maxWidth: 1680, margin: '0 auto', padding: '18px 14px 28px', boxSizing: 'border-box' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    <section style={card}><iframe title="KingsHall live market chart" src={MARKET_SERVICE_URL} style={{ width: '100%', height: 'clamp(520px, 75vw, 900px)', border: 0, borderRadius: 10, display: 'block' }} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></section>
    <section style={{ ...card, width: '100%', maxWidth: 620, boxSizing: 'border-box', margin: '16px auto 0', display: 'grid', gap: 12 }}>
      <div><h2 style={{ margin: 0, fontSize: '1.1rem' }}>Place prediction order</h2><p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: '0.88rem' }}>Buy predicts a rise. Sell predicts a fall. Your order stays open until it is completed or cancelled.</p></div>
      <input required min="0" step="any" type="number" placeholder="KRN quantity" value={quantity} onChange={(event) => { setQuantity(event.target.value); setEstimatedFee(null); }} style={input} />
      <div style={{ display: 'grid', gap: 4, color: theme.textMuted, fontSize: '0.85rem' }}><span>Trading fee: {(feeRate * 100).toFixed(2)}% of the executed order value</span>{estimatedFee !== null ? <span>Estimated fee for this order: {estimatedFee.toFixed(6)} USDT</span> : null}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <button type="button" disabled={submitting} onClick={() => void submitOrder('buy')} style={{ padding: 12, border: 0, borderRadius: 9, background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'Submitting…' : 'Buy · Rise'}</button>
        <button type="button" disabled={submitting} onClick={() => void submitOrder('sell')} style={{ padding: 12, border: 0, borderRadius: 9, background: theme.danger, color: theme.textInverse, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'Submitting…' : 'Sell · Fall'}</button>
      </div>
      {message ? <NotificationBanner tone={messageTone} title="Trading" message={message} /> : null}
    </section>
  </main><NowBar /></div></HybridTheme>;
};

export default TradeExchangePage;
