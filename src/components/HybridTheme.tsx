import React from 'react';

export type HybridThemeMode = 'light' | 'dark';

type HybridThemeToken = {
  mode: HybridThemeMode;
  name: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
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
    border: 'rgba(0, 0, 0, 0.10)',
    text: '#111111',
    textMuted: '#5f5f5f',
    primary: '#111111',
    primarySoft: 'rgba(17, 17, 17, 0.08)',
    success: '#111111',
    warning: '#4b5563',
    danger: '#111111',
  },
  dark: {
    mode: 'dark',
    name: 'Dark',
    background: '#000000',
    surface: '#111111',
    surfaceElevated: '#181818',
    border: 'rgba(255,255,255,0.10)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    primary: '#ffffff',
    primarySoft: 'rgba(255, 255, 255, 0.08)',
    success: '#ffffff',
    warning: '#d4d4d4',
    danger: '#ffffff',
  },
};

type HybridThemeProps = {
  mode?: HybridThemeMode;
  children?: React.ReactNode;
};

export const HYBRID_CARD_STYLES = {
  card: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
    boxSizing: 'border-box' as const,
  },
  cardMobile: {
    padding: '16px',
    borderRadius: '18px',
  },
};

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
