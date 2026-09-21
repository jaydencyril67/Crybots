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
  content: { display: 'grid', gap: '18px', marginTop: '18px' },
  section: { display: 'grid', gap: '10px' },
  sectionTitle: { margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', color: theme.text },
  sectionText: { margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7, maxWidth: '62ch' },
  buttonList: { display: 'grid', gap: '10px', marginTop: '6px' },
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
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
  cardSubtext: { margin: 0, fontSize: '0.86rem', color: theme.textMuted, lineHeight: 1.6 },
});

const pageButtons = ['Deposit', 'Withdraw', 'Transfer', 'Manage'];

const AssetPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  const handleButtonClick = (label: string) => {
    if (label === 'Deposit') navigate('/deposit');
    if (label === 'Withdraw') navigate('/withdrawals');
    if (label === 'Transfer') navigate('/transfer');
    if (label === 'Manage') navigate('/manage');
  };

  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Assets</h2>
              <p style={styles.sectionText}>Manage your funds and choose an asset action below.</p>
            </section>
            <div style={styles.buttonList}>
              {pageButtons.map((label) => (
                <button key={label} type="button" style={styles.cardButton} onClick={() => handleButtonClick(label)}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{label}</h3>
                  {label === 'Manage' ? <p style={styles.cardSubtext}>Review and manage your assets.</p> : null}
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

export default AssetPage;
