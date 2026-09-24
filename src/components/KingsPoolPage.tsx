import React from 'react';
import { Activity, ArrowLeft, Coins, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' },
  card: { minWidth: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: '14px', padding: '14px', background: theme.surfaceGlass, backdropFilter: 'blur(20px)' },
  label: { margin: 0, color: theme.textMuted, fontSize: '0.78rem' },
  value: { margin: '7px 0 0', fontSize: 'clamp(1.1rem, 3vw, 1.45rem)', fontWeight: 900, overflowWrap: 'anywhere' as const },
  note: { margin: '5px 0 0', color: theme.textMuted, fontSize: '0.72rem' },
  icon: { display: 'inline-flex', padding: '8px', borderRadius: '10px', color: theme.primary, background: theme.surfaceMuted },
  section: { display: 'grid', gap: '10px', marginTop: '16px' },
  sectionTitle: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
  position: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
  metric: { padding: '12px', borderRadius: '12px', background: theme.surfaceMuted },
  metricLabel: { margin: 0, color: theme.textMuted, fontSize: '0.74rem' },
  metricValue: { margin: '5px 0 0', fontWeight: 900, overflowWrap: 'anywhere' as const },
  chart: { height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: `1px dashed ${theme.borderGlass}`, color: theme.textMuted, fontSize: '0.82rem', textAlign: 'center' as const },
  steps: { display: 'grid', gap: '9px', margin: 0, paddingLeft: '20px', color: theme.textMuted, fontSize: '0.84rem', lineHeight: 1.5 },
  disclaimer: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.5 },
});

const KingsPoolPage = () => {
  const { themeMode } = useAppTheme();
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);

  return <HybridTheme><Helmet><title>KingsPool | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>

    <div style={styles.grid}>
      <div style={styles.card}><span style={styles.icon}><Coins size={19} /></span><p style={styles.label}>Total in pool</p><p style={styles.value}>— USDT</p><p style={styles.note}>Awaiting live pool data</p></div>
      <div style={styles.card}><span style={styles.icon}><Users size={19} /></span><p style={styles.label}>Total users</p><p style={styles.value}>—</p><p style={styles.note}>Active pool participants</p></div>
      <div style={styles.card}><span style={styles.icon}><Activity size={19} /></span><p style={styles.label}>Pool performance</p><p style={styles.value}>—</p><p style={styles.note}>Current gain or loss</p></div>
    </div>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Your KingsPool position</h2><div style={{ ...styles.card, ...styles.position }}>
      <div style={styles.metric}><p style={styles.metricLabel}>Your investment</p><p style={styles.metricValue}>— USDT</p></div>
      <div style={styles.metric}><p style={styles.metricLabel}>Current value</p><p style={styles.metricValue}>— USDT</p></div>
      <div style={styles.metric}><p style={styles.metricLabel}>Your profit/loss</p><p style={styles.metricValue}>—</p></div>
      <div style={styles.metric}><p style={styles.metricLabel}>Pool share</p><p style={styles.metricValue}>—</p></div>
    </div></section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Pool performance</h2><div style={styles.card}><div style={styles.chart}><TrendingUp size={20} /> Performance chart will appear when pool data is connected.</div></div></section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>What is happening in the pool?</h2><div style={styles.card}><p style={styles.disclaimer}>KingsHall manages one shared trading strategy for participating users. Pool gains and losses will be reflected proportionally in each user’s position.</p><ul style={styles.steps}><li>Users deposit supported crypto.</li><li>Deposited funds are allocated to KingsPool.</li><li>KingsHall trades the pooled assets.</li><li>Each user’s value changes with the pool’s performance.</li></ul></div></section>

    <section style={styles.section}><h2 style={styles.sectionTitle}>Risk notice</h2><div style={styles.card}><p style={styles.disclaimer}><TrendingDown size={16} /> Investment value can rise or fall. Returns are not guaranteed, and users may lose part or all of their invested funds.</p></div></section>
  </div><NowBar /></div></HybridTheme>;
};

export default KingsPoolPage;
