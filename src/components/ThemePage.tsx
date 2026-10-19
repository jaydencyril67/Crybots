import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';

const ThemePage = () => {
  const theme = HYBRID_THEME_TOKENS.dark;
  const styles = {
    page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
    back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    card: { marginTop: '22px', padding: '18px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    heading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
    description: { margin: '8px 0 0', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
    active: { display: 'flex', alignItems: 'center', gap: '9px', marginTop: '16px', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceElevated, fontWeight: 800, fontSize: '0.9rem' },
  };
  return (
    <HybridTheme>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/options')}><ArrowLeft size={17} /> Options</button>
          <section style={styles.card}>
            <h2 style={styles.heading}>Appearance</h2>
            <p style={styles.description}>CryBots uses its dark glass theme throughout the app. Light, system-following, and scheduled theme switching have been removed.</p>
            <div style={styles.active}><Check size={17} /> Dark theme is always enabled</div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default ThemePage;
