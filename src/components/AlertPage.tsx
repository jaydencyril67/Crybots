import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import api from '../api/axios';
import type { AlertPreferences, AlertPreferencesResponse } from '../types/alertPreferences';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import NowBar from './NowBar';

const NOTIFICATION_COLOR_STORAGE_KEY = 'kingshall_notification_color';
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
const hexToRgb = (hex: string) => ({ r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) });
const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
const hsvToHex = (h: number, s: number, v: number) => { const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c; const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x]; return rgbToHex(Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)); };
const hueFromHex = (hex: string) => { const {r,g,b}=hexToRgb(hex); const rr=r/255,gg=g/255,bb=b/255,max=Math.max(rr,gg,bb),min=Math.min(rr,gg,bb),d=max-min; if(!d)return 0; if(max===rr)return (60*((gg-bb)/d)+360)%360; if(max===gg)return 60*((bb-rr)/d+2); return 60*((rr-gg)/d+4); };

const preferenceTopics = [
  { key: 'account', label: 'Account activity', description: 'Profile changes, sign-ins and account updates.' },
  { key: 'security', label: 'Security alerts', description: 'Password, two-factor authentication and session activity.' },
  { key: 'transactions', label: 'Transactions', description: 'Deposits, withdrawals, transfers and payment updates.' },
  { key: 'market', label: 'Market updates', description: 'Market movements, bot activity and strategy updates.' },
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
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  rowContent: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 },
  icon: { color: theme.primary, flexShrink: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  enableButton: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', flexShrink: 0 },
  enabledButton: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  disabledButton: { opacity: 0.6, cursor: 'not-allowed' },
  colorPreview: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}` },
  colorSwatch: { width: 44, height: 44, borderRadius: 14, flexShrink: 0 },
  picker: { width: 'min(76vw, 300px)', margin: '8px auto 16px' },
  hueRing: { width: '100%', aspectRatio: '1', borderRadius: '50%', background: 'conic-gradient(from 0turn, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))', padding: 24, boxSizing: 'border-box' as const, cursor: 'crosshair', position: 'relative' as const },
  field: { position: 'absolute' as const, inset: 24, borderRadius: '50%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,.96)), linear-gradient(to right, #fff 0%, var(--picker-hue) 100%)', cursor: 'crosshair' },
  point: { position: 'absolute' as const, width: 18, height: 18, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #000', pointerEvents: 'none' as const },
  inputs: { display: 'flex', gap: 10, flexWrap: 'wrap' as const },
  input: { flex: '1 1 180px', minWidth: 0, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '12px 14px', fontSize: '.95rem' },
  apply: { border: 0, borderRadius: 12, background: theme.primary, color: theme.textInverse, padding: '12px 18px', fontWeight: 800, cursor: 'pointer' },

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
  const [notificationColor, setNotificationColor] = useState('#ef4444');
  const [customColor, setCustomColor] = useState('#ef4444');
  const [rgb, setRgb] = useState({ r: 239, g: 68, b: 68 });
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(.72);
  const [value, setValue] = useState(.94);
  const [colorError, setColorError] = useState('');
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in window ? Notification.permission : 'unsupported'));

  useEffect(() => {
    const stored = window.localStorage.getItem(NOTIFICATION_COLOR_STORAGE_KEY);
    if (stored && isHexColor(stored)) {
      const next = stored.toLowerCase(); const nextRgb = hexToRgb(next); const max = Math.max(nextRgb.r,nextRgb.g,nextRgb.b)/255; const min = Math.min(nextRgb.r,nextRgb.g,nextRgb.b)/255;
      setNotificationColor(next); setCustomColor(next); setRgb(nextRgb); setHue(hueFromHex(next)); setValue(max); setSaturation(max === 0 ? 0 : (max-min)/max);
    }
  }, []);

  const selectNotificationColor = (next: string) => {
    const normalized = next.toLowerCase();
    window.localStorage.setItem(NOTIFICATION_COLOR_STORAGE_KEY, normalized);
    window.dispatchEvent(new Event('kingshall-notification-color-changed'));
    const nextRgb = hexToRgb(normalized); const max = Math.max(nextRgb.r,nextRgb.g,nextRgb.b)/255; const min = Math.min(nextRgb.r,nextRgb.g,nextRgb.b)/255;
    setNotificationColor(normalized); setCustomColor(normalized); setRgb(nextRgb); setHue(hueFromHex(normalized)); setValue(max); setSaturation(max === 0 ? 0 : (max-min)/max); setColorError('');
  };

  const applyNotificationColor = () => {
    const normalized = customColor.startsWith('#') ? customColor : `#${customColor}`;
    if (!isHexColor(normalized)) { setColorError('Enter a valid six-digit hex color, for example #ef4444.'); return; }
    selectNotificationColor(normalized);
  };

  const selectHue = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect=event.currentTarget.getBoundingClientRect(); const x=event.clientX-rect.left-rect.width/2; const y=event.clientY-rect.top-rect.height/2; const d=Math.hypot(x,y); const outer=rect.width/2;
    if(d < outer-24 || d > outer) return;
    const next=(Math.atan2(y,x)*180/Math.PI+90+360)%360; setHue(next); selectNotificationColor(hsvToHex(next,saturation,value));
  };

  const selectField = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect=event.currentTarget.getBoundingClientRect(); const s=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)); const v=Math.max(0,Math.min(1,1-(event.clientY-rect.top)/rect.height)); setSaturation(s); setValue(v); selectNotificationColor(hsvToHex(hue,s,v));
  };

  const updateRgb = (channel: 'r'|'g'|'b', raw: string) => {
    const next={...rgb,[channel]:Math.max(0,Math.min(255,Number(raw)||0))}; setRgb(next); selectNotificationColor(rgbToHex(next.r,next.g,next.b));
  };

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

  const savePreference = async (key: keyof Preferences) => {
    if (key === 'security' || savingKey) return;

    setSaved(false);
    setError('');
    const nextPreferences = { ...preferences, [key]: !preferences[key] };
    setSavingKey(key);

    if (key === 'push' && nextPreferences.push && pushPermission !== 'granted') {
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
            <p style={styles.cardText}>Choose the color used for your app header notification alert and unread badge. Your selection is saved immediately.</p>
            <div style={styles.colorPreview}>
              <span style={{ ...styles.colorSwatch, background: notificationColor, boxShadow: `0 0 24px ${notificationColor}` }} />
              <strong>{notificationColor.toUpperCase()}</strong>
            </div>
            <div style={styles.picker}>
              <div style={styles.hueRing} onClick={selectHue}>
                <div style={{ ...styles.field, '--picker-hue': hsvToHex(hue,1,1) } as React.CSSProperties} onClick={(e) => { e.stopPropagation(); selectField(e); }}>
                  <span style={{ ...styles.point, left: `${saturation*100}%`, top: `${(1-value)*100}%` }} />
                </div>
              </div>
            </div>
            <div style={styles.inputs}>
              <input aria-label="Notification HEX color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="#ef4444" style={styles.input} />
              <button type="button" style={styles.apply} onClick={applyNotificationColor}>Apply</button>
            </div>
            <div style={{ ...styles.inputs, marginTop: 10 }}>
              {(['r','g','b'] as const).map((channel) => <input key={channel} aria-label={`${channel.toUpperCase()} notification color`} type="number" min="0" max="255" value={rgb[channel]} onChange={(e) => updateRgb(channel,e.target.value)} style={styles.input} />)}
            </div>
            {colorError ? <p style={{ ...styles.description, color: '#f87171' }}>{colorError}</p> : null}
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
                  <button type="button" disabled={loading || savingKey !== null || key === 'security'} aria-label={`${preferences[key] ? 'Disable' : 'Enable'} ${label}`} aria-pressed={preferences[key]} style={{ ...styles.enableButton, ...(preferences[key] ? styles.enabledButton : {}), ...(loading || savingKey !== null || key === 'security' ? styles.disabledButton : {}) }} onClick={() => void savePreference(key)}>
                    {savingKey === key ? <InlineLoadingDots /> : preferences[key] ? 'Enabled' : 'Enable'}
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
                  <button type="button" disabled={loading || savingKey !== null} aria-label={`${preferences[key] ? 'Disable' : 'Enable'} ${label} notifications`} aria-pressed={preferences[key]} style={{ ...styles.enableButton, ...(preferences[key] ? styles.enabledButton : {}), ...(loading || savingKey !== null ? styles.disabledButton : {}) }} onClick={() => void savePreference(key)}>
                    {savingKey === key ? <InlineLoadingDots /> : preferences[key] ? 'Enabled' : 'Enable'}
                  </button>
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
