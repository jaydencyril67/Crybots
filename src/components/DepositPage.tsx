import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import NowBar from './NowBar';
import HybridTheme, { HYBRID_CARD_STYLES, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const DepositPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  const styles = useMemo(() => ({
    page: {
      minHeight: '100vh',
      padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 118px',
      background: theme.background,
      color: theme.text,
    },
    shell: {
      width: 'min(1160px, 100%)',
      margin: '0 auto',
    },
    card: {
      ...HYBRID_CARD_STYLES.card,
      borderRadius: '16px',
      padding: 'clamp(12px, 2.5vw, 16px)',
    },
    headerRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '12px',
      flexWrap: 'wrap' as const,
    },
    title: {
      margin: '4px 0 0',
      fontSize: 'clamp(1.3rem, 4vw, 1.45rem)',
      fontWeight: 800,
      letterSpacing: '-0.03em',
      lineHeight: 1.2,
    },
    subtitle: {
      margin: '8px 0 0',
      color: theme.textMuted,
      lineHeight: 1.4,
      fontSize: '0.82rem',
      maxWidth: '58ch',
    },
    mutedCard: {
      ...HYBRID_CARD_STYLES.panel,
      marginTop: '10px',
      borderRadius: '13px',
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

  return (
    <div data-shadow-free-page="deposit" style={styles.page}>
      <style>{'[data-shadow-free-page="deposit"] [style*="box-shadow"] { box-shadow: none !important; }'}</style>
      <div style={styles.shell}>
        
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
