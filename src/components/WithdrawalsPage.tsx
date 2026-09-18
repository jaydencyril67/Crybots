import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarClock, Coins, ShieldCheck, TimerReset } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import ReusableDatePage from './ReusableDatePage';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
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
    padding: 'clamp(18px, 4vw, 30px)',
  },
  section: {
    display: 'grid',
    gap: '20px',
    padding: 'clamp(18px, 4vw, 28px)',
    borderRadius: '28px',
    border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`,
    background: 'linear-gradient(180deg, rgba(14,18,33,0.92), rgba(9,12,24,0.86))',
    boxShadow: '0 22px 80px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionText: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  field: { display: 'grid', gap: '8px' },
  label: { fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
  selectTrigger: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, borderRadius: '14px', padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: HYBRID_THEME_TOKENS.dark.surfaceMuted, border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, color: HYBRID_THEME_TOKENS.dark.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  helper: { fontSize: '0.85rem', color: HYBRID_THEME_TOKENS.dark.textMuted, lineHeight: 1.5 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, padding: '12px 16px', fontWeight: 700, color: HYBRID_THEME_TOKENS.dark.text, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, cursor: 'pointer', width: '100%', maxWidth: '100%' },
  primaryButton: { background: `linear-gradient(135deg, ${HYBRID_THEME_TOKENS.dark.primarySoft}, ${HYBRID_THEME_TOKENS.dark.surfaceGlass})`, border: 'none' },
  customPickerRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' },
  customPickerButton: { borderRadius: '16px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, padding: '12px 14px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const },
  customPickerButtonActive: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.borderGlass}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass },
  customPickerDisplay: { borderRadius: '16px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, padding: '13px 14px', color: HYBRID_THEME_TOKENS.dark.text, fontSize: '0.92rem', lineHeight: 1.5 },
  customPickerHint: { fontSize: '0.82rem', color: '#95a8ca', lineHeight: 1.5 },
};

const WithdrawPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = useMemo(() => ({
    ...baseStyles,
    page: {
      ...baseStyles.page,
      background: theme.background,
      color: theme.text,
    },
    section: { ...baseStyles.section, border: `1px solid ${theme.border}`, background: theme.surfaceGlass, boxShadow: `inset 0 1px 0 ${theme.highlight}, 0 18px 34px rgba(0, 0, 0, 0.10)` },
    sectionText: { ...baseStyles.sectionText, color: theme.textMuted },
    label: { ...baseStyles.label, color: theme.textMuted },
    input: { ...baseStyles.input, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    selectTrigger: { ...baseStyles.selectTrigger, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    selectMenu: { ...baseStyles.selectMenu, border: `1px solid ${theme.border}`, background: theme.surfaceMuted },
    selectOption: { ...baseStyles.selectOption, border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text },
    helper: { ...baseStyles.helper, color: theme.textMuted },
    button: { ...baseStyles.button, border: `1px solid ${theme.border}`, color: theme.text, background: theme.surfaceGlass },
    primaryButton: { ...baseStyles.primaryButton, color: theme.textInverse },
    customPickerButton: { ...baseStyles.customPickerButton, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    customPickerButtonActive: { ...baseStyles.customPickerButtonActive, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    customPickerDisplay: { ...baseStyles.customPickerDisplay, border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text },
    customPickerHint: { ...baseStyles.customPickerHint, color: theme.textMuted },
  }), [theme]);

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
  const [showSchedulePage, setShowSchedulePage] = useState(false);
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

  useEffect(() => {
    if (method !== 'scheduled') {
      setShowSchedulePage(false);
    }
  }, [method]);

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
    <div data-shadow-free-page="withdrawals" style={styles.page}>
      <Helmet><title>Withdraw | KingsHall Exchange</title></Helmet>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.content}>
          {message.kind !== 'idle' ? <NotificationBanner tone={message.kind === 'success' ? 'success' : 'error'} title={message.kind === 'success' ? 'Withdrawal updated' : 'Please review your details'} message={message.text} /> : null}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}><Coins size={18} /> Withdraw USDT</h2>
            <p style={styles.sectionText}>Choose instant or scheduled processing and send funds to your bound wallet.</p>
            <div ref={assetMenuRef} style={styles.field as React.CSSProperties}>
              <span style={styles.label}>Asset type</span>
              <button type="button" style={styles.selectTrigger} onClick={() => setIsAssetMenuOpen((current) => !current)}>
                <span>Crypto</span>
                <span style={{ transform: isAssetMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
              </button>
              {isAssetMenuOpen ? (
                <div style={styles.selectMenu}>
                  {(['crypto'] as const).map((option) => (
                    <button key={option} type="button" style={styles.selectOption} onClick={() => { setAssetType(option); setIsAssetMenuOpen(false); }}>
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
                    <button key={option} type="button" style={styles.selectOption} onClick={() => { setMethod(option); setIsMethodMenuOpen(false); }}>
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
              <input style={styles.input} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="USDT" />
            </div>
            <div style={styles.field as React.CSSProperties}>
              <span style={styles.label}>Bound wallet</span>
              <input style={styles.input} value={availableDestination} readOnly />
              <span style={styles.helper}>Use your bound TRC-20 wallet.</span>
            </div>
            {method === 'scheduled' ? <div style={styles.field as React.CSSProperties}><span style={styles.label}>Schedule date and time</span><button type="button" style={styles.input as React.CSSProperties} onClick={() => setShowSchedulePage(true)}>{scheduledFor ? new Date(scheduledFor).toLocaleString() : 'Choose date and time'}</button></div> : null}
            <div style={styles.field as React.CSSProperties}>
              <span style={styles.label}>Security code</span>
              <input style={{ ...styles.input, opacity: securityCodeSet ? 1 : 0.65, cursor: securityCodeSet ? 'text' : 'not-allowed' }} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeSet ? '6-digit security code' : 'Set security code to continue'} disabled={!securityCodeSet} />
            </div>
            <div style={styles.buttonRow}>
              <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleWithdraw()} disabled={withdrawing || !availableDestination || !securityCodeSet || !securityCode}>
                {withdrawing ? 'Submitting...' : 'Submit withdrawal'}
              </button>
            </div>
            <p style={styles.sectionText}>Crypto balance: {balances.usdtBalance.toFixed(2)} USDT</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}><ShieldCheck size={18} /> Security code</h2>
            <p style={styles.sectionText}>Use the settings page to bind or change your security code. Withdrawals only work after it has been set.</p>
            <p style={styles.sectionText}>If you have not set a security code yet, go to Settings and bind one first before submitting a withdrawal.</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}><TimerReset size={18} /> Withdrawal method guide</h2>
            <p style={styles.sectionText}>Instant withdrawals submit immediately. Scheduled withdrawals are queued for the date and time you choose, giving you more control over when the transfer is processed.</p>
          </section>
        </div>
        <NowBar />
      </div>
      {showSchedulePage ? (
        <ReusableDatePage
          title="Schedule withdrawal"
          description="Choose the date and time you want this withdrawal to be processed."
          label="Schedule date and time"
          mode="auto"
          value={scheduledFor}
          onCancel={() => setShowSchedulePage(false)}
          onConfirm={(value) => {
            setScheduledFor(value);
            setShowSchedulePage(false);
          }}
          confirmLabel="Confirm schedule"
          cancelLabel="Back"
        />
      ) : null}
    </div>
  );
};

export default WithdrawPage;
