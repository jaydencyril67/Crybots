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
  badge: {
    width: '112px',
    height: '112px',
    borderRadius: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, rgba(6,11,22,0.95) 0%, rgba(17,24,39,0.98) 100%)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 42px rgba(0,0,0,0.34)',
  },
  badgeInner: {
    width: '68px',
    height: '68px',
    borderRadius: '22px',
    position: 'relative' as const,
    background: 'linear-gradient(135deg, rgba(248,250,252,0.95) 0%, rgba(167,139,250,0.82) 55%, rgba(103,232,249,0.9) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.22), 0 16px 30px rgba(139,92,246,0.18)',
    overflow: 'hidden',
  },
  badgeCut: {
    position: 'absolute' as const,
    inset: '16px 14px 16px 14px',
    borderRadius: '14px',
    background: 'linear-gradient(180deg, rgba(6,11,22,0.96) 0%, rgba(17,24,39,0.96) 100%)',
    clipPath: 'polygon(0 0, 58% 0, 58% 38%, 100% 38%, 100% 62%, 58% 62%, 58% 100%, 0 100%, 0 62%, 42% 62%, 42% 38%, 0 38%)',
    opacity: 0.98,
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 900,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    background: 'linear-gradient(135deg, #F8FAFC 0%, #C7D2FE 22%, #A78BFA 52%, #67E8F9 82%, #E2E8F0 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
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

const AppSplashOverlay = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const revealDelay = 2000;
    const timer = window.setTimeout(() => setReady(true), revealDelay);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div style={{ ...styles.overlay, ...(ready ? styles.hidden : {}) }} aria-hidden={ready}>
      <div style={styles.card}>
        <div style={styles.badge}>
          <div style={styles.badgeInner}>
            <div style={styles.badgeCut} />
          </div>
        </div>
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
