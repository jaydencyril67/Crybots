import React from 'react';

const styles = {
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: '#7dd3fc',
    opacity: 0.35,
    animation: 'loading-dots 1.2s infinite steps(1, end)',
  },
  activeDot: {
    opacity: 1,
  },
} as const;

const LoadingDots = () => {
  return (
    <div style={styles.wrap} aria-hidden="true">
      <span style={{ ...styles.dot, ...styles.activeDot }} />
      <span style={styles.dot} />
      <span style={styles.dot} />
    </div>
  );
};

export default LoadingDots;
