import React from 'react';
import { ArrowLeft, BriefcaseBusiness, Home, Lightbulb } from 'lucide-react';
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
  title: { margin: '20px 0 0', fontSize: '1.15rem', fontWeight: 900 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  rowContent: { minWidth: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  action: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.textInverse, background: theme.primary, cursor: 'pointer', flexShrink: 0 },
  icon: { display: 'grid', placeItems: 'center', width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: theme.surfaceMuted, color: theme.primary },
  rowContentWithIcon: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 },
});

const categories = [
  { name: 'Commerce', description: 'Explore opportunities to buy, sell, and exchange goods and services.', icon: BriefcaseBusiness },
  { name: 'Rentals', description: 'Discover flexible rental opportunities for products, spaces, and more.', icon: Home },
  { name: 'Creation', description: 'Bring new ideas to life and build something valuable for the community.', icon: Lightbulb },
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
          <h1 style={styles.title}>Market</h1>
          <p style={styles.text}>Choose a market category to discover new opportunities across KingsHall Exchange.</p>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>Explore the market</h2>
            <p style={styles.cardText}>Select one of the options below to get started.</p>
            <div style={styles.list}>
              {categories.map(({ name, description, icon: Icon }) => {
                const isSelected = selectedCategory === name;
                return (
                  <div key={name} style={styles.row}>
                    <div style={styles.rowContentWithIcon}>
                      <div style={styles.icon}><Icon size={22} /></div>
                      <div style={styles.rowContent}>
                        <p style={styles.label}>{name}</p>
                        <p style={styles.description}>{description}</p>
                      </div>
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
