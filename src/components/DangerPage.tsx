import React, { useState } from 'react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import HybridTheme from './HybridTheme';
import NowBar from './NowBar';

type DangerActionKey = 'disable' | 'self-exclude' | 'delete';

type DangerActionState = {
  password: string;
  confirmation: string;
  reason: string;
  status: string;
  loading: DangerActionKey | null;
};

const styles = {
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
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
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  sectionText: {
    margin: '8px 0 0',
    fontSize: '0.92rem',
    color: '#a3a3a3',
    lineHeight: 1.7,
    maxWidth: '62ch',
  },
  actionTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  actionText: {
    margin: '8px 0 0',
    fontSize: '0.88rem',
    color: '#b3b3b3',
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
    color: '#8f8f8f',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: '#ffffff',
    padding: '12px 14px',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '18px',
  },
  actionButton: {
    borderRadius: '18px',
    padding: '12px 18px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    fontWeight: 800,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.05)',
    textAlign: 'center' as const,
  },
  status: {
    marginTop: '14px',
    fontSize: '0.92rem',
    fontWeight: 700,
    color: '#ffffff',
  },
};

const DangerPage = () => {
  const [disable, setDisable] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', status: '', loading: null });
  const [selfExclude, setSelfExclude] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', status: '', loading: null });
  const [remove, setRemove] = useState<DangerActionState>({ password: '', confirmation: '', reason: '', status: '', loading: null });

  const submitAction = async (
    action: DangerActionKey,
    state: DangerActionState,
    setState: React.Dispatch<React.SetStateAction<DangerActionState>>,
  ) => {
    setState((current) => ({ ...current, loading: action, status: '' }));

    try {
      const headers = { Authorization: `Bearer ${window.localStorage.getItem('token') || ''}` };
      const payload = { password: state.password, confirmation: state.confirmation, reason: state.reason };

      if (action === 'delete') {
        await api.delete('/api/settings/danger/delete', {
          headers,
          data: { password: state.password, confirmation: state.confirmation },
        });
      } else if (action === 'disable') {
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
  return (
    <HybridTheme mode="dark">
      <div style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
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
              <p style={styles.actionText}>This permanently removes your account after the confirmation step. This action cannot be undone.</p>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-delete-password">Password</label>
                <input id="danger-delete-password" style={styles.input} type="password" value={remove.password} onChange={(event) => setRemove((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="danger-delete-confirmation">Confirmation</label>
                <input id="danger-delete-confirmation" style={styles.input} value={remove.confirmation} onChange={(event) => setRemove((current) => ({ ...current, confirmation: event.target.value }))} placeholder="DELETE" />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.actionButton} onClick={() => submitAction('delete', remove, setRemove)} disabled={remove.loading !== null}>Delete Account</button>
              </div>
              {remove.status ? <div style={styles.status}>{remove.status}</div> : null}
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DangerPage;
