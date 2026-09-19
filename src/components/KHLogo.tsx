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
        <linearGradient id={`${logoId}-gold`} x1="18" y1="16" x2="82" y2="86" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFF3B0" />
        <stop offset="0.28" stopColor="#F6D365" />
        <stop offset="0.62" stopColor="#D4A72C" />
        <stop offset="1" stopColor="#9A6812" />
        </linearGradient>
        <filter id={`${logoId}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#8A5A10" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M14 27L30 42L50 19L70 42L86 27L79 73H21L14 27Z"
        fill={`url(#${logoId}-gold)`}
        stroke="#FFE69A"
        strokeWidth="2"
        strokeLinejoin="round"
        filter={`url(#${logoId}-shadow)`}
      />
      <path d="M20 73H80" stroke="#8F5F12" strokeWidth="7" strokeLinecap="round" />
      <path d="M23 80H77" stroke={`url(#${logoId}-gold)`} strokeWidth="6" strokeLinecap="round" />
      <circle cx="14" cy="27" r="5" fill="#F8D86A" stroke="#FFF1A8" strokeWidth="1.5" />
      <circle cx="50" cy="19" r="5" fill="#F8D86A" stroke="#FFF1A8" strokeWidth="1.5" />
      <circle cx="86" cy="27" r="5" fill="#F8D86A" stroke="#FFF1A8" strokeWidth="1.5" />
    </svg>
  );
};

export default KHLogo;
