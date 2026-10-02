import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type UserDetails = Record<string, unknown> & { email?: string };

const formatValue = (value: unknown) => typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value ?? '');
const isStructuredValue = (value: unknown) => typeof value === 'object' && value !== null;
const HIDDEN_USER_FIELDS = new Set(['_id', '__v', 'sessions', 'createdAt', 'updatedAt', 'accountStatusUpdatedAt', 'isAgent', 'pageUsage', 'alertPreferences', 'idleLogoutEnabled', 'idleLogoutMinutes', 'accountStatusReason', 'loginCount', 'maxActiveSessions']);

const AdminUserStatsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [user, setUser] = useState<UserDetails | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const id = window.location.pathname.split('/').filter(Boolean).pop();

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    if (id) api.get<{ user: UserDetails }>(`/api/admin/users/${id}`).then(({ data }) => {
      setUser(data.user);
      setDraft(Object.fromEntries(Object.entries(data.user).map(([key, value]) => [key, formatValue(value)])));
    }).catch(() => setError('Unable to load this user.'));
  }, [id]);

  const entries = useMemo(() => user ? Object.entries(user).filter(([key]) => !HIDDEN_USER_FIELDS.has(key)) : [], [user]);
  const updateDraft = (key: string, value: string) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); };

  const deleteUser = async () => {
    if (!id) return;
    setDeleting(true); setError('');
    try {
      await api.delete(`/api/admin/users/${id}`);
      navigate('/admin/users');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete user.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const saveChanges = async () => {
    if (!id || !user) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const updates: Record<string, unknown> = {};
      entries.forEach(([key, value]) => {
        const raw = draft[key] ?? '';
        if (isStructuredValue(value)) {
          try { updates[key] = JSON.parse(raw); } catch { throw new Error(`Use valid JSON for ${key}.`); }
        } else if (typeof value === 'number') updates[key] = Number(raw);
        else if (typeof value === 'boolean') updates[key] = raw === 'true';
        else updates[key] = raw;
      });
      const response = await api.patch<{ user: UserDetails }>(`/api/admin/users/${id}`, updates);
      setUser(response.data.user);
      setDraft(Object.fromEntries(Object.entries(response.data.user).map(([key, value]) => [key, formatValue(value)])));
      setSaved(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save user changes.');
    } finally { setSaving(false); }
  };

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}>
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}>
      <div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
          <section style={{ display: 'grid', gap: 8 }}>
            <button type="button" onClick={() => navigate('/admin/users')} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, padding: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 800 }}><ArrowLeft size={15} /> Back to users</button>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>User-Stats</h2>
            <p style={{ margin: 0, fontSize: '0.92rem', color: theme.textMuted }}>{user?.email || 'Account details'}</p>
          </section>
          <section style={{ display: 'grid', gap: 8 }}>
            {error ? <NotificationBanner tone="error" title="Unable to load user" message={error} /> : !user ? <NotificationBanner title="Loading user details" message="Loading the selected user account…" /> : <>
              {entries.map(([key, value]) => <label key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 0.35fr) minmax(0, 1fr)', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                <strong style={{ fontSize: '0.82rem', overflowWrap: 'anywhere' }}>{key}</strong>
                {isStructuredValue(value) ? <textarea value={draft[key] || ''} onChange={(event) => updateDraft(key, event.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: `1px solid ${theme.border}`, borderRadius: 8, padding: 8, background: theme.surfaceMuted, color: theme.text, font: 'inherit', fontSize: '0.8rem' }} /> : <input value={draft[key] || ''} onChange={(event) => updateDraft(key, key === 'uid' ? event.target.value.replace(/\D/g, '').slice(0, 5) : event.target.value)} maxLength={key === 'uid' ? 5 : undefined} inputMode={key === 'uid' ? 'numeric' : undefined} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 9px', background: theme.surfaceMuted, color: theme.text, font: 'inherit', fontSize: '0.84rem' }} />}
              </label>)}
              <div style={{ display: 'grid', gap: 10, marginTop: 4 }}><button type="button" onClick={saveChanges} disabled={saving || deleting} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 0, borderRadius: 999, padding: '9px 14px', background: theme.primary, color: theme.textInverse, cursor: saving || deleting ? 'wait' : 'pointer', fontWeight: 800, fontSize: '0.82rem' }}><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>{saved && <span style={{ color: theme.success, fontSize: '0.82rem', textAlign: 'center' }}>Saved</span>}{showDeleteConfirm ? <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, border: `1px solid ${theme.danger}`, background: theme.surfaceGlass }}><span style={{ color: theme.danger, fontSize: '0.82rem' }}>Delete this user permanently? This action cannot be undone.</span><div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{ flex: 1, border: 0, borderRadius: 999, padding: '9px 14px', background: theme.surfaceMuted, color: theme.text, cursor: deleting ? 'wait' : 'pointer', fontWeight: 800, fontSize: '0.82rem' }}>Cancel</button><button type="button" onClick={() => void deleteUser()} disabled={deleting} style={{ flex: 1, border: 0, borderRadius: 999, padding: '9px 14px', background: theme.danger, color: theme.textInverse, cursor: deleting ? 'wait' : 'pointer', fontWeight: 800, fontSize: '0.82rem' }}><Trash2 size={15} /> {deleting ? 'Deleting…' : 'Confirm delete'}</button></div></div> : <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={saving || deleting} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 0, borderRadius: 999, padding: '9px 14px', background: theme.surfaceMuted, color: theme.danger, cursor: saving || deleting ? 'wait' : 'pointer', fontWeight: 800, fontSize: '0.82rem' }}><Trash2 size={15} /> Delete user</button>}</div>
            </>}
          </section>
        </div>
      </div>
      <NowBar admin />
    </div>
  </HybridTheme>;
};

export default AdminUserStatsPage;
