import React from 'react';
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
    maxWidth: '1160px',
    margin: '0 auto',
    padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px',
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
  cardGrid: {
    display: 'grid',
    gap: '10px',
    marginTop: '6px',
  },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(110px, 0.35fr) minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    borderRadius: '14px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    color: theme.text,
    textAlign: 'left' as const,
    boxSizing: 'border-box' as const,
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 850,
    whiteSpace: 'nowrap' as const,
  },
  cardSubtext: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.84rem',
    lineHeight: 1.4,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  viewButton: {
    borderRadius: '999px',
    border: `1px solid ${theme.borderGlass}`,
    padding: '7px 12px',
    fontSize: '0.82rem',
    fontWeight: 800,
    color: theme.text,
    background: theme.surfaceMuted,
    cursor: 'pointer',
    justifySelf: 'end',
  },
  status: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.84rem',
  },
});

const LogoutPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Logout</h2>
            </section>

            <div style={styles.cardGrid} aria-label="Logout options">
              <article style={styles.card}>
                <h3 style={styles.cardTitle}>Auto Logout</h3>
                <p style={styles.cardSubtext}>Choose idle or scheduled session exits.</p>
                <button type="button" style={styles.viewButton} onClick={() => navigate('/auto-logout')}>View</button>
              </article>
              <article style={styles.card}>
                <h3 style={styles.cardTitle}>Manual Logout</h3>
                <p style={styles.cardSubtext}>Review the warning before ending your session.</p>
                <button type="button" style={styles.viewButton} onClick={() => navigate('/manual-logout')}>View</button>
              </article>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default LogoutPage;
