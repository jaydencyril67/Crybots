import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import api, { forceLogout } from '../api/axios';
import { navigate } from '../utils/navigate';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '14px', marginTop: '10px' },
  rowList: { display: 'grid', gap: '10px', width: '100%', minWidth: 0, padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
  dangerRow: { width: '100%', maxWidth: '100%', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', padding: '13px 14px', display: 'grid', gap: '6px', textAlign: 'left' as const, minWidth: 0, boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '12px' },
  title: { margin: 0, fontSize: '0.96rem', fontWeight: 800, color: theme.text },
  text: { margin: '5px 0 0', fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.4, maxWidth: '64ch' },
  actions: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', padding: '12px 16px', border: `1px solid ${theme.borderGlass}`, cursor: 'pointer', fontWeight: 700, color: theme.text, background: theme.surfaceMuted, width: '100%', maxWidth: '100%' },
  danger: { background: theme.primary, borderColor: theme.primary, color: theme.textInverse },
});

const ManualExitPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    try {
      await api.post('/api/auth/signout');
    } catch {
      // Local credentials are cleared even if the server cannot be reached.
    }
    forceLogout();
  };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <main style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.back} onClick={() => navigate('/exit')}><ArrowLeft size={17} /> Exit</button>
            <div style={styles.rowList}>
              <section style={styles.dangerRow} role="alert">
                <h3 style={styles.title}>Manual Exit</h3>
                <p style={styles.text}>Your token and current session will be terminated immediately, and you will be navigated to the landing page.</p>
                <p style={styles.text}><strong>Before exiting, finish or save any progress that you do not want to lose.</strong></p>
                <div style={styles.actions}>
                  <button type="button" style={styles.button} onClick={() => navigate('/exit')}>Keep me signed in</button>
                  <button type="button" style={{ ...styles.button, ...styles.danger }} disabled={isExiting} onClick={() => { void handleExit(); }}>{isExiting ? 'Exiting...' : 'Exit now'}</button>
                </div>
              </section>
            </div>
          </div>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ManualExitPage;
