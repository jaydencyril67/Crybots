import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import TradingViewChart from './TradingViewChart';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';
const Chart = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [usdtAmount, setUsdtAmount] = React.useState('');
  const [takeProfitPrice, setTakeProfitPrice] = React.useState('');
  const [stopLossPrice, setStopLossPrice] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageTone, setMessageTone] = React.useState<'success' | 'error'>('success');
  const [submittingSide, setSubmittingSide] = React.useState<'buy' | 'sell' | null>(null);

  const submitOrder = async (side: 'buy' | 'sell') => {
    const parsedUsdtAmount = Number(usdtAmount);
    if (!Number.isFinite(parsedUsdtAmount) || parsedUsdtAmount < 10) {
      setMessageTone('error');
      setMessage('Trade amount must be at least 10 USDT.');
      return;
    }

    const parsedTakeProfit = takeProfitPrice === '' ? undefined : Number(takeProfitPrice);
    const parsedStopLoss = stopLossPrice === '' ? undefined : Number(stopLossPrice);
    if ((parsedTakeProfit !== undefined && (!Number.isFinite(parsedTakeProfit) || parsedTakeProfit <= 0)) || (parsedStopLoss !== undefined && (!Number.isFinite(parsedStopLoss) || parsedStopLoss <= 0)) || (side === 'buy' && parsedStopLoss !== undefined && parsedTakeProfit !== undefined && parsedStopLoss >= parsedTakeProfit) || (side === 'sell' && parsedTakeProfit !== undefined && parsedStopLoss !== undefined && parsedTakeProfit >= parsedStopLoss)) {
      setMessageTone('error');
      setMessage('Set valid target prices: for buys, stop-loss must be below take-profit; for sells, take-profit must be below stop-loss.');
      return;
    }

    setSubmittingSide(side);
    setMessage(null);
    try {
      const clientOrderId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await api.post('/api/trading/orders', {
        symbol: 'KRN/USDT',
        clientOrderId,
        side,
        usdtAmount: parsedUsdtAmount,
        takeProfitPrice: parsedTakeProfit,
        stopLossPrice: parsedStopLoss,
      });
      setUsdtAmount('');
      setTakeProfitPrice('');
      setStopLossPrice('');
      setMessageTone('success');
      setMessage(`Market ${side === 'buy' ? 'buy' : 'sell'} order placed successfully. View the completed order in Trade history.`);
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessageTone('error');
      setMessage(apiMessage || 'Unable to place the order.');
    } finally {
      setSubmittingSide(null);
    }
  };

  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 11px', borderRadius: 9, border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text };

  return <HybridTheme><Helmet><title>Chart | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ width: '100%', maxWidth: 1680, margin: '0 auto', padding: '18px 14px 28px', boxSizing: 'border-box' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    <section style={{ ...card, padding: 0, height: 'clamp(540px, 68vw, 860px)', overflow: 'hidden' }}><TradingViewChart themeMode={themeMode} /></section>
    <section style={{ ...card, width: '100%', maxWidth: 620, boxSizing: 'border-box', margin: '16px auto 0', display: 'grid', gap: 12 }}>
      <input required min="10" step="any" type="number" placeholder="USDT amount to trade (minimum 10 USDT)" value={usdtAmount} onChange={(event) => { setUsdtAmount(event.target.value); }} style={input} />
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><input min="0" step="any" type="number" placeholder="Take-profit price (optional)" value={takeProfitPrice} onChange={(event) => { setTakeProfitPrice(event.target.value); }} style={input} /><input min="0" step="any" type="number" placeholder="Stop-loss price (optional)" value={stopLossPrice} onChange={(event) => { setStopLossPrice(event.target.value); }} style={input} /></div>
      <div style={{ display: 'grid', gap: 4, color: theme.textMuted, fontSize: '0.85rem' }}><span>Market order: fills immediately at the current price</span><span>Take-profit and stop-loss close the position automatically when triggered</span><span>No additional charge is added to market orders</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <button type="button" disabled={submittingSide !== null} onClick={() => void submitOrder('buy')} style={{ padding: 12, border: 0, borderRadius: 9, background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: submittingSide === 'buy' ? 'wait' : 'pointer' }}>{submittingSide === 'buy' ? <InlineLoadingDots /> : 'Buy'}</button>
        <button type="button" disabled={submittingSide !== null} onClick={() => void submitOrder('sell')} style={{ padding: 12, border: 0, borderRadius: 9, background: theme.danger, color: theme.textInverse, fontWeight: 800, cursor: submittingSide === 'sell' ? 'wait' : 'pointer' }}>{submittingSide === 'sell' ? <InlineLoadingDots /> : 'Sell'}</button>
      </div>
      {message ? <NotificationBanner tone={messageTone} title="Trading" message={message} /> : null}
    </section>
  </main><NowBar /></div></HybridTheme>;
};

export default Chart;
