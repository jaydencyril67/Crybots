import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

type Props = { mode: 'orders' | 'portfolio' | 'history' };

type Order = { _id: string; symbol: string; side: 'buy' | 'sell'; quantity: number; status: 'open' | 'filled' | 'cancelled' | 'rejected'; executedPrice?: number; executedValue?: number; createdAt: string };
type Fill = { _id: string; side: string; quantity: number; price: number; value?: number; realizedPnl: number; createdAt: string };
type Position = { _id?: string; quantity: number; averageEntryPrice: number; marketValue: number; unrealizedPnl: number; realizedPnl: number };
type OpenPosition = Position & { availableQuantity: number };

const formatUsdt = (value: number) => `${value.toFixed(2)} USDT`;
const formatKrn = (value: number) => `${value.toFixed(6)} KRN`;
const formatPrice = (value: number) => `${value.toFixed(2)} USDT`;
const calculateLivePnl = (position: OpenPosition, currentPrice: number | null) => {
  if (currentPrice === null) return position.unrealizedPnl;
  const quantity = Math.abs(position.quantity);
  return position.quantity >= 0
    ? quantity * (currentPrice - position.averageEntryPrice)
    : quantity * (position.averageEntryPrice - currentPrice);
};

const metricRowStyle = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: `1px solid ${theme.borderGlass}` });
type Portfolio = { price: number; balance: number; equity: number; unrealizedPnl: number; realizedPnl: number; positions: Position[] };

