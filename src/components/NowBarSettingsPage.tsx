import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';
import { VOICE_MODE_CHANGED_EVENT, VOICE_MODE_STORAGE_KEY } from '../utils/voiceNavigation';

type EdgeLightMode = 'stable-light' | 'stable' | 'blink-light' | 'blink' | 'pulse-light' | 'pulse' | 'color-light' | 'color';

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const BUTTON_COLOR_ENABLED_STORAGE_KEY = 'nowbar_button_color_enabled';
const SWIPE_NAVIGATION_STORAGE_KEY = 'nowbar_swipe_navigation_enabled';
const EXPAND_MODE_STORAGE_KEY = 'nowbar_expand_mode_enabled';
const EDGE_LIGHT_MODES: Array<{ key: EdgeLightMode; label: string }> = [
  { key: 'stable-light', label: 'Stable Light' },
  { key: 'stable', label: 'Stable glow' },
  { key: 'blink-light', label: 'Blinking Light' },
  { key: 'blink', label: 'Blinking glow' },
  { key: 'pulse-light', label: 'Breathing Light' },
  { key: 'pulse', label: 'Breathing glow' },
  { key: 'color-light', label: 'Changing Light' },
  { key: 'color', label: 'Changing glow' },
];

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: '20px 0 8px', fontSize: '1.15rem', fontWeight: 900 },
  text: { margin: 0, color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: '22px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  rowContent: { minWidth: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  button: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', flexShrink: 0 },
  active: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  modes: { display: 'grid', gap: '10px', marginTop: '10px' },
  modeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '11px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  modeLabel: { margin: 0, fontWeight: 750, fontSize: '0.88rem' },
});

const NowBarSettingsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [enabled, setEnabled] = useState(false);
  const [buttonColorEnabled, setButtonColorEnabled] = useState(true);
  const [swipeNavigationEnabled, setSwipeNavigationEnabled] = useState(true);
  const [expandModeEnabled, setExpandModeEnabled] = useState(true);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [mode, setMode] = useState<EdgeLightMode>('stable');

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { enabled?: boolean; mode?: EdgeLightMode };
      const savedButtonColorEnabled = window.localStorage.getItem(BUTTON_COLOR_ENABLED_STORAGE_KEY);
      const savedSwipeNavigation = window.localStorage.getItem(SWIPE_NAVIGATION_STORAGE_KEY);
      const savedExpandMode = window.localStorage.getItem(EXPAND_MODE_STORAGE_KEY);
      const savedVoiceMode = window.localStorage.getItem(VOICE_MODE_STORAGE_KEY);
      setEnabled(Boolean(saved.enabled));
      if (savedButtonColorEnabled !== null) setButtonColorEnabled(savedButtonColorEnabled === 'true');
      if (savedSwipeNavigation !== null) setSwipeNavigationEnabled(savedSwipeNavigation === 'true');
      if (savedExpandMode !== null) setExpandModeEnabled(savedExpandMode === 'true');
      if (savedVoiceMode !== null) setVoiceModeEnabled(savedVoiceMode === 'true');
      if (saved.mode && EDGE_LIGHT_MODES.some((option) => option.key === saved.mode)) setMode(saved.mode);
    } catch {
      // Keep defaults when saved settings are invalid.
    }
  }, []);

  const save = (nextEnabled: boolean, nextMode: EdgeLightMode) => {
    let color = '#38bdf8';
    try {
      const stored = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { color?: string };
      if (stored.color) {
        color = stored.color;
      }
    } catch {
      // Keep the default color when saved data is invalid.
    }
    window.localStorage.setItem(EDGE_LIGHT_STORAGE_KEY, JSON.stringify({ enabled: nextEnabled, color, mode: nextMode }));
    window.dispatchEvent(new Event('nowbar-edge-light-changed'));
  };

  const toggleButtonColor = () => {
    const nextEnabled = !buttonColorEnabled;
    setButtonColorEnabled(nextEnabled);
    window.localStorage.setItem(BUTTON_COLOR_ENABLED_STORAGE_KEY, String(nextEnabled));
    window.dispatchEvent(new Event('nowbar-button-color-changed'));
  };

  const toggleFeature = (key: string, value: boolean, setValue: React.Dispatch<React.SetStateAction<boolean>>) => {
    setValue(value);
    window.localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event('nowbar-feature-settings-changed'));
  };

  const toggleSwipeNavigation = () => {
    toggleFeature(SWIPE_NAVIGATION_STORAGE_KEY, !swipeNavigationEnabled, setSwipeNavigationEnabled);
  };

  const toggleExpandMode = () => {
    toggleFeature(EXPAND_MODE_STORAGE_KEY, !expandModeEnabled, setExpandModeEnabled);
  };

  const toggleVoiceMode = () => {
    const nextEnabled = !voiceModeEnabled;
    setVoiceModeEnabled(nextEnabled);
    window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, String(nextEnabled));
    window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
  };

  const toggle = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    save(nextEnabled, mode);
  };

  const selectMode = (nextMode: EdgeLightMode) => {
    setMode(nextMode);
    save(enabled, nextMode);
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/options')}><ArrowLeft size={17} /> Options</button>
          <h1 style={styles.title}>NowBar Settings</h1>
          <p style={styles.text}>Manage the NowBar experience, including its edge lighting and visual behavior.</p>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>⚡ Edge lighting</h2>
            <p style={styles.cardText}>Control the animated edge effect and choose how it behaves around the NowBar.</p>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Edge lighting</p>
                  <p style={styles.description}>Show the selected lighting effect around the NowBar.</p>
                </div>
                <button type="button" style={{ ...styles.button, ...(enabled ? styles.active : {}) }} onClick={toggle} aria-pressed={enabled}>{enabled ? 'Enabled' : 'Enable'}</button>
              </div>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Edge-light color</p>
                  <p style={styles.description}>Choose the color used by the edge lighting effect.</p>
                </div>
                <button type="button" style={styles.button} onClick={() => navigate('/nowbar-color')}>Choose color</button>
              </div>
              <div>
                <p style={{ ...styles.label, margin: '4px 0 10px' }}>Lighting behavior</p>
                <div style={styles.modes}>
                  {EDGE_LIGHT_MODES.map((option) => (
                    <div key={option.key} style={styles.modeRow}>
                      <p style={styles.modeLabel}>{option.label}</p>
                      <button type="button" style={{ ...styles.button, ...(mode === option.key ? styles.active : {}) }} onClick={() => selectMode(option.key)} aria-pressed={mode === option.key}>{mode === option.key ? 'Enabled' : 'Enable'}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>🧭 Navigation behavior</h2>
            <p style={styles.cardText}>Choose which touch interactions are available on the NowBar. Both features are enabled by default.</p>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Swipe navigation</p>
                  <p style={styles.description}>Navigate between related pages by swiping left or right on the NowBar.</p>
                </div>
                <button type="button" style={{ ...styles.button, ...(swipeNavigationEnabled ? styles.active : {}) }} onClick={toggleSwipeNavigation} aria-pressed={swipeNavigationEnabled}>{swipeNavigationEnabled ? 'Enabled' : 'Enable'}</button>
              </div>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Expand mode</p>
                  <p style={styles.description}>Allow holding the NowBar to expand its navigation buttons.</p>
                </div>
                <button type="button" style={{ ...styles.button, ...(expandModeEnabled ? styles.active : {}) }} onClick={toggleExpandMode} aria-pressed={expandModeEnabled}>{expandModeEnabled ? 'Enabled' : 'Enable'}</button>
              </div>
            </div>
          </section>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>🎙 Voice navigation</h2>
            <p style={styles.cardText}>Use the visible NowBar page labels as voice commands. Microphone permission is required.</p>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Voice Mode</p>
                  <p style={styles.description}>Listen for NowBar labels and navigate to the matching page.</p>
                </div>
                <button type="button" style={{ ...styles.button, ...(voiceModeEnabled ? styles.active : {}) }} onClick={toggleVoiceMode} aria-pressed={voiceModeEnabled}>{voiceModeEnabled ? 'Enabled' : 'Enable'}</button>
              </div>
            </div>
          </section>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>🎨 Button color</h2>
            <p style={styles.cardText}>Replace the bold white button borders with a color that matches your NowBar style.</p>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Button color</p>
                  <p style={styles.description}>Use your selected color on NowBar buttons.</p>
                </div>
                <button type="button" style={{ ...styles.button, ...(buttonColorEnabled ? styles.active : {}) }} onClick={toggleButtonColor} aria-pressed={buttonColorEnabled}>{buttonColorEnabled ? 'Enabled' : 'Enable'}</button>
              </div>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Button-color selection</p>
                  <p style={styles.description}>Choose the color applied to the NowBar button borders.</p>
                </div>
                <button type="button" style={styles.button} onClick={() => navigate('/nowbar-button-color')}>Choose color</button>
              </div>
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default NowBarSettingsPage;
