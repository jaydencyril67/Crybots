import React, { useState } from 'react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import ReusableConfirmationPage from './ReusableConfirmationPage';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { useAppTheme } from './AppTheme';

type DangerActionKey = 'disable' | 'self-exclude' | 'delete';

type DangerActionState = {
  password: string;
  confirmation: string;
  reason: string;
  status: string;
  loading: DangerActionKey | null;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '18px',
    marginTop: '18px',
  },
  card: {
    ...createHybridCardStyles(theme).card,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: theme.text,
  },
  sectionText: {
    margin: '8px 0 0',
    fontSize: '0.92rem',
    color: theme.textMuted,
    lineHeight: 1.7,
    maxWidth: '62ch',
  },
  actionTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    color: theme.text,
  },
  actionText: {
    margin: '8px 0 0',
    fontSize: '0.88rem',
    color: theme.textMuted,
    lineHeight: 1.55,
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
    borderRadius: '18px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    color: theme.text,
    padding: '12px 14px',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '18px',
  },
  actionButton: {
    borderRadius: '999px',
    padding: '12px 16px',
    border: `1px solid ${theme.primary}`,
    cursor: 'pointer',
    fontWeight: 800,
    color: theme.textInverse,
    background: theme.primary,
    textAlign: 'center' as const,
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

  const [disable, setDisable] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', status: '', loading: null });
  const [selfExclude, setSelfExclude] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', status: '', loading: null });
  const [remove, setRemove] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', status: '', loading: null });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const submitAction = async (
    action: DangerActionKey,
    state: DangerActionState,
    setState: React.Dispatch<React.SetStateAction<DangerActionState>>,
  ) => {
    setState((current) => ({ ...current, loading: action, status: '' }));

    try {
      const headers = { Authorization: `Bearer ${window.localStorage.getItem('token') || ''}` };
      const payload = { password: state.password, confirmation: state.confirmation, reason: state.reason };

      if (action === 'disable') {
        await api.patch('/api/settings/danger/disable', payload, { headers });
      } else {
        await api.patch('/api/settings/danger/self-exclude', payload, { headers });
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
      const response = await api.delete('/api/settings/danger/delete', {
        headers,
        data: { password: remove.password, confirmation: remove.confirmation },
      });
      const forceLogout = Boolean((response.data as { forceLogout?: boolean })?.forceLogout);
      const reactivationAtIso = (response.data as { reactivationAtIso?: string })?.reactivationAtIso;

      if (reactivationAtIso) {
        window.localStorage.setItem('pendingDeletionRecoveryUntil', reactivationAtIso);
      }

      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('kingshall_user');
      window.localStorage.removeItem('firstName');
      window.localStorage.removeItem('kingshall_first_name');
      window.dispatchEvent(new Event('ke:force-logout'));
      if (forceLogout) {
        navigate('/pending-deletion');
        return;
      }
      navigate('/pending-deletion');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the action.';
      setRemove((current) => ({ ...current, status: message }));
    } finally {
      setRemove((current) => ({ ...current, loading: null }));
    }
  };

  if (showDeleteConfirmation) {
    return (
      <ReusableConfirmationPage
        eyebrow="Delete account"
        title="Confirm account deletion"
        description="Review the warnings carefully. Your account will be marked for deletion, sign-in will be blocked, and you can only cancel it with an email code after the cooldown window begins."
        statusLabel="This starts a 30-day deletion countdown."
        statusTone="danger"
        primaryActionLabel={remove.loading === 'delete' ? 'Confirming…' : 'Confirm delete'}
        secondaryActionLabel="Go back"
        onPrimaryAction={confirmDeleteAccount}
        onSecondaryAction={() => setShowDeleteConfirmation(false)}
        footerNote={remove.status || 'Deleting your account immediately logs you out and prevents normal use until cancellation is approved.'}
      >
        <div style={styles.field}>
          <label style={styles.label} htmlFor="danger-delete-password">Password</label>
          <input id="danger-delete-password" style={styles.input} type="password" value={remove.password} onChange={(event) => setRemove((current) => ({ ...current, password: event.target.value }))} />
        </div>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="danger-delete-confirmation">Confirmation</label>
          <input id="danger-delete-confirmation" style={styles.input} value={remove.confirmation} onChange={(event) => setRemove((current) => ({ ...current, confirmation: event.target.value }))} placeholder="DELETE" />
        </div>
      </ReusableConfirmationPage>
    );
  }

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <div style={styles.shell}>
          
          <div style={styles.content}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Danger Zone</h2>
              <p style={styles.sectionText}>These actions are irreversible or highly restrictive. Read each warning carefully before continuing.</p>
            </section>

            <section style={styles.card}>
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

            <section style={styles.card}>
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
                <label style={styles.label} htmlFor="danger-self-exclude-reason">Reason</label>
                <input id="danger-self-exclude-reason" style={styles.input} value={selfExclude.reason} onChange={(event) => setSelfExclude((current) => ({ ...current, reason: event.target.value }))} placeholder="Optional reason for self exclusion" />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.actionButton} onClick={() => submitAction('self-exclude', selfExclude, setSelfExclude)} disabled={selfExclude.loading !== null}>Self Exclude Account</button>
              </div>
              {selfExclude.status ? <div style={styles.status}>{selfExclude.status}</div> : null}
            </section>

            <section style={styles.card}>
              <h3 style={styles.actionTitle}>Delete Account</h3>
              <p style={styles.actionText}>This starts the hybrid deletion flow. You will first see a dedicated confirmation page before the deletion request is submitted.</p>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.actionButton} onClick={() => setShowDeleteConfirmation(true)} disabled={remove.loading !== null}>Open Delete Confirmation</button>
              </div>
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DangerPage;
