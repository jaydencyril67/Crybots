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
  const title = mode === 'orders' ? 'Open orders' : mode === 'history' ? 'Trade history' : 'Portfolio';
  const cancelOrder = async (orderId: string) => {
    try {
      await api.delete(`/api/trading/orders/${orderId}`);
      setOrders((current) => current.filter((order) => order._id !== orderId));
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(apiMessage || 'Unable to cancel this order.');
    }
  };

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (mode === 'portfolio') {
          const response = await api.get<Portfolio>('/api/trading/portfolio');
          if (active) setPortfolio(response.data);
        } else {
          const response = await api.get<{ orders: Order[]; fills?: Fill[] }>(mode === 'history' ? '/api/trading/history' : '/api/trading/orders', mode === 'orders' ? { params: { status: 'open' } } : undefined);
          if (active) {
            setOrders(response.data.orders);
            setFills(response.data.fills || []);
          }
        }
      } catch (error) {
        if (active) {
          const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setMessage(apiMessage || 'Unable to load your trading records.');
        }
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [mode]);
  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  return <HybridTheme><Helmet><title>{title} | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 28px' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    {message ? <NotificationBanner tone="error" title="Trading records" message={message} /> : null}
    <section style={{ ...card, marginTop: 16 }}>{loading ? <LoadingDots /> : mode === 'portfolio' && portfolio ? <div style={{ display: 'grid', gap: 10 }}><strong>Live price: ${portfolio.price.toFixed(6)}</strong><span>Available USDT: {portfolio.balance.toFixed(2)}</span><span>Total equity: {portfolio.equity.toFixed(2)} USDT</span><span>Unrealized P&L: {portfolio.unrealizedPnl.toFixed(2)} USDT</span><span>Realized P&L: {portfolio.realizedPnl.toFixed(2)} USDT</span>{portfolio.positions.map((position, index) => <article key={index} style={{ paddingTop: 10, borderTop: `1px solid ${theme.borderGlass}` }}>Position: {position.quantity.toFixed(6)} KRN · Market value: {position.marketValue.toFixed(2)} · P&L: {position.unrealizedPnl.toFixed(2)}</article>)}</div> : orders.length === 0 ? <p style={{ color: theme.textMuted }}>No records yet.</p> : <div style={{ display: 'grid', gap: 8 }}>{orders.map((order) => <article key={order._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: 10, borderBottom: `1px solid ${theme.borderGlass}` }}><strong>{order.symbol}</strong><span>{order.side} · {order.type}</span><span>{order.quantity} · {order.status}</span><span>{order.executedPrice ? `@ ${order.executedPrice}` : 'Open'}</span><span>{order.fee} fee</span>{mode === 'orders' && order.status === 'open' ? <button type="button" onClick={() => { void cancelOrder(order._id); }} style={{ padding: '7px 10px', border: `1px solid ${theme.borderGlass}`, borderRadius: 8, background: theme.background, color: theme.text, cursor: 'pointer' }}>Cancel</button> : null}</article>)}</div>}{mode === 'history' && fills.length > 0 ? <div style={{ display: 'grid', gap: 8, marginTop: 18 }}><strong>Fills</strong>{fills.map((fill) => <article key={fill._id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, padding: 10, borderTop: `1px solid ${theme.borderGlass}` }}><span>{fill.side} {fill.quantity} KRN</span><span>@ {fill.price}</span><span>Fee: {fill.fee}</span><span>Realized P&L: {fill.realizedPnl.toFixed(2)}</span></article>)}</div> : null}</section>
  </main><NowBar /></div></HybridTheme>;
};
export default TradeRecordsPage;
