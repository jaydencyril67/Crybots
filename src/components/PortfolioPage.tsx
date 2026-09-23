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
  sectionText: {
    margin: 0,
    fontSize: '0.92rem',
    color: theme.textMuted,
    lineHeight: 1.7,
    maxWidth: '62ch',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '14px',
    marginTop: '6px',
  },
  card: {
    display: 'grid',
    gap: '14px',
    padding: '18px',
    borderRadius: '18px',
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
    fontSize: '1rem',
    fontWeight: 850,
  },
  cardSubtext: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.86rem',
    lineHeight: 1.6,
    minHeight: '66px',
  },
  viewButton: {
    borderRadius: '999px',
    border: `1px solid ${theme.borderGlass}`,
    padding: '9px 13px',
    fontWeight: 800,
    color: theme.text,
    background: theme.surfaceMuted,
    cursor: 'pointer',
    justifySelf: 'start',
  },
});

const pageButtons = [
  { label: 'Details', description: 'View and manage your personal profile information.', route: '/profile' },
  { label: 'Statistics', description: 'Review your deposits, withdrawals, transfers, activity, and account totals.', route: '/portfolio/statistics' },
  { label: 'Security', description: 'Manage your password, two-factor authentication, sessions, and security controls.', route: '/security' },
  { label: 'Danger', description: 'Access account recovery and irreversible account actions.', route: '/danger' },
];

const PortfolioPage = () => {

  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Portfolio</h2>
              <p style={styles.sectionText}>Explore your account sections from focused pages with the controls and details you need.</p>
            </section>

            <div style={styles.cardGrid}>
              {pageButtons.map(({ label, description, route }) => (
                <article key={label} style={styles.card}>
                  <h3 style={styles.cardTitle}>{label}</h3>
                  <p style={styles.cardSubtext}>{description}</p>
                  <button type="button" style={styles.viewButton} onClick={() => navigate(route)}>View</button>
                </article>
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
