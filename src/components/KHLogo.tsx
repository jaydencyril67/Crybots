import React, { useId } from 'react';
type KHLogoProps = {
  size?: number;
  label?: string;
};

const KHLogo = ({ size = 32, label = 'KingsHall' }: KHLogoProps) => {
  const logoId = useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`${logoId}-gold`} x1="18" y1="16" x2="82" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D8C27A" />
          <stop offset="0.24" stopColor="#B5964B" />
          <stop offset="0.52" stopColor="#795B24" />
          <stop offset="0.76" stopColor="#B08B3D" />
          <stop offset="1" stopColor="#58400F" />
        </linearGradient>
        <linearGradient id={`${logoId}-edge`} x1="16" y1="18" x2="84" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E6D391" />
          <stop offset="0.5" stopColor="#9B7832" />
          <stop offset="1" stopColor="#49340C" />
        </linearGradient>
        <filter id={`${logoId}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodColor="#4D3007" floodOpacity="0.38" />
        </filter>
      </defs>
      <path
        d="M14 28L27 40L39 19L50 37L61 19L73 40L86 28L78 71H22L14 28Z"
        fill={`url(#${logoId}-gold)`}
        stroke={`url(#${logoId}-edge)`}
        strokeWidth="2.4"
        strokeLinejoin="round"
        filter={`url(#${logoId}-shadow)`}
      />
      <path d="M22 71H78" stroke="#674008" strokeWidth="6" strokeLinecap="round" />
      <path d="M26 78H74" stroke={`url(#${logoId}-edge)`} strokeWidth="3" strokeLinecap="round" />
      <path d="M27 40L39 59L50 37L61 59L73 40" fill="none" stroke="#D8C27A" strokeWidth="1.2" strokeLinejoin="round" opacity="0.5" />
      <path d="M14 28L27 40M39 19L50 37M61 19L73 40M86 28L73 40" stroke="#E6D391" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
    </svg>
  );
};

export default KHLogo;
