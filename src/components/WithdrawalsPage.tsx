import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CalendarClock, Coins, ShieldCheck, TimerReset } from 'lucide-react';
import api from '../api/axios';
import NotificationBanner from './NotificationBanner';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import NowBar from './NowBar';
import ReusableDatePage from './ReusableDatePage';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import { getFriendlyErrorMessage } from '../utils/errorMessage';

type WithdrawalWallet = { id?: string; network: 'TRC-20' | 'BEP-20' | 'TRX'; address: string; description?: string };
type WithdrawalDetailsResponse = {
  user?: {
    walletAddress?: string;
    wallets?: WithdrawalWallet[];
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
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', padding: '7px 10px', cursor: 'pointer', fontSize: '0.84rem' },
  shell: {
    width: '100%',
    maxWidth: '920px',
    margin: '0 auto',
    padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '12px',
    padding: '18px',
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '22px',
    border: `1px solid ${HYBRID_THEME_TOKENS.dark.borderGlass}`,
    background: HYBRID_THEME_TOKENS.dark.surfaceGlass,
  },
  section: {
    display: 'grid',
    width: '100%',
    boxSizing: 'border-box' as const,
    gap: '14px',
    padding: '13px 14px',
    borderRadius: '15px',
    border: `1px solid ${HYBRID_THEME_TOKENS.dark.borderGlass}`,
    background: HYBRID_THEME_TOKENS.dark.surfaceMuted,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '0.96rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionText: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    lineHeight: 1.4,
    fontSize: '0.82rem',
  },
  field: { display: 'grid', gap: '8px', position: 'relative' as const },
  label: { fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '12px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surface, color: HYBRID_THEME_TOKENS.dark.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem' },
  selectTrigger: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, borderRadius: '14px', padding: '10px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: HYBRID_THEME_TOKENS.dark.surfaceMuted, border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, color: HYBRID_THEME_TOKENS.dark.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  helper: { fontSize: '0.85rem', color: HYBRID_THEME_TOKENS.dark.textMuted, lineHeight: 1.5 },
  buttonRow: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'flex-start', gap: '10px', marginTop: '8px' },
  button: { borderRadius: '999px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, padding: '10px 14px', fontWeight: 700, color: HYBRID_THEME_TOKENS.dark.text, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, cursor: 'pointer', width: '100%', maxWidth: '100%' },
  primaryButton: { borderRadius: '999px', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', width: '100%', maxWidth: '100%' },
  customPickerRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' },
  customPickerButton: { borderRadius: '16px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceMuted, color: HYBRID_THEME_TOKENS.dark.text, padding: '12px 14px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const },
  customPickerButtonActive: { border: `1px solid ${HYBRID_THEME_TOKENS.dark.borderGlass}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass },
  customPickerDisplay: { borderRadius: '16px', border: `1px solid ${HYBRID_THEME_TOKENS.dark.border}`, background: HYBRID_THEME_TOKENS.dark.surfaceGlass, padding: '13px 14px', color: HYBRID_THEME_TOKENS.dark.text, fontSize: '0.92rem', lineHeight: 1.5 },
  customPickerHint: { fontSize: '0.82rem', lineHeight: 1.5 },
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
    back: { ...baseStyles.back, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text },
    content: { ...baseStyles.content, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    section: { ...baseStyles.section, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
    sectionText: { ...baseStyles.sectionText, color: theme.textMuted },
    label: { ...baseStyles.label, color: theme.textMuted },
    input: { ...baseStyles.input, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text },
    selectTrigger: { ...baseStyles.selectTrigger, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    selectMenu: { ...baseStyles.selectMenu, border: `1px solid ${theme.border}`, background: theme.surfaceMuted },
    selectOption: { ...baseStyles.selectOption, border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text },
    helper: { ...baseStyles.helper, color: theme.textMuted },
    button: { ...baseStyles.button, border: `1px solid ${theme.border}`, color: theme.text, background: theme.surfaceGlass },
    primaryButton: { ...baseStyles.primaryButton, background: theme.primary, border: `1px solid ${theme.primary}`, color: theme.textInverse },
    customPickerButton: { ...baseStyles.customPickerButton, border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text },
    customPickerButtonActive: { ...baseStyles.customPickerButtonActive, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    customPickerDisplay: { ...baseStyles.customPickerDisplay, border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text },
    customPickerHint: { ...baseStyles.customPickerHint, color: theme.textMuted },
  }), [theme]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ kind: 'idle' as 'idle' | 'success' | 'error', text: '' });
  const [method, setMethod] = useState<'instant' | 'scheduled'>('instant');
  const [isMethodMenuOpen, setIsMethodMenuOpen] = useState(false);
  const methodMenuRef = useRef<HTMLDivElement | null>(null);
  const [amount, setAmount] = useState('');
  const [destinationValue, setDestinationValue] = useState('');
  const [wallets, setWallets] = useState<WithdrawalWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
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
      if (methodMenuRef.current && !methodMenuRef.current.contains(event.target as Node)) {
        setIsMethodMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    const loadDetails = async () => {
      try {
        const { data } = await api.get<WithdrawalDetailsResponse>('/api/withdrawals/me');
        const availableWallets = data.user?.wallets ?? [];
        setWallets(availableWallets);
        setCurrentWallet(data.user?.walletAddress ?? availableWallets[0]?.address ?? '');
        setSecurityCodeSet(Boolean(data.user?.securityCodeSet));
        setBalances({ usdtBalance: data.balances?.usdtBalance ?? 0 });
        if (availableWallets[0]?.id) setSelectedWalletId(availableWallets[0].id);
        else if (data.user?.walletAddress) setDestinationValue(data.user.walletAddress);
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
    const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId);
    setDestinationValue(selectedWallet?.address ?? (wallets.length ? '' : currentWallet));
  }, [currentWallet, selectedWalletId, wallets]);

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
      setMessage({ kind: 'error', text: getFriendlyErrorMessage(error, 'Unable to update your security code. Please check your details and try again.') });
    } finally {
      setSavingSecurityCode(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { data } = await api.post('/api/withdrawals', {
        assetType: 'crypto',
        amount: Number(amount),
        currency: 'USDT',
        walletId: selectedWalletId || undefined,
        destinationValue: availableDestination,
        method,
        scheduledFor: method === 'scheduled' ? scheduledFor : undefined,
        securityCode,
      });
      setMessage({ kind: 'success', text: data.message || 'Withdrawal submitted successfully.' });
      setBalances(data.balances || balances);
    } catch (error: any) {
      setMessage({ kind: 'error', text: getFriendlyErrorMessage(error, 'Unable to submit your withdrawal. Please check your details and try again.') });
    } finally {
      setWithdrawing(false);
    }
  };

  if (showSchedulePage) {
    return (
      <ReusableDatePage
        title="Schedule withdrawal"
        description="Choose the date and time you want this withdrawal to be processed."
        label="Schedule date and time"
        mode="datetime-local"
        value={scheduledFor}
        onCancel={() => setShowSchedulePage(false)}
        onConfirm={(value) => {
          setScheduledFor(value);
          setShowSchedulePage(false);
        }}
        cancelLabel="Back"
      />
    );
  }

  return (
    <HybridTheme mode={themeMode}>
      <div data-shadow-free-page="withdrawals" style={styles.page}>
      <Helmet><title>Withdraw | KingsHall Exchange</title></Helmet>
      <div style={styles.shell}>
        <button type="button" style={styles.back} onClick={() => navigate('/asset')}><ArrowLeft size={17} /> Assets</button>
        <div style={styles.content}>
          <section style={styles.section}>
            {message.kind !== 'idle' ? <NotificationBanner tone={message.kind === 'success' ? 'success' : 'error'} title={message.kind === 'success' ? 'Withdrawal updated' : 'Please review your details'} message={message.text} /> : null}
            <h2 style={styles.sectionTitle}><Coins size={18} /> Withdraw USDT</h2>
            <p style={styles.sectionText}>Choose instant or scheduled processing and send funds to your bound wallet.</p>
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
              <input style={styles.input} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00 USDT" />
            </div>
            <div style={styles.field as React.CSSProperties}>
              <span style={styles.label}>Withdrawal wallet</span>
              {wallets.length ? <select style={styles.input} value={selectedWalletId} onChange={(event) => setSelectedWalletId(event.target.value)}>
                {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.description || wallet.network} · {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}</option>)}
              </select> : <input style={styles.input} value={availableDestination} readOnly />}
              <span style={styles.helper}>{wallets.length ? 'Select one of your validated wallets.' : 'Bind a wallet in Manage before withdrawing.'}</span>
            </div>
            {method === 'scheduled' ? <div style={styles.field as React.CSSProperties}><span style={styles.label}>Schedule date and time</span><button type="button" style={styles.input as React.CSSProperties} onClick={() => setShowSchedulePage(true)}>{scheduledFor ? new Date(scheduledFor).toLocaleString() : 'Choose date and time'}</button></div> : null}
            <div style={styles.field as React.CSSProperties}>
              <span style={styles.label}>Security code</span>
              <input style={{ ...styles.input, opacity: securityCodeSet ? 1 : 0.65, cursor: securityCodeSet ? 'text' : 'not-allowed' }} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={securityCodeSet ? '6-digit security code' : 'Set security code to continue'} disabled={!securityCodeSet} />
            </div>
            <div style={styles.buttonRow}>
              <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleWithdraw()} disabled={withdrawing || !availableDestination || (wallets.length > 0 && !selectedWalletId) || !securityCodeSet || !securityCode}>
                {withdrawing ? <InlineLoadingDots /> : 'Submit withdrawal'}
              </button>
            </div>
            <p style={styles.sectionText}>Crypto balance: {loading ? <LoadingDots /> : `${balances.usdtBalance.toFixed(2)} USDT`}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}><ShieldCheck size={18} /> Security code</h2>
            <p style={styles.sectionText}>Use the Settings page to set or change your security code. Withdrawals only work after it has been set.</p>
            <p style={styles.sectionText}>If you have not set a security code yet, go to Settings and set one before submitting a withdrawal.</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}><TimerReset size={18} /> Withdrawal method guide</h2>
            <p style={styles.sectionText}>Instant withdrawals submit immediately. Scheduled withdrawals are queued for the date and time you choose, giving you more control over when the transfer is processed.</p>
          </section>
        </div>
        <NowBar />
      </div>
      </div>
    </HybridTheme>
  );
};

export default WithdrawPage;
