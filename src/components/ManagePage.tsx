import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, WalletCards } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import InlineLoadingDots from './InlineLoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { navigate } from '../utils/navigate';

type WalletNetwork = 'TRC-20' | 'BEP-20' | 'TRX';
type Wallet = { id?: string; network: WalletNetwork; address: string; description?: string };
type MeResponse = { user?: { wallets?: Wallet[]; walletAddress?: string } };
type Status = { kind: 'idle' | 'success' | 'error'; message: string };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  card: { maxWidth: '720px', margin: '12px auto 0', padding: '18px', borderRadius: '18px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [network, setNetwork] = useState<WalletNetwork>('TRC-20');
  const [walletAddress, setWalletAddress] = useState('');
  const [description, setDescription] = useState('');
  const [walletValid, setWalletValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/settings/me');
        setWallets(data.user?.wallets ?? []);
      } catch {
        navigate('/signin');
      }
    };
    void loadWallet();
  }, []);

  const handleSave = async () => {
    const address = walletAddress.trim();
    if (!walletValid) {
      setStatus({ kind: 'error', message: `Enter a valid ${network} wallet address before saving.` });
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/api/settings/wallets', { network, address, description });
      setWallets(data.wallets || []);
      setWalletAddress('');
      setDescription('');
      setWalletValid(false);
      setStatus({ kind: 'success', message: 'Wallet saved successfully.' });
    } catch (error: any) {
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
          <button type="button" style={styles.back} onClick={() => navigate('/asset')}><ArrowLeft size={17} /> Assets</button>
          <section style={styles.card}>
            <h1 style={{ ...styles.title, display: 'flex', alignItems: 'center', gap: '10px' }}><WalletCards size={22} /> Manage wallet</h1>
            <p style={styles.text}>Bind up to 10 validated TRC-20, BEP-20, or TRX wallets for secure withdrawals.</p>
            {status.kind !== 'idle' ? <div style={{ marginTop: '16px' }}><NotificationBanner tone={status.kind === 'success' ? 'success' : 'error'} title={status.kind === 'success' ? 'Wallet updated' : 'Check your details'} message={status.message} /></div> : null}
            <div style={styles.form}>
              <label style={styles.label}>
                <span>Wallet network</span>
                <select style={styles.input} value={network} onChange={(event) => { setNetwork(event.target.value as WalletNetwork); setWalletValid(false); }}>
                  <option value="TRC-20">TRC-20</option><option value="BEP-20">BEP-20</option><option value="TRX">TRX</option>
                </select>
              </label>
              <label style={styles.label}>
                <span>Wallet address</span>
                <input style={styles.input} value={walletAddress} onChange={(event) => { const value = event.target.value.trim(); setWalletAddress(value); setWalletValid(network === 'BEP-20' ? /^0x[a-fA-F0-9]{40}$/.test(value) : /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)); }} placeholder={network === 'BEP-20' ? '0x…' : 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                <span style={styles.helper}>{walletValid ? `${network} wallet format looks valid.` : `Enter a valid ${network} address.`}</span>
              </label>
              <label style={styles.label}><span>Description (optional)</span><input style={styles.input} value={description} onChange={(event) => setDescription(event.target.value.slice(0, 100))} placeholder="e.g. Main trading wallet" /></label>
              <button style={styles.button} type="button" onClick={() => void handleSave()} disabled={saving || !walletValid || wallets.length >= 10}>{saving ? <InlineLoadingDots /> : wallets.length >= 10 ? 'Wallet limit reached' : 'Save wallet'}</button>
            </div>
            {wallets.length ? <div style={{ ...styles.form, marginTop: '22px' }}><strong>Bound wallets ({wallets.length}/10)</strong>{wallets.map((wallet) => <div key={wallet.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}><span><b>{wallet.description || wallet.network}</b><br /><small>{wallet.network} · {wallet.address}</small></span><button type="button" style={styles.button} onClick={() => void (async () => { try { const { data } = await api.delete(`/api/settings/wallets/${wallet.id}`); setWallets(data.wallets || []); } catch (error: any) { setStatus({ kind: 'error', message: getFriendlyErrorMessage(error, 'Unable to remove wallet.') }); } })()}>Remove</button></div>)}</div> : null}
          </section>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ManagePage;
