import React, { useMemo } from 'react';
import { ShieldCheck, Wallet } from 'lucide-react';
import AppHeader from './AppHeader';
import NowBar from './NowBar';

const authToken = window.localStorage.getItem('token') ?? '';

const styles = {
  page: {
    minHeight: '100vh',
    padding: 'clamp(16px, 4vw, 24px) clamp(12px, 4vw, 16px) 104px',
    background: 'radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 35%), linear-gradient(180deg, #07111f 0%, #050b14 100%)',
    color: '#eef4ff',
  },
  shell: {
    width: 'min(920px, 100%)',
    margin: '0 auto',
  },
  card: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '28px',
    background: 'rgba(8,14,26,0.82)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.36)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    padding: 'clamp(16px, 4vw, 22px)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '18px',
    flexWrap: 'wrap' as const,
  },
  title: {
    margin: '18px 0 0',
    fontSize: 'clamp(1.3rem, 4vw, 1.45rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#9aaac9',
    lineHeight: 1.6,
    fontSize: '0.92rem',
    maxWidth: '58ch',
  },
  mutedCard: {
    marginTop: '16px',
    borderRadius: '22px',
    padding: '18px',
    border: '1px dashed rgba(255,255,255,0.12)',
    color: 'rgba(238,244,255,0.72)',
    background: 'rgba(255,255,255,0.03)',
  },
};

const DepositPage = () => {
  const cryptoContent = useMemo(() => (
    <div style={styles.mutedCard}>
      <strong>USDT deposits only</strong>
      <p style={{ margin: '10px 0 0' }}>
        This app is now USDT-only. Add your wallet address and use the crypto deposit flow to move funds in.
      </p>
    </div>
  ), []);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.card}>
          <div style={styles.headerRow}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: '#9aaac9' }}>
              <ShieldCheck size={18} />
              <span>Secure deposits</span>
            </div>
          </div>

          <h1 style={styles.title}>Deposit funds</h1>
          <p style={styles.subtitle}>
            Deposit USDT straight to your wallet address and keep everything on-chain.
          </p>

          {cryptoContent}
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default DepositPage;
