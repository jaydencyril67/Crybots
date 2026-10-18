import React from 'react';

export type HybridThemeMode = 'light' | 'dark';

type HybridThemeToken = {
  mode: HybridThemeMode;
  name: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceGlass: string;
  surfaceShine: string;
  border: string;
  borderStrong: string;
  borderGlass: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primarySoft: string;
  highlight: string;
  highlightSoft: string;
  success: string;
  warning: string;
  danger: string;
};

export const HYBRID_THEME_TOKENS: Record<HybridThemeMode, HybridThemeToken> = {
  light: {
    mode: 'light',
    name: 'Light',
    background: 'radial-gradient(ellipse at 75% 10%, rgba(151,160,174,0.09), transparent 36%), #e9e7e2',
    surface: 'linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,255,255,0.52))',
    surfaceElevated: 'linear-gradient(145deg, rgba(255,255,255,0.90), rgba(255,255,255,0.72))',
    surfaceMuted: 'rgba(255,255,255,0.52)',
    surfaceGlass: 'linear-gradient(145deg, rgba(255,255,255,0.60), rgba(255,255,255,0.40))',
    surfaceShine: 'rgba(255,255,255,0.62)',
    border: 'rgba(80,84,92,0.16)',
    borderStrong: 'rgba(80,84,92,0.28)',
    borderGlass: 'rgba(255,255,255,0.72)',
    text: '#151515',
    textMuted: '#626262',
    textInverse: '#ffffff',
    primary: '#151515',
    primarySoft: 'rgba(21,21,21,0.07)',
    highlight: 'rgba(255,255,255,0.38)',
    highlightSoft: 'rgba(255,255,255,0.22)',
    success: '#166534',
    warning: '#b45309',
    danger: '#b91c1c',
  },
  dark: {
    mode: 'dark',
    name: 'Dark',
    background: 'radial-gradient(ellipse at 75% 10%, rgba(151,160,174,0.09), transparent 36%), #050505',
    surface: 'radial-gradient(ellipse at 0 0, rgba(255,255,255,0.065), transparent 55%), linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
    surfaceElevated: 'radial-gradient(ellipse at 0 0, rgba(255,255,255,0.075), transparent 55%), linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
    surfaceMuted: 'rgba(255,255,255,0.023)',
    surfaceGlass: 'radial-gradient(ellipse at 0 0, rgba(255,255,255,0.065), transparent 55%), linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
    surfaceShine: 'rgba(255,255,255,0.075)',
    border: 'rgba(221,226,233,0.105)',
    borderStrong: 'rgba(221,226,233,0.22)',
    borderGlass: 'rgba(221,226,233,0.15)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    textInverse: '#000000',
    primary: '#ffffff',
    primarySoft: 'rgba(255,255,255,0.12)',
    highlight: 'rgba(255,255,255,0.065)',
    highlightSoft: 'rgba(255,255,255,0.023)',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#fb7185',
  },
};

type HybridThemeProps = {
  mode?: HybridThemeMode;
  children?: React.ReactNode;
};

export const createHybridCardStyles = (theme: HybridThemeToken) => ({
  card: {
    borderRadius: '24px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '18px',
    boxSizing: 'border-box' as const,
    boxShadow: 'inset 0 1px rgba(255,255,255,0.035)',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  },
  cardMobile: {
    padding: '16px',
    borderRadius: '18px',
  },
  panel: {
    borderRadius: '18px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '16px 18px',
    boxSizing: 'border-box' as const,
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  },
});

export const HYBRID_CARD_STYLES = createHybridCardStyles(HYBRID_THEME_TOKENS.dark);

const styles = {
  root: {
    minHeight: '100vh',
    transition: 'background-color 180ms ease, color 180ms ease',
  },
};

const HybridTheme = ({ mode = 'dark', children }: HybridThemeProps) => {
  const theme = HYBRID_THEME_TOKENS[mode];

  return (
    <div
      data-theme={theme.mode}
      data-theme-name={theme.name}
      style={{
        ...styles.root,
        background: theme.background,
        color: theme.text,
      }}
    >
      <style>{`html, body, #root, *, *::before, *::after { font-family: "STIX Two Text" !important; font-synthesis: none !important; }
[data-theme="dark"] select { background-color: #151515 !important; color: #fff !important; border-color: rgba(221,226,233,.28) !important; color-scheme: dark; }
[data-theme="light"] select { background-color: #f5f4f1 !important; color: #151515 !important; border-color: rgba(80,84,92,.28) !important; color-scheme: light; }
[data-theme="dark"] select option { background: #151515 !important; color: #fff !important; }
[data-theme="light"] select option { background: #f5f4f1 !important; color: #151515 !important; }
[data-theme="dark"] [role="listbox"] { background: #090909 !important; background-image: none !important; opacity: 1 !important; border-color: rgba(221,226,233,.32) !important; box-shadow: 0 16px 36px rgba(0,0,0,.72) !important; }
[data-theme="light"] [role="listbox"] { background: #f1f0ec !important; background-image: none !important; opacity: 1 !important; border-color: rgba(80,84,92,.30) !important; box-shadow: 0 16px 36px rgba(30,30,30,.20) !important; }
[data-theme] [role="listbox"] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
[data-theme="dark"] button[role="option"] { background: transparent !important; color: #fff !important; }
[data-theme="light"] button[role="option"] { background: transparent !important; color: #151515 !important; }
[data-theme="dark"] button[role="option"][aria-selected="true"] { background: rgba(255,255,255,.16) !important; color: #fff !important; border: 1px solid rgba(255,255,255,.28) !important; }
[data-theme="light"] button[role="option"][aria-selected="true"] { background: rgba(21,21,21,.10) !important; color: #151515 !important; border: 1px solid rgba(80,84,92,.25) !important; }

[data-theme="dark"] button { background: radial-gradient(ellipse at 8% 0%, rgba(255,255,255,.13), transparent 62%), linear-gradient(145deg, rgba(62,62,62,.94), rgba(28,28,28,.91)) !important; border-color: rgba(221,226,233,.28) !important; color: #fff !important; box-shadow: inset 0 1px rgba(255,255,255,.13), inset 0 -1px rgba(0,0,0,.18), 0 4px 14px rgba(0,0,0,.22); backdrop-filter: blur(12px) saturate(125%); -webkit-backdrop-filter: blur(12px) saturate(125%); }
[data-theme="light"] button { background: radial-gradient(ellipse at 8% 0%, rgba(255,255,255,.58), transparent 62%), linear-gradient(145deg, rgba(190,189,184,.88), rgba(158,157,152,.82)) !important; border-color: rgba(80,84,92,.28) !important; color: #151515 !important; box-shadow: inset 0 1px rgba(255,255,255,.48), inset 0 -1px rgba(70,70,70,.08), 0 4px 14px rgba(30,30,30,.10); backdrop-filter: blur(12px) saturate(125%); -webkit-backdrop-filter: blur(12px) saturate(125%); }
[data-theme] button:disabled { opacity: .55; }
[data-theme] button:active { box-shadow: inset 0 1px rgba(255,255,255,.04); }
`}</style>
      {children}
    </div>
  );
};

export default HybridTheme;
