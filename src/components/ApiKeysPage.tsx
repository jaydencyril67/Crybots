import React, { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Plus, ShieldCheck, Copy, Ban } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import ReusableDatePage from './ReusableDatePage';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type PermissionCategory = 'data' | 'trade' | 'funds';
type PermissionAction = 'read' | 'write';
type Permissions = Record<PermissionCategory, Record<PermissionAction, boolean>> & { withdrawals: boolean };
type ApiKey = { id: string; name: string; prefix: string; permissions: Permissions; expiresAt?: string; revokedAt?: string; createdAt: string };
const permissionCategories: { key: PermissionCategory; label: string; description: string }[] = [
  { key: 'data', label: 'Data', description: 'User details, account information, transactions and related data.' },
  { key: 'trade', label: 'Trade', description: 'Bot and trading-related activities.' },
  { key: 'funds', label: 'Funds', description: 'Financial activities such as withdrawals and transfers.' },
];
const emptyPermissions = (): Permissions => ({
  data: { read: false, write: false },
  trade: { read: false, write: false },
  funds: { read: false, write: false },
  withdrawals: false,
});

const ApiKeysPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Permissions>(() => ({ ...emptyPermissions(), data: { read: true, write: false } }));
  const [expiration, setExpiration] = useState('');
  const [secret, setSecret] = useState('');
  const [showExpirationPage, setShowExpirationPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [securityCode, setSecurityCode] = useState('');
  const [expandedKeyId, setExpandedKeyId] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  const loadKeys = async () => {
    try {
      const response = await api.get<{ keys: ApiKey[] }>('/api/developer/api-keys');
      setKeys(response.data.keys);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load API keys.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadKeys(); }, []);

  const createKey = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await api.post<{ secret: string }>('/api/developer/api-keys', { name, permissions, expiresAt: expiration || undefined });
      setSecret(response.data.secret); setName(''); setExpiration(''); setPermissions({ ...emptyPermissions(), data: { read: true, write: false } }); await loadKeys();
    } catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to create API key.'); }
    finally { setSaving(false); }
  };

  const revokeKey = async (id: string) => {
    setRevokingId(id);
    try { await api.post(`/api/developer/api-keys/${id}/revoke`); await loadKeys(); }
    catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to revoke API key.'); }
    finally { setRevokingId(null); }
  };

  const deleteKey = async (id: string) => {
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/api/developer/api-keys/${id}`, { data: { securityCode } });
      setKeys((current) => current.filter((key) => key.id !== id));
      setExpandedKeyId('');
      setDeleteId(null);
      setSecurityCode('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to delete API key.');
    } finally {
      setDeletingId(null);
    }
  };

  if (showExpirationPage) {
    return <ReusableDatePage title="API key expiration" description="Choose when this API key should expire." value={expiration} mode="date" confirmLabel="Set expiration date" cancelLabel="Back" showNowBar={false} min={new Date().toISOString().slice(0, 10)} onConfirm={(value) => { setExpiration(value); setShowExpirationPage(false); }} onCancel={() => setShowExpirationPage(false)} />;
  }

  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', overflowX: 'hidden' as const, background: theme.background, color: theme.text, paddingBottom: '90px' },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
    content: { display: 'grid', gap: '14px', marginTop: '14px' },
    back: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    card: { padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    row: { display: 'grid', gap: 10, width: '100%', padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, boxSizing: 'border-box' as const, minWidth: 0 },
    label: { margin: 0, color: theme.textMuted, fontSize: '0.74rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 7 },
    value: { margin: 0, color: theme.text, fontSize: '0.94rem', fontWeight: 800, lineHeight: 1.5, wordBreak: 'break-word' as const, overflowWrap: 'anywhere' as const },
    note: { margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 },
    input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem', font: 'inherit' },
    button: { border: 'none', borderRadius: 999, padding: '11px 16px', fontWeight: 700, cursor: 'pointer', width: '100%', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: theme.primary, color: theme.textInverse, fontSize: '0.88rem', font: 'inherit' },
    mutedButton: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text },
  };

  const permissionSummary = (permissions?: Permissions) => permissionCategories
    .filter((category) => permissions?.[category.key] && (permissions[category.key].read || permissions[category.key].write))
    .map((category) => `${category.label}: ${permissions![category.key].read ? 'Read' : ''}${permissions![category.key].read && permissions![category.key].write ? ' + ' : ''}${permissions![category.key].write ? 'Write' : ''}`)
    .join(' · ') || 'No permissions';

  return <HybridTheme mode={themeMode}>
    <main style={styles.page}>
      <div style={styles.shell}>
        <button type="button" onClick={() => navigate('/dev')} style={styles.back}><ArrowLeft size={17} /> Dev</button>
        <div style={styles.content}>
          {error && <NotificationBanner tone="error" title="API key action unavailable" message={error} />}
          {secret && <NotificationBanner tone="success" title="New API key created" message="Copy the secret now. It will not be shown again." />}

          <div style={styles.card}>
            <div style={styles.row}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={20} color={theme.primary} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.value}>API Keys</p>
                  <p style={styles.note}>Manage secure credentials for external applications.</p>
                </div>
                <span style={{ borderRadius: 999, padding: '5px 9px', fontSize: '0.7rem', fontWeight: 850, background: theme.surfaceGlass, color: theme.textMuted }}>{keys.filter((key) => !key.revokedAt).length} active</span>
              </div>
            </div>
            <div style={{ ...styles.row, marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div><p style={styles.label}>Active</p><p style={{ ...styles.value, marginTop: 5 }}>{keys.filter((key) => !key.revokedAt).length}</p></div>
                <div><p style={styles.label}>Revoked</p><p style={{ ...styles.value, marginTop: 5 }}>{keys.filter((key) => Boolean(key.revokedAt)).length}</p></div>
                <div><p style={styles.label}>Total</p><p style={{ ...styles.value, marginTop: 5 }}>{keys.length}</p></div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            {!showCreate ? (
              <button type="button" onClick={() => setShowCreate(true)} style={styles.button}><Plus size={16} /> Create API key</button>
            ) : (
              <form onSubmit={createKey} style={{ display: 'grid', gap: 10 }}>
                <div style={styles.row}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><ShieldCheck size={18} color={theme.primary} /><div><p style={styles.value}>New API key</p><p style={styles.note}>Give only the permissions this application needs.</p></div></div>
                </div>
                <div style={styles.row}><label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>Name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="My trading app" style={styles.input} /></label></div>
                <div style={styles.row}><label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>Expiration<button type="button" onClick={() => setShowExpirationPage(true)} style={{ ...styles.input, textAlign: 'left', cursor: 'pointer' }}>{expiration || 'No expiration'}</button></label></div>
                <div style={styles.row}>
                  <p style={styles.label}>Permissions</p>
                  <p style={styles.note}>Read retrieves information. Write allows actions.</p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {permissionCategories.map((category) => <div key={category.key} style={{ padding: 12, border: `1px solid ${theme.borderGlass}`, borderRadius: 12, background: theme.surfaceGlass }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><strong>{category.label}</strong><span style={{ fontSize: '0.72rem', color: theme.textMuted }}>{category.key === 'data' ? 'Account & records' : category.key === 'trade' ? 'Bots & trading' : 'Transfers & financial actions'}</span></div>
                      <p style={{ ...styles.note, marginTop: 4 }}>{category.description}</p>
                      <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>{(['read', 'write'] as PermissionAction[]).map((action) => <label key={action} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={permissions[category.key][action]} onChange={() => setPermissions((current) => ({ ...current, [category.key]: { ...current[category.key], [action]: !current[category.key][action] } }))} /> {action === 'read' ? 'Read' : 'Write'}</label>)}</div>
                    </div>)}
                    <div style={{ padding: 12, border: `1px solid ${theme.borderGlass}`, borderRadius: 12, background: theme.surfaceGlass }}>
                      <strong>API withdrawals</strong><p style={styles.note}>Separate permission for initiating wallet withdrawals. Requires Funds Write.</p>
                      <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 8 }}><input type="checkbox" checked={permissions.withdrawals && permissions.funds.write} disabled={!permissions.funds.write} onChange={() => setPermissions((current) => ({ ...current, withdrawals: !current.withdrawals }))} /> Allow API withdrawals</label>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  <button type="button" onClick={() => setShowCreate(false)} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Cancel</button>
                  <button disabled={saving || !permissionCategories.some((category) => permissions[category.key].read || permissions[category.key].write)} style={{ ...styles.button, borderRadius: 10 }}>{saving ? <InlineLoadingDots /> : 'Create key'}</button>
                </div>
              </form>
            )}
          </div>

          {secret && <div style={styles.card}><div style={styles.row}><p style={styles.label}><KeyRound size={15} /> Secret</p><code style={{ display: 'block', overflowWrap: 'anywhere', padding: 12, borderRadius: 10, background: theme.surfaceGlass }}>{secret}</code><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}><button type="button" onClick={() => void navigator.clipboard?.writeText(secret)} style={{ ...styles.button, borderRadius: 10 }}><Copy size={15} /> Copy</button><button type="button" onClick={() => setSecret('')} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Dismiss</button></div></div></div>}

          <div style={styles.card}>
            <div style={styles.row}><p style={styles.value}>Your API keys</p><p style={styles.note}>Tap View to inspect permissions and manage each credential.</p></div>
            {loading ? <div style={{ ...styles.row, marginTop: 10, textAlign: 'center' }}><InlineLoadingDots /></div> : !keys.length ? <div style={{ ...styles.row, marginTop: 10 }}><p style={styles.note}>No API keys yet. Create one when you are ready to connect an external application.</p></div> : <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>{keys.map((key) => <article key={key.id} style={styles.row}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <KeyRound size={20} color={key.revokedAt ? theme.textMuted : theme.primary} />
                <div style={{ minWidth: 0, flex: 1 }}><p style={{ ...styles.value, fontSize: '0.95rem' }}>{key.name}</p><p style={{ ...styles.note, marginTop: 3 }}>{key.prefix}… · {key.revokedAt ? 'Revoked' : 'Active'}</p></div>
                <button type="button" onClick={() => setExpandedKeyId((current) => current === key.id ? '' : key.id)} style={{ flexShrink: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '7px 12px', background: theme.surfaceGlass, color: theme.primary, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>{expandedKeyId === key.id ? 'Hide' : 'View'}</button>
              </div>
              {expandedKeyId === key.id && <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                  <div><p style={styles.label}>Status</p><p style={{ ...styles.value, marginTop: 5 }}>{key.revokedAt ? 'Revoked' : 'Active'}</p></div>
                  <div><p style={styles.label}>Permissions</p><p style={{ ...styles.value, marginTop: 5, fontSize: '0.82rem' }}>{permissionSummary(key.permissions)}</p></div>
                  <div><p style={styles.label}>Created</p><p style={{ ...styles.value, marginTop: 5 }}>{new Date(key.createdAt).toLocaleString()}</p></div>
                  <div><p style={styles.label}>Expires</p><p style={{ ...styles.value, marginTop: 5 }}>{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</p></div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                  <p style={styles.label}>Access</p><p style={{ ...styles.note, marginTop: 5 }}>{key.permissions?.withdrawals ? 'API withdrawals enabled' : 'API withdrawals disabled'}</p>
                </div>

                {!key.revokedAt && (revokeId === key.id ? <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: `1px solid ${theme.danger}`, background: theme.surfaceGlass }}><p style={styles.note}>Revoke this API key? Applications using it will stop working.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}><button type="button" onClick={() => setRevokeId(null)} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Cancel</button><button type="button" onClick={() => { setRevokeId(null); void revokeKey(key.id); }} disabled={revokingId === key.id} style={{ ...styles.button, background: theme.danger, borderRadius: 10 }}><Ban size={15} />{revokingId === key.id ? <InlineLoadingDots /> : 'Confirm revoke'}</button></div></div> : <button type="button" onClick={() => setRevokeId(key.id)} disabled={revokingId !== null} style={{ ...styles.button, ...styles.mutedButton }}><Ban size={15} /> Revoke API key</button>)}
                {deleteId === key.id ? (
                  <div style={{ display: 'grid', gap: 10, marginTop: 8, padding: 12, borderRadius: 12, border: `1px solid ${theme.danger}`, background: theme.surfaceGlass }}>
                    <p style={styles.note}>Permanently delete this API key? This cannot be undone.</p>
                    <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>Security code<input type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit security code" style={styles.input} /></label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <button type="button" onClick={() => { setDeleteId(null); setSecurityCode(''); }} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Cancel</button>
                      <button type="button" onClick={() => void deleteKey(key.id)} disabled={deletingId === key.id || securityCode.length !== 6} style={{ ...styles.button, background: theme.danger, borderRadius: 10 }}>{deletingId === key.id ? <InlineLoadingDots /> : 'Delete API key'}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setDeleteId(key.id); setSecurityCode(''); setRevokeId(null); }} disabled={deletingId !== null} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Delete API key</button>
                )}
              </div>}
            </article>)}</div>}
          </div>
        </div>
        <NowBar />
      </div>
    </main>
  </HybridTheme>;

};
export default ApiKeysPage;
