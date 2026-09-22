import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy, ShieldCheck } from 'lucide-react';
import NowBar from './NowBar';
import { HYBRID_THEME_TOKENS, createHybridCardStyles } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import api from '../api/axios';

const DepositPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  const styles = useMemo(() => {
    const cardStyles = createHybridCardStyles(theme);

    return ({
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
      ...cardStyles.card,
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      color: theme.text,
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
      ...cardStyles.panel,
      border: `1px solid ${theme.border}`,
      background: theme.surfaceElevated,
      marginTop: '10px',
      borderRadius: '13px',
      color: theme.textMuted,
    },
    label: { display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700 },
    input: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '11px 12px', background: theme.surfaceMuted, color: theme.text, fontSize: '0.95rem' },
    selectTrigger: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '11px 12px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', textAlign: 'left' as const },
    selectMenu: { display: 'grid', gap: '6px', marginTop: '6px', padding: '8px', border: `1px solid ${theme.borderStrong}`, borderRadius: '16px', background: theme.surfaceElevated, position: 'relative' as const, zIndex: 5 },
    selectOption: { width: '100%', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '10px 12px', background: theme.surface, color: theme.text, cursor: 'pointer', textAlign: 'left' as const },
    primaryButton: { border: `1px solid ${theme.primary}`, borderRadius: '10px', padding: '11px 16px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 700, opacity: 1 },
    primaryButtonDisabled: { opacity: 0.55, cursor: 'not-allowed' },
    secondaryButton: { border: `1px solid ${theme.border}`, borderRadius: '9px', padding: '8px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' },
    address: { wordBreak: 'break-all' as const, margin: '6px 0 0', padding: '10px', borderRadius: '9px', background: theme.surfaceGlass, fontFamily: 'monospace', fontSize: '0.8rem' },
    });
  }, [theme]);

  type DepositPayment = { id?: string; paymentId?: string; status?: string; paymentStatus?: string; amount?: number; priceAmount?: number; currency?: string; priceCurrency?: string; payCurrency: string; payAmount?: number; payAddress?: string; };
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('usdttrc20');
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const networkMenuRef = useRef<HTMLDivElement | null>(null);
  const [payment, setPayment] = useState<DepositPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (networkMenuRef.current && !networkMenuRef.current.contains(event.target as Node)) setIsNetworkMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const paymentId = payment?.id || payment?.paymentId;
    const status = payment?.status || payment?.paymentStatus;
    if (!paymentId || ['confirmed', 'finished', 'failed', 'refunded', 'expired'].includes(status || '')) return undefined;
    const timer = window.setInterval(async () => {
      try {
        const response = await api.get<{ payment: DepositPayment }>(`/api/deposits/${paymentId}`);
        setPayment(response.data.payment);
      } catch {
        // A temporary status request failure should not interrupt the payment flow.
      }
    }, 10000);
    return () => window.clearInterval(timer);
  }, [payment]);

  const createPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setCopied(false);
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 10) {
      setMessage('Enter a deposit amount of at least 10 USDT.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<{ payment: DepositPayment }>('/api/deposits', { amount: value, payCurrency: network });
      setPayment(response.data.payment);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to create a crypto payment.');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (!payment?.payAddress) return;
    await navigator.clipboard.writeText(payment.payAddress);
    setCopied(true);
  };

  const cryptoContent = payment ? (
    <div style={styles.mutedCard}>
      <strong>Send USDT to this address</strong>
      <p style={{ margin: '8px 0 0' }}>Send exactly the requested amount on the selected network. Your balance updates after network confirmation.</p>
      <p style={styles.address}>{payment.payAddress || 'Payment address is being prepared…'}</p>
      <p style={{ margin: '8px 0', fontWeight: 700 }}>{payment.payAmount ?? '—'} {payment.payCurrency} · Status: {payment.status || payment.paymentStatus || 'waiting'}</p>
      {payment.payAddress && <button type="button" style={styles.secondaryButton} onClick={copyAddress}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy address</>}</button>}
    </div>
  ) : (
    <form onSubmit={createPayment} style={styles.mutedCard}>
      <strong>USDT deposits only</strong>
      <p style={{ margin: '8px 0 14px' }}>Choose a network and create a payment address. Do not send funds until an address is shown.</p>
      <label style={styles.label} htmlFor="deposit-amount">Amount (USDT)</label>
      <input id="deposit-amount" style={styles.input} type="number" min="10" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100.00" required />
      <div ref={networkMenuRef} style={{ marginTop: '12px' }}>
        <span style={styles.label}>USDT network</span>
        <button id="deposit-network" type="button" style={styles.selectTrigger} onClick={() => setIsNetworkMenuOpen((current) => !current)} aria-expanded={isNetworkMenuOpen}>
          <span>{network === 'usdttrc20' ? 'TRON (TRC-20)' : network === 'usdterc20' ? 'Ethereum (ERC-20)' : 'BNB Smart Chain (BEP-20)'}</span>
          <ChevronDown size={17} />
        </button>
        {isNetworkMenuOpen && <div style={styles.selectMenu}>
          {[['usdttrc20', 'TRON (TRC-20)'], ['usdterc20', 'Ethereum (ERC-20)'], ['usdtbsc', 'BNB Smart Chain (BEP-20)']].map(([value, label]) => (
            <button key={value} type="button" style={styles.selectOption} onClick={() => { setNetwork(value); setIsNetworkMenuOpen(false); }}>{label}</button>
          ))}
        </div>}
      </div>
      {message && <p role="alert" style={{ color: '#d96b6b', margin: '12px 0 0' }}>{message}</p>}
      <button type="submit" style={{ ...styles.primaryButton, ...(loading ? styles.primaryButtonDisabled : {}), marginTop: '14px' }} disabled={loading}>{loading ? 'Creating payment…' : 'Create deposit address'}</button>
    </form>
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
