import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

type Props = { mode: 'orders' | 'portfolio' | 'history' };

type Order = { _id: string; symbol: string; side: string; type: string; quantity: number; status: string; limitPrice?: number; executedPrice?: number; fee: number; createdAt: string };

const TradeRecordsPage = ({ mode }: Props) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const title = mode === 'orders' ? 'Open orders' : mode === 'history' ? 'Trade history' : 'Portfolio';
  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await api.get<{ orders: Order[] }>(mode === 'history' ? '/api/trading/history' : '/api/trading/orders', mode === 'orders' ? { params: { status: 'open' } } : undefined);
        if (active) setOrders(response.data.orders);
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [mode]);
  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  return <HybridTheme><Helmet><title>{title} | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 28px' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h1><p style={{ color: theme.textMuted }}>{mode === 'portfolio' ? 'Your exchange positions, account value, and fees.' : 'KingsHall exchange records for your account.'}</p>
    <section style={{ ...card, marginTop: 16 }}>{loading ? <LoadingDots /> : orders.length === 0 ? <p style={{ color: theme.textMuted }}>No records yet.</p> : <div style={{ display: 'grid', gap: 8 }}>{orders.map((order) => <article key={order._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, padding: 10, borderBottom: `1px solid ${theme.borderGlass}` }}><strong>{order.symbol}</strong><span>{order.side} · {order.type}</span><span>{order.quantity} · {order.status}</span><span>{order.fee} fee</span></article>)}</div>}</section>
  </main><NowBar /></div></HybridTheme>;
};
export default TradeRecordsPage;
