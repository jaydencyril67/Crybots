import React from 'react';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '118px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '1160px',
    margin: '0 auto',
    padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px',
    boxSizing: 'border-box' as const,
  },
  content: { display: 'grid', gap: '14px', marginTop: '10px' },
  section: { display: 'grid', gap: '10px' },
  sectionTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: theme.text },
  sectionText: { margin: 0, fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.4, maxWidth: '62ch' },
  buttonList: { display: 'grid', gap: '10px', marginTop: '6px' },
  cardButton: {
    display: 'grid', gridTemplateColumns: 'minmax(110px, 0.35fr) minmax(0, 1fr) auto', alignItems: 'center', gap: '14px', width: '100%', padding: '12px 14px', borderRadius: '14px',
    border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text,
    textAlign: 'left' as const, boxSizing: 'border-box' as const, cursor: 'pointer',
    backdropFilter: 'blur(24px) saturate(1.15)', WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
  cardSubtext: { margin: 0, fontSize: '0.84rem', color: theme.textMuted, lineHeight: 1.4, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
});

const pageButtons = [
  { label: 'Theme Settings', description: 'Choose your preferred app theme.', path: '/theme-settings' },
  { label: 'Nowbar Settings', description: 'Manage the NowBar experience.', path: '/nowbar-settings' },
  { label: 'Alert Settings', description: 'Choose notification topics and delivery methods.', path: '/alert-settings' },
];

const OptionsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Options</h2>
              <p style={styles.sectionText}>Customize your app experience and notification preferences.</p>
            </section>
            <div style={styles.buttonList}>
              {pageButtons.map(({ label, description, path }) => (
                <button key={label} type="button" style={styles.cardButton} onClick={() => navigate(path)}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{label}</h3>
                  <p style={styles.cardSubtext}>{description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default OptionsPage;
