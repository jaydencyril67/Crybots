import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

const Portfolio = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  return (
    <HybridTheme mode={themeMode}>
      <Helmet><title>Portfolio | KingsHall</title></Helmet>
      <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' }}>
        <div style={{ width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
          <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }} onClick={() => navigate('/trade')}><ArrowLeft size={17} /> Trade</button>
          <section style={{ marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850 }}>Portfolio</h2>
            <p style={{ margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 }}>Review your balances, positions, and trading performance.</p>
            <div style={{ padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem' }}>No portfolio data available</p>
              <p style={{ margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 }}>Trading records will appear here when activity is available.</p>
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default Portfolio;
