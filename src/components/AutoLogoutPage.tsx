import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import ReusableDatePage from './ReusableDatePage';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import { getScheduledLogout, setScheduledLogout } from '../utils/scheduledLogout';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '14px', marginTop: '10px' },
  card: { ...createHybridCardStyles(theme).card },
  rowList: { display: 'grid', gap: '10px', width: '100%', minWidth: 0, padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
  dangerRow: { width: '100%', maxWidth: '100%', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', padding: '13px 14px', display: 'grid', gap: '6px', textAlign: 'left' as const, minWidth: 0, boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '12px' },
  title: { margin: 0, fontSize: '0.96rem', fontWeight: 800, color: theme.text },
  text: { margin: '5px 0 0', fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.4, maxWidth: '64ch' },
  status: { margin: '5px 0 0', fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.4 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', padding: '12px 16px', border: `1px solid ${theme.primary}`, cursor: 'pointer', fontWeight: 700, color: theme.textInverse, background: theme.primary, width: '100%', maxWidth: '100%' },
});

const toLocalDateTimeValue = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const AutoLogoutPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [idleEnabled, setIdleEnabled] = useState(false);
  const [idleSaving, setIdleSaving] = useState(false);
  const [scheduledLogout, setScheduledLogoutValue] = useState(getScheduledLogout);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [status, setStatus] = useState('No automatic logout has been configured.');

  const saveIdleLogout = async () => {
    const nextValue = !idleEnabled;
    setIdleSaving(true);
    try {
      const response = await api.put('/api/auth/idle-logout', { enabled: nextValue });
      setIdleEnabled(Boolean(response.data.idleLogoutEnabled));
      setStatus(response.data.idleLogoutEnabled ? 'Idle logout enabled.' : 'Idle logout disabled.');
    } catch (error: any) {
      setStatus(error?.response?.data?.message || 'Unable to update idle logout.');
    } finally {
      setIdleSaving(false);
    }
  };

  const saveSchedule = async (value: string) => {
    setScheduleSaving(true);
    try {
      const response = await api.put('/api/auth/scheduled-logout', { scheduledLogoutAt: new Date(value).toISOString() });
      const savedValue = toLocalDateTimeValue(response.data.scheduledLogoutAt);
      setScheduledLogoutValue(savedValue);
      setScheduledLogout(savedValue);
      setShowDatePicker(false);
      setStatus(`Scheduled logout set for ${savedValue.replace('T', ' ')}.`);
    } catch (error: any) {
      setStatus(error?.response?.data?.message || 'Unable to save scheduled logout.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const cancelSchedule = async () => {
    setScheduleSaving(true);
    try {
      await api.put('/api/auth/scheduled-logout', { scheduledLogoutAt: null });
      setScheduledLogoutValue('');
      setScheduledLogout('');
      setStatus('Scheduled logout cancelled.');
    } catch (error: any) {
      setStatus(error?.response?.data?.message || 'Unable to cancel scheduled logout.');
    } finally {
      setScheduleSaving(false);
    }
  };

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const [scheduleResponse, idleResponse] = await Promise.all([
          api.get('/api/auth/scheduled-logout'),
          api.get('/api/auth/idle-logout'),
        ]);
        const serverValue = scheduleResponse.data.scheduledLogoutAt ? toLocalDateTimeValue(scheduleResponse.data.scheduledLogoutAt) : '';
        setIdleEnabled(Boolean(idleResponse.data.idleLogoutEnabled));
        setScheduledLogoutValue(serverValue);
        setScheduledLogout(serverValue);
        setStatus(serverValue ? `Scheduled logout set for ${serverValue.replace('T', ' ')}.` : 'No automatic logout has been configured.');
      } catch {
        if (scheduledLogout) setStatus(`Scheduled logout set for ${scheduledLogout.replace('T', ' ')}.`);
      }
    };
    void loadSchedule();
  }, []);

  if (showDatePicker) {
    return <ReusableDatePage title="Scheduled logout" description="Choose the date and time when this session should end automatically." value={scheduledLogout} mode="datetime-local" confirmLabel="Save scheduled logout" onConfirm={saveSchedule} onCancel={() => setShowDatePicker(false)} />;
  }

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <main style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.back} onClick={() => navigate('/logout')}><ArrowLeft size={17} /> Logout</button>
            <div style={styles.rowList}>
              <section style={styles.dangerRow}>
                <h3 style={styles.title}>Automatic Logout</h3>
                <p style={styles.text}>Set an automatic logout for inactivity or schedule a specific time to end this session.</p>
                <div style={styles.dangerRow}>
                  <strong>Logout when the app is idle</strong>
                  <p style={styles.status}>End your session after 30 minutes of inactivity. Scheduled logout remains independent.</p>
                  <div style={styles.buttonRow}><button type="button" style={styles.button} aria-pressed={idleEnabled} disabled={idleSaving} onClick={saveIdleLogout}>{idleSaving ? 'Saving...' : idleEnabled ? 'Enabled' : 'Enable'}</button></div>
                </div>
                <div style={styles.dangerRow}>
                  <strong>Scheduled logout</strong>
                  <p style={styles.status}>{scheduledLogout ? `Set for ${scheduledLogout.replace('T', ' ')}` : 'No scheduled logout set.'}</p>
                  <div style={styles.buttonRow}>
                    <button type="button" style={styles.button} disabled={scheduleSaving} onClick={() => setShowDatePicker(true)}>{scheduledLogout ? 'Change time' : 'Choose time'}</button>
                    {scheduledLogout && <button type="button" style={styles.button} disabled={scheduleSaving} onClick={cancelSchedule}>{scheduleSaving ? 'Cancelling...' : 'Cancel scheduled logout'}</button>}
                  </div>
                </div>
                <p style={styles.status} aria-live="polite">{status}</p>
              </section>
            </div>
          </div>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default AutoLogoutPage;
