import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarClock, Coins, ShieldCheck, TimerReset } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type WithdrawalDetailsResponse = {
  user?: {
    walletAddress?: string;
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
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
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
    padding: 'clamp(18px, 4vw, 30px)',
    display: 'grid',
    gap: '18px',
  },
  grid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' as const,
  },
  card: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardText: {
    margin: '10px 0 0',
    color: '#9db0d1',
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  field: { display: 'grid', gap: '8px' },
  label: { fontSize: '0.82rem', fontWeight: 700, color: '#d7e2f8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
  selectTrigger: { border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '14px', padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)', transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  helper: { fontSize: '0.85rem', color: '#95a8ca', lineHeight: 1.5 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 16px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', width: '100%', maxWidth: '100%' },
  primaryButton: { background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', border: 'none' },
  customPickerRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' },
  customPickerButton: { borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '12px 14px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const },
  customPickerButtonActive: { border: '1px solid rgba(125,211,252,0.55)', background: 'rgba(125,211,252,0.12)' },
  customPickerDisplay: { borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '13px 14px', color: '#eef4ff', fontSize: '0.92rem', lineHeight: 1.5 },
  customPickerHint: { fontSize: '0.82rem', color: '#95a8ca', lineHeight: 1.5 },
};

const WithdrawalsPage = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ kind: 'idle' as 'idle' | 'success' | 'error', text: '' });
  const [assetType, setAssetType] = useState<'crypto'>('crypto');
  const [method, setMethod] = useState<'instant' | 'scheduled'>('instant');
  const [isAssetMenuOpen, setIsAssetMenuOpen] = useState(false);
  const [isMethodMenuOpen, setIsMethodMenuOpen] = useState(false);
  const assetMenuRef = useRef<HTMLDivElement | null>(null);
  const methodMenuRef = useRef<HTMLDivElement | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [destinationValue, setDestinationValue] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [currentWallet, setCurrentWallet] = useState('');
  const [balances, setBalances] = useState({ usdtBalance: 0 });
  const [securityCodeSet, setSecurityCodeSet] = useState(false);

  const [savingSecurityCode, setSavingSecurityCode] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [password, setPassword] = useState('');
  const [newSecurityCode, setNewSecurityCode] = useState('');

  const availableDestination = useMemo(() => currentWallet, [currentWallet]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (assetMenuRef.current && !assetMenuRef.current.contains(event.target as Node)) {
        setIsAssetMenuOpen(false);
      }
      if (methodMenuRef.current && !methodMenuRef.current.contains(event.target as Node)) {
        setIsMethodMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    const loadDetails = async () => {
      try {
        const { data } = await api.get<WithdrawalDetailsResponse>('/api/withdrawals/me');
        setCurrentWallet(data.user?.walletAddress ?? '');

        setSecurityCodeSet(Boolean(data.user?.securityCodeSet));
        setBalances({ usdtBalance: data.balances?.usdtBalance ?? 0 });
        if (data.user?.walletAddress) setDestinationValue(data.user.walletAddress);
      } catch {
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };
    void loadDetails();
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setDestinationValue(currentWallet);
  }, [currentWallet]);



  const handleSaveSecurityCode = async () => {
    setSavingSecurityCode(true);
    try {
      await api.patch('/api/withdrawals/security-code', { currentPassword: password, securityCode: newSecurityCode });
      setMessage({ kind: 'success', text: 'Security code updated successfully.' });
      setPassword('');
      setNewSecurityCode('');
      setSecurityCodeSet(true);
    } catch (error: any) {
      setMessage({ kind: 'error', text: error?.response?.data?.message || 'Unable to update security code.' });
    } finally {
      setSavingSecurityCode(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { data } = await api.post('/api/withdrawals', {
        assetType,
        amount: Number(amount),
        currency,
        destinationValue: availableDestination,
        method,
        scheduledFor: method === 'scheduled' ? scheduledFor : undefined,
        securityCode,
      });
      setMessage({ kind: 'success', text: data.message || 'Withdrawal submitted successfully.' });
      setBalances(data.balances || balances);
    } catch (error: any) {
      setMessage({ kind: 'error', text: error?.response?.data?.message || 'Unable to submit withdrawal.' });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return null;

  return (
    <div style={styles.page}>
      <Helmet><title>Withdraw | KingsHall Exchange</title></Helmet>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.panel}>
          <div style={styles.body}>
            {message.kind !== 'idle' ? <NotificationBanner tone={message.kind === 'success' ? 'success' : 'error'} title={message.kind === 'success' ? 'Withdrawal updated' : 'Please review your details'} message={message.text} /> : null}
            <div style={styles.grid}>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><Coins size={18} /> Withdraw USDT</h2>
                <p style={styles.cardText}>Choose instant or scheduled processing and send funds to your bound wallet.</p>
                <div ref={assetMenuRef} style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Asset type</span>
                  <button type="button" style={styles.selectTrigger} onClick={() => setIsAssetMenuOpen((current) => !current)}>
                    <span>Crypto</span>
                    <span style={{ transform: isAssetMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
                  </button>
                  {isAssetMenuOpen ? (
                    <div style={styles.selectMenu}>
                      {(['crypto'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          style={styles.selectOption}
                          onClick={() => {
                            setAssetType(option);
                            setIsAssetMenuOpen(false);
                          }}
                        >
                          Crypto
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div ref={methodMenuRef} style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Withdrawal method</span>
                  <button type="button" style={styles.selectTrigger} onClick={() => setIsMethodMenuOpen((current) => !current)}>
                    <span>{method === 'instant' ? 'Instant' : 'Scheduled'}</span>
                    <span style={{ transform: isMethodMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
                  </button>
                  {isMethodMenuOpen ? (
                    <div style={styles.selectMenu}>
                      {(['instant', 'scheduled'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          style={styles.selectOption}
                          onClick={() => {
                            setMethod(option);
                            setIsMethodMenuOpen(false);
                          }}
                        >
                          {option === 'instant' ? 'Instant' : 'Scheduled'}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Amount</span>
                  <input style={styles.input} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={assetType === 'crypto' ? '0.00 USDT' : '0.00'} />
                </div>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Currency</span>
                  <input style={styles.input} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder={assetType === 'crypto' ? 'USDT' : 'NGN'} />
                </div>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Bound wallet</span>
                  <input style={styles.input} value={availableDestination} readOnly />
                  <span style={styles.helper}>Use your bound TRC-20 wallet.</span>
                </div>
                {method === 'scheduled' ? <div style={styles.field as React.CSSProperties}><span style={styles.label}>Schedule date and time</span><input style={styles.input} type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /></div> : null}
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Security code</span>
                  <input style={{ ...styles.input, opacity: securityCodeSet ? 1 : 0.65, cursor: securityCodeSet ? 'text' : 'not-allowed' }} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeSet ? '6-digit security code' : 'Set security code to continue'} disabled={!securityCodeSet} />
                </div>
                <div style={styles.buttonRow}>
                  <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleWithdraw()} disabled={withdrawing || !availableDestination || !securityCodeSet || !securityCode}>
                    {withdrawing ? 'Submitting...' : 'Submit withdrawal'}
                  </button>
                </div>
                <p style={styles.cardText}>Crypto balance: {balances.usdtBalance.toFixed(2)} USDT</p>
              </section>

              <section style={styles.card}>
                <h2 style={styles.cardTitle}><ShieldCheck size={18} /> Security code</h2>
                <p style={styles.cardText}>Use the settings page to bind or change your security code. Withdrawals only work after it has been set.</p>
                <p style={styles.cardText}>If you have not set a security code yet, go to Settings and bind one first before submitting a withdrawal.</p>
              </section>
            </div>
            <section style={styles.card}>
              <h2 style={styles.cardTitle}><TimerReset size={18} /> Withdrawal method guide</h2>
              <p style={styles.cardText}>Instant withdrawals submit immediately. Scheduled withdrawals are queued for the date and time you choose, giving you more control over when the transfer is processed.</p>
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default WithdrawalsPage;
