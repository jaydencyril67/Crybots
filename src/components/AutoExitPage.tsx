import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import InlineLoadingDots from './InlineLoadingDots';
import ReusableDatePage from './ReusableDatePage';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import { getScheduledLogout, setScheduledLogout } from '../utils/scheduledLogout';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '14px', marginTop: '10px' },
  card: { ...createHybridCardStyles(theme).card },
  rowList: { display: 'grid', gap: '10px', width: '100%', minWidth: 0, padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
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

const AutoExitPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [idleEnabled, setIdleEnabled] = useState(false);
  const [idleMinutes, setIdleMinutes] = useState(10);
  const [idleSaving, setIdleSaving] = useState(false);
  const [scheduledExit, setScheduledExitValue] = useState(getScheduledLogout);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [status, setStatus] = useState('No automatic exit has been configured.');

  const saveIdleExit = async (enabled = !idleEnabled) => {
    const nextValue = enabled;
    setIdleSaving(true);
    try {
      const response = await api.put('/api/auth/idle-logout', { enabled: nextValue, minutes: idleMinutes });
      setIdleEnabled(Boolean(response.data.idleLogoutEnabled));
      setIdleMinutes(Number(response.data.idleLogoutMinutes) || idleMinutes);
      setStatus(response.data.idleLogoutEnabled ? `Idle exit enabled after ${response.data.idleLogoutMinutes} minutes.` : 'Idle exit disabled.');
    } catch (error: any) {
      setStatus(error?.response?.data?.message || 'Unable to update idle exit.');
    } finally {
      setIdleSaving(false);
    }
  };

  const saveSchedule = async (value: string) => {
    setScheduleSaving(true);
    try {
      const response = await api.put('/api/auth/scheduled-logout', { scheduledLogoutAt: new Date(value).toISOString() });
      const savedValue = toLocalDateTimeValue(response.data.scheduledLogoutAt);
      setScheduledExitValue(savedValue);
      setScheduledLogout(savedValue);
      setShowDatePicker(false);
      setStatus(`Scheduled exit set for ${savedValue.replace('T', ' ')}.`);
    } catch (error: any) {
      setStatus(error?.response?.data?.message || 'Unable to save scheduled exit.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const cancelSchedule = async () => {
    setScheduleSaving(true);
    try {
      await api.put('/api/auth/scheduled-logout', { scheduledLogoutAt: null });
      setScheduledExitValue('');
      setScheduledLogout('');
      setStatus('Scheduled exit cancelled.');
    } catch (error: any) {
      setStatus(error?.response?.data?.message || 'Unable to cancel scheduled exit.');
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
        setIdleMinutes([5, 10, 15, 30].includes(Number(idleResponse.data.idleLogoutMinutes)) ? Number(idleResponse.data.idleLogoutMinutes) : 10);
        setScheduledExitValue(serverValue);
        setScheduledLogout(serverValue);
        setStatus(serverValue ? `Scheduled exit set for ${serverValue.replace('T', ' ')}.` : 'No automatic exit has been configured.');
      } catch {
        if (scheduledExit) setStatus(`Scheduled exit set for ${scheduledExit.replace('T', ' ')}.`);
      }
    };
    void loadSchedule();
  }, []);

  if (showDatePicker) {
    return <ReusableDatePage title="Scheduled exit" description="Choose the date and time when this session should end automatically." value={scheduledExit} mode="datetime-local" confirmLabel="Save scheduled exit" onConfirm={saveSchedule} onCancel={() => setShowDatePicker(false)} />;
  }

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <main style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.back} onClick={() => navigate('/exit')}><ArrowLeft size={17} /> Exit</button>
            <div style={styles.rowList}>
              <section style={styles.dangerRow}>
                <h3 style={styles.title}>Automatic Exit</h3>
                <p style={styles.text}>Set an automatic exit for inactivity or schedule a specific time to end this session.</p>
                <div style={styles.dangerRow}>
                  <strong>Exit when the app is idle</strong>
                  <p style={styles.status}>End your session after the selected period of inactivity. Scheduled exit remains independent.</p>
                  <div style={styles.buttonRow}>
                    <span style={styles.status}>Timeout</span>
                    <div style={{ display: 'grid', gap: '8px', width: '100%', maxWidth: '320px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: theme.text, fontWeight: 700 }}><span>{idleMinutes} minutes</span><span style={{ color: theme.textMuted, fontSize: '0.8rem' }}>5–30</span></div>
                      <input type="range" min="5" max="30" step="5" value={idleMinutes} onChange={(event) => setIdleMinutes(Number(event.target.value))} disabled={idleSaving} aria-label="Idle exit timeout in minutes" style={{ width: '100%', accentColor: theme.primary, cursor: idleSaving ? 'not-allowed' : 'grab', opacity: idleSaving ? 0.65 : 1 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, fontSize: '0.72rem' }}><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span></div>
                    </div>
                    {idleEnabled && <button type="button" style={styles.button} disabled={idleSaving} onClick={() => saveIdleExit(true)}>{idleSaving ? <InlineLoadingDots /> : 'Save timeout'}</button>}
                    <button type="button" style={styles.button} aria-pressed={idleEnabled} disabled={idleSaving} onClick={() => saveIdleExit(!idleEnabled)}>{idleSaving ? <InlineLoadingDots /> : idleEnabled ? 'Disable' : 'Enable'}</button>
                  </div>
                </div>
              </section>
              <section style={styles.dangerRow}>
                <div style={styles.dangerRow}>
                  <strong>Scheduled exit</strong>
                  <p style={styles.status}>{scheduledExit ? `Set for ${scheduledExit.replace('T', ' ')}` : 'No scheduled exit set.'}</p>
                  <div style={styles.buttonRow}>
                    <button type="button" style={styles.button} disabled={scheduleSaving} onClick={() => setShowDatePicker(true)}>{scheduledExit ? 'Change time' : 'Choose time'}</button>
                    {scheduledExit && <button type="button" style={styles.button} disabled={scheduleSaving} onClick={cancelSchedule}>{scheduleSaving ? <InlineLoadingDots /> : 'Cancel scheduled exit'}</button>}
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

export default AutoExitPage;
