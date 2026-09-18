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
    background: '#f4efe8',
    surface: '#fbf8f2',
    surfaceElevated: '#fffdfa',
    surfaceMuted: '#f2ebe1',
    surfaceGlass: 'rgba(255,255,255,0.32)',
    surfaceShine: 'rgba(255,255,255,0.04)',
    border: 'rgba(28, 28, 28, 0.08)',
    borderStrong: 'rgba(28, 28, 28, 0.12)',
    borderGlass: 'rgba(255,255,255,0.06)',
    text: '#151515',
    textMuted: '#626262',
    textInverse: '#ffffff',
    primary: '#151515',
    primarySoft: 'rgba(21, 21, 21, 0.06)',
    highlight: 'rgba(255,255,255,0.04)',
    highlightSoft: 'rgba(255,255,255,0.03)',
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
    surfaceShine: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.18)',
    borderGlass: 'rgba(255,255,255,0.10)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    textInverse: '#000000',
    primary: '#ffffff',
    primarySoft: 'rgba(255, 255, 255, 0.10)',
    highlight: 'rgba(255,255,255,0.02)',
    highlightSoft: 'rgba(255,255,255,0.02)',
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
    background: theme.surfaceGlass,
    padding: '18px',
    boxSizing: 'border-box' as const,
    boxShadow: 'none',
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
    background: theme.surfaceGlass,
    padding: '16px 18px',
    boxSizing: 'border-box' as const,
    boxShadow: 'none',
    backdropFilter: 'blur(24px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  },
} satisfies Record<'card' | 'cardMobile' | 'panel', React.CSSProperties>);

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
