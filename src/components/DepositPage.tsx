import React, { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import NowBar from './NowBar';
import HybridTheme, { HYBRID_CARD_STYLES, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import InlineLoadingDots from './InlineLoadingDots';

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
    back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
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
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '16px',
      border: 0,
      borderRadius: '10px',
      padding: '11px 15px',
      background: theme.primary,
      color: theme.textInverse,
      cursor: 'pointer',
      fontWeight: 800,
    },
    status: {
      margin: '12px 0 0',
      color: theme.textMuted,
      fontSize: '0.82rem',
    },
  }), [theme]);

  const [isStarting, setIsStarting] = useState(false);
  const [depositMessage, setDepositMessage] = useState('');

  const startDeposit = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setDepositMessage('');

    try {
      const { data } = await api.post('/api/transak/create');
      const { transak, deposit } = data as {
        deposit: { reference: string };
        transak: {
          environment: 'sandbox' | 'production';
          apiKey: string;
          walletAddress: string;
          cryptoCurrency: string;
          network: string;
          partnerOrderId: string;
          email?: string;
          firstName?: string;
          lastName?: string;
        };
      };

      if (!transak.apiKey) throw new Error('Transak is not configured yet.');

      const widgetHost = transak.environment === 'production' ? 'global.transak.com' : 'global-staging.transak.com';
      const query = new URLSearchParams({
        apiKey: transak.apiKey,
        walletAddress: transak.walletAddress,
        cryptoCurrencyCode: transak.cryptoCurrency,
        network: transak.network,
        partnerOrderId: transak.partnerOrderId,
        ...(transak.email ? { email: transak.email } : {}),
        ...(transak.firstName ? { firstName: transak.firstName } : {}),
        ...(transak.lastName ? { lastName: transak.lastName } : {}),
      });

      window.open(`https://${widgetHost}/?${query.toString()}`, '_blank', 'noopener,noreferrer');
      setDepositMessage(`Deposit ${deposit.reference} is pending. Complete payment in the Transak window.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start the deposit.';
      setDepositMessage(message);
    } finally {
      setIsStarting(false);
    }
  };

  const cryptoContent = (
    <div style={styles.mutedCard}>
      <strong>Buy USDT with fiat</strong>
      <p style={{ margin: '10px 0 0' }}>
        Pay securely with Transak. Your completed USDT purchase is sent to the KingsHall platform wallet and credited to your account after confirmation.
      </p>
      <button type="button" style={styles.button} onClick={() => void startDeposit()} disabled={isStarting}>
        {isStarting ? <InlineLoadingDots /> : <><ExternalLink size={16} /> Continue with Transak</>}
      </button>
      {depositMessage ? <p style={styles.status}>{depositMessage}</p> : null}
    </div>
  );

  return (
    <div data-shadow-free-page="deposit" style={styles.page}>
      <style>{'[data-shadow-free-page="deposit"] [style*="box-shadow"] { box-shadow: none !important; }'}</style>
      <div style={styles.shell}>
        <button type="button" style={styles.back} onClick={() => navigate('/asset')}><ArrowLeft size={17} /> Assets</button>
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
