import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarClock, ChevronLeft, ChevronRight, Coins, Landmark, ShieldCheck, TimerReset } from 'lucide-react';
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
  customPickerButton: { borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '12px 14px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' },
  customPickerDisplay: { borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,12,24,0.96)', padding: '14px', color: '#eef4ff', fontSize: '0.92rem', lineHeight: 1.5, display: 'grid', gap: '12px' },
  customPickerHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  customPickerNavButton: { width: '40px', height: '40px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  customPickerMonthLabel: { color: '#fff', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em' },
  customPickerWeekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' },
  customPickerWeekday: { textAlign: 'center' as const, color: 'rgba(255,255,255,0.56)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
  customPickerCalendar: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' },
  customPickerDay: { borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: '42px', cursor: 'pointer', fontWeight: 700 },
  customPickerDaySelected: { border: '1px solid rgba(103,232,249,0.65)', background: 'rgba(103,232,249,0.16)', color: '#cffafe' },
  customPickerDayToday: { boxShadow: 'inset 0 0 0 1px rgba(196,181,253,0.6)' },
  customPickerDayDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  customPickerSpacer: { minHeight: '42px' },
  customPickerHint: { fontSize: '0.82rem', color: '#95a8ca', lineHeight: 1.5, margin: 0 },
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
  const [scheduledMonth, setScheduledMonth] = useState(() => new Date());
  const [scheduledHour, setScheduledHour] = useState(() => '09');
  const [scheduledMinute, setScheduledMinute] = useState(() => '00');
  const scheduledPickerRef = useRef<HTMLDivElement | null>(null);
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

  const moveScheduledMonth = (delta: number) => {
    setScheduledMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const updateScheduledFor = (date: Date, hour = scheduledHour, minute = scheduledMinute) => {
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(hour), Number(minute));
    const padded = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}T${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
    setScheduledFor(padded);
  };

  const selectScheduledDate = (date: Date) => {
    updateScheduledFor(date);
  };

  const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
  const minuteOptions = ['00', '15', '30', '45'];

  const selectScheduledHour = (hour: string) => {
    setScheduledHour(hour);
    const currentDate = scheduledFor ? new Date(scheduledFor) : new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth(), 1);
    updateScheduledFor(currentDate, hour, scheduledMinute);
  };

  const selectScheduledMinute = (minute: string) => {
    setScheduledMinute(minute);
    const currentDate = scheduledFor ? new Date(scheduledFor) : new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth(), 1);
    updateScheduledFor(currentDate, scheduledHour, minute);
  };

  const scheduledCalendarDays = useMemo(() => {
    const start = new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth(), 1);
    const end = new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth() + 1, 0);
    const firstDayIndex = start.getDay();
    const days: Array<{ date: Date | null; key: string; label: string; disabled: boolean; isSelected: boolean; isToday: boolean }> = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
      days.push({ date: null, key: `blank-${i}`, label: '', disabled: true, isSelected: false, isToday: false });
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      const date = new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth(), day);
      const isoDate = date.toISOString().slice(0, 10);
      const today = new Date();
      const selected = scheduledFor.startsWith(isoDate);
      const disabled = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({
        date,
        key: isoDate,
        label: String(day),
        disabled,
        isSelected: selected,
        isToday: today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate(),
      });
    }

    return days;
  }, [scheduledMonth, scheduledFor]);

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
                    <div style={styles.customPickerPanel}>
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
                    <div style={styles.customPickerPanel}>
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
                {method === 'scheduled' ? (
                  <div style={styles.field as React.CSSProperties} ref={scheduledPickerRef}>
                    <span style={styles.label}>Schedule date and time</span>
                    <button type="button" style={styles.customPickerButton} onClick={() => setScheduledFor((current) => current)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <CalendarClock size={18} />
                        <span>{scheduledFor ? scheduledFor.replace('T', ' · ') : 'Pick schedule date and time'}</span>
                      </span>
                      <span aria-hidden="true">▾</span>
                    </button>
                    <div style={styles.customPickerDisplay}>
                      <div style={styles.customPickerHeader}>
                        <button type="button" style={styles.customPickerNavButton} onClick={() => moveScheduledMonth(-1)} aria-label="Previous month">
                          <ChevronLeft size={18} />
                        </button>
                        <strong style={styles.customPickerMonthLabel}>{scheduledMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
                        <button type="button" style={styles.customPickerNavButton} onClick={() => moveScheduledMonth(1)} aria-label="Next month">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                      <div style={styles.customPickerWeekdays}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                          <span key={day} style={styles.customPickerWeekday}>{day}</span>
                        ))}
                      </div>
                      <div style={styles.customPickerCalendar}>
                        {scheduledCalendarDays.map((day) => day.date ? (
                          <button
                            key={day.key}
                            type="button"
                            disabled={day.disabled}
                            aria-pressed={day.isSelected}
                            style={{
                              ...styles.customPickerDay,
                              ...(day.isSelected ? styles.customPickerDaySelected : null),
                              ...(day.isToday ? styles.customPickerDayToday : null),
                              ...(day.disabled ? styles.customPickerDayDisabled : null),
                            }}
                            onClick={() => selectScheduledDate(day.date as Date)}
                          >
                            {day.label}
                          </button>
                        ) : (
                          <span key={day.key} style={styles.customPickerSpacer} />
                        ))}
                      </div>
                      <div style={styles.field as React.CSSProperties}>
                        <span style={styles.label}>Hour</span>
                        <div style={styles.summaryRow}>
                          {hourOptions.map((hour) => (
                            <button
                              key={hour}
                              type="button"
                              style={{
                                ...styles.button,
                                ...(scheduledHour === hour ? styles.customPickerDaySelected : null),
                              }}
                              onClick={() => selectScheduledHour(hour)}
                              aria-pressed={scheduledHour === hour}
                            >
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={styles.field as React.CSSProperties}>
                        <span style={styles.label}>Minute</span>
                        <div style={styles.summaryRow}>
                          {minuteOptions.map((minute) => (
                            <button
                              key={minute}
                              type="button"
                              style={{
                                ...styles.button,
                                ...(scheduledMinute === minute ? styles.customPickerDaySelected : null),
                              }}
                              onClick={() => selectScheduledMinute(minute)}
                              aria-pressed={scheduledMinute === minute}
                            >
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p style={styles.customPickerHint}>Pick a date from the grid and then choose the hour and minute in-app. Native date/time controls are disabled.</p>
                    </div>
                  </div>
                ) : null}
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
