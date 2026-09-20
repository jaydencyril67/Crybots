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

const hsvToHex = (hue: number, saturation: number, value: number) => {
  const chroma = value * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0] : segment < 2 ? [secondary, chroma, 0] : segment < 3 ? [0, chroma, secondary] : segment < 4 ? [0, secondary, chroma] : segment < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
  const match = value - chroma;
  return rgbToHex(Math.round((red + match) * 255), Math.round((green + match) * 255), Math.round((blue + match) * 255));
};

const hueFromHex = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;
  if (max === red) return ((60 * ((green - blue) / delta) + 360) % 360);
  if (max === green) return 60 * ((blue - red) / delta + 2);
  return 60 * ((red - green) / delta + 4);
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
  colorPicker: { width: 'min(76vw, 330px)', margin: '8px auto 22px' },
  hueRing: { width: '100%', aspectRatio: '1', borderRadius: '50%', background: 'conic-gradient(from 0turn, hsl(0 100% 50%) 0deg, hsl(30 100% 50%) 30deg, hsl(60 100% 50%) 60deg, hsl(90 100% 50%) 90deg, hsl(120 100% 50%) 120deg, hsl(150 100% 50%) 150deg, hsl(180 100% 50%) 180deg, hsl(210 100% 50%) 210deg, hsl(240 100% 50%) 240deg, hsl(270 100% 50%) 270deg, hsl(300 100% 50%) 300deg, hsl(330 100% 50%) 330deg, hsl(360 100% 50%) 360deg)', padding: '24px', boxSizing: 'border-box' as const, cursor: 'crosshair', position: 'relative' as const, boxShadow: '0 0 0 1px rgba(255,255,255,.16), 0 12px 30px rgba(0,0,0,.22)' },
  colorField: { position: 'absolute' as const, inset: '24px', borderRadius: '50%', background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.96) 100%), linear-gradient(to right, #fff 0%, var(--picker-hue) 100%)', cursor: 'crosshair', overflow: 'hidden' as const, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3), inset 0 0 18px rgba(0,0,0,.28)' },
  colorFieldPoint: { position: 'absolute' as const, width: '18px', height: '18px', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #000, 0 2px 5px rgba(0,0,0,.45)', pointerEvents: 'none' as const },
  huePointTrack: { position: 'absolute' as const, inset: '12px', borderRadius: '50%', pointerEvents: 'none' as const },
  huePoint: { position: 'absolute' as const, left: '50%', top: 0, width: '18px', height: '18px', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #000, 0 2px 5px rgba(0,0,0,.45)', pointerEvents: 'none' as const },
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
  const [hue, setHue] = useState(197);
  const [saturation, setSaturation] = useState(0.77);
  const [value, setValue] = useState(0.97);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) ?? '{}') as { color?: string };
      if (stored.color && isHexColor(stored.color)) {
        const storedColor = stored.color.toLowerCase();
        setColor(storedColor);
        setCustomColor(storedColor);
        const storedRgb = hexToRgb(storedColor);
        const storedMax = Math.max(storedRgb.r, storedRgb.g, storedRgb.b) / 255;
        const storedMin = Math.min(storedRgb.r, storedRgb.g, storedRgb.b) / 255;
        setRgb(storedRgb);
        setHue(hueFromHex(storedColor));
        setValue(storedMax);
        setSaturation(storedMax === 0 ? 0 : (storedMax - storedMin) / storedMax);
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
    const nextRgb = hexToRgb(normalizedColor);
    const nextMax = Math.max(nextRgb.r, nextRgb.g, nextRgb.b) / 255;
    const nextMin = Math.min(nextRgb.r, nextRgb.g, nextRgb.b) / 255;
    setRgb(nextRgb);
    setHue(hueFromHex(normalizedColor));
    setValue(nextMax);
    setSaturation(nextMax === 0 ? 0 : (nextMax - nextMin) / nextMax);
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

  const selectHueAtPoint = (clientX: number, clientY: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const outerRadius = Math.min(rect.width, rect.height) / 2;
    const innerRadius = outerRadius - 24;

    if (distance < innerRadius || distance > outerRadius) {
      return;
    }

    const nextHue = (Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI + 90 + 360) % 360;
    setHue(nextHue);
    selectColor(hsvToHex(nextHue, saturation, value));
  };

  const updateColorField = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextSaturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const nextValue = Math.max(0, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height)));
    setSaturation(nextSaturation);
    setValue(nextValue);
    selectColor(hsvToHex(hue, nextSaturation, nextValue));
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
              style={styles.colorPicker}
            >
              <div
                style={{ ...styles.hueRing, touchAction: 'manipulation' }}
                onClick={(event) => {
                  selectHueAtPoint(event.clientX, event.clientY, event.currentTarget);
                }}
              >
                <span style={{ ...styles.huePointTrack, transform: `rotate(${hue}deg)` }}>
                  <span style={styles.huePoint} />
                </span>
                <div
                  style={{ ...styles.colorField, '--picker-hue': hsvToHex(hue, 1, 1) } as React.CSSProperties}
                  onClick={(event) => {
                    event.stopPropagation();
                    updateColorField(event);
                  }}
                >
                  <span style={{ ...styles.colorFieldPoint, left: `${saturation * 100}%`, top: `${(1 - value) * 100}%` }} />
                </div>
              </div>
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
