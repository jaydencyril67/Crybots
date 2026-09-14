import React from 'react';

const styles = {
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '999px',
    background: 'currentColor',
    opacity: 0.6,
    animation: 'inline-loading-dots 1s infinite ease-in-out',
  },
} as const;

const InlineLoadingDots = () => {
  return (
    <span style={styles.wrap} aria-hidden="true">
      <span style={{ ...styles.dot, animationDelay: '0ms' }} />
      <span style={{ ...styles.dot, animationDelay: '150ms' }} />
      <span style={{ ...styles.dot, animationDelay: '300ms' }} />
    </span>
  );
};

export default InlineLoadingDots;
