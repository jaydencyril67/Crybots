import React from 'react';

export type HybridThemeMode = 'light' | 'dark';

type HybridThemeToken = {
  mode: HybridThemeMode;
  name: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primarySoft: string;
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
    border: 'rgba(0, 0, 0, 0.10)',
    borderStrong: 'rgba(0, 0, 0, 0.16)',
    text: '#111111',
    textMuted: '#5f5f5f',
    textInverse: '#ffffff',
    primary: '#111111',
    primarySoft: 'rgba(17, 17, 17, 0.08)',
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
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.16)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    textInverse: '#000000',
    primary: '#ffffff',
    primarySoft: 'rgba(255, 255, 255, 0.08)',
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
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: '18px',
    boxSizing: 'border-box' as const,
  },
  cardMobile: {
    padding: '16px',
    borderRadius: '18px',
  },
  panel: {
    borderRadius: '18px',
    border: `1px solid ${theme.borderStrong}`,
    background: theme.surfaceElevated,
    padding: '16px 18px',
    boxSizing: 'border-box' as const,
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
