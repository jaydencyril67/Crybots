import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy } from 'lucide-react';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';
import HybridTheme, { HYBRID_THEME_TOKENS, createHybridCardStyles } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import NotificationBanner from './NotificationBanner';

const statusLabel = (status?: string) => {
  const normalizedStatus = (status || 'waiting').toLowerCase();
  if (['confirmed', 'finished', 'completed'].includes(normalizedStatus)) return 'completed';
  if (['failed', 'refunded', 'expired', 'cancelled', 'canceled'].includes(normalizedStatus)) return normalizedStatus;
  return 'pending';
};

const DepositPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  const styles = useMemo(() => {
    const cardStyles = createHybridCardStyles(theme);

    return ({
    page: {
      minHeight: '100vh',
      overflowX: 'hidden' as const,
      overflowY: 'auto' as const,
      paddingBottom: '132px',
      background: theme.background,
      color: theme.text,
    },
    shell: {
      width: '100%',
      maxWidth: '920px',
      margin: '0 auto',
      padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
      boxSizing: 'border-box' as const,
    },
    card: {
      ...cardStyles.card,
      width: '100%',
      boxSizing: 'border-box' as const,
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
      color: theme.text,
      borderRadius: '22px',
      padding: '18px',
      marginTop: '14px',
      display: 'grid',
      gap: '12px',
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
      width: '100%',
      boxSizing: 'border-box' as const,
      padding: '13px 14px',
      borderRadius: '15px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceMuted,
      marginTop: 0,
      display: 'grid',
      gap: '12px',
      color: theme.textMuted,
    },
    label: { display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700 },
    input: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '10px 12px', background: theme.surface, color: theme.text, fontSize: '0.9rem', outline: 'none' },
    selectTrigger: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '11px 12px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', textAlign: 'left' as const },
    selectMenu: { display: 'grid', gap: '6px', padding: '8px', border: `1px solid ${theme.borderStrong}`, borderRadius: '16px', background: theme.surfaceElevated, position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 10 },
    selectOption: { width: '100%', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '10px 12px', background: theme.surface, color: theme.text, cursor: 'pointer', textAlign: 'left' as const },
    primaryButton: { border: `1px solid ${theme.primary}`, borderRadius: '999px', padding: '12px 16px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 700, width: '100%', maxWidth: '100%', opacity: 1 },
    primaryButtonDisabled: { opacity: 0.55, cursor: 'not-allowed' },
    secondaryButton: { border: `1px solid ${theme.border}`, borderRadius: '9px', padding: '8px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' },
    address: { wordBreak: 'break-all' as const, margin: '6px 0 0', padding: '10px', borderRadius: '9px', background: theme.surfaceGlass, fontFamily: 'monospace', fontSize: '0.8rem' },
    recentList: { display: 'grid', gap: '8px', marginTop: '10px' },
    recentItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '10px', background: theme.surface, color: theme.text },
    recentItemClickable: { cursor: 'pointer', transition: 'border-color 0.15s ease, background 0.15s ease' },
    recentMeta: { color: theme.textMuted, fontSize: '0.76rem' },
    status: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' as const },
    });
  }, [theme]);

  type DepositPayment = { id?: string; paymentId?: string; status?: string; paymentStatus?: string; amount?: number; priceAmount?: number; currency?: string; priceCurrency?: string; payCurrency?: string; payAmount?: number; payAddress?: string; createdAt?: string; };
  type FixedDepositAddress = { address: string; asset: string; network: string; status: string };
  type DepositHistoryRecord = { id?: string; type?: string; status?: string; amountValue?: number; amount?: string; currency?: string; date?: string; time?: string; reference?: string; };

  const normalizeDeposit = (deposit: DepositPayment): DepositPayment => ({
    ...deposit,
    id: deposit.id || deposit.paymentId,
    paymentId: deposit.paymentId || deposit.id,
    payCurrency: deposit.payCurrency || deposit.currency || 'USDT',
  });
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('usdttrc20');
  const [depositMethod, setDepositMethod] = useState<'fixed' | 'now'>('fixed');
  const [fixedAddress, setFixedAddress] = useState<FixedDepositAddress | null>(null);
  const [fixedAddressLoading, setFixedAddressLoading] = useState(true);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const networkMenuRef = useRef<HTMLDivElement | null>(null);
  const [payment, setPayment] = useState<DepositPayment | null>(null);
  const [resumingPaymentId, setResumingPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentDeposits, setRecentDeposits] = useState<DepositPayment[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [depositNotice, setDepositNotice] = useState<{ tone: 'info' | 'success' | 'error'; title: string; message: string } | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (networkMenuRef.current && !networkMenuRef.current.contains(event.target as Node)) setIsNetworkMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadFixedAddress = async () => {
      try {
        const response = await api.get<{ address?: FixedDepositAddress | null }>('/api/deposits/fixed-address');
        setFixedAddress(response.data.address || null);
      } catch {
        setFixedAddress(null);
      } finally {
        setFixedAddressLoading(false);
      }
    };

    void loadFixedAddress();
  }, []);

  useEffect(() => {
    const loadRecentDeposits = async () => {
      setRecentLoading(true);
      try {
        const response = await api.get<{ deposits?: DepositPayment[] }>('/api/deposits/recent');
        const deposits = Array.isArray(response.data.deposits) ? response.data.deposits : [];
        if (deposits.length > 0) {
          setRecentDeposits(deposits.map(normalizeDeposit).slice(0, 5));
          return;
        }

        const historyResponse = await api.get<{ transactions?: DepositHistoryRecord[] }>('/api/transactions/me');
        const historyDeposits = (historyResponse.data.transactions || [])
          .filter((transaction) => transaction.type === 'deposit')
          .map((transaction) => normalizeDeposit({
            id: transaction.reference?.replace(/^DEP-/, ''),
            paymentId: transaction.reference?.replace(/^DEP-/, ''),
            status: transaction.status,
            amount: transaction.amountValue,
            priceAmount: transaction.amountValue,
            currency: transaction.currency,
            payCurrency: transaction.currency,
            createdAt: transaction.date && transaction.time ? `${transaction.date}T${transaction.time}Z` : undefined,
          }));
        setRecentDeposits(historyDeposits.slice(0, 5));
      } catch {
        setRecentDeposits([]);
      } finally {
        setRecentLoading(false);
      }
    };

    void loadRecentDeposits();
  }, []);

  useEffect(() => {
    const paymentId = payment?.id || payment?.paymentId;
    const status = payment?.status || payment?.paymentStatus;
    if (!paymentId || ['confirmed', 'finished', 'failed', 'refunded', 'expired'].includes(status || '')) return undefined;
    const timer = window.setInterval(async () => {
      try {
        const response = await api.get<{ payment: DepositPayment }>(`/api/deposits/${paymentId}`);
        const nextPayment = normalizeDeposit(response.data.payment);
        setPayment(nextPayment);
        const nextStatus = statusLabel(nextPayment.paymentStatus || nextPayment.status);
        if (nextStatus === 'completed') {
          setDepositNotice({ tone: 'success', title: 'Deposit confirmed', message: 'Your USDT deposit has been confirmed and your balance will reflect it shortly.' });
        } else if (['failed', 'refunded', 'expired', 'cancelled', 'canceled'].includes(nextStatus)) {
          setDepositNotice({ tone: 'error', title: 'Deposit not completed', message: 'This deposit could not be completed. Please start a new deposit or contact support.' });
        }
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
      const createdPayment = normalizeDeposit(response.data.payment);
      setPayment(createdPayment);
      setDepositNotice({ tone: 'info', title: 'Deposit address ready', message: 'Send the requested amount to the address below. We will notify you when it is confirmed.' });
      setRecentDeposits((current) => [createdPayment, ...current.filter((item) => item.paymentId !== createdPayment.paymentId)].slice(0, 5));
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

  const isPendingStatus = (status?: string) => {
    return statusLabel(status) === 'pending';
  };

  const resumePendingDeposit = async (deposit: DepositPayment) => {
    const paymentId = deposit.paymentId || deposit.id;
    if (!paymentId || !isPendingStatus(deposit.paymentStatus || deposit.status)) return;
    setMessage('');
    setCopied(false);
    if (deposit.payAddress) {
      setPayment(deposit);
      return;
    }
    setResumingPaymentId(paymentId);
    try {
      const response = await api.get<{ payment: DepositPayment }>(`/api/deposits/${paymentId}`);
      if (response.data?.payment) {
        const nextPayment = normalizeDeposit(response.data.payment);
        setPayment(nextPayment);
        setDepositNotice({ tone: 'info', title: 'Deposit resumed', message: 'This deposit is ready. Send the requested amount to continue.' });
      }
    } catch {
      setPayment(deposit);
    } finally {
      setResumingPaymentId(null);
    }
  };

  const copyFixedAddress = async () => {
    if (!fixedAddress?.address) return;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fixedAddress.address);
      setCopied(true);
    }
  };

  const fixedAddressContent = (
    <div style={styles.mutedCard}>
      <strong>Fixed USDT deposit address</strong>
      <p style={{ margin: '8px 0 0' }}>Send USDT only on the TRON (TRC-20) network to this address. Your balance is credited after the network deposit is confirmed.</p>
      {fixedAddressLoading ? <div style={{ padding: '12px 0' }}><LoadingDots /></div> : fixedAddress ? <>
        <p style={styles.address}>{fixedAddress.address}</p>
        <p style={{ margin: '8px 0', fontWeight: 700 }}>{fixedAddress.asset} · {fixedAddress.network}</p>
        <button type="button" style={styles.secondaryButton} onClick={copyFixedAddress}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy address</>}</button>
      </> : <p style={{ margin: '8px 0 0' }}>A fixed deposit address is not available yet. Please use the one-time payment option or contact support.</p>}
    </div>
  );

  const cryptoContent = depositMethod === 'fixed' ? fixedAddressContent : payment ? (
    <div style={styles.mutedCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <strong>Send USDT to this address</strong>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => {
            setPayment(null);
            setDepositNotice(null);
            setMessage('');
          }}
        >
          New deposit
        </button>
      </div>
      <p style={{ margin: '8px 0 0' }}>Send exactly the requested amount on the selected network. Your balance updates after network confirmation.</p>
      <p style={styles.address}>{payment.payAddress || 'Payment address is being prepared…'}</p>
      <p style={{ margin: '8px 0', fontWeight: 700 }}>{payment.payAmount ?? payment.priceAmount ?? '—'} {payment.payCurrency} · Status: {payment.status || payment.paymentStatus || 'waiting'}</p>
      {payment.payAddress && <button type="button" style={styles.secondaryButton} onClick={copyAddress}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy address</>}</button>}
    </div>
  ) : (
    <form onSubmit={createPayment} style={styles.mutedCard}>
      <strong>USDT deposits only</strong>
      <p style={{ margin: '8px 0 14px' }}>Choose a network and create a payment address. Do not send funds until an address is shown.</p>
      <label style={styles.label} htmlFor="deposit-amount">Amount (USDT)</label>
      <input id="deposit-amount" style={styles.input} type="number" min="10" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" required />
      <div ref={networkMenuRef} style={{ marginTop: '12px', position: 'relative' }}>
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
      {message ? <NotificationBanner tone="error" title="Deposit update" message={message} /> : null}
      <button type="submit" style={{ ...styles.primaryButton, ...(loading ? styles.primaryButtonDisabled : {}), marginTop: '8px' }} disabled={loading}>{loading ? <><LoadingDots /> Creating payment…</> : 'Create deposit address'}</button>
    </form>
  );

  return (
    <HybridTheme mode={themeMode}>
      <div data-shadow-free-page="deposit" style={styles.page}>
        <style>{'[data-shadow-free-page="deposit"] [style*="box-shadow"] { box-shadow: none !important; }'}</style>
        <div style={styles.shell}>
        <button type="button" style={styles.back} onClick={() => navigate('/asset')}><ArrowLeft size={17} /> Assets</button>
        <div style={styles.card}>
          {depositNotice ? <NotificationBanner tone={depositNotice.tone} title={depositNotice.title} message={depositNotice.message} /> : null}
          {payment && statusLabel(payment.paymentStatus || payment.status) === 'completed' ? <NotificationBanner tone="success" title="Deposit confirmed" message="Your USDT deposit has been confirmed and your balance will reflect it shortly." /> : null}
          {payment && ['failed', 'refunded', 'expired', 'cancelled', 'canceled'].includes(statusLabel(payment.paymentStatus || payment.status)) ? <NotificationBanner tone="error" title="Deposit not completed" message="This deposit could not be completed. Please start a new deposit or contact support." /> : null}
          {payment && statusLabel(payment.paymentStatus || payment.status) === 'pending' ? <NotificationBanner tone="info" title="Deposit awaiting confirmation" message="Send the requested amount to the address above. We will update this page when the network confirms it." /> : null}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" style={{ ...styles.secondaryButton, ...(depositMethod === 'fixed' ? { borderColor: theme.primary, color: theme.primary } : {}) }} onClick={() => { setDepositMethod('fixed'); setPayment(null); setCopied(false); }}>Fixed address</button>
            <button type="button" style={{ ...styles.secondaryButton, ...(depositMethod === 'now' ? { borderColor: theme.primary, color: theme.primary } : {}) }} onClick={() => { setDepositMethod('now'); setCopied(false); }}>One-time payment</button>
          </div>
          {cryptoContent}
          <div style={styles.mutedCard}>
            <strong>Recent deposits</strong>
            {recentLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                <LoadingDots />
              </div>
            ) : recentDeposits.length === 0 ? (
              <p style={{ margin: '8px 0 0' }}>No deposits yet.</p>
            ) : (
              <div style={styles.recentList}>
                {recentDeposits.map((deposit) => {
                  const status = statusLabel(deposit.paymentStatus || deposit.status);
                  const isPending = isPendingStatus(deposit.paymentStatus || deposit.status);
                  const isResumingThis = resumingPaymentId === (deposit.paymentId || deposit.id);
                  return (
                    <div
                      key={deposit.paymentId || deposit.id}
                      style={{
                        ...styles.recentItem,
                        ...(isPending ? styles.recentItemClickable : {}),
                      }}
                      onClick={isPending ? () => void resumePendingDeposit(deposit) : undefined}
                      role={isPending ? 'button' : undefined}
                      tabIndex={isPending ? 0 : undefined}
                      onKeyDown={isPending ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void resumePendingDeposit(deposit); } } : undefined}
                      title={isPending ? 'Click to resume payment' : undefined}
                    >
                      <div>
                        <strong>{deposit.priceAmount ?? deposit.amount ?? '—'} USDT</strong>
                        <div style={styles.recentMeta}>
                          {deposit.payCurrency} · {deposit.createdAt ? new Date(deposit.createdAt).toLocaleDateString() : 'Recently'}
                          {isPending ? ' · Click to resume' : ''}
                        </div>
                      </div>
                      <span style={styles.status}>
                        {isResumingThis ? <LoadingDots /> : status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <NowBar />
      </div>
      </div>
    </HybridTheme>
  );
};

export default DepositPage;
