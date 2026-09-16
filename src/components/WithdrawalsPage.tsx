import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarClock, Coins, Landmark, ShieldCheck, TimerReset } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type WithdrawalDetailsResponse = {
  user?: {
    walletAddress?: string;
    fiatBankName?: string;
    fiatAccountName?: string;
    fiatAccountNumber?: string;
    securityCodeSet?: boolean;
  };
  balances?: {
    usdtBalance?: number;
    fiatBalance?: number;
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
  select: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
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
  const [assetType, setAssetType] = useState<'crypto' | 'fiat'>('crypto');
  const [method, setMethod] = useState<'instant' | 'scheduled'>('instant');
  const [isAssetMenuOpen, setIsAssetMenuOpen] = useState(false);
  const [isMethodMenuOpen, setIsMethodMenuOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [destinationValue, setDestinationValue] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [currentWallet, setCurrentWallet] = useState('');
  const [fiatAccount, setFiatAccount] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [balances, setBalances] = useState({ usdtBalance: 0, fiatBalance: 0 });
  const [securityCodeSet, setSecurityCodeSet] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingSecurityCode, setSavingSecurityCode] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [password, setPassword] = useState('');
  const [newSecurityCode, setNewSecurityCode] = useState('');

  const availableDestination = useMemo(() => {
    if (assetType === 'crypto') return currentWallet;
    return fiatAccount.accountNumber;
  }, [assetType, currentWallet, fiatAccount.accountNumber]);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const { data } = await api.get<WithdrawalDetailsResponse>('/api/withdrawals/me');
        setCurrentWallet(data.user?.walletAddress ?? '');
        setFiatAccount({
          bankName: data.user?.fiatBankName ?? '',
          accountName: data.user?.fiatAccountName ?? '',
          accountNumber: data.user?.fiatAccountNumber ?? '',
        });
        setSecurityCodeSet(Boolean(data.user?.securityCodeSet));
        setBalances({ usdtBalance: data.balances?.usdtBalance ?? 0, fiatBalance: data.balances?.fiatBalance ?? 0 });
        if (data.user?.walletAddress) setDestinationValue(data.user.walletAddress);
      } catch {
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };
    void loadDetails();
  }, []);

  useEffect(() => {
    setDestinationValue(assetType === 'crypto' ? currentWallet : fiatAccount.accountNumber);
  }, [assetType, currentWallet, fiatAccount.accountNumber]);

  const handleSaveFiatAccount = async () => {
    setSavingAccount(true);
    try {
      await api.patch('/api/withdrawals/fiat-account', fiatAccount);
      setMessage({ kind: 'success', text: 'Fiat account saved successfully.' });
    } catch (error: any) {
      setMessage({ kind: 'error', text: error?.response?.data?.message || 'Unable to save fiat account.' });
    } finally {
      setSavingAccount(false);
    }
  };

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
                <h2 style={styles.cardTitle}><Coins size={18} /> Withdraw crypto or fiat</h2>
                <p style={styles.cardText}>Choose an asset type, pick instant or scheduled processing, and send funds to your bound account.</p>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Asset type</span>
                  <button type="button" style={styles.button} onClick={() => setIsAssetMenuOpen((current) => !current)}>
                    {assetType === 'crypto' ? 'Crypto' : 'Fiat'}
                  </button>
                  {isAssetMenuOpen ? (
                    <div style={styles.summaryRow}>
                      <button type="button" style={styles.button} onClick={() => { setAssetType('crypto'); setIsAssetMenuOpen(false); }}>Crypto</button>
                      <button type="button" style={styles.button} onClick={() => { setAssetType('fiat'); setIsAssetMenuOpen(false); }}>Fiat</button>
                    </div>
                  ) : null}
                </div>
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Withdrawal method</span>
                  <button type="button" style={styles.button} onClick={() => setIsMethodMenuOpen((current) => !current)}>
                    {method === 'instant' ? 'Instant' : 'Scheduled'}
                  </button>
                  {isMethodMenuOpen ? (
                    <div style={styles.summaryRow}>
                      <button type="button" style={styles.button} onClick={() => { setMethod('instant'); setIsMethodMenuOpen(false); }}>Instant</button>
                      <button type="button" style={styles.button} onClick={() => { setMethod('scheduled'); setIsMethodMenuOpen(false); }}>Scheduled</button>
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
                  <span style={styles.label}>{assetType === 'crypto' ? 'Bound wallet' : 'Bound fiat account'}</span>
                  <input style={styles.input} value={availableDestination} readOnly />
                  <span style={styles.helper}>{assetType === 'crypto' ? 'Use your bound TRC-20 wallet.' : 'Use the fiat account saved in settings.'}</span>
                </div>
                {method === 'scheduled' ? <div style={styles.field as React.CSSProperties}><span style={styles.label}>Schedule date and time</span><input style={styles.input} value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} placeholder="YYYY-MM-DD HH:mm" /></div> : null}
                <div style={styles.field as React.CSSProperties}>
                  <span style={styles.label}>Security code</span>
                  <input style={styles.input} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit security code" />
                </div>
                <div style={styles.buttonRow}>
                  <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleWithdraw()} disabled={withdrawing || !availableDestination}>
                    {withdrawing ? 'Submitting...' : 'Submit withdrawal'}
                  </button>
                </div>
                <p style={styles.cardText}>Crypto balance: {balances.usdtBalance.toFixed(2)} USDT · Fiat balance: {balances.fiatBalance.toFixed(2)}</p>
              </section>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><Landmark size={18} /> Fiat account binding</h2>
                <p style={styles.cardText}>Bind a receiving fiat account for scheduled or instant cash-out requests.</p>
                <div style={styles.field as React.CSSProperties}><span style={styles.label}>Bank name</span><input style={styles.input} value={fiatAccount.bankName} onChange={(event) => setFiatAccount((current) => ({ ...current, bankName: event.target.value }))} /></div>
                <div style={styles.field as React.CSSProperties}><span style={styles.label}>Account name</span><input style={styles.input} value={fiatAccount.accountName} onChange={(event) => setFiatAccount((current) => ({ ...current, accountName: event.target.value }))} /></div>
                <div style={styles.field as React.CSSProperties}><span style={styles.label}>Account number</span><input style={styles.input} value={fiatAccount.accountNumber} onChange={(event) => setFiatAccount((current) => ({ ...current, accountNumber: event.target.value }))} /></div>
                <div style={styles.buttonRow}><button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSaveFiatAccount()} disabled={savingAccount}>{savingAccount ? 'Saving...' : 'Save fiat account'}</button></div>
              </section>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><ShieldCheck size={18} /> Security code</h2>
                <p style={styles.cardText}>Set or change your withdrawal security code. Password verification is required.</p>
                <div style={styles.field as React.CSSProperties}><span style={styles.label}>Current password</span><input style={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
                <div style={styles.field as React.CSSProperties}><span style={styles.label}>Security code</span><input style={styles.input} type="password" value={newSecurityCode} onChange={(event) => setNewSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeSet ? 'Change security code' : 'Set security code'} /></div>
                <div style={styles.buttonRow}><button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSaveSecurityCode()} disabled={savingSecurityCode}>{savingSecurityCode ? 'Saving...' : securityCodeSet ? 'Change code' : 'Bind code'}</button></div>
                <p style={styles.cardText}>Scheduled withdrawals are held for review until the selected date and time.</p>
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
