import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { WalletCards } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import InlineLoadingDots from './InlineLoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { navigate } from '../utils/navigate';

const trc20WalletPattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

type MeResponse = { user?: { walletAddress?: string } };
type Status = { kind: 'idle' | 'success' | 'error'; message: string };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '132px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  card: { maxWidth: '720px', margin: '18px auto 0', padding: '22px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 900 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  form: { display: 'grid', gap: '12px', marginTop: '18px' },
  label: { display: 'grid', gap: '8px', fontWeight: 700 },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '13px 14px', outline: 'none' },
  helper: { color: theme.textMuted, fontSize: '0.85rem', fontWeight: 400 },
  button: { borderRadius: '999px', border: `1px solid ${theme.primary}`, padding: '11px 16px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', justifySelf: 'start' },
});

const ManagePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletValid, setWalletValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/auth/me');
        const address = data.user?.walletAddress ?? '';
        setWalletAddress(address);
        setWalletValid(trc20WalletPattern.test(address));
      } catch {
        navigate('/signin');
      }
    };
    void loadWallet();
  }, []);

  const handleSave = async () => {
    const address = walletAddress.trim();
    if (!trc20WalletPattern.test(address)) {
      setWalletValid(false);
      setStatus({ kind: 'error', message: 'Enter a valid TRC-20 wallet address before saving.' });
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/settings/wallet', { walletAddress: address });
      setWalletAddress(address);
      setWalletValid(true);
      setStatus({ kind: 'success', message: 'Wallet address saved successfully.' });
    } catch (error: any) {
      setWalletValid(false);
      setStatus({ kind: 'error', message: getFriendlyErrorMessage(error, 'Unable to save your wallet address. Please try again.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <Helmet><title>Manage | KingsHall Exchange</title></Helmet>
        <div style={styles.shell}>
          <section style={styles.card}>
            <h1 style={{ ...styles.title, display: 'flex', alignItems: 'center', gap: '10px' }}><WalletCards size={22} /> Manage wallet</h1>
            <p style={styles.text}>Bind your TRC-20 wallet address so withdrawals can be added securely to your account.</p>
            {status.kind !== 'idle' ? <div style={{ marginTop: '16px' }}><NotificationBanner tone={status.kind === 'success' ? 'success' : 'error'} title={status.kind === 'success' ? 'Wallet updated' : 'Check your details'} message={status.message} /></div> : null}
            <div style={styles.form}>
              <label style={styles.label}>
                <span>TRC-20 wallet address</span>
                <input style={styles.input} value={walletAddress} onChange={(event) => { const value = event.target.value.trim(); setWalletAddress(value); setWalletValid(trc20WalletPattern.test(value)); }} placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                <span style={styles.helper}>{walletValid ? 'TRC-20 wallet format looks valid.' : 'Enter a valid TRC-20 address starting with T.'}</span>
              </label>
              <button style={styles.button} type="button" onClick={() => void handleSave()} disabled={saving || !walletValid}>{saving ? <InlineLoadingDots /> : 'Save wallet'}</button>
            </div>
          </section>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ManagePage;
