import React from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme, type AppThemePreference } from './AppTheme';
import NowBar from './NowBar';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  card: { marginTop: '24px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 900 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  toggleRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginTop: '18px' },
  toggle: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '10px 14px', fontWeight: 700, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer' },
  activeToggle: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
});

const ThemeSettingsPage = () => {
  const { themeMode, themePreference, setThemePreference } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const preferences: AppThemePreference[] = ['dark', 'light', 'system', 'shift'];

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <h1 style={styles.title}>Theme Settings</h1>
          <p style={styles.text}>Choose how KingsHall Exchange should look. System follows your device theme; Shift uses Light from 6 AM to 6 PM and Dark overnight.</p>
          <section style={styles.card}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>🎨 Theme</h2>
            <div style={styles.toggleRow}>
              {preferences.map((preference) => (
                <button key={preference} type="button" style={{ ...styles.toggle, ...(themePreference === preference ? styles.activeToggle : {}) }} onClick={() => setThemePreference(preference)}>
                  {preference[0].toUpperCase() + preference.slice(1)}
                </button>
              ))}
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default ThemeSettingsPage;
