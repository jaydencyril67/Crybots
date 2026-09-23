import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme, type AppThemePreference } from './AppTheme';
import NowBar from './NowBar';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  card: { marginTop: '24px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: '20px 0 0', fontSize: '1.15rem', fontWeight: 900 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginTop: '22px' },
  themeCard: { display: 'grid', gap: '14px', padding: '16px', borderRadius: '18px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, textAlign: 'left' as const },
  themeCardActive: { border: `1px solid ${theme.primary}`, boxShadow: `0 0 0 1px ${theme.primarySoft}` },
  themePreview: { height: '76px', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', boxSizing: 'border-box' as const },
  previewLine: { height: '7px', borderRadius: '999px', width: '58%' },
  previewPanel: { height: '24px', borderRadius: '8px', width: '78%' },
  themeCardTitle: { margin: 0, fontSize: '1rem', fontWeight: 850 },
  themeCardText: { margin: 0, color: theme.textMuted, fontSize: '0.8rem', lineHeight: 1.45, minHeight: '46px' },
  enableButton: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', justifySelf: 'start' },
  enabledButton: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
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
          <div style={styles.themeGrid}>
            {themeOptions.map((option) => {
              const previewTheme = HYBRID_THEME_TOKENS[option.preview];
              const isEnabled = themePreference === option.key;

              return (
                <article key={option.key} style={{ ...styles.themeCard, ...(isEnabled ? styles.themeCardActive : {}) }}>
                  <div style={{ ...styles.themePreview, background: previewTheme.background, border: `1px solid ${previewTheme.borderGlass}` }}>
                    <span style={{ ...styles.previewLine, background: previewTheme.primary }} />
                    <span style={{ ...styles.previewPanel, background: previewTheme.surfaceElevated, border: `1px solid ${previewTheme.border}` }} />
                  </div>
                  <div>
                    <h2 style={{ ...styles.themeCardTitle, color: theme.text }}>{option.name}</h2>
                    <p style={styles.themeCardText}>{option.description}</p>
                  </div>
                  <button type="button" style={{ ...styles.enableButton, ...(isEnabled ? styles.enabledButton : {}) }} onClick={() => setThemePreference(option.key)}>
                    {isEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default ThemeSettingsPage;
