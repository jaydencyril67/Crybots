import React from 'react';

type KHLogoProps = {
  size?: number;
  label?: string;
};

const KHLogo = ({ size = 32, label = 'CryBots' }: KHLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
    >
      <rect x="5" y="5" width="90" height="90" rx="17" fill="#000" />
      <rect x="5.5" y="5.5" width="89" height="89" rx="16.5" fill="none" stroke="#151515" strokeWidth="1" />

      <ellipse cx="44.7" cy="50" rx="8.2" ry="34.6" fill="none" stroke="#fff" strokeWidth="1.15" />
      <ellipse cx="50" cy="50" rx="8.2" ry="34.6" fill="none" stroke="#fff" strokeWidth="1.35" />
      <ellipse cx="55.3" cy="50" rx="8.2" ry="34.6" fill="none" stroke="#fff" strokeWidth="1.15" />

      <ellipse cx="50" cy="44.7" rx="34.6" ry="8.2" fill="none" stroke="#fff" strokeWidth="1.35" />
      <ellipse cx="50" cy="50" rx="34.6" ry="8.2" fill="none" stroke="#fff" strokeWidth="1.15" />
      <ellipse cx="50" cy="55.3" rx="34.6" ry="8.2" fill="none" stroke="#fff" strokeWidth="1.15" />

      <circle cx="50" cy="50" r="4.7" fill="#fff" />
    </svg>
  );
};

export default KHLogo;
