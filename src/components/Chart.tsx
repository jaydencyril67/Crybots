import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import TradingViewChart from './TradingViewChart';
import { useAppTheme } from './AppTheme';
type TradingViewMover = {
  symbol: string;
  name: string;
  change: number;
  price: number | null;
};

const Chart = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [movers, setMovers] = React.useState<TradingViewMover[]>([]);
  const [moversLoading, setMoversLoading] = React.useState(true);
  const [moversError, setMoversError] = React.useState('');

  const loadMovers = React.useCallback(async () => {
    setMoversLoading(true);
    setMoversError('');
    try {
      const response = await fetch('https://scanner.tradingview.com/crypto/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter: [
            { left: 'change', operation: 'in_range', right: [1.5, 3] },
          ],
          columns: ['name', 'description', 'close', 'change'],
          sort: { sortBy: 'change', sortOrder: 'asc' },
          options: { lang: 'en' },
          range: [0, 30],
        }),
      });
      if (!response.ok) throw new Error('TradingView scanner request failed');
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const nextMovers = rows
        .map((row: any) => {
          const values = Array.isArray(row?.d) ? row.d : [];
          return {
            symbol: String(row?.s || values[0] || ''),
            name: String(values[1] || row?.s || ''),
            price: Number.isFinite(Number(values[2])) ? Number(values[2]) : null,
            change: Number(values[3]),
          };
        })
        .filter((item: TradingViewMover) => Number.isFinite(item.change) && item.change >= 1.5 && item.change <= 3)
        .sort((a: TradingViewMover, b: TradingViewMover) => a.change - b.change);
      setMovers(nextMovers);
    } catch {
      setMoversError('Unable to load TradingView 24h movers right now.');
      setMovers([]);
    } finally {
      setMoversLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadMovers();
    const timer = window.setInterval(() => { void loadMovers(); }, 60000);
    return () => window.clearInterval(timer);
  }, [loadMovers]);
  const card: React.CSSProperties = { padding: 16, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  return <HybridTheme><Helmet><title>Chart | KingsHall</title></Helmet><div style={{ minHeight: '100vh', paddingBottom: 90, background: theme.background, color: theme.text }}><main style={{ width: '100%', maxWidth: 1680, margin: '0 auto', padding: '18px 14px 28px', boxSizing: 'border-box' }}>
    <button type="button" onClick={() => navigate('/trade')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 11px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Trade</button>
    <section style={{ ...card, padding: 0, height: 'clamp(620px, 78vw, 1000px)', overflow: 'hidden' }}><TradingViewChart themeMode={themeMode} /></section>
    <section style={{ ...card, marginTop: 14 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>24H Movers</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.textMuted }}>TradingView assets with a 24h change between +1.5% and +3%</p>
      </div>
      {moversLoading ? <div style={{ padding: '18px 4px', textAlign: 'center', fontSize: 13, color: theme.textMuted }}>Scanning TradingView…</div> : moversError ? <div style={{ padding: '14px 12px', borderRadius: 10, background: theme.surfaceGlass, color: theme.textMuted, fontSize: 13 }}>{moversError}</div> : movers.length === 0 ? <div style={{ padding: '18px 4px', textAlign: 'center', fontSize: 13, color: theme.textMuted }}>No assets currently match the +1.5% to +3% range.</div> : <div style={{ display: 'grid', gap: 8 }}>{movers.map((item) => <div key={item.symbol} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 11, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.symbol}</div><div style={{ marginTop: 3, fontSize: 11, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 900 }}>+{item.change.toFixed(2)}%</div>{item.price !== null ? <div style={{ marginTop: 3, fontSize: 11, color: theme.textMuted }}>{item.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</div> : null}</div></div>)}</div>}
    </section>
  </main><NowBar /></div></HybridTheme>;
};

export default Chart;
