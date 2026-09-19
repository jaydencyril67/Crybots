import React from 'react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: theme.surfaceMuted,
    border: `1px solid ${theme.borderGlass}`,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: theme.primary,
    opacity: 0.35,
    animation: 'loading-dots 1.2s infinite steps(1, end)',
  },
  activeDot: {
    opacity: 1,
  },
});

const LoadingDots = () => {
  const { themeMode } = useAppTheme();
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);

  return (
    <div style={styles.wrap} aria-hidden="true">
      <span style={{ ...styles.dot, ...styles.activeDot }} />
      <span style={styles.dot} />
      <span style={styles.dot} />
    </div>
  );
};

export default LoadingDots;
