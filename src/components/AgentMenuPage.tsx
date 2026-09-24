import { useEffect, useState } from 'react';
import { ArrowLeft, Coins, Save, Wallet } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NotificationBanner from './NotificationBanner';

type Dashboard = { agent: { code: string | null; link: string | null; availableEarnings: number }; stats: { totalEarned: number } };
type Status = { kind: 'idle' | 'success' | 'error'; message: string };

const AgentMenuPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<Dashboard>({ agent: { code: '', link: '', availableEarnings: 0 }, stats: { totalEarned: 0 } });
  const [code, setCode] = useState('');
  const [codeAvailability, setCodeAvailability] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get<Dashboard>('/api/referrals/dashboard');
      setData(response.data);
      setCode(response.data.agent.code || '');
      setStatus({ kind: 'idle', message: '' });
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.response?.data?.message || 'Unable to load agent settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    const nextCode = code.trim();
    if (!/^\d{6}$/.test(nextCode) || nextCode === data.agent.code) {
      setCodeAvailability(nextCode === data.agent.code ? 'available' : 'idle');
      return;
    }

    setCodeAvailability('checking');
    const timer = window.setTimeout(() => {
      void api.get<{ available: boolean }>('/api/referrals/settings/availability', { params: { code: nextCode } })
        .then((response) => setCodeAvailability(response.data.available ? 'available' : 'unavailable'))
        .catch(() => setCodeAvailability('idle'));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [code, data.agent.code]);

  const saveCode = async () => {
    const nextCode = code.trim();
    if (!/^\d{6}$/.test(nextCode)) {
      setStatus({ kind: 'error', message: 'Referral code must be exactly 6 digits.' });
      return;
    }
    if (codeAvailability !== 'available') {
      setStatus({ kind: 'error', message: codeAvailability === 'checking' ? 'Checking referral code availability.' : 'That referral code is already in use.' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch<{ code: string; link: string }>('/api/referrals/settings', { code: nextCode });
      setCode(response.data.code);
      setData((current) => current ? { ...current, agent: { ...current.agent, code: response.data.code, link: response.data.link } } : current);
      setStatus({ kind: 'success', message: 'Referral code and link updated successfully.' });
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.response?.data?.message || 'Unable to update referral code.' });
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setStatus({ kind: 'error', message: 'Enter a valid withdrawal amount.' });
      return;
    }
    if (requestedAmount > (data?.agent.availableEarnings || 0)) {
      setStatus({ kind: 'error', message: 'The withdrawal amount is higher than your available earnings.' });
      return;
    }
    setWithdrawing(true);
    try {
      const response = await api.post<{ amount: number; availableEarnings: number }>('/api/referrals/earnings/withdraw', { amount: requestedAmount });
      setData((current) => current ? { ...current, agent: { ...current.agent, availableEarnings: response.data.availableEarnings } } : current);
      setAmount('');
      setStatus({ kind: 'success', message: `${response.data.amount.toFixed(2)} USDT transferred to your main balance.` });
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.response?.data?.message || 'Unable to withdraw your earnings.' });
    } finally {
      setWithdrawing(false);
    }
  };

  return <HybridTheme mode={themeMode}><div style={styles.page(theme)}><main style={styles.shell}>
    <button type="button" style={styles.back(theme)} onClick={() => navigate('/agent')}><ArrowLeft size={16} /> Agent</button>
    {status.kind !== 'idle' ? <NotificationBanner tone={status.kind === 'success' ? 'success' : 'error'} title={status.kind === 'success' ? 'Success' : 'Action failed'} message={status.message} /> : null}
    <div style={styles.content}>
      <div style={styles.rowList(theme)}><section style={styles.card(theme)}><h2 style={styles.cardTitle}><Save size={18} /> Referral settings</h2><p style={styles.text(theme)}>Choose a memorable six-digit code. Your referral link updates automatically.</p><label style={styles.label(theme)}>Referral code<input style={styles.input(theme)} value={code} inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>{codeAvailability === 'checking' ? <p style={styles.validation(theme)}>Checking availability...</p> : codeAvailability === 'available' && code !== data.agent.code ? <p style={{ ...styles.validation(theme), color: '#34d399' }}>Referral code is available.</p> : codeAvailability === 'unavailable' ? <p style={{ ...styles.validation(theme), color: '#f87171' }}>Referral code is already in use.</p> : null}{loading ? <LoadingDots /> : <p style={styles.link(theme)}>{data.agent.link || 'Your referral link will appear here.'}</p>}<button type="button" style={styles.primary(theme)} disabled={saving || loading || codeAvailability === 'checking' || codeAvailability === 'unavailable'} onClick={() => void saveCode()}>{saving ? <InlineLoadingDots /> : <><Save size={16} /> Save referral code</>}</button></section>
      <section style={styles.card(theme)}><h2 style={styles.cardTitle}><Wallet size={18} /> Withdraw earnings</h2><div style={styles.balance(theme)}><span>Available earnings</span>{loading ? <LoadingDots /> : <strong>{data.agent.availableEarnings.toFixed(2)} USDT</strong>}</div><p style={styles.text(theme)}>Withdraw all or part of your earned referral commissions into your main USDT balance.</p><label style={styles.label(theme)}>Amount (USDT)<input style={styles.input(theme)} value={amount} type="number" min="0.01" max={data.agent.availableEarnings} step="0.01" inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label><button type="button" style={styles.primary(theme)} disabled={withdrawing || loading || data.agent.availableEarnings <= 0} onClick={() => void withdraw()}>{withdrawing ? <InlineLoadingDots /> : <><Coins size={16} /> Withdraw to main balance</>}</button><button type="button" style={styles.secondary(theme)} disabled={data.agent.availableEarnings <= 0} onClick={() => setAmount(data.agent.availableEarnings.toFixed(2))}>Use available balance</button></section>
      </div>
    </div>
    </main></div></HybridTheme>;
};

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '8px 12px', background: theme.surfaceGlass, color: theme.text, fontSize: '0.86rem', cursor: 'pointer', fontWeight: 700 }),
  text: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, maxWidth: '62ch', color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }),
  content: { display: 'grid', gap: 14, marginTop: 18 },
  rowList: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, width: '100%', padding: 18, borderRadius: 22, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const }),
  card: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }),
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1rem', fontWeight: 800 },
  label: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 7, color: theme.textMuted, fontSize: '0.85rem', fontWeight: 700 }),
  input: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '11px 12px', fontSize: '1rem', outline: 'none' }),
  link: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, color: theme.textMuted, wordBreak: 'break-all' as const, fontSize: '0.86rem' }),
  validation: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, color: theme.textMuted, fontSize: '0.82rem' }),
  balance: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 14, background: theme.surfaceMuted, color: theme.textMuted }),
  primary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, border: `1px solid ${theme.primary}`, borderRadius: 999, background: theme.primary, color: theme.textInverse, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  secondary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, padding: '9px 14px', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, background: theme.surfaceMuted, color: theme.text, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  shortcuts: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  notice: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', alignItems: 'center', gap: 7, marginTop: 18, padding: 12, borderRadius: 12, background: theme.surfaceMuted, fontSize: '0.86rem', lineHeight: 1.6 }),
  loading: { display: 'flex', justifyContent: 'center', padding: 36 },
};

export default AgentMenuPage;
