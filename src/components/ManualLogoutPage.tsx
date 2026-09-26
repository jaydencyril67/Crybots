import React, { useState } from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import api, { forceLogout } from '../api/axios';
import { navigate } from '../utils/navigate';

const ManualLogoutPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const styles = {
    page: { minHeight: '100vh', paddingBottom: '132px', background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: '700px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
    card: { display: 'grid', gap: '16px', borderRadius: '20px', border: '1px solid rgba(248, 113, 113, 0.55)', background: theme.surfaceGlass, padding: 'clamp(16px, 3.5vw, 24px)' },
    title: { margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 },
    text: { margin: 0, color: theme.textMuted, lineHeight: 1.7 },
    actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
    button: { borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, padding: '12px 16px', cursor: 'pointer', fontWeight: 800, background: theme.surfaceMuted, color: theme.text },
    danger: { background: 'rgba(127, 29, 29, 0.35)', borderColor: 'rgba(248, 113, 113, 0.65)' },
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/api/auth/signout');
    } catch {
      // Local credentials are cleared even if the server cannot be reached.
    }
    forceLogout();
  };

  return (
    <HybridTheme>
      <div style={styles.page}>
        <main style={styles.shell}>
          <section style={styles.card} role="alert">
            <h1 style={styles.title}>Log out now?</h1>
            <p style={styles.text}>Your token and current session will be terminated immediately, and you will be navigated to the landing page.</p>
            <p style={styles.text}><strong>Before logging out, finish or save any progress that you do not want to lose.</strong></p>
            <div style={styles.actions}>
              <button type="button" style={styles.button} onClick={() => navigate('/logout')}>Keep me signed in</button>
              <button type="button" style={{ ...styles.button, ...styles.danger }} disabled={isLoggingOut} onClick={() => { void handleLogout(); }}>{isLoggingOut ? 'Logging out...' : 'Log out now'}</button>
            </div>
          </section>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ManualLogoutPage;
