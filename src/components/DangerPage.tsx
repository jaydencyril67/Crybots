import React, { useState } from 'react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import HybridTheme from './HybridTheme';
import NowBar from './NowBar';

type DangerActionKey = 'disable' | 'self-exclude' | 'delete';

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
    gap: '24px',
    marginTop: '18px',
  },
  section: {
    display: 'grid',
    gap: '12px',
    paddingTop: '10px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  sectionText: {
    margin: 0,
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
    margin: 0,
    fontSize: '0.88rem',
    color: '#b3b3b3',
    lineHeight: 1.65,
    maxWidth: '64ch',
  },
  field: {
    display: 'grid',
    gap: '8px',
    marginTop: '10px',
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
    borderRadius: '0',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.14)',
    background: 'transparent',
    color: '#ffffff',
    padding: '12px 0',
    outline: 'none',
  },
  actionButton: {
    borderRadius: '0',
    padding: '16px 0',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    fontWeight: 800,
    color: '#ffffff',
    background: 'transparent',
    textAlign: 'left' as const,
  },
  status: {
    marginTop: '12px',
    fontSize: '0.92rem',
    fontWeight: 700,
    color: '#ffffff',
  },
};

const DangerPage = () => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState<DangerActionKey | null>(null);

  const submitAction = async (action: DangerActionKey) => {
    setLoading(action);
    setStatus('');

    try {
      const headers = { Authorization: `Bearer ${window.localStorage.getItem('token') || ''}` };

      if (action === 'delete') {
        await api.delete('/api/settings/danger/delete', {
          headers,
          data: { password, confirmation },
        });
      } else if (action === 'disable') {
        await api.patch('/api/settings/danger/disable', { password, confirmation, reason }, { headers });
      } else {
        await api.patch('/api/settings/danger/self-exclude', { password, confirmation, reason }, { headers });
      }

      setStatus('Success: account action completed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the action.';
      setStatus(message);
    } finally {
      setLoading(null);
    }
  };


  return (
    <HybridTheme mode="dark">
      <div style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          <div style={styles.content}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Danger Zone</h2>
              <p style={styles.sectionText}>These actions are irreversible or highly restrictive. Read each warning carefully before continuing.</p>
            </section>

            <section style={styles.section}>
              <h3 style={styles.actionTitle}>Disable Account</h3>
              <p style={styles.actionText}>This will suspend access to your account until it is restored by support or your next allowed login flow.</p>
            </section>
            <section style={styles.section}>
              <h3 style={styles.actionTitle}>Self Exclude</h3>
              <p style={styles.actionText}>This places your account into a self-exclusion state to prevent further use according to your request.</p>
            </section>
            <section style={styles.section}>
              <h3 style={styles.actionTitle}>Delete Account</h3>
              <p style={styles.actionText}>This permanently removes your account after the confirmation step. This action cannot be undone.</p>
            </section>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="danger-password">Password</label>
              <input id="danger-password" style={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="danger-confirmation">Confirmation</label>
              <input id="danger-confirmation" style={styles.input} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="DISABLE, SELF EXCLUDE, or DELETE" />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="danger-reason">Reason</label>
              <input id="danger-reason" style={styles.input} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional reason for the action" />
            </div>

            <button type="button" style={styles.actionButton} onClick={() => submitAction('disable')} disabled={loading !== null}>Confirm Disable</button>
            <button type="button" style={styles.actionButton} onClick={() => submitAction('self-exclude')} disabled={loading !== null}>Confirm Self Exclude</button>
            <button type="button" style={styles.actionButton} onClick={() => submitAction('delete')} disabled={loading !== null}>Confirm Delete</button>

            {status ? <div style={styles.status}>{status}</div> : null}
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DangerPage;