const TradeRecordsPage = ({ mode }: Props) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [openPositions, setOpenPositions] = React.useState<OpenPosition[]>([]);
  const [fills, setFills] = React.useState<Fill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null);
  const [currentPrice, setCurrentPrice] = React.useState<number | null>(null);
  const title = mode === 'orders' ? 'Open trades' : mode === 'history' ? 'Trade history' : 'Portfolio';
  const loadRecords = React.useCallback(async (activeRef?: { current: boolean }) => {
    setMessage(null);
    try {
      if (mode === 'portfolio') {
        const response = await api.get<Portfolio>('/api/trading/portfolio');
        if (!activeRef || activeRef.current) setPortfolio(response.data);
      } else {
        const response = await api.get<{ orders: Order[]; fills?: Fill[]; positions?: OpenPosition[]; position?: OpenPosition | null; price?: number }>(mode === 'history' ? '/api/trading/history' : '/api/trading/orders', mode === 'orders' ? { params: { status: 'open' } } : undefined);
        if (!activeRef || activeRef.current) {
          setCurrentPrice(response.data.price ?? null);
          setOrders(response.data.orders || []);
          setOpenPositions(response.data.positions || (response.data.position ? [response.data.position] : []));
          setFills(response.data.fills || []);
        }
      }
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (!activeRef || activeRef.current) setMessage(apiMessage || 'Unable to load your trading records.');
    } finally {
      if (!activeRef || activeRef.current) setLoading(false);
    }
  }, [mode]);

  const closePosition = async (positionId?: string) => {
    if (!positionId) {
      setMessage('Unable to close this trade because its position ID is missing. Please refresh and try again.');
      return;
    }
    try {
      await api.post('/api/trading/orders/position/close', { positionId });
      await loadRecords();
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(apiMessage || 'Unable to close this trade.');
    }
  };

  React.useEffect(() => {
    const active = { current: true };
    setLoading(true);
    void loadRecords(active);
    if (mode !== 'orders') {
      return () => {
        active.current = false;
      };
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return () => {
        active.current = false;
      };
    }

    const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://kingshalls.onrender.com';
    const stream = new EventSource(`${apiBaseUrl}/api/trading/price/stream?token=${encodeURIComponent(token)}`);
    stream.addEventListener('market-price', (event) => {
      try {
        const payload = JSON.parse(event.data) as { price?: number };
        if (active.current && typeof payload.price === 'number' && Number.isFinite(payload.price)) {
          setCurrentPrice(payload.price);
        }
      } catch {
        // Ignore malformed stream messages and keep the current price.
      }
    });
    stream.onerror = () => {
      // EventSource automatically retries after a temporary connection failure.
    };

    return () => {
      active.current = false;
      stream.close();
    };
  }, [loadRecords, mode]);
  const cardStyles = createHybridCardStyles(theme);
  return <HybridTheme><Helmet><title>{title} | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 28px' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    {message ? <NotificationBanner tone="error" title="Trading records" message={message} /> : null}
    <section style={{ ...cardStyles.card, marginTop: 16 }}>{loading ? <LoadingDots /> : (mode === 'portfolio' && portfolio ? <div style={{ display: 'grid', gap: 10 }}><strong>Live price: ${portfolio.price.toFixed(6)}</strong><span>Available USDT: {portfolio.balance.toFixed(2)}</span><span>Total equity: {portfolio.equity.toFixed(2)} USDT</span><span>Unrealized P&L: {portfolio.unrealizedPnl.toFixed(2)} USDT</span><span>Realized P&L: {portfolio.realizedPnl.toFixed(2)} USDT</span>{portfolio.positions.map((position, index) => <article key={position._id || index} style={{ display: 'grid', gap: 8, paddingTop: 10, borderTop: `1px solid ${theme.borderGlass}` }}><strong>Open KRN trade</strong><span>{position.quantity.toFixed(6)} KRN · Entry: {position.averageEntryPrice.toFixed(6)} · Market value: {position.marketValue.toFixed(2)} USDT</span><span style={{ color: position.unrealizedPnl >= 0 ? theme.primary : theme.danger }}>Unrealized P&L: {position.unrealizedPnl.toFixed(2)} USDT</span><button type="button" onClick={() => { void closePosition(position._id); }} style={{ width: 'fit-content', padding: '7px 10px', border: 0, borderRadius: 8, background: theme.danger, color: theme.textInverse, cursor: 'pointer' }}>Close trade</button></article>)}</div> : mode === 'orders' ? <div style={{ display: 'grid', gap: 10 }}>{openPositions.map((openPosition, index) => <article key={openPosition._id || index} style={{ ...cardStyles.panel, display: 'grid', gap: 2 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 10 }}><strong>{openPosition.quantity >= 0 ? 'BUY · RISE' : 'SELL · FALL'}</strong><span style={{ color: theme.textMuted }}>{formatKrn(Math.abs(openPosition.quantity))}</span></div><div style={metricRowStyle(theme)}><span style={{ color: theme.textMuted }}>Order Amount</span><strong>{formatUsdt(Math.abs(openPosition.quantity) * openPosition.averageEntryPrice)}</strong></div><div style={metricRowStyle(theme)}><span style={{ color: theme.textMuted }}>Entry Price</span><strong>{formatPrice(openPosition.averageEntryPrice)}</strong></div><div style={metricRowStyle(theme)}><span style={{ color: theme.textMuted }}>Current Price</span><strong>{currentPrice === null ? '—' : formatPrice(currentPrice)}</strong></div><div style={{ ...metricRowStyle(theme), borderBottom: 0 }}><span style={{ color: theme.textMuted }}>Live P&amp;L</span><strong style={{ color: calculateLivePnl(openPosition, currentPrice) >= 0 ? theme.primary : theme.danger }}>{formatUsdt(calculateLivePnl(openPosition, currentPrice))}</strong></div><button type="button" onClick={() => { void closePosition(openPosition._id); }} style={{ width: 'fit-content', marginTop: 10, padding: '8px 12px', border: 0, borderRadius: 8, background: theme.danger, color: theme.textInverse, cursor: 'pointer' }}>Close trade</button></article>)}{openPositions.length === 0 && orders.length === 0 ? <p style={{ color: theme.textMuted }}>No open trades yet.</p> : orders.map((order) => <article key={order._id} style={{ ...cardStyles.panel, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}><strong style={{ color: order.side === 'buy' ? theme.primary : theme.danger }}>{order.side === 'buy' ? 'BUY · RISE' : 'SELL · FALL'}</strong><span>{order.symbol}</span><span>{order.quantity.toFixed(6)} KRN · {order.status}</span><span>{order.executedPrice ? `Bought/sold @ ${order.executedPrice.toFixed(6)} · Value ${(order.executedValue || order.quantity * order.executedPrice).toFixed(6)} USDT` : 'Market trade'}</span><span>{new Date(order.createdAt).toLocaleString()}</span></article>)}</div> : orders.length === 0 ? <p style={{ color: theme.textMuted }}>No records yet.</p> : <div style={{ display: 'grid', gap: 8 }}>{orders.map((order) => <article key={order._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: 10, borderBottom: `1px solid ${theme.borderGlass}` }}><strong style={{ color: order.side === 'buy' ? theme.primary : theme.danger }}>{order.side === 'buy' ? 'BUY · RISE' : 'SELL · FALL'}</strong><span>{order.symbol}</span><span>{order.quantity.toFixed(6)} KRN · {order.status}</span><span>{order.executedPrice ? `Traded @ ${order.executedPrice.toFixed(6)} · Value ${(order.executedValue || order.quantity * order.executedPrice).toFixed(6)} USDT` : 'Market trade'}</span><span>{new Date(order.createdAt).toLocaleString()}</span></article>)}</div>)}{mode === 'history' && fills.length > 0 ? <div style={{ display: 'grid', gap: 8, marginTop: 18 }}><strong>Fills</strong>{fills.map((fill) => <article key={fill._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: 10, borderTop: `1px solid ${theme.borderGlass}` }}><span>{fill.side.toUpperCase()} · {fill.quantity.toFixed(6)} KRN</span><span>Entry/execution @ {fill.price.toFixed(6)} · Value {(fill.value || fill.quantity * fill.price).toFixed(6)} USDT</span><span>{new Date(fill.createdAt).toLocaleString()}</span><span>Realized P&L: {fill.realizedPnl.toFixed(2)} USDT</span></article>)}</div> : null}</section>
  </main><NowBar /></div></HybridTheme>;
};
export default TradeRecordsPage;
