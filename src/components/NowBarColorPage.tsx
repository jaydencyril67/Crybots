import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const EDGE_LIGHT_COLOR_HISTORY_KEY = 'nowbar_edge_light_color_history';
const MAX_EDGE_LIGHT_COLOR_HISTORY = 5;

const COLOR_PALETTE = [
  '#38bdf8', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16',
  '#a3e635', '#eab308', '#facc15', '#f59e0b', '#f97316', '#fb923c',
  '#ef4444', '#e11d48', '#f43f5e', '#ec4899', '#db2777', '#d946ef',
  '#a855f7', '#8b5cf6', '#6366f1', '#4f46e5', '#2563eb', '#0ea5e9',
  '#7dd3fc', '#5eead4', '#86efac', '#bef264', '#fde047', '#fdba74',
] as const;

const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '120px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  backButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', border: 0, background: 'transparent', color: theme.textMuted, padding: 0, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 700 },
  heading: { margin: '24px 0 8px', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 900 },
  intro: { margin: 0, color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: '24px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  preview: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '16px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}` },
  previewColor: { width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0 },
  sectionTitle: { margin: '0 0 14px', fontSize: '1rem', fontWeight: 800 },
  palette: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(52px, 1fr))', gap: '10px' },
  swatch: { width: '100%', aspectRatio: '1', minHeight: '46px', borderRadius: '14px', border: `2px solid ${theme.borderGlass}`, cursor: 'pointer', boxSizing: 'border-box' as const },
  activeSwatch: { border: `3px solid ${theme.text}`, boxShadow: `0 0 0 3px ${theme.primary}` },
  recent: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px' },
  inputRow: { display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' as const },
  input: { flex: '1 1 180px', minWidth: 0, borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '12px 14px', fontSize: '0.95rem', outline: 'none' },
  applyButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', border: 0, borderRadius: '12px', background: theme.primary, color: '#fff', padding: '12px 18px', fontWeight: 800, cursor: 'pointer' },
  error: { margin: '8px 0 0', color: '#f87171', fontSize: '0.82rem' },
  code: { margin: '0 0 0 auto', color: theme.textMuted, fontSize: '0.85rem' },
});

const NowBarColorPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [color, setColor] = useState('#38bdf8');
  const [history, setHistory] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#38bdf8');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { color?: string };
      if (stored.color && isHexColor(stored.color)) {
        setColor(stored.color.toLowerCase());
        setCustomColor(stored.color.toLowerCase());
      }
      const storedHistory = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_COLOR_HISTORY_KEY) ?? '[]') as unknown;
      if (Array.isArray(storedHistory)) {
        setHistory(storedHistory.filter((value): value is string => typeof value === 'string' && isHexColor(value)).map((value) => value.toLowerCase()).slice(0, MAX_EDGE_LIGHT_COLOR_HISTORY));
      }
    } catch {
      // Keep the default color when saved data is invalid.
    }
  }, []);

  const selectColor = (nextColor: string) => {
    const normalizedColor = nextColor.toLowerCase();
    const stored = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    window.localStorage.setItem(EDGE_LIGHT_STORAGE_KEY, JSON.stringify({ ...stored, color: normalizedColor }));
    window.dispatchEvent(new Event('nowbar-edge-light-changed'));
    const nextHistory = Array.from(new Set([normalizedColor, ...history])).slice(0, MAX_EDGE_LIGHT_COLOR_HISTORY);
    window.localStorage.setItem(EDGE_LIGHT_COLOR_HISTORY_KEY, JSON.stringify(nextHistory));
    setColor(normalizedColor);
    setCustomColor(normalizedColor);
    setHistory(nextHistory);
    setError('');
  };

  const applyCustomColor = () => {
    if (!isHexColor(customColor)) {
      setError('Enter a valid six-digit hex color, for example #38bdf8.');
      return;
    }
    selectColor(customColor);
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.backButton} onClick={() => navigate('/settings')}>
            <ArrowLeft size={18} /> Back to settings
          </button>
          <h1 style={styles.heading}>NowBar light color</h1>
          <p style={styles.intro}>Choose the color used by your NowBar edge lighting. Your selection is saved immediately.</p>

          <section style={styles.card}>
            <div style={styles.preview}>
              <span style={{ ...styles.previewColor, background: color, boxShadow: `0 0 24px ${color}` }} />
              <strong>Selected color</strong>
              <code style={styles.code}>{color.toUpperCase()}</code>
            </div>
          </section>

          {history.length > 0 ? (
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Recent colors</h2>
              <div style={styles.recent}>
                {history.map((recentColor) => (
                  <button key={recentColor} type="button" aria-label={`Use recent color ${recentColor}`} title={recentColor.toUpperCase()} onClick={() => selectColor(recentColor)} style={{ ...styles.swatch, width: '52px', ...(color === recentColor ? styles.activeSwatch : {}), background: recentColor }} />
                ))}
              </div>
            </section>
          ) : null}

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Color palette</h2>
            <div style={styles.palette}>
              {COLOR_PALETTE.map((paletteColor) => (
                <button key={paletteColor} type="button" aria-label={`Use ${paletteColor} for NowBar edge lighting`} title={paletteColor.toUpperCase()} onClick={() => selectColor(paletteColor)} style={{ ...styles.swatch, ...(color === paletteColor ? styles.activeSwatch : {}), background: paletteColor }} />
              ))}
            </div>
            <div style={styles.inputRow}>
              <input aria-label="Custom hex color" value={customColor} onChange={(event) => setCustomColor(event.target.value)} placeholder="#38bdf8" style={styles.input} />
              <button type="button" style={styles.applyButton} onClick={applyCustomColor}><Check size={17} /> Apply custom color</button>
            </div>
            {error ? <p style={styles.error}>{error}</p> : null}
          </section>
        </div>
      </main>
    </HybridTheme>
  );
};

export default NowBarColorPage;
