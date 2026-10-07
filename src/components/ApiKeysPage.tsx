import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import ReusableDatePage from './ReusableDatePage';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; expiresAt?: string; revokedAt?: string; createdAt: string };
const scopes = ['read', 'trade', 'transfers'];

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

  if (showExpirationPage) {
    return <ReusableDatePage title="API key expiration" description="Choose when this API key should expire." value={expiration} mode="date" confirmLabel="Set expiration date" cancelLabel="Back" showNowBar={false} min={new Date().toISOString().slice(0, 10)} onConfirm={(value) => { setExpiration(value); setShowExpirationPage(false); }} onCancel={() => setShowExpirationPage(false)} />;
  }

  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text };
  const button: React.CSSProperties = { border: 0, borderRadius: 999, padding: '10px 15px', fontWeight: 800, cursor: 'pointer', background: theme.primary, color: theme.textInverse, width: '100%', maxWidth: '100%', boxSizing: 'border-box' };
  const rowList: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', minWidth: 0, padding: 10, border: `1px solid ${theme.borderGlass}`, borderRadius: 16, background: theme.surfaceGlass, boxSizing: 'border-box' };
  const row: React.CSSProperties = { padding: '13px 14px', border: `1px solid ${theme.borderGlass}`, borderRadius: 15, background: theme.surfaceMuted, boxSizing: 'border-box' };

  return <HybridTheme mode={themeMode}><main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' }}><div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
    <button type="button" onClick={() => navigate('/dev')} style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'start', width: 'fit-content', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: 12 }}><ArrowLeft size={15} /> Dev</button>

    {error && <p role="alert" style={{ color: theme.danger }}>{error}</p>}
    {secret && <section style={{ ...rowList, marginBottom: 14, borderColor: theme.primary }}><div style={row}><strong>Copy your new API key now</strong><p style={{ color: theme.textMuted }}>For security, this secret cannot be shown again.</p><code style={{ display: 'block', overflowWrap: 'anywhere', padding: 12, background: theme.surfaceMuted }}>{secret}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(secret)} style={{ ...button, marginTop: 12 }}>Copy secret</button><button type="button" onClick={() => setSecret('')} style={{ ...button, marginLeft: 8, background: theme.surfaceMuted, color: theme.text }}>Dismiss</button></div></section>}
    <form onSubmit={createKey} style={rowList}><div style={row}><h3 style={{ margin: 0 }}>Create API key</h3></div><div style={row}><label style={{ display: 'grid', gap: 7 }}>Name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} style={input} /></label></div><div style={row}><label style={{ display: 'grid', gap: 7 }}>Expires on (optional)<button type="button" onClick={() => setShowExpirationPage(true)} style={{ ...input, textAlign: 'left', cursor: 'pointer' }}>{expiration || 'Choose expiration date'}</button></label></div><div style={row}><fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend>Permissions</legend><p style={{ marginTop: 4, color: theme.textMuted, fontSize: '0.84rem' }}>Read lets an app view information. Write lets it perform actions in that category.</p><div style={{ display: 'grid', gap: 10 }}>{permissionCategories.map((category) => <div key={category.key} style={{ padding: 12, border: `1px solid ${theme.borderGlass}`, borderRadius: 12 }}><strong>{category.label}</strong><div style={{ color: theme.textMuted, fontSize: '0.8rem', margin: '4px 0 9px' }}>{category.description}</div><div style={{ display: 'flex', gap: 18 }}>{(['read', 'write'] as PermissionAction[]).map((action) => <label key={action} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={permissions[category.key][action]} onChange={() => setPermissions((current) => ({ ...current, [category.key]: { ...current[category.key], [action]: !current[category.key][action] } }))} />{action === 'read' ? 'Read' : 'Write'}</label>)}</div></div>)}</div></fieldset></div><div style={row}><button disabled={saving || !permissionCategories.some((category) => permissions[category.key].read || permissions[category.key].write)} style={button}>{saving ? <InlineLoadingDots /> : 'Create key'}</button></div></form>
    <section style={{ ...rowList, marginTop: 18 }}><div style={row}><h3 style={{ margin: 0 }}>Your keys</h3></div>{loading ? <div style={{ ...row, textAlign: 'center' }}><LoadingDots /></div> : !keys.length ? <div style={{ ...row, color: theme.textMuted }}>No API keys yet.</div> : keys.map((key) => <article key={key.id} style={row}><strong>{key.name}</strong><p style={{ margin: '6px 0', color: theme.textMuted }}>{key.prefix}… · {permissionCategories.filter((category) => key.permissions?.[category.key] && (key.permissions[category.key].read || key.permissions[category.key].write)).map((category) => `${category.label}: ${key.permissions[category.key].read ? 'Read' : ''}${key.permissions[category.key].read && key.permissions[category.key].write ? ' + ' : ''}${key.permissions[category.key].write ? 'Write' : ''}`).join(' · ') || 'No permissions'} · {key.revokedAt ? 'Revoked' : 'Active'}</p>{!key.revokedAt && (revokeId === key.id ? <div style={{ display: 'grid', gap: 8, marginTop: 8, padding: 10, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><span style={{ color: theme.textMuted, fontSize: '0.82rem' }}>Revoke this API key? Applications using it will stop working.</span><div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => setRevokeId(null)} style={{ ...button, background: theme.surfaceMuted, color: theme.text }}>Cancel</button><button type="button" onClick={() => { setRevokeId(null); void revokeKey(key.id); }} disabled={revokingId === key.id} style={{ ...button, background: theme.surfaceMuted, color: theme.text }}>{revokingId === key.id ? <InlineLoadingDots /> : 'Confirm revoke'}</button></div></div> : <button type="button" onClick={() => setRevokeId(key.id)} disabled={revokingId !== null} style={{ ...button, background: theme.surfaceMuted, color: theme.text }}>Revoke</button>)}</article>)}</section>
  </div><NowBar /></main></HybridTheme>;
};
export default ApiKeysPage;
