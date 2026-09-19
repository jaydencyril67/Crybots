import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRightLeft, AtSign, BadgeCheck, Hash, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type TransferRecipientCheckResponse = {
  exists?: boolean;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    uid?: string;
    email?: string;
  };
};

type TransferDetailsResponse = {
  user?: {
    uid?: string;
    email?: string;
    securityCodeSet?: boolean;
  };
  balances?: {
    usdtBalance?: number;
  };
};

const baseStyles = {
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(14px, 3vw, 28px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '16px',
  },
  hero: {
    display: 'grid',
    gap: '10px',
    padding: 'clamp(16px, 4vw, 24px)',
    borderRadius: '24px',
    border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`,
    background: HYBRID_THEME_TOKENS.dark.surfaceGlass,
  },
  heroRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  titleBlock: {
    display: 'grid',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.3rem, 3vw, 1.45rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    lineHeight: 1.6,
    fontSize: '0.92rem',
    maxWidth: '62ch',
  },
  balance: {
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    fontSize: '0.92rem',
    whiteSpace: 'nowrap' as const,
  },
  section: {
    display: 'grid',
    gap: '14px',
    padding: '16px',
    borderRadius: '22px',
    border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`,
    background: HYBRID_THEME_TOKENS.dark.surfaceGlass,
  },
  sectionTitle: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1rem',
    fontWeight: 800,
  },
  sectionText: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  field: { display: 'grid', gap: '8px' },
  label: { fontSize: '0.82rem', fontWeight: 700, color: HYBRID_THEME_TOKENS.dark.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, padding: '12px 14px', outline: 'none', fontSize: '0.9rem' },
  selectTrigger: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, borderRadius: '14px', padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: HYBRID_THEME_TOKENS.dark.surfaceMuted, border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, color: HYBRID_THEME_TOKENS.dark.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  helper: { fontSize: '0.85rem', color: HYBRID_THEME_TOKENS.dark.textMuted, lineHeight: 1.5 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, padding: '12px 16px', fontWeight: 700, color: HYBRID_THEME_TOKENS.dark.text, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, cursor: 'pointer', width: '100%', maxWidth: '100%', fontSize: '0.92rem' },
  primaryButton: { background: HYBRID_THEME_TOKENS.dark.surfaceMuted, border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}` },
  stack: { display: 'grid', gap: '14px' },
  summary: { display: 'grid', gap: '12px' },
  note: { display: 'grid', gap: '8px' },
};

const TransferPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = useMemo(() => ({
    ...baseStyles,
    page: { ...baseStyles.page, background: theme.background, color: theme.text },
    hero: { ...baseStyles.hero, border: `1px solid ${theme.border}`, background: theme.surfaceGlass },
    title: { ...baseStyles.title, color: theme.text },
    subtitle: { ...baseStyles.subtitle, color: theme.textMuted },
    balance: { ...baseStyles.balance, color: theme.textMuted },
    section: { ...baseStyles.section, border: `1px solid ${theme.border}`, background: theme.surfaceGlass },
    sectionText: { ...baseStyles.sectionText, color: theme.textMuted },
    label: { ...baseStyles.label, color: theme.textMuted },
    input: { ...baseStyles.input, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    selectTrigger: { ...baseStyles.selectTrigger, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    selectMenu: { ...baseStyles.selectMenu, border: `1px solid ${theme.border}`, background: theme.surfaceMuted },
    selectOption: { ...baseStyles.selectOption, border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text },
    helper: { ...baseStyles.helper, color: theme.textMuted },
    button: { ...baseStyles.button, border: `1px solid ${theme.border}`, color: theme.text, background: theme.surfaceGlass },
    primaryButton: { ...baseStyles.primaryButton, color: theme.text },
    stack: baseStyles.stack,
  }), [theme]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ kind: 'idle' as 'idle' | 'success' | 'error', text: '' });
  const [recipientMethod, setRecipientMethod] = useState<'uid' | 'email'>('uid');
  const [recipientValue, setRecipientValue] = useState('');
  const [recipientValid, setRecipientValid] = useState(false);
  const [recipientDetails, setRecipientDetails] = useState<TransferRecipientCheckResponse['user'] | null>(null);
  const [recipientChecking, setRecipientChecking] = useState(false);
  const [isRecipientMenuOpen, setIsRecipientMenuOpen] = useState(false);
  const recipientMenuRef = useRef<HTMLDivElement | null>(null);
  const [amount, setAmount] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodeBound, setSecurityCodeBound] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [transferring, setTransferring] = useState(false);

  const recipientDisplay = useMemo(() => {
    if (!recipientDetails) return '';
    return recipientMethod === 'email'
      ? `${recipientDetails.firstName ?? ''} ${recipientDetails.lastName ?? ''}`.trim() || recipientDetails.email || ''
      : `${recipientDetails.firstName ?? ''} ${recipientDetails.lastName ?? ''}`.trim() || recipientDetails.uid || '';
  }, [recipientDetails, recipientMethod]);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const { data } = await api.get<TransferDetailsResponse>('/api/transfers/me');
        setUsdtBalance(data.balances?.usdtBalance ?? 0);
        setSecurityCodeBound(Boolean(data.user?.securityCodeSet));
      } catch {
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (recipientMenuRef.current && !recipientMenuRef.current.contains(event.target as Node)) {
        setIsRecipientMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    const value = recipientValue.trim();
    setRecipientValid(false);
    setRecipientDetails(null);

    if (!value) return;

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          setRecipientChecking(true);
          const { data } = await api.get<TransferRecipientCheckResponse>('/api/transfers/recipient-check', {
            params: { method: recipientMethod, value },
          });
          setRecipientValid(Boolean(data.exists));
          setRecipientDetails(data.user ?? null);
        } catch {
          setRecipientValid(false);
          setRecipientDetails(null);
        } finally {
          setRecipientChecking(false);
        }
      })();
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [recipientMethod, recipientValue]);

  const handleTransfer = async () => {
    if (!recipientValid) return;

    setTransferring(true);
    try {
      const { data } = await api.post('/api/transfers', {
        recipientMethod,
        recipientValue: recipientValue.trim(),
        amount: Number(amount),
        securityCode,
      });
      setUsdtBalance(data.balances?.usdtBalance ?? usdtBalance);
      setMessage({ kind: 'success', text: data.message || 'Transfer completed successfully.' });
      setAmount('');
      setSecurityCode('');
    } catch (error: any) {
      setMessage({ kind: 'error', text: error?.response?.data?.message || 'Unable to complete transfer.' });
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return null;

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <Helmet><title>Transfer | KingsHall Exchange</title></Helmet>
        <div style={styles.shell}>
          <AppHeader />
          <div style={styles.content}>
            {message.kind !== 'idle' ? <NotificationBanner tone={message.kind === 'success' ? 'success' : 'error'} title={message.kind === 'success' ? 'Transfer updated' : 'Please review your details'} message={message.text} /> : null}
            <div style={styles.hero}>
              <div style={styles.heroRow}>
                <div style={styles.titleBlock}>
                  <h1 style={styles.title}>Transfer USDT</h1>
                  <p style={styles.subtitle}>Send USDT to another user using their UID or email. Recipient validation runs automatically as you type.</p>
                </div>
                <div style={styles.balance}>Balance: {usdtBalance.toFixed(2)} USDT</div>
              </div>
            </div>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}><ArrowRightLeft size={18} /> Transfer details</h2>
              <div style={styles.stack}>
                <div ref={recipientMenuRef} style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Recipient type</span>
                  <button type="button" style={styles.selectTrigger} onClick={() => setIsRecipientMenuOpen((current) => !current)}>
                    <span>{recipientMethod === 'uid' ? 'UID' : 'Email'}</span>
                    <span style={{ transform: isRecipientMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
                  </button>
                  {isRecipientMenuOpen ? (
                    <div style={styles.selectMenu}>
                      {(['uid', 'email'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          style={styles.selectOption}
                          onClick={() => {
                            setRecipientMethod(option);
                            setIsRecipientMenuOpen(false);
                          }}
                        >
                          {option === 'uid' ? 'UID' : 'Email'}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>{recipientMethod === 'email' ? 'Recipient email' : 'Recipient UID'}</span>
                  <input
                    style={styles.input}
                    value={recipientValue}
                    onChange={(event) => setRecipientValue(recipientMethod === 'uid' ? event.target.value.replace(/\D/g, '').slice(0, 5) : event.target.value)}
                    placeholder={recipientMethod === 'email' ? 'recipient@email.com' : '12345'}
                  />
                </div>

                <div style={styles.helper}>
                  {recipientChecking ? 'Checking recipient...' : recipientValid ? `Recipient found: ${recipientDisplay}` : recipientValue.trim() ? 'No matching user found yet.' : 'Enter a UID or email to validate.'}
                </div>

                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Amount</span>
                  <input style={styles.input} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00 USDT" />
                </div>

                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Security code</span>
                  <input style={{ ...styles.input, opacity: securityCodeBound ? 1 : 0.65, cursor: securityCodeBound ? 'text' : 'not-allowed' }} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeBound ? '6-digit code' : 'Set security code to continue'} disabled={!securityCodeBound} />
                </div>

                <div style={styles.buttonRow}>
                  <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleTransfer()} disabled={transferring || !recipientValid || !securityCodeBound || !securityCode}>
                    {transferring ? 'Sending...' : 'Send USDT'}
                  </button>
                </div>
              </div>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}><BadgeCheck size={18} /> Transfer rules</h2>
              <p style={styles.sectionText}>Transfers require a valid recipient, positive amount, and enough USDT in your wallet. The recipient cannot be yourself.</p>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}><UserRound size={18} /> Recipient validation</h2>
              <p style={styles.sectionText}>UID entries are restricted to 5 digits. Email validation checks the exact email that exists in the database.</p>
              <p style={styles.sectionText}>Validation runs live after a short pause so the interface stays responsive on mobile and desktop.</p>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}><Hash size={18} /> Security verification</h2>
              <p style={styles.sectionText}>Bind a security code first if you have not set one yet. Transfers use your security code for verification and do not require your account password.</p>
              <p style={styles.sectionText}>This keeps user-to-user sends aligned with the rest of the app’s account protection flow.</p>
            </section>
          </div>
          <NowBar />
        </div>
      </div>
    </HybridTheme>
  );
};

export default TransferPage;
