import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import api from '../api/axios';
import type { AlertPreferences, AlertPreferencesResponse } from '../types/alertPreferences';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';

const preferenceTopics = [
  { key: 'account', label: 'Account activity', description: 'Profile changes, sign-ins and account updates.' },
  { key: 'security', label: 'Security alerts', description: 'Password, two-factor authentication and session activity.' },
  { key: 'transactions', label: 'Transactions', description: 'Deposits, withdrawals, transfers and payment updates.' },
  { key: 'market', label: 'Market updates', description: 'Price movements, staking and investment updates.' },
] as const;

const deliveryChannels = [
  { key: 'email', label: 'Email', description: 'Receive important updates in your inbox.', icon: Mail },
  { key: 'push', label: 'Push', description: 'Get alerts on your device when available.', icon: Smartphone },
  { key: 'inApp', label: 'In-app', description: 'Show alerts in the KingsHall notification center.', icon: Bell },
] as const;

type TopicKey = typeof preferenceTopics[number]['key'];
type ChannelKey = typeof deliveryChannels[number]['key'];
type Preferences = AlertPreferences;

const defaultPreferences: Preferences = {
  account: true,
  security: true,
  transactions: true,
  market: false,
  email: true,
  push: true,
  inApp: true,
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  heading: { margin: '20px 0 8px', fontSize: '1.15rem', fontWeight: 900 },
  intro: { margin: 0, color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: '22px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  rowContent: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 },
  icon: { color: theme.primary, flexShrink: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  toggle: { width: '48px', height: '28px', border: 0, borderRadius: '999px', padding: '3px', cursor: 'pointer', flexShrink: 0, background: theme.borderGlass },
  toggleOn: { background: theme.primary },
  knob: { display: 'block', width: '22px', height: '22px', borderRadius: '50%', background: theme.textMuted, transition: 'transform 160ms ease, background 160ms ease' },
  knobOn: { transform: 'translateX(20px)', background: theme.textInverse },
  save: { marginTop: '18px', width: '100%', border: 0, borderRadius: '14px', padding: '13px 16px', background: theme.primary, color: theme.textInverse, fontWeight: 850, cursor: 'pointer' },
});

const AlertSettingsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in window ? Notification.permission : 'unsupported'));

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await api.get<AlertPreferencesResponse>('/api/settings/alerts');
        setPreferences({ ...defaultPreferences, ...response.data.preferences });
      } catch {
        try {
          const stored = window.localStorage.getItem('kingshall_alert_preferences');
          if (stored) setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
        } catch {
          // Use the defaults when stored preferences are unavailable.
        }
        setError('Unable to load saved preferences. You can still update them and try again.');
      } finally {
        setLoading(false);
      }
    };

    void loadPreferences();
  }, []);

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      setPushPermission('unsupported');
      setError('Push notifications are not supported by this browser.');
      return false;
    }
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== 'granted') {
      setError('Allow browser notifications to receive push alerts on this device.');
    }
    return permission === 'granted';
  };

  const toggle = (key: keyof Preferences) => {
    setSaved(false);
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const savePreferences = async () => {
    setSaved(false);
    setError('');
    setSaving(true);

    if (preferences.push && pushPermission !== 'granted') {
      const granted = await requestPushPermission();
      if (!granted) {
        setSaving(false);
        return;
      }
    }

    try {
      const response = await api.patch<AlertPreferencesResponse>('/api/settings/alerts', preferences);
      setPreferences({ ...defaultPreferences, ...response.data.preferences });
      window.localStorage.setItem('kingshall_alert_preferences', JSON.stringify(response.data.preferences));
      setSaved(true);
    } catch {
      setError('Unable to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/options')}><ArrowLeft size={17} /> Options</button>
          <h1 style={styles.heading}>Alert settings</h1>
          <p style={styles.intro}>Choose which updates you receive and where KingsHall Exchange should deliver them.</p>
          {loading ? <NotificationBanner tone="info" title="Loading preferences" message="Retrieving your saved alert settings." /> : null}
          {saved ? <NotificationBanner tone="success" title="Preferences saved" message="Your alert settings have been updated." /> : null}
          {error ? <NotificationBanner tone="error" title="Unable to update preferences" message={error} /> : null}

          <section style={styles.card}>
            <h2 style={styles.cardHeading}>What would you like to hear about?</h2>
            <p style={styles.cardText}>Security alerts remain enabled to help protect your account.</p>
            <div style={styles.list}>
              {preferenceTopics.map(({ key, label, description }) => (
                <div key={key} style={styles.row}>
                  <div style={styles.rowContent}>
                    <div>
                      <p style={styles.label}>{label}</p>
                      <p style={styles.description}>{description}</p>
                    </div>
                  </div>
                  <button type="button" disabled={loading || saving || key === 'security'} aria-label={`${preferences[key] ? 'Disable' : 'Enable'} ${label}`} aria-pressed={preferences[key]} style={{ ...styles.toggle, ...(preferences[key] ? styles.toggleOn : {}) }} onClick={() => toggle(key)}>
                    {loading || saving ? <InlineLoadingDots /> : <span style={{ ...styles.knob, ...(preferences[key] ? styles.knobOn : {}) }} />}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardHeading}>How should we notify you?</h2>
            <p style={styles.cardText}>You can choose more than one delivery method. Push alerts require browser permission{pushPermission === 'granted' ? ' and are enabled on this device.' : '.'}</p>
            <div style={styles.list}>
              {deliveryChannels.map(({ key, label, description, icon: Icon }) => (
                <div key={key} style={styles.row}>
                  <div style={styles.rowContent}>
                    <Icon size={20} style={styles.icon} />
                    <div>
                      <p style={styles.label}>{label}</p>
                      <p style={styles.description}>{description}</p>
                    </div>
                  </div>
                  <button type="button" disabled={loading || saving} aria-label={`${preferences[key] ? 'Disable' : 'Enable'} ${label} notifications`} aria-pressed={preferences[key]} style={{ ...styles.toggle, ...(preferences[key] ? styles.toggleOn : {}) }} onClick={() => toggle(key)}>
                    {loading || saving ? <InlineLoadingDots /> : <span style={{ ...styles.knob, ...(preferences[key] ? styles.knobOn : {}) }} />}
                  </button>
                </div>
              ))}
            </div>
            <button type="button" disabled={loading || saving} style={styles.save} onClick={() => void savePreferences()}>{saving ? <><InlineLoadingDots /> Saving…</> : 'Save preferences'}</button>
          </section>
        </div>
      </main>
    </HybridTheme>
  );
};

export default AlertSettingsPage;
