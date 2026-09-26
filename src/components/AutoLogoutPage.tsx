import React, { useEffect, useState } from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import ReusableDatePage from './ReusableDatePage';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import { getScheduledLogout, setScheduledLogout } from '../utils/scheduledLogout';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '760px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  card: { display: 'grid', gap: '14px', borderRadius: '20px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, padding: 'clamp(16px, 3.5vw, 24px)' },
  eyebrow: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const },
  title: { margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 },
  text: { margin: 0, color: theme.textMuted, lineHeight: 1.65 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' as const, padding: '14px 0', borderTop: `1px solid ${theme.borderGlass}` },
  button: { borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, padding: '10px 14px', cursor: 'pointer', fontWeight: 800, background: theme.surfaceMuted, color: theme.text },
  primary: { background: theme.primary, borderColor: theme.primary, color: theme.textInverse },
  status: { margin: 0, color: theme.textMuted, fontSize: '0.86rem' },
});

const AutoLogoutPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [idleEnabled, setIdleEnabled] = useState(false);
  const [scheduledLogout, setScheduledLogoutValue] = useState(getScheduledLogout);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState('No automatic logout has been configured.');

  const saveSchedule = (value: string) => {
    setScheduledLogoutValue(value);
    setScheduledLogout(value);
    setShowDatePicker(false);
    setStatus(`Scheduled logout set for ${value.replace('T', ' ')}.`);
  };

  useEffect(() => {
    if (scheduledLogout) {
      setStatus(`Scheduled logout set for ${scheduledLogout.replace('T', ' ')}.`);
    }
  }, [scheduledLogout]);

  if (showDatePicker) {
    return <ReusableDatePage title="Scheduled logout" description="Choose the date and time when this session should end automatically." value={scheduledLogout} mode="datetime-local" confirmLabel="Save scheduled logout" onConfirm={saveSchedule} onCancel={() => setShowDatePicker(false)} />;
  }

  return (
    <HybridTheme>
      <div style={styles.page}>
        <main style={styles.shell}>
          <section style={styles.card}>
            <p style={styles.eyebrow}>Security settings</p>
            <h1 style={styles.title}>AUTO LOGOUT</h1>
            <p style={styles.text}>Set an automatic logout for inactivity or schedule a specific time to end this session.</p>
            <div style={styles.row}>
              <div><strong>Logout when the app is idle</strong><p style={styles.status}>End your session after a period of inactivity.</p></div>
              <button type="button" aria-pressed={idleEnabled} style={{ ...styles.button, ...(idleEnabled ? styles.primary : {}) }} onClick={() => { setIdleEnabled(!idleEnabled); setStatus(!idleEnabled ? 'Idle logout enabled.' : 'Idle logout disabled.'); }}>{idleEnabled ? 'Enabled' : 'Enable'}</button>
            </div>
            <div style={styles.row}>
              <div><strong>Scheduled logout</strong><p style={styles.status}>{scheduledLogout ? `Set for ${scheduledLogout.replace('T', ' ')}` : 'No scheduled logout set.'}</p></div>
              <button type="button" style={{ ...styles.button, ...styles.primary }} onClick={() => setShowDatePicker(true)}>{scheduledLogout ? 'Change time' : 'Choose time'}</button>
            </div>
            <p style={styles.status} aria-live="polite">{status}</p>
            <button type="button" style={styles.button} onClick={() => navigate('/logout')}>Back to logout</button>
          </section>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default AutoLogoutPage;
