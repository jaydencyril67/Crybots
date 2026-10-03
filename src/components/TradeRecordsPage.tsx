import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

type Props = { mode: 'orders' | 'portfolio' | 'history' };

type Order = { _id: string; symbol: string; side: string; type: string; quantity: number; status: string; limitPrice?: number; executedPrice?: number; fee: number; createdAt: string };
type Fill = { _id: string; side: string; quantity: number; price: number; fee: number; realizedPnl: number; createdAt: string };
type Portfolio = { price: number; balance: number; equity: number; unrealizedPnl: number; realizedPnl: number; positions: Array<{ quantity: number; averageEntryPrice: number; marketValue: number; unrealizedPnl: number; realizedPnl: number }> };

const TradeRecordsPage = ({ mode }: Props) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [fills, setFills] = React.useState<Fill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null);
  const title = mode === 'orders' ? 'Open trades' : mode === 'history' ? 'Trade history' : 'Portfolio';
  const loadRecords = React.useCallback(async (activeRef?: { current: boolean }) => {
    setMessage(null);
    try {
      if (mode === 'portfolio') {
        const response = await api.get<Portfolio>('/api/trading/portfolio');
        if (!activeRef || activeRef.current) setPortfolio(response.data);
      } else {
        const response = await api.get<{ orders: Order[]; fills?: Fill[] }>(mode === 'history' ? '/api/trading/history' : '/api/trading/orders', mode === 'orders' ? { params: { status: 'open' } } : undefined);
        if (!activeRef || activeRef.current) {
          setOrders(response.data.orders || []);
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

  const cancelOrder = async (orderId: string) => {
    try {
      await api.delete(`/api/trading/orders/${orderId}`);
      await loadRecords();
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(apiMessage || 'Unable to cancel this order.');
    }
  };

  React.useEffect(() => {
    const active = { current: true };
    setLoading(true);
    void loadRecords(active);
    const timer = window.setInterval(() => { void loadRecords(active); }, 15000);
    return () => {
      active.current = false;
      window.clearInterval(timer);
    };
  }, [loadRecords]);
  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  return <HybridTheme><Helmet><title>{title} | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 28px' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    {message ? <NotificationBanner tone="error" title="Trading records" message={message} /> : null}
    <section style={{ ...card, marginTop: 16 }}>{loading ? <LoadingDots /> : mode === 'portfolio' && portfolio ? <div style={{ display: 'grid', gap: 10 }}><strong>Live price: ${portfolio.price.toFixed(6)}</strong><span>Available USDT: {portfolio.balance.toFixed(2)}</span><span>Total equity: {portfolio.equity.toFixed(2)} USDT</span><span>Unrealized P&L: {portfolio.unrealizedPnl.toFixed(2)} USDT</span><span>Realized P&L: {portfolio.realizedPnl.toFixed(2)} USDT</span>{portfolio.positions.map((position, index) => <article key={index} style={{ paddingTop: 10, borderTop: `1px solid ${theme.borderGlass}` }}>Position: {position.quantity.toFixed(6)} KRN · Market value: {position.marketValue.toFixed(2)} · P&L: {position.unrealizedPnl.toFixed(2)}</article>)}</div> : orders.length === 0 ? <p style={{ color: theme.textMuted }}>{mode === 'orders' ? 'No open trades yet.' : 'No records yet.'}</p> : <div style={{ display: 'grid', gap: 8 }}>{orders.map((order) => <article key={order._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: 10, borderBottom: `1px solid ${theme.borderGlass}` }}><strong style={{ color: order.side === 'buy' ? theme.primary : theme.danger }}>{order.side === 'buy' ? 'BUY · RISE' : 'SELL · FALL'}</strong><span>{order.symbol}</span><span>{order.quantity} KRN · {order.status}</span><span>{order.limitPrice ? `Limit @ ${order.limitPrice}` : order.executedPrice ? `@ ${order.executedPrice}` : 'Prediction open'}</span><span>{order.fee} fee · {new Date(order.createdAt).toLocaleString()}</span>{mode === 'orders' && order.status === 'open' ? <button type="button" onClick={() => { void cancelOrder(order._id); }} style={{ padding: '7px 10px', border: `1px solid ${theme.borderGlass}`, borderRadius: 8, background: theme.background, color: theme.text, cursor: 'pointer' }}>Cancel</button> : null}</article>)}</div>}{mode === 'history' && fills.length > 0 ? <div style={{ display: 'grid', gap: 8, marginTop: 18 }}><strong>Fills</strong>{fills.map((fill) => <article key={fill._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: 10, borderTop: `1px solid ${theme.borderGlass}` }}><span>{fill.side} {fill.quantity} KRN</span><span>@ {fill.price}</span><span>Fee: {fill.fee}</span><span>Realized P&L: {fill.realizedPnl.toFixed(2)}</span></article>)}</div> : null}</section>
  </main><NowBar /></div></HybridTheme>;
};
export default TradeRecordsPage;
