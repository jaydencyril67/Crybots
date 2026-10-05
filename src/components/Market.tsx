import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type Props = { mode: 'market' | 'portfolio' | 'history' };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  action: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.textInverse, background: theme.primary, cursor: 'pointer', flexShrink: 0 },
});

const categories = [
  { name: 'Commerce', description: 'Explore opportunities to buy, sell, and exchange goods and services.' },
  { name: 'Rentals', description: 'Discover flexible rental opportunities for products, spaces, and more.' },
  { name: 'Creation', description: 'Bring new ideas to life and build something valuable for the community.' },
];

const Market = (_props: Props) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  return (
    <HybridTheme mode={themeMode}>
      <Helmet><title>Market | KingsHall</title></Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/trade')}><ArrowLeft size={17} /> Trade</button>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>Explore the market</h2>
            <p style={styles.cardText}>Select one of the options below to get started.</p>
            <div style={styles.list}>
              {categories.map(({ name, description }) => {
                const isSelected = selectedCategory === name;
                return (
                  <div key={name} style={styles.row}>
                    <div>
                      <p style={styles.label}>{name}</p>
                      <p style={styles.description}>{description}</p>
                    </div>
                    <button type="button" style={{ ...styles.action, ...(isSelected ? { background: theme.success, borderColor: theme.success } : {}) }} onClick={() => setSelectedCategory(name)} aria-pressed={isSelected}>
                      {isSelected ? 'Selected' : 'Explore'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default Market;
