import React from 'react';
import { ArrowLeft, Coins, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { ...createHybridCardStyles(theme).card },
  performanceCard: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '12px' },
  chart: { height: 'clamp(260px, 58vw, 440px)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '16px', border: `1px dashed ${theme.borderGlass}`, color: theme.textMuted, fontSize: '0.82rem', textAlign: 'center' as const },
  chartTitle: { margin: 0, color: theme.text, fontSize: '1rem', fontWeight: 900 },
  listCard: { display: 'grid', gap: '8px', minWidth: 0, padding: '10px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', minWidth: 0, padding: '12px 13px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  listItemContent: { minWidth: 0 },
  movementHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const },
  selectWrap: { position: 'relative' as const, minWidth: '150px' },
  selectTrigger: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '10px 12px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  movementGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' },
  movementCard: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '9px' },
  movementLabel: { display: 'flex', alignItems: 'center', gap: '7px', margin: 0, fontSize: '0.82rem', fontWeight: 850 },
  movementValue: { margin: 0, fontSize: '1.2rem', fontWeight: 900 },
  label: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.3 },
  value: { margin: 0, fontSize: 'clamp(0.96rem, 2.5vw, 1.12rem)', fontWeight: 900, textAlign: 'right' as const, overflowWrap: 'anywhere' as const },
  note: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.7rem', lineHeight: 1.35 },
  icon: { display: 'inline-flex', flexShrink: 0, color: theme.primary },
  section: { display: 'grid', gap: '10px', marginTop: '16px' },
  sectionTitle: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
  disclaimer: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.5 },
});

const KingsPoolPage = () => {
  const { themeMode } = useAppTheme();
  const [movementPeriod, setMovementPeriod] = React.useState<'week' | 'month' | 'year'>('week');
  const [isMovementMenuOpen, setIsMovementMenuOpen] = React.useState(false);
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);

  return <HybridTheme><Helmet><title>KingsPool | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool performance</h2><div style={styles.performanceCard}><div style={styles.chart}><TrendingUp size={28} /><p style={styles.chartTitle}>KingsPool performance</p><span>Performance chart will appear when pool data is connected.</span></div></div></section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool overview</h2><div style={styles.listCard}>
      <div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.label}>Total funds in the pool</p><p style={styles.note}>Combined value of participating assets</p></div><Coins size={19} style={styles.icon} /><p style={styles.value}>— USDT</p></div>
      <div style={styles.listItem}><div style={styles.listItemContent}><p style={styles.label}>Total holders</p><p style={styles.note}>Active KingsPool participants</p></div><Users size={19} style={styles.icon} /><p style={styles.value}>—</p></div>
    </div></section>

    <section style={styles.section}>
      <div style={styles.movementHeader}>
        <h2 style={styles.sectionTitle}>Biggest market moves</h2>
        <div style={styles.selectWrap}>
          <button type="button" aria-label="Select market move period" style={styles.selectTrigger} onClick={() => setIsMovementMenuOpen((current) => !current)}>
            <span>{movementPeriod === 'week' ? 'This week' : movementPeriod === 'month' ? 'This month' : 'This year'}</span>
            <span style={{ transform: isMovementMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
          </button>
          {isMovementMenuOpen ? <div style={styles.selectMenu}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <button key={period} type="button" style={styles.selectOption} onClick={() => { setMovementPeriod(period); setIsMovementMenuOpen(false); }}>
                {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year'}
              </button>
            ))}
          </div> : null}
        </div>
      </div>
      <div style={styles.movementGrid}>
        <div style={styles.movementCard}>
          <p style={styles.movementLabel}><TrendingUp size={17} /> Biggest rise</p>
          <p style={styles.movementValue}>—</p>
          <p style={styles.note}>Highest move in the selected {movementPeriod}</p>
        </div>
        <div style={styles.movementCard}>
          <p style={styles.movementLabel}><TrendingDown size={17} /> Biggest fall</p>
          <p style={styles.movementValue}>—</p>
          <p style={styles.note}>Largest drop in the selected {movementPeriod}</p>
        </div>
      </div>
    </section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Risk notice</h2><div style={styles.card}><p style={styles.disclaimer}><TrendingDown size={16} /> Investment value can rise or fall. Returns are not guaranteed, and users may lose part or all of their invested funds.</p></div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default KingsPoolPage;
