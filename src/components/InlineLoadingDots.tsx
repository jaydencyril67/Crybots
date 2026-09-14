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
    opacity: 0.35,
    animation: 'inline-loading-dots 1.2s infinite steps(1, end)',
  },
  activeDot: {
    opacity: 1,
  },
} as const;

const InlineLoadingDots = () => {
  return (
    <span style={styles.wrap} aria-hidden="true">
      <span style={{ ...styles.dot, ...styles.activeDot }} />
      <span style={styles.dot} />
      <span style={styles.dot} />
    </span>
  );
};

export default InlineLoadingDots;
