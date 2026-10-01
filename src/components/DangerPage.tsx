import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { useAppTheme } from './AppTheme';

type DangerActionKey = 'disable' | 'self-exclude' | 'delete';

type DangerActionState = {
  password: string;
  confirmation: string;
  reason: string;
  durationDays: string;
  status: string;
  loading: DangerActionKey | null;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '90px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '920px',
    margin: '0 auto',
    padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '14px',
    marginTop: '10px',
  },
  card: {
    ...createHybridCardStyles(theme).card,
  },
  rowList: {
    display: 'grid',
    gap: '10px',
    width: '100%',
    minWidth: 0,
    padding: '18px',
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    boxSizing: 'border-box' as const,
  },
  dangerRow: {
    width: '100%',
    maxWidth: '100%',
    background: theme.surfaceMuted,
    border: `1px solid ${theme.borderGlass}`,
    borderRadius: '15px',
    padding: '13px 14px',
    display: 'grid',
    gap: '6px',
    textAlign: 'left' as const,
    minWidth: 0,
    boxSizing: 'border-box' as const,
  },
  portfolioBack: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '12px' },
  sectionTitle: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: theme.text,
  },
  sectionText: {
    margin: '3px 0 0',
    fontSize: '0.82rem',
    color: theme.textMuted,
    lineHeight: 1.4,
    maxWidth: '62ch',
  },
  actionTitle: {
    margin: 0,
    fontSize: '0.96rem',
    fontWeight: 800,
    color: theme.text,
  },
  actionText: {
    margin: '5px 0 0',
    fontSize: '0.82rem',
    color: theme.textMuted,
    lineHeight: 1.4,
    maxWidth: '64ch',
  },
  field: {
    display: 'grid',
    gap: '6px',
    marginTop: '14px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: theme.textMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '13px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    color: theme.text,
    padding: '10px 12px',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-start',
    gap: '10px',
    marginTop: '8px',
  },
  actionButton: {
    borderRadius: '999px',
    padding: '12px 16px',
    border: `1px solid ${theme.primary}`,
    cursor: 'pointer',
    fontWeight: 700,
    color: theme.textInverse,
    background: theme.primary,
    width: '100%',
    maxWidth: '100%',
  },
  status: {
    marginTop: '14px',
    fontSize: '0.92rem',
    fontWeight: 700,
    color: theme.textMuted,
  },
});

const DangerPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  const [disable, setDisable] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', durationDays: '', status: '', loading: null });
  const [selfExclude, setSelfExclude] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', durationDays: '', status: '', loading: null });
  const [remove, setRemove] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', durationDays: '', status: '', loading: null });

  const submitAction = async (
    action: DangerActionKey,
    state: DangerActionState,
    setState: React.Dispatch<React.SetStateAction<DangerActionState>>,
  ) => {
    setState((current) => ({ ...current, loading: action, status: '' }));

    try {
      const headers = { Authorization: `Bearer ${window.localStorage.getItem('token') || ''}` };
      const payload = { password: state.password, confirmation: state.confirmation, reason: state.reason, ...(action === 'self-exclude' ? { durationDays: Number(state.durationDays) } : {}) };

      if (action === 'disable') {
        await api.patch('/api/settings/danger/disable', payload, { headers });
      } else {
        await api.patch('/api/settings/danger/self-exclude', payload, { headers });
      }

      if (action === 'self-exclude') {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('kingshall_user');
        window.localStorage.removeItem('firstName');
        window.localStorage.removeItem('kingshall_first_name');
        window.dispatchEvent(new Event('ke:force-logout'));
        navigate('/');
        return;
      }

      setState((current) => ({ ...current, status: 'Success: account action completed.' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the action.';
      setState((current) => ({ ...current, status: message }));
    } finally {
      setState((current) => ({ ...current, loading: null }));
    }
  };

  const confirmDeleteAccount = async () => {
    setRemove((current) => ({ ...current, loading: 'delete', status: '' }));

    try {
      const headers = { Authorization: `Bearer ${window.localStorage.getItem('token') || ''}` };
      await api.delete('/api/settings/danger/delete', {
        headers,
        data: { password: remove.password, confirmation: remove.confirmation, reason: remove.reason },
      });
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('kingshall_user');
      window.localStorage.removeItem('firstName');
      window.localStorage.removeItem('kingshall_first_name');
      window.dispatchEvent(new Event('ke:force-logout'));
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the action.';
      setRemove((current) => ({ ...current, status: message }));
    } finally {
      setRemove((current) => ({ ...current, loading: null }));
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <div style={styles.shell}>
          
          <div style={styles.content}>
            <button type="button" style={styles.portfolioBack} onClick={() => navigate('/profile')}><ArrowLeft size={17} /> Profile</button>
            <div style={styles.rowList}>
              <section style={styles.dangerRow}>
              <h3 style={styles.actionTitle}>Disable Account</h3>
              <p style={styles.actionText}>This will suspend access to your account until it is restored by support or your next allowed login flow.</p>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-disable-password">Password</label>
                <input id="danger-disable-password" style={styles.input} type="password" value={disable.password} onChange={(event) => setDisable((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-disable-confirmation">Confirmation</label>
                <input id="danger-disable-confirmation" style={styles.input} value={disable.confirmation} onChange={(event) => setDisable((current) => ({ ...current, confirmation: event.target.value }))} placeholder="DISABLE" />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-disable-reason">Reason</label>
                <input id="danger-disable-reason" style={styles.input} value={disable.reason} onChange={(event) => setDisable((current) => ({ ...current, reason: event.target.value }))} placeholder="Optional reason for disabling" />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.actionButton} onClick={() => submitAction('disable', disable, setDisable)} disabled={disable.loading !== null}>Disable Account</button>
              </div>
              {disable.status ? <div style={styles.status}>{disable.status}</div> : null}
              </section>

              <section style={styles.dangerRow}>
              <h3 style={styles.actionTitle}>Self Exclude</h3>
              <p style={styles.actionText}>This places your account into a self-exclusion state to prevent further use according to your request.</p>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-self-exclude-password">Password</label>
                <input id="danger-self-exclude-password" style={styles.input} type="password" value={selfExclude.password} onChange={(event) => setSelfExclude((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-self-exclude-confirmation">Confirmation</label>
                <input id="danger-self-exclude-confirmation" style={styles.input} value={selfExclude.confirmation} onChange={(event) => setSelfExclude((current) => ({ ...current, confirmation: event.target.value }))} placeholder="SELF EXCLUDE" />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-self-exclude-duration">Exclusion duration (days)</label>
                <input id="danger-self-exclude-duration" style={styles.input} type="number" min="1" max="3650" step="1" value={selfExclude.durationDays} onChange={(event) => setSelfExclude((current) => ({ ...current, durationDays: event.target.value.replace(/\D/g, '') }))} placeholder="Enter number of days" />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-self-exclude-reason">Reason</label>
                <input id="danger-self-exclude-reason" style={styles.input} value={selfExclude.reason} onChange={(event) => setSelfExclude((current) => ({ ...current, reason: event.target.value }))} placeholder="Optional reason for self exclusion" />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.actionButton} onClick={() => submitAction('self-exclude', selfExclude, setSelfExclude)} disabled={selfExclude.loading !== null || !selfExclude.durationDays}>Self Exclude Account</button>
              </div>
              {selfExclude.status ? <div style={styles.status}>{selfExclude.status}</div> : null}
              </section>

              <section style={styles.dangerRow}>
              <h3 style={styles.actionTitle}>Delete Account</h3>
              <p style={styles.actionText}>This starts a 30-day deletion countdown. Sign-in will be blocked while your account is pending deletion.</p>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-delete-password">Password</label>
                <input id="danger-delete-password" style={styles.input} type="password" value={remove.password} onChange={(event) => setRemove((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-delete-confirmation">Confirmation</label>
                <input id="danger-delete-confirmation" style={styles.input} value={remove.confirmation} onChange={(event) => setRemove((current) => ({ ...current, confirmation: event.target.value }))} placeholder="DELETE" />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-delete-reason">Reason</label>
                <input id="danger-delete-reason" style={styles.input} value={remove.reason} onChange={(event) => setRemove((current) => ({ ...current, reason: event.target.value }))} placeholder="Optional reason for deleting" />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.actionButton} onClick={confirmDeleteAccount} disabled={remove.loading !== null}>{remove.loading === 'delete' ? 'Deleting…' : 'Delete Account'}</button>
              </div>
              {remove.status ? <div style={styles.status}>{remove.status}</div> : null}
              </section>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DangerPage;
