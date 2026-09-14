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
    animation: 'loading-dots 1s infinite ease-in-out',
  },
} as const;

const LoadingDots = () => {
  return (
    <div style={styles.wrap} aria-label="Loading content">
      <span style={{ ...styles.dot, animationDelay: '0ms' }} />
      <span style={{ ...styles.dot, animationDelay: '150ms' }} />
      <span style={{ ...styles.dot, animationDelay: '300ms' }} />
    </div>
  );
};

export default LoadingDots;
