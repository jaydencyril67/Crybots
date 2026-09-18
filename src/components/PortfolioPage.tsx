import React from 'react';
import AppHeader from './AppHeader';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '18px',
    marginTop: '18px',
  },
  section: {
    display: 'grid',
    gap: '10px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: theme.text,
  },
  sectionText: {
    margin: 0,
    fontSize: '0.92rem',
    color: theme.textMuted,
    lineHeight: 1.7,
    maxWidth: '62ch',
  },
  buttonList: {
    display: 'grid',
    gap: '10px',
    marginTop: '6px',
  },
  cardButton: {
    display: 'grid',
    gap: '6px',
    width: '100%',
    padding: '16px 18px',
    borderRadius: '18px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    color: theme.text,
    textAlign: 'left' as const,
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    boxShadow: `inset 0 1px 0 ${theme.highlight}, inset 0 -1px 0 ${theme.border}, 0 18px 34px ${theme.primarySoft}`,
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
  cardSubtext: {
    margin: 0,
    fontSize: '0.86rem',
    color: theme.textMuted,
    lineHeight: 1.6,
  },
});

const pageButtons = ['Details', 'Statistics', 'Security', 'Danger'];

const PortfolioPage = () => {
  const handleButtonClick = (label: string) => {
    if (label === 'Details') {
      navigate('/profile');
    }
    if (label === 'Security') {
      navigate('/security');
    }
    if (label === 'Danger') {
      navigate('/danger');
    }
  };

  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Portfolio</h2>
              <p style={styles.sectionText}>Select a section below. These are page actions for now, not navigation tabs.</p>
            </section>

            <div style={styles.buttonList}>
              {pageButtons.map((label) => (
                <button key={label} type="button" style={styles.cardButton} onClick={() => handleButtonClick(label)}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{label}</h3>
                  {label === 'Danger' ? <p style={styles.cardSubtext}>Account recovery and irreversible actions.</p> : null}
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

export default PortfolioPage;
