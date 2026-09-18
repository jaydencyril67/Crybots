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
    background: '#f8f8f6',
    surface: 'rgba(255,255,255,0.92)',
    surfaceElevated: '#ffffff',
    border: 'rgba(17, 24, 39, 0.08)',
    text: '#111111',
    textMuted: '#5f5f5f',
    primary: '#2f2f2f',
    primarySoft: 'rgba(47, 47, 47, 0.08)',
    success: '#4b5563',
    warning: '#6b7280',
    danger: '#1f2937',
  },
  dark: {
    mode: 'dark',
    name: 'Dark',
    background: '#000000',
    surface: 'rgba(24,24,24,0.96)',
    surfaceElevated: 'rgba(34,34,34,0.98)',
    border: 'rgba(255,255,255,0.10)',
    text: '#ffffff',
    textMuted: '#b3b3b3',
    primary: '#d4d4d4',
    primarySoft: 'rgba(212, 212, 212, 0.10)',
    success: '#d1d5db',
    warning: '#a3a3a3',
    danger: '#f5f5f5',
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
