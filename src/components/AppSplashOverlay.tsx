import React, { useEffect, useState } from 'react';

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, rgba(34,211,238,0.16), transparent 34%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.18), transparent 28%), linear-gradient(180deg, #050816 0%, #0b1220 100%)',
    color: '#ffffff',
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
    width: '132px',
    height: '132px',
    objectFit: 'contain' as const,
    display: 'block',
    filter: 'drop-shadow(0 18px 36px rgba(0,0,0,0.38))',
  },
  subtitle: {
    margin: 0,
    color: 'rgba(255,255,255,0.68)',
    fontSize: '13px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
  },
  shimmer: {
    width: '180px',
    height: '3px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(103,232,249,0.75) 50%, transparent 100%)',
    animation: 'ke-splash-shimmer 1.4s ease-in-out infinite',
  },
};

const AppSplashOverlay = ({ active = false }: { active?: boolean }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setReady(true);
      return;
    }

    const revealDelay = 3000;
    const timer = window.setTimeout(() => setReady(true), revealDelay);

    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div style={{ ...styles.overlay, ...(ready ? styles.hidden : {}) }} aria-hidden={ready}>
      <div style={styles.card}>
        <img src="/icons/ke-icon.svg" alt="KingsHall Exchange" style={styles.logo} />
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
