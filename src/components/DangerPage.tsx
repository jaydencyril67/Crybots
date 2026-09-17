import React, { useState } from 'react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
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
    gap: '12px',
    marginTop: '18px',
  },
  rowButton: {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'grid',
    gap: '6px',
  },
  warning: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#cbd5e1',
    lineHeight: 1.5,
  },
  title: {
    margin: '0 0 4px',
    fontSize: '1.05rem',
    fontWeight: 800,
  },
  status: {
    marginTop: '12px',
    fontSize: '0.92rem',
    fontWeight: 700,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.35)',
    color: '#ffffff',
    padding: '13px 14px',
    outline: 'none',
  },
  field: {
    display: 'grid',
    gap: '8px',
    marginTop: '14px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#e5e7eb',
  },
  actionButton: {
    borderRadius: '14px',
    padding: '13px 16px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 800,
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

  const theme = HYBRID_THEME_TOKENS.dark;

  return (
    <HybridTheme mode="dark">
      <div style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          <div style={styles.content}>
            <button type="button" style={styles.rowButton} onClick={() => submitAction('disable')}>
              <div style={{ ...styles.title, color: theme.warning }}>Disable Account</div>
              <p style={styles.warning}>This will suspend access to your account until it is restored by support or your next allowed login flow.</p>
            </button>
            <button type="button" style={styles.rowButton} onClick={() => submitAction('self-exclude')}>
              <div style={{ ...styles.title, color: theme.danger }}>Self Exclude</div>
              <p style={styles.warning}>This places your account into a self-exclusion state to prevent further use according to your request.</p>
            </button>
            <button type="button" style={styles.rowButton} onClick={() => submitAction('delete')}>
              <div style={{ ...styles.title, color: theme.danger }}>Delete Account</div>
              <p style={styles.warning}>This permanently removes your account after the confirmation step. This action cannot be undone.</p>
            </button>

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
            <div style={{ display: 'grid', gap: '10px' }}>
              <button type="button" style={{ ...styles.actionButton, background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }} onClick={() => submitAction('disable')} disabled={loading !== null}>Confirm Disable</button>
              <button type="button" style={{ ...styles.actionButton, background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }} onClick={() => submitAction('self-exclude')} disabled={loading !== null}>Confirm Self Exclude</button>
              <button type="button" style={{ ...styles.actionButton, background: 'linear-gradient(135deg, #991b1b, #450a0a)' }} onClick={() => submitAction('delete')} disabled={loading !== null}>Confirm Delete</button>
            </div>
            {status ? <div style={styles.status}>{status}</div> : null}
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DangerPage;
