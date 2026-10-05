import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRightLeft, AtSign, BadgeCheck, Hash, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api/axios';
import NotificationBanner from './NotificationBanner';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

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

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '90px',
  },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  shell: {
    width: '100%',
    maxWidth: '920px',
    margin: '0 auto',
    padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
    boxSizing: 'border-box' as const,
  },
  panel: {
    display: 'grid',
    gap: '10px',
    marginTop: '22px',
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '10px',
    borderRadius: '16px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
  },
  body: {
    padding: '0',
    display: 'grid',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  grid: {
    display: 'grid',
    gap: '10px',
    gridTemplateColumns: '1fr' as const,
  },
  card: {
    display: 'grid',
    width: '100%',
    boxSizing: 'border-box' as const,
    gap: '10px',
    padding: '13px 14px',
    borderRadius: '15px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    lineHeight: 1.3,
    color: theme.text,
  },
  cardText: {
    margin: '5px 0 0',
    color: theme.textMuted,
    lineHeight: 1.4,
    fontSize: '0.82rem',
  },
  field: { display: 'grid', gap: '8px', position: 'relative' as const },
  label: { fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem' },
  selectTrigger: { border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '10px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceElevated, border: `1px solid ${theme.border}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  helper: { fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.5 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', border: `1px solid ${theme.border}`, padding: '10px 14px', fontWeight: 700, color: theme.text, background: theme.surfaceGlass, cursor: 'pointer', width: '100%', maxWidth: '100%', fontSize: '0.92rem' },
  primaryButton: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  narrowCard: { minWidth: 0 },
  summaryRow: { display: 'grid', gap: '12px' },
});

const TransferPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

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
  const transferAmount = Number(amount);
  const amountIsValid = Number.isFinite(transferAmount) && transferAmount >= 1 && transferAmount <= 10000;

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
    if (!recipientValid || !amountIsValid) {
      setMessage({ kind: 'error', text: 'Enter a transfer amount between 1 and 10,000 USDT.' });
      return;
    }

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
      setMessage({ kind: 'error', text: getFriendlyErrorMessage(error, 'Unable to complete transfer. Please check your details and try again.') });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <Helmet><title>Transfer | KingsHall Exchange</title></Helmet>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/asset')}><ArrowLeft size={17} /> Assets</button>
          <div style={styles.panel}>
            <div style={styles.body}>
              <div style={styles.grid}>
              <section style={styles.card}>
                {message.kind !== 'idle' ? <NotificationBanner tone={message.kind === 'success' ? 'success' : 'error'} title={message.kind === 'success' ? 'Transfer updated' : 'Please review your details'} message={message.text} /> : null}
                <h2 style={styles.cardTitle}><ArrowRightLeft size={18} /> Send USDT to another user</h2>
                <p style={styles.cardText}>Transfer USDT from your balance to another account using UID or email. The recipient is validated live as you type.</p>
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
                  <input style={styles.input} type="number" min="1" max="10000" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1 USDT" />
                  <span style={styles.helper}>Minimum 1 USDT · Maximum 10,000 USDT per transaction</span>
                </div>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Security code</span>
                  <input style={{ ...styles.input, opacity: securityCodeBound ? 1 : 0.65, cursor: securityCodeBound ? 'text' : 'not-allowed' }} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeBound ? '6-digit security code' : 'Set security code to continue'} disabled={!securityCodeBound} />
                </div>
                <div style={styles.buttonRow}>
                  <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleTransfer()} disabled={transferring || !recipientValid || !amountIsValid || !securityCodeBound || !securityCode}>
                    {transferring ? <InlineLoadingDots /> : 'Send USDT'}
                  </button>
                </div>
                <p style={styles.cardText}>Available balance: {loading ? <LoadingDots /> : `${usdtBalance.toFixed(2)} USDT`}</p>
              </section>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><BadgeCheck size={18} /> Transfer rules</h2>
                <p style={styles.cardText}>Transfers require a valid recipient, positive amount, and enough USDT in your wallet. The recipient cannot be yourself.</p>
              </section>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><UserRound size={18} /> Recipient validation</h2>
                <p style={styles.cardText}>UID entries are restricted to 5 digits. Email validation checks the exact email that exists in the database.</p>
                <p style={styles.cardText}>Validation runs live after a short pause so the interface stays responsive on mobile and desktop.</p>
              </section>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><Hash size={18} /> Security verification</h2>
                <p style={styles.cardText}>Set a security code first if you have not set one yet. Transfers use your security code for verification and do not require your account password.</p>
                <p style={styles.cardText}>This keeps user-to-user sends aligned with the rest of the app’s account protection flow.</p>
              </section>
              </div>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default TransferPage;
