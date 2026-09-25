import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';

type PickerName = 'deposit' | 'withdraw' | 'loss';
type PoolAction = 'deposit' | 'withdraw';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '16px' },
  back: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'max-content', maxWidth: '100%', boxSizing: 'border-box' as const, gap: '6px', marginBottom: '2px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { ...createHybridCardStyles(theme).card, display: 'grid', gap: '14px', padding: '14px' },
  inner: { display: 'grid', gap: '12px', padding: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', background: theme.surfaceMuted },
  sectionTitle: { margin: 0, fontSize: '1rem', fontWeight: 900 },
  sectionText: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.5 },
  balance: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '12px 13px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', background: theme.surfaceGlass },
  balanceLabel: { margin: 0, color: theme.textMuted, fontSize: '0.76rem' },
  balanceValue: { margin: 0, fontSize: '1.05rem', fontWeight: 900, textAlign: 'right' as const },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' },
  field: { display: 'grid', gap: '7px', position: 'relative' as const },
  label: { color: theme.textMuted, fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' as const },
  input: { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '11px 12px', background: theme.surfaceGlass, color: theme.text, fontSize: '0.9rem', outline: 'none' },
  picker: { position: 'relative' as const },
  trigger: { width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '11px 12px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', textAlign: 'left' as const },
  menu: { position: 'absolute' as const, zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', background: theme.surfaceElevated, boxShadow: `0 16px 36px ${theme.borderGlass}` },
  option: { width: '100%', border: `1px solid ${theme.borderGlass}`, borderRadius: '11px', padding: '10px 12px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', textAlign: 'left' as const },
  button: { width: '100%', border: `1px solid ${theme.primary}`, borderRadius: '12px', padding: '11px 14px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 800 },
  secondaryButton: { width: '100%', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '11px 14px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontWeight: 800 },
  settingRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '12px 13px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', background: theme.surfaceGlass },
  settingText: { minWidth: 0 },
  settingLabel: { margin: 0, fontSize: '0.82rem', fontWeight: 800 },
  settingNote: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.7rem', lineHeight: 1.4 },
  checkbox: { width: '19px', height: '19px', accentColor: theme.primary, flexShrink: 0 },
  notice: { display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0, color: theme.textMuted, fontSize: '0.74rem', lineHeight: 1.5 },
});

const ControlCenterPage = () => {
  const { themeMode } = useAppTheme();
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);
  const [action, setAction] = useState<PoolAction>('deposit');
  const [openPicker, setOpenPicker] = useState<PickerName | null>(null);
  const [depositSource, setDepositSource] = useState('Main USDT balance');
  const [withdrawDestination, setWithdrawDestination] = useState('Main USDT balance');
  const [lossPercentage, setLossPercentage] = useState('10%');
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [poolBalance, setPoolBalance] = useState<number | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  React.useEffect(() => {
    let active = true;
    api.get<{ poolBalance: number; usdtBalance: number }>('/api/pool/balance')
      .then(({ data }) => { if (active) { setPoolBalance(data.poolBalance); setUsdtBalance(data.usdtBalance); } })
      .catch(() => { if (active) setPoolBalance(null); });
    return () => { active = false; };
  }, []);

  const handleTransfer = async () => {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 1) {
      setTransferMessage('Enter at least 1.00 USDT.');
      return;
    }

    setIsTransferring(true);
    setTransferMessage('');
    try {
      const endpoint = action === 'deposit' ? '/api/pool/deposit' : '/api/pool/withdraw';
      const { data } = await api.post<{ poolBalance: number; usdtBalance: number }>(endpoint, { amount: normalizedAmount });
      setPoolBalance(data.poolBalance);
      setUsdtBalance(data.usdtBalance);
      setAmount('');
      setTransferMessage(action === 'deposit' ? 'USDT deposited into KingsPool.' : 'USDT withdrawn to your main balance.');
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setTransferMessage(message || 'Unable to complete this transfer.');
    } finally {
      setIsTransferring(false);
    }
  };

  const renderPicker = (name: PickerName, value: string, options: string[], setValue: (next: string) => void) => (
    <div style={styles.picker}>
      <button type="button" style={styles.trigger} aria-expanded={openPicker === name} onClick={() => setOpenPicker(openPicker === name ? null : name)}>
        <span>{value}</span><ChevronDown size={16} />
      </button>
      {openPicker === name ? <div style={styles.menu}>{options.map((option) => <button type="button" key={option} style={styles.option} onClick={() => { setValue(option); setOpenPicker(null); }}>{option}</button>)}</div> : null}
    </div>
  );

  return <HybridTheme><Helmet><title>Control Center | KingsHall</title></Helmet><div style={styles.page}><main style={styles.shell}><div style={styles.content}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>

    <section style={styles.card}>
      <div style={styles.inner}>
        <h1 style={styles.sectionTitle}>Pool control center</h1>
        <p style={styles.sectionText}>Move funds between your main USDT balance and KingsPool, and configure how your investment should be protected.</p>
        <div style={styles.balance}><div><p style={styles.balanceLabel}>Your KingsPool balance</p><p style={styles.sectionText}>Current invested pool value</p></div><p style={styles.balanceValue}>{poolBalance === null ? <LoadingDots /> : `${poolBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}</p></div>
        <div style={styles.balance}><div><p style={styles.balanceLabel}>Main USDT balance</p><p style={styles.sectionText}>Available for pool deposits</p></div><p style={styles.balanceValue}>{usdtBalance === null ? <LoadingDots /> : `${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}</p></div>
      </div>
    </section>

    <section style={styles.card}>
      <div style={styles.inner}>
        <h2 style={styles.sectionTitle}>Pool funds</h2>
        <p style={styles.sectionText}>Deposit from your main balance or withdraw your available pool funds back to your main balance.</p>
        <div style={styles.actionGrid}>
          <button type="button" style={action === 'deposit' ? styles.button : styles.secondaryButton} onClick={() => setAction('deposit')}>Deposit into pool</button>
          <button type="button" style={action === 'withdraw' ? styles.button : styles.secondaryButton} onClick={() => setAction('withdraw')}>Withdraw from pool</button>
        </div>
        {action === 'deposit' ? <div style={styles.field}><span style={styles.label}>Deposit source</span>{renderPicker('deposit', depositSource, ['Main USDT balance'], setDepositSource)}</div> : <div style={styles.field}><span style={styles.label}>Withdrawal destination</span>{renderPicker('withdraw', withdrawDestination, ['Main USDT balance'], setWithdrawDestination)}</div>}
        <div style={styles.field}><label style={styles.label} htmlFor="pool-amount">Amount</label><input id="pool-amount" type="number" min="0" step="0.01" placeholder="0.00 USDT" value={amount} onChange={(event) => setAmount(event.target.value)} style={styles.input} /></div>
        <button type="button" style={{ ...styles.button, opacity: isTransferring ? 0.65 : 1 }} disabled={isTransferring} onClick={() => { void handleTransfer(); }}>{isTransferring ? <><InlineLoadingDots /> Processing…</> : action === 'deposit' ? 'Deposit into pool' : 'Withdraw to main balance'}</button>
        {transferMessage ? <p style={styles.sectionText}>{transferMessage}</p> : null}
      </div>
    </section>

    <section style={{ ...styles.card, position: 'relative', zIndex: 2 }}>
      <div style={styles.inner}>
        <h2 style={styles.sectionTitle}>Risk controls</h2>
        <p style={styles.sectionText}>Set a loss threshold and decide whether your pool funds should automatically return to your main USDT balance.</p>
        <div style={styles.field}><span style={styles.label}>Stop-loss percentage</span>{renderPicker('loss', lossPercentage, ['5%', '10%', '15%', '20%', '25%'], setLossPercentage)}</div>
        <div style={styles.settingRow}><div style={styles.settingText}><p style={styles.settingLabel}>Enable auto-withdraw</p><p style={styles.settingNote}>Automatically move your available pool funds to your main USDT balance if the selected loss level is reached.</p></div><input type="checkbox" aria-label="Enable auto-withdraw" checked={autoWithdraw} onChange={(event) => setAutoWithdraw(event.target.checked)} style={styles.checkbox} /></div>
      </div>
    </section>

    <section style={styles.card}><div style={styles.inner}><p style={styles.notice}><Info size={16} /><span>Pool deposits and withdrawals may be subject to availability, processing rules, and investment risk. Review the amount before confirming.</span></p></div></section>
  </div></main><NowBar /></div></HybridTheme>;
};

export default ControlCenterPage;
