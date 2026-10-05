import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, WalletCards } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import InlineLoadingDots from './InlineLoadingDots';
import NotificationBanner from './NotificationBanner';
import ReusableDatePage from './ReusableDatePage';
import NowBar from './NowBar';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { navigate } from '../utils/navigate';

type WalletNetwork = 'TRC-20' | 'BEP-20' | 'TRX';
type Wallet = { id?: string; network: WalletNetwork; address: string; description?: string };
type MeResponse = { user?: { wallets?: Wallet[]; walletAddress?: string } };
type BlockSecurityResponse = { enabled: boolean; startsAt: string | null; endsAt: string | null; active: boolean };
type BlockPicker = 'startsAt' | 'endsAt' | null;
type Status = { kind: 'idle' | 'success' | 'error'; message: string };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  card: { width: '100%', boxSizing: 'border-box' as const, margin: '22px auto 0', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, display: 'grid', gap: '10px' },
  innerCard: { width: '100%', boxSizing: 'border-box' as const, padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, display: 'grid', gap: '10px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: 0, fontSize: '1.08rem', fontWeight: 800 },
  text: { margin: '10px 0 0', color: theme.textMuted, lineHeight: 1.55, fontSize: '0.95rem' },
  form: { display: 'grid', gap: '10px', marginTop: 0 },
  label: { display: 'grid', gap: '6px', color: theme.textMuted, fontSize: '0.88rem', fontWeight: 600 },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', fontSize: '0.9rem', outline: 'none' },
  selectTrigger: { width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', borderRadius: '14px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '11px 12px', fontSize: '0.95rem', cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}` },
  selectOption: { width: '100%', borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.highlightSoft, color: theme.text, padding: '10px 12px', textAlign: 'left' as const, cursor: 'pointer' },
  helper: { color: theme.textMuted, fontSize: '0.85rem', fontWeight: 400 },
  button: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '10px 14px', background: theme.surfaceGlass, color: theme.text, fontWeight: 700, cursor: 'pointer', justifySelf: 'start', fontSize: '0.92rem' },
  primaryButton: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}`, width: '100%', maxWidth: '100%' },
  walletTable: { width: '100%', maxHeight: '280px', overflow: 'auto' as const, marginTop: '10px', border: `1px solid ${theme.border}`, borderRadius: '14px' },
  walletTableInner: { width: '100%', minWidth: '680px', borderCollapse: 'collapse' as const },
  walletTableCell: { padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, textAlign: 'left' as const, fontSize: '0.82rem', whiteSpace: 'nowrap' as const, verticalAlign: 'middle' as const },
  walletTableHeader: { padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, textAlign: 'left' as const, color: theme.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const },
  walletActionButton: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' },

});

const ManagePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [network, setNetwork] = useState<WalletNetwork>('TRC-20');
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [description, setDescription] = useState('');
  const [walletValid, setWalletValid] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });
  const [blockSettings, setBlockSettings] = useState<BlockSecurityResponse>({ enabled: false, startsAt: null, endsAt: null, active: false });
  const [blockPicker, setBlockPicker] = useState<BlockPicker>(null);
  const [blockSaving, setBlockSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [{ data: walletData }, { data: blockData }] = await Promise.all([
          api.get<MeResponse>('/api/settings/me'),
          api.get<BlockSecurityResponse>('/api/settings/withdrawal-transfer-security'),
        ]);
        setWallets(walletData.user?.wallets ?? []);
        setBlockSettings(blockData);
      } catch {
        navigate('/signin');
      }
    };
    void loadSettings();
  }, []);

  const saveBlockSettings = async (nextSettings: BlockSecurityResponse) => {
    setBlockSaving(true);
    try {
      const { data } = await api.patch<BlockSecurityResponse>('/api/settings/withdrawal-transfer-security', nextSettings.enabled ? { enabled: true, startsAt: nextSettings.startsAt, endsAt: nextSettings.endsAt } : { enabled: false });
      setBlockSettings(data);
      setStatus({ kind: 'success', message: data.enabled ? 'Withdrawals and transfers are blocked for the selected period.' : 'Withdrawal and transfer blocking disabled.' });
    } catch (error: any) {
      setStatus({ kind: 'error', message: getFriendlyErrorMessage(error, 'Unable to update withdrawal and transfer blocking.') });
    } finally {
      setBlockSaving(false);
    }
  };

  const resetWalletForm = () => {
    setWalletAddress('');
    setDescription('');
    setWalletValid(false);
    setEditingWalletId(null);
  };

  const handleSave = async () => {
    const address = walletAddress.trim();
    const normalizedSecurityCode = securityCode.replace(/\D/g, '').slice(0, 6);
    if (!walletValid) {
      setStatus({ kind: 'error', message: `Enter a valid ${network} wallet address before saving.` });
      return;
    }
    if (normalizedSecurityCode.length !== 6) {
      setStatus({ kind: 'error', message: 'Enter your 6-digit security code to continue.' });
      return;
    }

    setSaving(true);
    try {
      const request = { network, address, description, securityCode: normalizedSecurityCode };
      const { data } = editingWalletId
        ? await api.patch(`/api/settings/wallets/${editingWalletId}`, request)
        : await api.post('/api/settings/wallets', request);
      const wasEditing = Boolean(editingWalletId);
      setWallets(data.wallets || []);
      resetWalletForm();
      setStatus({ kind: 'success', message: wasEditing ? 'Wallet updated successfully.' : 'Wallet saved successfully.' });
    } catch (error: any) {
      setStatus({ kind: 'error', message: getFriendlyErrorMessage(error, 'Unable to save your wallet address. Please try again.') });
    } finally {
      setSaving(false);
    }
  };

  if (blockPicker) {
    const currentValue = blockSettings[blockPicker];
    const isStartPicker = blockPicker === 'startsAt';
    return <ReusableDatePage
      title={isStartPicker ? 'Block start date and time' : 'Block end date and time'}
      description={isStartPicker ? 'Choose when withdrawals and transfers should be blocked.' : 'Choose when the withdrawal and transfer block should end.'}
      value={currentValue || ''}
      mode="datetime-local"
      min={isStartPicker ? new Date().toISOString().slice(0, 16) : blockSettings.startsAt || new Date().toISOString().slice(0, 16)}
      confirmLabel={isStartPicker ? 'Set start time' : 'Set end time'}
      cancelLabel="Back"
      showNowBar={false}
      onConfirm={(value) => {
        setBlockSettings((current) => ({ ...current, [blockPicker]: value }));
        setBlockPicker(null);
      }}
      onCancel={() => setBlockPicker(null)}
    />;
  }

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <Helmet><title>Manage | KingsHall Exchange</title></Helmet>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/asset')}><ArrowLeft size={17} /> Assets</button>
          <section style={styles.card}>
            <h2 style={{ ...styles.title, display: 'flex', alignItems: 'center', gap: '10px' }}><WalletCards size={22} /> Manage wallet</h2>
            <p style={styles.text}>Bind up to 10 validated TRC-20, BEP-20, or TRX wallets for secure withdrawals.</p>
            {status.kind !== 'idle' ? <div style={{ marginTop: '16px' }}><NotificationBanner tone={status.kind === 'success' ? 'success' : 'error'} title={status.kind === 'success' ? 'Wallet updated' : 'Check your details'} message={status.message} /></div> : null}
            <div style={styles.innerCard}>
              <div style={styles.form}>
                <div style={{ ...styles.label, position: 'relative' as const }}>
                <span>Wallet network</span>
                <button type="button" style={styles.selectTrigger} onClick={() => setIsNetworkMenuOpen((current) => !current)} aria-expanded={isNetworkMenuOpen}>
                  <span>{network}</span>
                  <span>▾</span>
                </button>
                {isNetworkMenuOpen ? (
                  <div style={styles.selectMenu}>
                    {(['TRC-20', 'BEP-20', 'TRX'] as WalletNetwork[]).map((option) => (
                      <button key={option} type="button" style={styles.selectOption} onClick={() => { setNetwork(option); setWalletValid(false); setIsNetworkMenuOpen(false); }}>
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <label style={styles.label}>
                <span>Wallet address</span>
                <input style={styles.input} value={walletAddress} onChange={(event) => { const value = event.target.value.trim(); setWalletAddress(value); setWalletValid(network === 'BEP-20' ? /^0x[a-fA-F0-9]{40}$/.test(value) : /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)); }} placeholder={network === 'BEP-20' ? '0x…' : 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                <span style={styles.helper}>{walletValid ? `${network} wallet format looks valid.` : `Enter a valid ${network} address.`}</span>
              </label>
              <label style={styles.label}><span>Description (optional)</span><input style={styles.input} value={description} onChange={(event) => setDescription(event.target.value.slice(0, 100))} placeholder="e.g. Main trading wallet" /></label>
              <label style={styles.label}><span>Security code</span><input style={styles.input} type="password" inputMode="numeric" maxLength={6} value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit security code" /><span style={styles.helper}>Required when binding or editing a wallet.</span></label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSave()} disabled={saving || !walletValid || (!editingWalletId && wallets.length >= 10)}>{saving ? <InlineLoadingDots /> : editingWalletId ? 'Update wallet' : wallets.length >= 10 ? 'Wallet limit reached' : 'Save wallet'}</button>
                  {editingWalletId ? <button style={{ ...styles.button, background: theme.surfaceMuted, borderColor: theme.borderGlass, color: theme.text }} type="button" onClick={resetWalletForm}>Cancel edit</button> : null}
                </div>
              </div>
            </div>
          </section>
          {wallets.length ? <section style={styles.card}>
            <div style={styles.innerCard}><strong>Bound wallets ({wallets.length}/10)</strong><div style={styles.walletTable}><table style={styles.walletTableInner}><thead><tr><th style={styles.walletTableHeader}>Wallet</th><th style={styles.walletTableHeader}>Network</th><th style={styles.walletTableHeader}>Address</th><th style={styles.walletTableHeader}>Actions</th></tr></thead><tbody>{wallets.map((wallet) => <tr key={wallet.id}><td style={styles.walletTableCell}>{wallet.description || 'Bound wallet'}</td><td style={styles.walletTableCell}>{wallet.network}</td><td style={styles.walletTableCell}>{wallet.address}</td><td style={styles.walletTableCell}><div style={{ display: 'flex', gap: '8px' }}><button type="button" style={styles.walletActionButton} onClick={() => { setEditingWalletId(wallet.id || null); setNetwork(wallet.network); setWalletAddress(wallet.address); setDescription(wallet.description || ''); setWalletValid(true); }}>Edit</button><button type="button" style={{ ...styles.walletActionButton, background: theme.surfaceMuted }} onClick={() => void (async () => { if (securityCode.replace(/\D/g, '').length !== 6) { setStatus({ kind: 'error', message: 'Enter your 6-digit security code before unbinding a wallet.' }); return; } try { const { data } = await api.delete(`/api/settings/wallets/${wallet.id}`, { data: { securityCode: securityCode.replace(/\D/g, '').slice(0, 6) } }); setWallets(data.wallets || []); if (editingWalletId === wallet.id) resetWalletForm(); setStatus({ kind: 'success', message: 'Wallet unbound successfully.' }); } catch (error: any) { setStatus({ kind: 'error', message: getFriendlyErrorMessage(error, 'Unable to remove wallet.') }); } })()}>Unbind</button></div></td></tr>)}</tbody></table></div></div>
          </section> : null}
          <section style={styles.card}>
            <div style={styles.innerCard}>
              <strong>Withdrawal and transfer block</strong>
              <p style={styles.text}>Temporarily prevent withdrawals and transfers during a selected date and time range.</p>
              <button type="button" style={styles.button} onClick={() => setBlockPicker('startsAt')}>Start: {blockSettings.startsAt ? new Date(blockSettings.startsAt).toLocaleString() : 'Choose date and time'}</button>
              <button type="button" style={styles.button} onClick={() => setBlockPicker('endsAt')}>End: {blockSettings.endsAt ? new Date(blockSettings.endsAt).toLocaleString() : 'Choose date and time'}</button>
              <button type="button" style={{ ...styles.button, ...styles.primaryButton }} disabled={blockSaving || (!blockSettings.enabled && (!blockSettings.startsAt || !blockSettings.endsAt))} onClick={() => void saveBlockSettings(blockSettings.enabled ? { enabled: false, startsAt: null, endsAt: null, active: false } : { ...blockSettings, enabled: true })}>{blockSaving ? <InlineLoadingDots /> : blockSettings.enabled ? 'Disable block' : 'Enable block'}</button>
            </div>
          </section>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ManagePage;
