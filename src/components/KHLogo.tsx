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
      viewBox="0 0 512 512"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: size, height: size, flexShrink: 0 }}
    >
      <rect x="32" y="32" width="448" height="448" rx="92" fill="#000" />
      <rect x="32.75" y="32.75" width="446.5" height="446.5" rx="91.25" fill="none" stroke="#151515" strokeWidth="1.5" />

      <ellipse cx="229" cy="256" rx="42" ry="177" fill="none" stroke="#fff" strokeWidth="4.5" />
      <ellipse cx="256" cy="256" rx="42" ry="177" fill="none" stroke="#fff" strokeWidth="5.5" />
      <ellipse cx="283" cy="256" rx="42" ry="177" fill="none" stroke="#fff" strokeWidth="4.5" />

      <ellipse cx="256" cy="230" rx="177" ry="43" fill="none" stroke="#fff" strokeWidth="5.5" />
      <ellipse cx="256" cy="256" rx="177" ry="43" fill="none" stroke="#fff" strokeWidth="4.5" />
      <ellipse cx="256" cy="282" rx="177" ry="43" fill="none" stroke="#fff" strokeWidth="4.5" />

      <circle cx="256" cy="256" r="24" fill="#fff" />
    </svg>
  );
};

export default KHLogo;
