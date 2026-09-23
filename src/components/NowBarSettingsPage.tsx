import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type EdgeLightMode = 'stable-light' | 'stable' | 'blink-light' | 'blink' | 'pulse-light' | 'pulse' | 'color-light' | 'color';

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const BUTTON_COLOR_ENABLED_STORAGE_KEY = 'nowbar_button_color_enabled';
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
  title: { margin: '20px 0 0', fontSize: '1.15rem', fontWeight: 900 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: '24px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  row: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: '10px', marginTop: '18px' },
  button: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '10px 14px', fontWeight: 700, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer' },
  active: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  modes: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '16px' },
});

const NowBarSettingsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [enabled, setEnabled] = useState(false);
  const [buttonColorEnabled, setButtonColorEnabled] = useState(true);
  const [mode, setMode] = useState<EdgeLightMode>('stable');

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { enabled?: boolean; mode?: EdgeLightMode };
      const savedButtonColorEnabled = window.localStorage.getItem(BUTTON_COLOR_ENABLED_STORAGE_KEY);
      setEnabled(Boolean(saved.enabled));
      if (savedButtonColorEnabled !== null) setButtonColorEnabled(savedButtonColorEnabled === 'true');
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
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>⚡ Edge lighting</h2>
            <div style={styles.row}>
              <button type="button" style={{ ...styles.button, ...(enabled ? styles.active : {}) }} onClick={toggle}>{enabled ? 'On' : 'Off'}</button>
              <button type="button" style={styles.button} onClick={() => navigate('/nowbar-color')}>Choose color</button>
            </div>
            <div style={styles.modes}>
              {EDGE_LIGHT_MODES.map((option) => (
                <button key={option.key} type="button" style={{ ...styles.button, borderRadius: '14px', textAlign: 'left', ...(mode === option.key ? styles.active : {}) }} onClick={() => selectMode(option.key)}>{option.label}</button>
              ))}
            </div>
          </section>
          <section style={styles.card}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>🎨 Button color</h2>
            <p style={styles.text}>Replace the bold white button borders with a color that matches your NowBar style.</p>
            <div style={styles.row}>
              <button type="button" style={{ ...styles.button, ...(buttonColorEnabled ? styles.active : {}) }} onClick={toggleButtonColor}>{buttonColorEnabled ? 'On' : 'Off'}</button>
              <button type="button" style={styles.button} onClick={() => navigate('/nowbar-button-color')}>Choose color</button>
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default NowBarSettingsPage;
