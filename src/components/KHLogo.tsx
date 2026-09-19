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
        <linearGradient id={`${logoId}-gold`} x1="20" y1="18" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF1A8" />
          <stop offset="0.22" stopColor="#E8B94A" />
          <stop offset="0.55" stopColor="#B7791F" />
          <stop offset="0.8" stopColor="#F2CE69" />
          <stop offset="1" stopColor="#8A5A12" />
        </linearGradient>
        <linearGradient id={`${logoId}-edge`} x1="16" y1="24" x2="84" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3B0" />
          <stop offset="0.5" stopColor="#C58A2A" />
          <stop offset="1" stopColor="#6E460D" />
        </linearGradient>
        <filter id={`${logoId}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#5B3A0A" floodOpacity="0.42" />
        </filter>
      </defs>
      <path
        d="M15 27L28 39L40 20L50 35L60 20L72 39L85 27L78 72H22L15 27Z"
        fill={`url(#${logoId}-gold)`}
        stroke={`url(#${logoId}-edge)`}
        strokeWidth="2.4"
        strokeLinejoin="round"
        filter={`url(#${logoId}-shadow)`}
      />
      <path d="M22 72H78" stroke="#6E460D" strokeWidth="6" strokeLinecap="round" />
      <path d="M25 78H75" stroke={`url(#${logoId}-edge)`} strokeWidth="3" strokeLinecap="round" />
      <path d="M28 39L40 58L50 35L60 58L72 39" fill="none" stroke="#FFF1A8" strokeWidth="1.4" strokeLinejoin="round" opacity="0.72" />
      <path d="M15 27L28 39M40 20L50 35M60 20L72 39M85 27L72 39" stroke="#FFF3B0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default KHLogo;
