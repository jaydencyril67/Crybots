import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import AppHeader from './AppHeader';
import NowBar from './NowBar';
import HybridTheme, { HYBRID_CARD_STYLES, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const DepositPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = useMemo(() => ({
    page: {
      minHeight: '100vh',
      padding: 'clamp(16px, 4vw, 24px) clamp(12px, 4vw, 16px) 104px',
      background: theme.background,
      color: theme.text,
    },
    shell: {
      width: 'min(920px, 100%)',
      margin: '0 auto',
    },
    card: {
      ...HYBRID_CARD_STYLES.card,
      borderRadius: '28px',
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
      color: theme.textMuted,
      lineHeight: 1.6,
      fontSize: '0.92rem',
      maxWidth: '58ch',
    },
    mutedCard: {
      ...HYBRID_CARD_STYLES.panel,
      marginTop: '16px',
      borderRadius: '22px',
      color: theme.textMuted,
    },
  }), [theme]);

  const cryptoContent = useMemo(() => (
    <div style={styles.mutedCard}>
      <strong>USDT deposits only</strong>
      <p style={{ margin: '10px 0 0' }}>
        This app is now USDT-only. Add your wallet address and use the crypto deposit flow to move funds in.
      </p>
    </div>
  ), [styles.mutedCard]);

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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: theme.textMuted }}>
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
