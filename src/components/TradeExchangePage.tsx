import React from 'react';
import { ArrowLeft, CheckCircle2, Clock3, RefreshCw, TrendingUp, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

const MARKET_SERVICE_URL = process.env.REACT_APP_MARKET_SERVICE_URL || process.env.MARKET_SERVICE_URL || 'https://market-matb.onrender.com';

type TradingOrder = {
  _id: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  filledQuantity?: number;
  limitPrice?: number;
  executedPrice?: number;
  fee?: number;
  status: string;
  createdAt?: string;
};

type TradingPosition = {
  quantity: number;
  availableQuantity?: number;
  averageEntryPrice: number;
  unrealizedPnl: number;
  marketValue: number;
  realizedPnl: number;
  fees: number;
};

type TradingAccount = {
  price: number;
  balance: number;
  reservedBalance?: number;
  feeRate: number;
  position?: TradingPosition | null;
  orders: TradingOrder[];
};

const TradeExchangePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const symbol = 'KRN/USDT';
  const [side, setSide] = React.useState<'buy' | 'sell'>('buy');
  const [type, setType] = React.useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = React.useState('');
  const [limitPrice, setLimitPrice] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageTone, setMessageTone] = React.useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = React.useState(false);
  const pendingClientOrderId = React.useRef<string | null>(null);
  const pendingOrderKey = React.useRef<string | null>(null);
  const [account, setAccount] = React.useState<TradingAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = React.useState(true);
  const [accountError, setAccountError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = React.useState<string | null>(null);
  const [openSelector, setOpenSelector] = React.useState<'side' | 'type' | null>(null);

  React.useEffect(() => {
    const handleOutsideClick = () => setOpenSelector(null);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadAccount = React.useCallback(async () => {
    setLoadingAccount(true);
    try {
      const response = await api.get('/api/trading/account');
      setAccount(response.data as TradingAccount);
      setAccountError(null);
      setLastUpdated(new Date());
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAccountError(apiMessage || 'Unable to load live trading data.');
    } finally {
      setLoadingAccount(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAccount();
    const timer = window.setInterval(() => { void loadAccount(); }, 10000);
    return () => window.clearInterval(timer);
  }, [loadAccount]);

  const cancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    setMessage(null);
    setMessageTone('success');
    try {
      await api.delete(`/api/trading/orders/${orderId}`);
      setMessage('Open order cancelled and reserved funds released.');
      await loadAccount();
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessageTone('error');
      setMessage(apiMessage || 'Unable to cancel the open order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const closePosition = async () => {
    setSubmitting(true);
    setMessage(null);
    setMessageTone('success');
    try {
      await api.post('/api/trading/orders/position/close');
      setMessage('Position closed successfully.');
      await loadAccount();
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessageTone('error');
      setMessage(apiMessage || 'Unable to close the position.');
    } finally { setSubmitting(false); }
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setMessageTone('error');
    try {
      const enteredAmount = Number(quantity);
      const executionPrice = side === 'buy' && type === 'limit' ? Number(limitPrice) : account?.price || 0;
      const orderQuantity = side === 'buy' ? enteredAmount / executionPrice : enteredAmount;
      if (!Number.isFinite(orderQuantity) || orderQuantity <= 0) {
        setMessage(side === 'buy' ? 'Enter a valid USDT amount and wait for the live price to load.' : 'Enter a valid KRN quantity.');
        return;
      }
      const orderKey = `${symbol}:${side}:${type}:${quantity}:${limitPrice}`;
      if (pendingOrderKey.current !== orderKey) {
        pendingClientOrderId.current = null;
        pendingOrderKey.current = orderKey;
      }
      const clientOrderId = pendingClientOrderId.current || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
      pendingClientOrderId.current = clientOrderId;
      await api.post('/api/trading/orders', { symbol, clientOrderId, side, type, quantity: orderQuantity, ...(type === 'limit' ? { limitPrice: Number(limitPrice) } : {}) });
      pendingClientOrderId.current = null;
      pendingOrderKey.current = null;
      setQuantity('');
      setLimitPrice('');
      setMessageTone('success');
      setMessage('Order accepted and executed or added to open orders.');
      await loadAccount();
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(apiMessage || 'Unable to submit the order. You can retry safely.');
    } finally {
      setSubmitting(false);
    }
  };

  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 11px', borderRadius: 9, border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text };
  const selectorField: React.CSSProperties = { position: 'relative', display: 'grid', gap: 6 };
  const selectorTrigger: React.CSSProperties = { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: 14, padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' };
  const selectorMenu: React.CSSProperties = { position: 'absolute', zIndex: 20, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: 6, padding: 8, borderRadius: 16, background: theme.background, border: `1px solid ${theme.borderGlass}`, transformOrigin: 'top', maxHeight: 260, overflowY: 'auto', boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)' };
  const selectorOption: React.CSSProperties = { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: 12, padding: '10px 12px', width: '100%', textAlign: 'left', cursor: 'pointer' };
  const toggleSelector = (selector: 'side' | 'type') => setOpenSelector((current) => current === selector ? null : selector);

  return <HybridTheme><Helmet><title>Exchange | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ width: '100%', maxWidth: 1680, margin: '0 auto', padding: '18px 14px 28px', boxSizing: 'border-box' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    <section style={{ ...card, marginTop: 16 }}><iframe title="KingsHall live market chart" src={MARKET_SERVICE_URL} style={{ width: '100%', height: 'clamp(520px, 75vw, 900px)', border: 0, borderRadius: 10, display: 'block' }} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></section>
    <form onSubmit={submitOrder} style={{ ...card, width: '100%', maxWidth: 1180, boxSizing: 'border-box', margin: '16px auto 0', display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: '1rem' }}>Place order</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <div style={selectorField} onMouseDown={(event) => event.stopPropagation()}>
          <span style={{ color: theme.textMuted, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Side</span>
          <button type="button" style={selectorTrigger} onClick={() => toggleSelector('side')}><span>{side === 'buy' ? 'Buy' : 'Sell'}</span><span style={{ transform: openSelector === 'side' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span></button>
          {openSelector === 'side' ? <div style={selectorMenu}>{(['buy', 'sell'] as const).map((option) => <button key={option} type="button" style={selectorOption} onClick={() => { setSide(option); setOpenSelector(null); }}>{option === 'buy' ? 'Buy' : 'Sell'}</button>)}</div> : null}
        </div>
        <div style={selectorField} onMouseDown={(event) => event.stopPropagation()}>
          <span style={{ color: theme.textMuted, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order type</span>
          <button type="button" style={selectorTrigger} onClick={() => toggleSelector('type')}><span>{type === 'market' ? 'Market' : 'Limit'}</span><span style={{ transform: openSelector === 'type' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span></button>
          {openSelector === 'type' ? <div style={selectorMenu}>{(['market', 'limit'] as const).map((option) => <button key={option} type="button" style={selectorOption} onClick={() => { setType(option); setOpenSelector(null); }}>{option === 'market' ? 'Market' : 'Limit'}</button>)}</div> : null}
        </div>
      </div>
      <input required min="0" step="any" type="number" placeholder={side === 'buy' ? 'USDT amount' : 'KRN quantity'} value={quantity} onChange={(event) => setQuantity(event.target.value)} style={input} />
      {type === 'limit' ? <input required min="0" step="any" type="number" placeholder="Limit price" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} style={input} /> : null}
      <button type="submit" disabled={submitting} style={{ padding: 11, border: 0, borderRadius: 9, background: side === 'buy' ? theme.primary : theme.danger, color: theme.textInverse, fontWeight: 800 }}>{submitting ? 'Submitting…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}</button>
      {message ? <NotificationBanner tone={messageTone} title="Trading" message={message} /> : null}
    </form>
    <section style={{ ...card, marginTop: 16, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><h2 style={{ margin: 0, fontSize: '1.05rem' }}>Trading dashboard</h2><span style={{ color: theme.textMuted, fontSize: '0.78rem' }}>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for live market data'}</span></div>
        <button type="button" onClick={() => void loadAccount()} disabled={loadingAccount} aria-label="Refresh trading data" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 11px', border: `1px solid ${theme.borderGlass}`, borderRadius: 9, background: theme.surfaceGlass, color: theme.text, cursor: loadingAccount ? 'wait' : 'pointer' }}><RefreshCw size={15} style={{ transform: loadingAccount ? 'rotate(180deg)' : 'none' }} /> Refresh</button>
      </div>
      {accountError ? <NotificationBanner tone="error" title="Trading data unavailable" message={accountError} /> : null}
      {loadingAccount && !account ? <span style={{ color: theme.textMuted }}>Loading your live orders and position…</span> : null}
      {account ? <>
        {(() => {
          const openOrders = (account.orders || []).filter((order) => order.status.toLowerCase() === 'open');
          const position = account.position && account.position.quantity > 0 ? account.position : null;
          const pnlPercent = position && position.averageEntryPrice > 0 ? (position.unrealizedPnl / (position.averageEntryPrice * position.quantity)) * 100 : 0;
          return <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 9 }}>
          {[['Live price', `${account.price.toFixed(6)}`], ['Available USDT', `${account.balance.toFixed(2)} USDT`], ['Reserved USDT', `${(account.reservedBalance || 0).toFixed(2)} USDT`], ['Fees', `${(account.feeRate * 100).toFixed(2)}%`]].map(([label, value]) => <div key={label} style={{ padding: 12, borderRadius: 10, background: theme.background, border: `1px solid ${theme.borderGlass}` }}><span style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span><strong style={{ display: 'block', marginTop: 5 }}>{value}</strong></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 12, background: theme.background, border: `1px solid ${theme.borderGlass}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>Open position</strong>{position ? <TrendingUp size={18} color={theme.primary} /> : <CheckCircle2 size={18} color={theme.textMuted} />}</div><div style={{ marginTop: 10, fontSize: '1.25rem', fontWeight: 800 }}>{position?.quantity?.toFixed(6) || '0.000000'} KRN</div><span style={{ color: theme.textMuted, fontSize: '0.82rem' }}>Entry: ${position?.averageEntryPrice?.toFixed(6) || '0.000000'} · Value: {position?.marketValue?.toFixed(2) || '0.00'} USDT</span></div>
          <div style={{ padding: 14, borderRadius: 12, background: theme.background, border: `1px solid ${theme.borderGlass}` }}><strong>Live P&L</strong><div style={{ marginTop: 10, fontSize: '1.25rem', fontWeight: 800, color: (position?.unrealizedPnl || 0) >= 0 ? theme.primary : theme.danger }}>{(position?.unrealizedPnl || 0) >= 0 ? '+' : ''}{(position?.unrealizedPnl || 0).toFixed(2)} USDT</div><span style={{ color: theme.textMuted, fontSize: '0.82rem' }}>({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%) · Realized: {(position?.realizedPnl || 0).toFixed(2)} USDT · Fees: {(position?.fees || 0).toFixed(2)} USDT</span></div>
        </div>
        {position ? <button type="button" onClick={closePosition} disabled={submitting} style={{ padding: 11, border: 0, borderRadius: 9, background: theme.danger, color: theme.textInverse, fontWeight: 800 }}>{submitting ? 'Closing…' : 'Close available position'}</button> : null}
        <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}><h3 style={{ margin: 0, fontSize: '0.95rem' }}>Open orders ({openOrders.length})</h3><Clock3 size={17} color={theme.textMuted} /></div>{openOrders.length ? <div style={{ display: 'grid', gap: 8 }}>{openOrders.map((order) => <div key={order._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', alignItems: 'center', gap: 8, padding: 11, borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.background }}><strong style={{ color: order.side === 'buy' ? theme.primary : theme.danger }}>{order.side.toUpperCase()} · {order.type.toUpperCase()}</strong><span>{order.quantity.toFixed(6)} KRN</span><span>{order.limitPrice ? `${order.limitPrice.toFixed(6)}` : 'Market'}</span><button type="button" onClick={() => void cancelOrder(order._id)} disabled={cancellingOrderId === order._id} style={{ justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 9px', border: `1px solid ${theme.borderGlass}`, borderRadius: 8, background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><X size={14} />{cancellingOrderId === order._id ? 'Cancelling…' : 'Cancel'}</button></div>)}</div> : <span style={{ color: theme.textMuted, fontSize: '0.86rem' }}>No open orders. New limit orders will appear here until they fill or are cancelled.</span>}</div>
          </>;
        })()}
      </> : null}
    </section>
  </main><NowBar /></div></HybridTheme>;
};

export default TradeExchangePage;
