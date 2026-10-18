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
    background: '#e9e7e2',
    surface: 'rgba(255,255,255,0.72)',
    surfaceElevated: 'rgba(255,255,255,0.88)',
    surfaceMuted: 'rgba(255,255,255,0.48)',
    surfaceGlass: 'rgba(255,255,255,0.58)',
    surfaceShine: 'rgba(255,255,255,0.42)',
    border: 'rgba(255,255,255,0.46)',
    borderStrong: 'rgba(255,255,255,0.72)',
    borderGlass: 'rgba(255,255,255,0.52)',
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
    background: '#050505',
    surface: 'rgba(255,255,255,0.055)',
    surfaceElevated: 'rgba(255,255,255,0.095)',
    surfaceMuted: 'rgba(255,255,255,0.035)',
    surfaceGlass: 'rgba(255,255,255,0.075)',
    surfaceShine: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.22)',
    borderGlass: 'rgba(255,255,255,0.13)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    textInverse: '#000000',
    primary: '#ffffff',
    primarySoft: 'rgba(255,255,255,0.12)',
    highlight: 'rgba(255,255,255,0.055)',
    highlightSoft: 'rgba(255,255,255,0.035)',
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
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '18px',
    boxSizing: 'border-box' as const,
    backdropFilter: 'blur(28px) saturate(1.35)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.35)',
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
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
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
      <style>{`html, body, #root, *, *::before, *::after { font-family: "STIX Two Text" !important; font-synthesis: none !important; }`}</style>
      {children}
    </div>
  );
};

export default HybridTheme;
