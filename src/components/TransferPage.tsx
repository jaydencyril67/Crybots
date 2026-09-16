import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRightLeft, AtSign, BadgeCheck, Hash, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
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

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#fff',
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
  panel: {
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(14,18,33,0.92), rgba(9,12,24,0.86))',
    boxShadow: '0 22px 80px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    overflow: 'hidden',
  },
  body: {
    padding: 'clamp(14px, 3.5vw, 24px)',
    display: 'grid',
    gap: '16px',
  },
  grid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' as const,
  },
  card: {
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '16px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    lineHeight: 1.3,
  },
  cardText: {
    margin: '10px 0 0',
    color: '#9db0d1',
    lineHeight: 1.6,
    fontSize: '0.9rem',
  },
  field: { display: 'grid', gap: '8px' },
  label: { fontSize: '0.78rem', fontWeight: 700, color: '#d7e2f8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '12px 14px', outline: 'none', fontSize: '0.9rem' },
  select: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '12px 14px', outline: 'none', fontSize: '0.9rem' },
  helper: { fontSize: '0.82rem', color: '#95a8ca', lineHeight: 1.5 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 16px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', width: '100%', maxWidth: '100%', fontSize: '0.92rem' },
  primaryButton: { background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', border: 'none' },
  narrowCard: { minWidth: 0 },
  summaryRow: { display: 'grid', gap: '12px' },
};

const TransferPage = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ kind: 'idle' as 'idle' | 'success' | 'error', text: '' });
  const [recipientMethod, setRecipientMethod] = useState<'uid' | 'email'>('uid');
  const [recipientValue, setRecipientValue] = useState('');
  const [recipientValid, setRecipientValid] = useState(false);
  const [recipientDetails, setRecipientDetails] = useState<TransferRecipientCheckResponse['user'] | null>(null);
  const [recipientChecking, setRecipientChecking] = useState(false);
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
    <div style={styles.page}>
      <Helmet><title>Transfer | KingsHall Exchange</title></Helmet>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.panel}>
          <div style={styles.body}>
            {message.kind !== 'idle' ? <NotificationBanner tone={message.kind === 'success' ? 'success' : 'error'} title={message.kind === 'success' ? 'Transfer updated' : 'Please review your details'} message={message.text} /> : null}
            <div style={styles.grid}>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><ArrowRightLeft size={18} /> Send USDT to another user</h2>
                <p style={styles.cardText}>Transfer USDT from your balance to another account using UID or email. The recipient is validated live as you type.</p>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Recipient type</span>
                  <select style={styles.select} value={recipientMethod} onChange={(event) => setRecipientMethod(event.target.value as 'uid' | 'email')}>
                    <option value="uid">UID</option>
                    <option value="email">Email</option>
                  </select>
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
                  <input style={styles.input} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeBound ? '6-digit code' : 'Bind security code to continue'} />
                </div>
                <div style={styles.buttonRow}>
                  <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleTransfer()} disabled={transferring || !recipientValid || !securityCode}>
                    {transferring ? 'Sending...' : 'Send USDT'}
                  </button>
                </div>
                <p style={styles.cardText}>Available balance: {usdtBalance.toFixed(2)} USDT</p>
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
                <p style={styles.cardText}>Bind a security code first if you have not set one yet. Transfers use your security code for verification and do not require your account password.</p>
                <p style={styles.cardText}>This keeps user-to-user sends aligned with the rest of the app’s account protection flow.</p>
              </section>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default TransferPage;
