import React, { useEffect, useState } from 'react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import KHLogo from './KHLogo';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.background,
    color: theme.text,
    transition: 'opacity 320ms ease, visibility 320ms ease',
  },
  hidden: {
    opacity: 0,
    visibility: 'hidden' as const,
    pointerEvents: 'none' as const,
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '18px',
    textAlign: 'center' as const,
  },
  logo: {
    width: '130px',
    height: 'auto',
    display: 'block',
  },
  subtitle: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '13px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
  },
  shimmer: {
    width: '180px',
    height: '3px',
    borderRadius: '999px',
    background: theme.primary,
    animation: 'ke-splash-shimmer 1.4s ease-in-out infinite',
  },
});

const AppSplashOverlay = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const shouldShowSplash = Boolean((window as Window & { __kingshallRefreshSplash?: boolean }).__kingshallRefreshSplash);
    setActive(shouldShowSplash);

    if (!shouldShowSplash) {
      document.documentElement.style.visibility = 'visible';
      setReady(true);
      return;
    }

    document.documentElement.style.visibility = 'visible';
    const revealDelay = 3000;
    const timer = window.setTimeout(() => setReady(true), revealDelay);

    return () => window.clearTimeout(timer);
  }, []);

  if (!active) {
    return null;
  }

  return (
    <div style={{ ...styles.overlay, ...(ready ? styles.hidden : {}) }} aria-hidden={ready}>
      <div style={styles.card}>
        <KHLogo size={52} label="KingsHall" />
        <div>
          <p style={styles.subtitle}>KingsHall Exchange</p>
        </div>
        <div style={styles.shimmer} />
      </div>
      <style>{`@keyframes ke-splash-shimmer { 0% { transform: scaleX(0.72); opacity: 0.45; } 50% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(0.72); opacity: 0.45; } }`}</style>
    </div>
  );
};

export default AppSplashOverlay;
