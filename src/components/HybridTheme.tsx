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
    background: '#ffffff',
    surface: '#f7f7f7',
    surfaceElevated: '#ffffff',
    surfaceMuted: '#f2f2f2',
    surfaceGlass: 'rgba(255,255,255,0.70)',
    surfaceShine: 'rgba(255,255,255,0.96)',
    border: 'rgba(0, 0, 0, 0.08)',
    borderStrong: 'rgba(0, 0, 0, 0.14)',
    borderGlass: 'rgba(255,255,255,0.95)',
    text: '#111111',
    textMuted: '#5f5f5f',
    textInverse: '#ffffff',
    primary: '#111111',
    primarySoft: 'rgba(17, 17, 17, 0.05)',
    highlight: 'rgba(255,255,255,0.92)',
    highlightSoft: 'rgba(255,255,255,0.42)',
    success: '#166534',
    warning: '#4b5563',
    danger: '#b91c1c',
  },
  dark: {
    mode: 'dark',
    name: 'Dark',
    background: '#000000',
    surface: '#111111',
    surfaceElevated: '#181818',
    surfaceMuted: '#111111',
    surfaceGlass: 'rgba(255,255,255,0.07)',
    surfaceShine: 'rgba(255,255,255,0.20)',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.18)',
    borderGlass: 'rgba(255,255,255,0.30)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    textInverse: '#000000',
    primary: '#ffffff',
    primarySoft: 'rgba(255, 255, 255, 0.10)',
    highlight: 'rgba(255,255,255,0.52)',
    highlightSoft: 'rgba(255,255,255,0.22)',
    success: '#4ade80',
    warning: '#d4d4d4',
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
    background: `linear-gradient(180deg, ${theme.surfaceShine} 0%, ${theme.surfaceGlass} 100%)`,
    padding: '18px',
    boxSizing: 'border-box' as const,
    boxShadow: `inset 0 1px 0 ${theme.highlight}, inset 0 -1px 0 ${theme.border}, 0 16px 28px ${theme.primarySoft}`,
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
  cardMobile: {
    padding: '16px',
    borderRadius: '18px',
  },
  panel: {
    borderRadius: '18px',
    border: `1px solid ${theme.borderGlass}`,
    background: `linear-gradient(180deg, ${theme.surfaceShine} 0%, ${theme.surfaceGlass} 100%)`,
    padding: '16px 18px',
    boxSizing: 'border-box' as const,
    boxShadow: `inset 0 1px 0 ${theme.highlight}, inset 0 -1px 0 ${theme.border}, 0 12px 22px ${theme.primarySoft}`,
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
      {children}
    </div>
  );
};

export default HybridTheme;
