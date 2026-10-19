import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import api from '../api/axios';
import type { AlertPreferences, AlertPreferencesResponse } from '../types/alertPreferences';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NotificationBanner from './NotificationBanner';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';

const preferenceTopics = [
  { key: 'account', label: 'Account activity', description: 'Profile changes, sign-ins and account updates.' },
  { key: 'security', label: 'Security alerts', description: 'Security-code, two-factor authentication and session activity.' },
  { key: 'transactions', label: 'Transactions', description: 'Deposits, withdrawals, transfers and payment updates.' },
  { key: 'market', label: 'Market updates', description: 'Market movements, bot activity and strategy updates.' },
] as const;

const deliveryChannels = [
  { key: 'email', label: 'Email', description: 'Receive important updates in your inbox.', icon: Mail },
  { key: 'push', label: 'Push', description: 'Get alerts on your device when available.', icon: Smartphone },
  { key: 'inApp', label: 'In-app', description: 'Show alerts in the CryBots notification center.', icon: Bell },
] as const;

type TopicKey = typeof preferenceTopics[number]['key'];
type ChannelKey = typeof deliveryChannels[number]['key'];
type Preferences = AlertPreferences;

const defaultPreferences: Preferences = {
  account: true,
  security: true,
  transactions: true,
  market: false,
  email: false,
  push: false,
  inApp: true,
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: 0 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 2px', borderRadius: 0, border: 'none', borderBottom: `1px solid ${theme.borderGlass}`, background: 'transparent' },
  rowContent: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 },
  icon: { color: theme.primary, flexShrink: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  enableButton: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', flexShrink: 0 },
  enabledButton: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  disabledButton: { opacity: 0.6, cursor: 'not-allowed' },
  toggle: { position: 'relative' as const, display: 'block', flex: '0 0 42px', width: '42px', height: '25px', padding: '3px', border: `1px solid ${theme.borderGlass}`, borderRadius: '999px', background: 'rgba(255,255,255,.045)', cursor: 'pointer', flexShrink: 0 },
  toggleOn: { borderColor: theme.primary, background: 'rgba(185,199,223,.22)', boxShadow: '0 0 12px rgba(185,199,223,.08)' },
  toggleKnob: { display: 'block', width: '17px', height: '17px', borderRadius: '50%', background: '#a4a8b0', transition: 'transform .16s, background .16s' },
  toggleKnobOn: { transform: 'translateX(16px)', background: '#eef2f8' },

});

const AlertPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);
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

  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  const registerNativePush = async () => {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      throw new Error('Allow notifications for CryBots in Android settings to enable push alerts.');
    }

    await PushNotifications.createChannel({ id: 'crybots_alerts', name: 'CryBots Alerts', importance: 5, sound: 'default' });
    const fcmToken = await new Promise<string>(async (resolve, reject) => {
      let settled = false;
      let registrationListener: { remove: () => Promise<void> } | undefined;
      let errorListener: { remove: () => Promise<void> } | undefined;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        void registrationListener?.remove();
        void errorListener?.remove();
        callback();
      };
      try {
        registrationListener = await PushNotifications.addListener('registration', result => {
          finish(() => resolve(result.value));
        });
        errorListener = await PushNotifications.addListener('registrationError', error => {
          finish(() => reject(new Error(error.error || 'Android could not register this device for push notifications.')));
        });
        await PushNotifications.register();
      } catch (error) {
        finish(() => reject(error instanceof Error ? error : new Error('Android push registration failed.')));
      }
    });

    await api.post('/api/notifications/native-push-token', { token: fcmToken });
    window.localStorage.setItem('crybots_native_push_token', fcmToken);
    setPushPermission('granted');
  };

  const decodeVapidKey = (value: string): Uint8Array => {
    const padded = value + '='.repeat((4 - value.length % 4) % 4);
    const raw = window.atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, char => char.charCodeAt(0));
  };

  const registerWebPush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushPermission('unsupported');
      throw new Error('Browser push is not supported here. Try a supported browser or the installed CryBots PWA.');
    }
    let permission = Notification.permission;
    if (permission !== 'granted') permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== 'granted') throw new Error('Allow browser notifications to enable CryBots push alerts.');

    const keyResponse = await api.get<{ publicKey?: string | null; configured?: boolean }>('/api/notifications/web-push-key');
    const publicKey = keyResponse.data.publicKey;
    if (!publicKey || keyResponse.data.configured !== true) {
      throw new Error('CryBots browser push needs the VAPID public and private keys configured on the API first.');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(publicKey),
      });
    }
    await api.post('/api/notifications/web-push-subscription', { subscription: subscription.toJSON() });
    window.localStorage.setItem('crybots_web_push_endpoint', subscription.endpoint);
  };

  const unregisterWebPush = async () => {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined;
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint || window.localStorage.getItem('crybots_web_push_endpoint');
    try {
      if (endpoint) await api.delete('/api/notifications/web-push-subscription', { data: { endpoint } });
    } finally {
      if (subscription) await subscription.unsubscribe().catch(() => false);
      window.localStorage.removeItem('crybots_web_push_endpoint');
    }
  };

  const requestPushPermission = async () => {
    if (isNativeAndroid) {
      try {
        await registerNativePush();
        return true;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unable to enable Android push alerts.');
        return false;
      }
    }
    try {
      await registerWebPush();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to enable browser push alerts.');
      return false;
    }
  };

  const savePreference = async (key: keyof Preferences) => {
    if (key === 'security' || savingKey) return;

    setSaved(false);
    setError('');
    const nextPreferences = { ...preferences, [key]: !preferences[key] };
    setSavingKey(key);

    if (key === 'push' && nextPreferences.push) {
      const granted = await requestPushPermission();
      if (!granted) {
        setSavingKey(null);
        return;
      }
    }

    try {
      const response = await api.patch<AlertPreferencesResponse>('/api/settings/alerts', nextPreferences);
      setPreferences({ ...defaultPreferences, ...response.data.preferences });
      window.localStorage.setItem('kingshall_alert_preferences', JSON.stringify(response.data.preferences));
      if (key === 'push' && !nextPreferences.push) {
        if (isNativeAndroid) {
          const nativeToken = window.localStorage.getItem('crybots_native_push_token');
          if (nativeToken) {
            await api.delete('/api/notifications/native-push-token', { data: { token: nativeToken } }).catch(() => undefined);
            window.localStorage.removeItem('crybots_native_push_token');
          }
        } else {
          await unregisterWebPush().catch(() => undefined);
        }
      }
      setSaved(true);
    } catch {
      setError('Unable to save preferences. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/options')}><ArrowLeft size={17} /> Options</button>
          {loading ? <NotificationBanner tone="info" title="Loading preferences" message="Retrieving your saved alert settings." /> : null}
          {saved ? <NotificationBanner tone="success" title="Preferences saved" message="Your alert settings have been updated." /> : null}
          {error ? <NotificationBanner tone="error" title="Unable to update preferences" message={error} /> : null}

          <section style={styles.card}>
            <h2 style={styles.cardHeading}>Notification color</h2>
            <p style={styles.cardText}>Customize the color used for your app header notification alert and unread badge.</p>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <div>
                    <p style={styles.label}>Notification color</p>
                    <p style={styles.description}>Choose the color used by the app header notification alert and unread badge.</p>
                  </div>
                </div>
                <button type="button" style={styles.enableButton} onClick={() => navigate('/notification-color')}>
                  Choose color
                </button>
              </div>
            </div>
          </section>

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
                  <button type="button" role="switch" disabled={loading || savingKey !== null || key === 'security'} aria-label={`${label}`} aria-checked={preferences[key]} style={{ ...styles.toggle, ...(preferences[key] ? styles.toggleOn : {}), ...(loading || savingKey !== null || key === 'security' ? styles.disabledButton : {}) }} onClick={() => void savePreference(key)}>{savingKey === key ? <LoadingDots /> : <span style={{ ...styles.toggleKnob, ...(preferences[key] ? styles.toggleKnobOn : {}) }} />}</button>
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
                  <button type="button" role="switch" disabled={loading || savingKey !== null} aria-label={`${label} notifications`} aria-checked={preferences[key]} style={{ ...styles.toggle, ...(preferences[key] ? styles.toggleOn : {}), ...(loading || savingKey !== null ? styles.disabledButton : {}) }} onClick={() => void savePreference(key)}>{savingKey === key ? <LoadingDots /> : <span style={{ ...styles.toggleKnob, ...(preferences[key] ? styles.toggleKnobOn : {}) }} />}</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <NowBar />
    </HybridTheme>
  );
};

export default AlertPage;
