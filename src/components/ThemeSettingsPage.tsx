import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme, type AppThemePreference } from './AppTheme';
import NowBar from './NowBar';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: '20px 0 0', fontSize: '1.15rem', fontWeight: 900 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: '22px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  cardHeading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  rowContent: { minWidth: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  enableButton: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', flexShrink: 0 },
  enabledButton: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  preview: { width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0 },
  rowContentWithPreview: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 },
});

const ThemeSettingsPage = () => {
  const { themeMode, themePreference, setThemePreference } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const themeOptions: Array<{ key: AppThemePreference; name: string; description: string; preview: 'dark' | 'light' }> = [
    { key: 'dark', name: 'Dark', description: 'A focused black canvas with high-contrast surfaces for a calm, immersive workspace.', preview: 'dark' },
    { key: 'light', name: 'Light', description: 'A warm, bright interface with soft surfaces designed for daytime clarity.', preview: 'light' },
    { key: 'system', name: 'System', description: 'Automatically follows the light or dark appearance selected on your device.', preview: themeMode },
    { key: 'shift', name: 'Shift', description: 'Adapts throughout the day: light during daytime hours and dark overnight.', preview: themeMode },
  ];

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/options')}><ArrowLeft size={17} /> Options</button>
          <h1 style={styles.title}>Theme Settings</h1>
          <p style={styles.text}>Choose how KingsHall Exchange should look. System follows your device theme; Shift uses Light from 6 AM to 6 PM and Dark overnight.</p>
          <section style={styles.card}>
            <h2 style={styles.cardHeading}>Appearance theme</h2>
            <p style={styles.cardText}>Choose how KingsHall Exchange should look. Your selected theme is applied immediately.</p>
            <div style={styles.list}>
              {themeOptions.map((option) => {
                const previewTheme = HYBRID_THEME_TOKENS[option.preview];
                const isEnabled = themePreference === option.key;

                return (
                  <div key={option.key} style={styles.row}>
                    <div style={styles.rowContentWithPreview}>
                      <div style={{ ...styles.preview, background: previewTheme.background, border: `1px solid ${previewTheme.borderGlass}` }} />
                      <div style={styles.rowContent}>
                        <p style={styles.label}>{option.name}</p>
                        <p style={styles.description}>{option.description}</p>
                      </div>
                    </div>
                    <button type="button" style={{ ...styles.enableButton, ...(isEnabled ? styles.enabledButton : {}) }} onClick={() => setThemePreference(option.key)} aria-pressed={isEnabled}>
                      {isEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default ThemeSettingsPage;
