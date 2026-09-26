import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; expiresAt?: string; revokedAt?: string; createdAt: string };
const scopes = ['read', 'trade', 'transfers'];

const DeveloperApiKeysPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);
  const [expiration, setExpiration] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      const response = await api.post<{ secret: string }>('/api/developer/api-keys', { name, scopes: selectedScopes, expiresAt: expiration || undefined });
      setSecret(response.data.secret); setName(''); setExpiration(''); setSelectedScopes(['read']); await loadKeys();
    } catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to create API key.'); }
    finally { setSaving(false); }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm('Revoke this API key? Applications using it will stop working.')) return;
    try { await api.post(`/api/developer/api-keys/${id}/revoke`); await loadKeys(); }
    catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to revoke API key.'); }
  };

  const card: React.CSSProperties = { padding: 18, borderRadius: 20, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text };
  const button: React.CSSProperties = { border: 0, borderRadius: 999, padding: '10px 15px', fontWeight: 800, cursor: 'pointer', background: theme.primary, color: theme.textInverse };

  return <HybridTheme><main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}><div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
    <button type="button" onClick={() => navigate('/developer')} style={{ ...button, background: theme.surfaceMuted, color: theme.text }}><ArrowLeft size={15} /> Back to Developer</button>
    <h2 style={{ margin: '22px 0 8px' }}>API Keys</h2><p style={{ color: theme.textMuted }}>Create scoped keys for secure server-to-server access. The secret is shown only once.</p>
    {error && <p role="alert" style={{ color: theme.danger || '#ef4444' }}>{error}</p>}
    {secret && <section style={{ ...card, marginTop: 18, borderColor: theme.primary }}><strong>Copy your new API key now</strong><p style={{ color: theme.textMuted }}>For security, this secret cannot be shown again.</p><code style={{ display: 'block', overflowWrap: 'anywhere', padding: 12, background: theme.surfaceMuted }}>{secret}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(secret)} style={{ ...button, marginTop: 12 }}>Copy secret</button><button type="button" onClick={() => setSecret('')} style={{ ...button, marginLeft: 8, background: theme.surfaceMuted, color: theme.text }}>Dismiss</button></section>}
    <form onSubmit={createKey} style={{ ...card, marginTop: 18, display: 'grid', gap: 12 }}><h3 style={{ margin: 0 }}>Create API key</h3><label>Name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} style={input} /></label><label>Expires on (optional)<input type="date" value={expiration} onChange={(event) => setExpiration(event.target.value)} style={input} /></label><fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend>Scopes</legend>{scopes.map((scope) => <label key={scope} style={{ display: 'inline-flex', gap: 6, marginRight: 16 }}><input type="checkbox" checked={selectedScopes.includes(scope)} onChange={() => setSelectedScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])} />{scope}</label>)}</fieldset><button disabled={saving || !selectedScopes.length} style={button}>{saving ? <InlineLoadingDots /> : 'Create key'}</button></form>
    <section style={{ ...card, marginTop: 18 }}><h3 style={{ marginTop: 0 }}>Your keys</h3>{loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 18 }}><LoadingDots /></div> : !keys.length ? <p style={{ color: theme.textMuted }}>No API keys yet.</p> : keys.map((key) => <article key={key.id} style={{ padding: 12, marginTop: 10, borderRadius: 12, background: theme.surfaceMuted }}><strong>{key.name}</strong><p style={{ margin: '6px 0', color: theme.textMuted }}>{key.prefix}… · {key.scopes.join(', ')} · {key.revokedAt ? 'Revoked' : 'Active'}</p>{!key.revokedAt && <button type="button" onClick={() => void revokeKey(key.id)} style={{ ...button, background: theme.surfaceGlass, color: theme.text }}>Revoke</button>}</article>)}</section>
  </div></main></HybridTheme>;
};
export default DeveloperApiKeysPage;
