import React, { useEffect, useState } from 'react';
import { ArrowLeft, Zap, Navigation, Palette } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

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
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '105px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: '10px clamp(14px, 3vw, 28px) 105px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '24px' },
  pageHeading: { margin: '0 0 25px' },
  heading: { margin: '15px 0 8px', fontSize: 'clamp(30px, 5vw, 43px)', fontWeight: 600, lineHeight: 1.08, letterSpacing: '-.035em' },
  intro: { maxWidth: '580px', margin: 0, color: theme.textMuted, fontSize: '13px', lineHeight: 1.75 },
  card: { margin: '0 0 15px', padding: 'clamp(16px, 3vw, 23px)', border: `1px solid ${theme.borderGlass}`, borderRadius: '19px', background: theme.surfaceGlass, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.055)' },
  cardHeading: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '17px' },
  cardIcon: { display: 'grid', placeItems: 'center', flex: '0 0 39px', width: '39px', height: '39px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', color: theme.text, background: 'rgba(255,255,255,.035)' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '-.01em' },
  cardText: { margin: '5px 0 0', color: theme.textMuted, fontSize: '11px', lineHeight: 1.65 },
  list: { display: 'grid', gap: 0 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minHeight: '63px', padding: '12px 0', borderTop: '1px solid rgba(221,226,233,.075)' },
  rowContent: { display: 'flex', flex: '1 1 auto', flexDirection: 'column' as const, gap: '5px', minWidth: 0 },
  label: { margin: 0, fontWeight: 600, fontSize: '12px', color: theme.text },
  description: { margin: 0, maxWidth: '560px', color: theme.textMuted, fontSize: '10.5px', lineHeight: 1.6 },
  button: { borderRadius: '10px', border: `1px solid ${theme.borderGlass}`, padding: '9px 12px', fontWeight: 700, fontSize: '11px', color: theme.text, background: 'rgba(255,255,255,.035)', cursor: 'pointer', flexShrink: 0 },
  active: { background: theme.surfaceMuted, color: theme.text, border: `1px solid ${theme.primary}` },
  toggle: { position: 'relative' as const, display: 'block', flex: '0 0 42px', width: '42px', height: '25px', padding: '3px', border: `1px solid ${theme.borderGlass}`, borderRadius: '999px', background: 'rgba(255,255,255,.045)', cursor: 'pointer' },
  toggleOn: { borderColor: theme.primary, background: 'rgba(185,199,223,.22)', boxShadow: '0 0 12px rgba(185,199,223,.08)' },
  toggleKnob: { display: 'block', width: '17px', height: '17px', borderRadius: '50%', background: '#a4a8b0', transition: 'transform .16s, background .16s' },
  toggleKnobOn: { transform: 'translateX(16px)', background: '#eef2f8' },
  modes: { display: 'grid', gap: 0, marginTop: '3px' },
  modeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', minHeight: '43px', padding: '9px 1px', borderTop: '1px solid rgba(221,226,233,.075)' },
  modeLabel: { margin: 0, fontWeight: 500, fontSize: '11px' },
});

const NowBarPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [enabled, setEnabled] = useState(false);
  const [buttonColorEnabled, setButtonColorEnabled] = useState(false);
  const [swipeNavigationEnabled, setSwipeNavigationEnabled] = useState(true);
  const [expandModeEnabled, setExpandModeEnabled] = useState(true);
    const [mode, setMode] = useState<EdgeLightMode>('stable');

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { enabled?: boolean; mode?: EdgeLightMode };
      const savedButtonColorEnabled = window.localStorage.getItem(BUTTON_COLOR_ENABLED_STORAGE_KEY);
      const savedSwipeNavigation = window.localStorage.getItem(SWIPE_NAVIGATION_STORAGE_KEY);
      const savedExpandMode = window.localStorage.getItem(EXPAND_MODE_STORAGE_KEY);
      setEnabled(Boolean(saved.enabled));
      if (savedButtonColorEnabled !== null) setButtonColorEnabled(savedButtonColorEnabled === 'true');
      if (savedSwipeNavigation !== null) setSwipeNavigationEnabled(savedSwipeNavigation === 'true');
      if (savedExpandMode !== null) setExpandModeEnabled(savedExpandMode === 'true');
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
          <header style={styles.pageHeading}>
            <h1 style={styles.heading}>NowBar</h1>
            <p style={styles.intro}>Customize NowBar lighting, navigation gestures, and button appearance.</p>
          </header>
          <section style={styles.card}>
            <div style={styles.cardHeading}><span style={styles.cardIcon}><Zap size={19} /></span><div><h2 style={styles.cardTitle}>Edge lighting</h2><p style={styles.cardText}>Control the animated edge effect around the NowBar.</p></div></div>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Edge lighting</p>
                  <p style={styles.description}>Show the selected lighting effect around the NowBar.</p>
                </div>
                <button type="button" role="switch" aria-checked={enabled} aria-label="Enable edge lighting" style={{ ...styles.toggle, ...(enabled ? styles.toggleOn : {}) }} onClick={toggle}><span style={{ ...styles.toggleKnob, ...(enabled ? styles.toggleKnobOn : {}) }} /></button>
              </div>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Edge-light color</p>
                  <p style={styles.description}>Choose the color used by the edge lighting effect.</p>
                </div>
                <button type="button" style={styles.button} onClick={() => navigate('/nowbar-color')}>Choose color</button>
              </div>
              <div style={{ marginTop: '12px' }}>
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
            <div style={styles.cardHeading}><span style={styles.cardIcon}><Navigation size={19} /></span><div><h2 style={styles.cardTitle}>Navigation behavior</h2><p style={styles.cardText}>Choose which touch interactions are available on the NowBar.</p></div></div>
            <div style={styles.list}>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Swipe navigation</p>
                  <p style={styles.description}>Navigate between related pages by swiping left or right on the NowBar.</p>
                </div>
                <button type="button" role="switch" aria-checked={swipeNavigationEnabled} aria-label="Enable swipe navigation" style={{ ...styles.toggle, ...(swipeNavigationEnabled ? styles.toggleOn : {}) }} onClick={toggleSwipeNavigation}><span style={{ ...styles.toggleKnob, ...(swipeNavigationEnabled ? styles.toggleKnobOn : {}) }} /></button>
              </div>
              <div style={styles.row}>
                <div style={styles.rowContent}>
                  <p style={styles.label}>Expand mode</p>
                  <p style={styles.description}>Allow holding the NowBar to expand its navigation buttons.</p>
                </div>
                <button type="button" role="switch" aria-checked={expandModeEnabled} aria-label="Enable expand mode" style={{ ...styles.toggle, ...(expandModeEnabled ? styles.toggleOn : {}) }} onClick={toggleExpandMode}><span style={{ ...styles.toggleKnob, ...(expandModeEnabled ? styles.toggleKnobOn : {}) }} /></button>
              </div>
            </div>
          </section>
          <section style={styles.card}>
            <div style={styles.cardHeading}><span style={styles.cardIcon}><Palette size={19} /></span><div><h2 style={styles.cardTitle}>Button color</h2><p style={styles.cardText}>Customize the borders of your NowBar navigation buttons.</p></div></div>
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

export default NowBarPage;
