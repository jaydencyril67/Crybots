import React from 'react';

type HybridThemeMode = 'light' | 'dark';

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
    background: '#f4f8ff',
    surface: 'rgba(255,255,255,0.9)',
    surfaceElevated: '#ffffff',
    border: 'rgba(17, 24, 39, 0.08)',
    text: '#0f172a',
    textMuted: '#475569',
    primary: '#2563eb',
    primarySoft: 'rgba(37, 99, 235, 0.12)',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  },
  dark: {
    mode: 'dark',
    name: 'Dark',
    background: '#050816',
    surface: 'rgba(14,18,33,0.92)',
    surfaceElevated: 'rgba(9,12,24,0.96)',
    border: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textMuted: '#9db0d1',
    primary: '#22d3ee',
    primarySoft: 'rgba(34, 211, 238, 0.12)',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
};

type HybridThemeProps = {
  mode?: HybridThemeMode;
  children?: React.ReactNode;
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
