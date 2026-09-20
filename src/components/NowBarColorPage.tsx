import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')).join('')}`;

const hueToHex = (hue: number) => {
  const saturation = 1;
  const lightness = 0.55;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0] : segment < 2 ? [secondary, chroma, 0] : segment < 3 ? [0, chroma, secondary] : segment < 4 ? [0, secondary, chroma] : segment < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
  const match = lightness - chroma / 2;
  return rgbToHex(Math.round((red + match) * 255), Math.round((green + match) * 255), Math.round((blue + match) * 255));
};

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
  colorWheel: { width: 'min(76vw, 330px)', aspectRatio: '1', margin: '8px auto 22px', borderRadius: '50%', background: 'conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)', border: `10px solid ${theme.surfaceMuted}`, boxShadow: `0 0 0 1px ${theme.borderGlass}, 0 12px 35px rgba(0,0,0,.25)`, cursor: 'crosshair', position: 'relative' as const },
  wheelCenter: { position: 'absolute' as const, inset: '25%', borderRadius: '50%', background: theme.background, border: `8px solid ${theme.surfaceMuted}`, pointerEvents: 'none' as const },
  inputRow: { display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' as const },
  input: { flex: '1 1 180px', minWidth: 0, borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '12px 14px', fontSize: '0.95rem', outline: 'none' },
  rgbRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' },
  rgbInput: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '12px 10px', fontSize: '0.95rem', outline: 'none' },
  applyButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', border: 0, borderRadius: '12px', background: theme.primary, color: '#fff', padding: '12px 18px', fontWeight: 800, cursor: 'pointer' },
  error: { margin: '8px 0 0', color: '#f87171', fontSize: '0.82rem' },
  code: { margin: '0 0 0 auto', color: theme.textMuted, fontSize: '0.85rem' },
});

const NowBarColorPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [color, setColor] = useState('#38bdf8');
  const [customColor, setCustomColor] = useState('#38bdf8');
  const [rgb, setRgb] = useState({ r: 56, g: 189, b: 248 });
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { color?: string };
      if (stored.color && isHexColor(stored.color)) {
        const storedColor = stored.color.toLowerCase();
        setColor(storedColor);
        setCustomColor(storedColor);
        setRgb(hexToRgb(storedColor));
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
    setColor(normalizedColor);
    setCustomColor(normalizedColor);
    setRgb(hexToRgb(normalizedColor));
    setError('');
  };

  const applyCustomColor = () => {
    const normalizedColor = customColor.startsWith('#') ? customColor : `#${customColor}`;
    if (!isHexColor(normalizedColor)) {
      setError('Enter a valid six-digit hex color, for example #38bdf8.');
      return;
    }
    selectColor(normalizedColor);
  };

  const updateRgb = (channel: 'r' | 'g' | 'b', value: string) => {
    const nextRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, Number(value) || 0)) };
    setRgb(nextRgb);
    selectColor(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
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

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Color wheel</h2>
            <div
              role="slider"
              tabIndex={0}
              aria-label="Choose NowBar color from color wheel"
              style={styles.colorWheel}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const hue = (Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI + 90 + 360) % 360;
                selectColor(hueToHex(hue));
              }}
            >
              <span style={{ ...styles.wheelCenter, background: color }} />
            </div>
            <div style={styles.inputRow}>
              <input aria-label="HEX color" value={customColor} onChange={(event) => setCustomColor(event.target.value)} placeholder="#38bdf8" style={styles.input} />
              <button type="button" style={styles.applyButton} onClick={applyCustomColor}><Check size={17} /> Apply</button>
            </div>
            <div style={styles.rgbRow}>
              {(['r', 'g', 'b'] as const).map((channel) => (
                <input key={channel} aria-label={`${channel.toUpperCase()} color value`} type="number" min="0" max="255" value={rgb[channel]} onChange={(event) => updateRgb(channel, event.target.value)} style={styles.rgbInput} />
              ))}
            </div>
            {error ? <p style={styles.error}>{error}</p> : null}
          </section>
        </div>
      </main>
    </HybridTheme>
  );
};

export default NowBarColorPage;
