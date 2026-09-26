import React, { useState } from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import api, { forceLogout } from '../api/axios';
import { navigate } from '../utils/navigate';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
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
  title: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
  },
  description: {
    margin: 0,
    maxWidth: '62ch',
    color: theme.textMuted,
    lineHeight: 1.7,
  },
  card: {
    display: 'grid',
    gap: '12px',
    padding: '16px',
    borderRadius: '14px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
  button: {
    borderRadius: '999px',
    border: `1px solid ${theme.borderGlass}`,
    padding: '10px 14px',
    fontSize: '0.88rem',
    fontWeight: 800,
    color: theme.text,
    background: theme.surfaceMuted,
    cursor: 'pointer',
  },
  dangerButton: {
    borderColor: 'rgba(248, 113, 113, 0.65)',
    background: 'rgba(127, 29, 29, 0.28)',
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
  const [status, setStatus] = useState('Choose how you want to end this session.');

  const handleManualLogout = async () => {
    setStatus('Signing you out securely...');
    try {
      await api.post('/api/auth/signout');
    } catch {
      // Clear local authentication even if the API is unavailable.
    }
    forceLogout();
  };

  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.title}>Logout</h2>
              <p style={styles.description}>Choose an automatic session exit or sign out manually from this device.</p>
            </section>

            <section style={styles.card} aria-label="Logout options">
              <button type="button" style={styles.button} onClick={forceLogout}>Auto Logout</button>
              <button type="button" style={{ ...styles.button, ...styles.dangerButton }} onClick={() => { void handleManualLogout(); }}>Manual Logout</button>
              <button type="button" style={styles.button} onClick={() => navigate('/portfolio')}>Back to Portfolio</button>
              <p style={styles.status} aria-live="polite">{status}</p>
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default LogoutPage;
