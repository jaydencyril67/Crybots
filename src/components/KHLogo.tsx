import React from 'react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';

type Theme = typeof HYBRID_THEME_TOKENS.dark;

type KHLogoProps = {
  theme: Theme;
  size?: number;
  label?: string;
};

const KHLogo = ({ theme, size = 32, label = 'KingsHall' }: KHLogoProps) => (
  <svg
    width={size * 2.5}
    height={size}
    viewBox="0 0 250 100"
    role="img"
    aria-label={label}
    style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
  >
    <text
      x="126"
      y="72"
      textAnchor="middle"
      fill={theme.text}
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="76"
      fontWeight="900"
      letterSpacing="-8"
    >
      KH
    </text>
    <path
      d="M52 86H200"
      fill="none"
      stroke={theme.primary}
      strokeWidth="8"
      strokeLinecap="round"
    />
    <circle cx="214" cy="86" r="5" fill={theme.primary} />
  </svg>
);

export default KHLogo;
