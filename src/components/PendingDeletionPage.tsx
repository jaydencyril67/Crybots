import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import ReusableConfirmationPage from './ReusableConfirmationPage';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type DeletionStatus = {
  scheduled: boolean;
  deletionScheduledAtIso?: string;
  daysLeft?: number;
  codeSentAt?: string;
  codeExpiresAt?: string;
  accountStatus?: string;
  accountStatusReason?: string;
  accountStatusUpdatedAt?: string;
  reactivationAtIso?: string;
};

const formatDaysLeft = (daysLeft?: number) => {
  if (!daysLeft || Number.isNaN(daysLeft)) return 'Unknown';
  return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
};

const PendingDeletionPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const recoveryUntil = useMemo(() => window.localStorage.getItem('pendingDeletionRecoveryUntil') || '', []);
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('Loading deletion status…');
  const [loading, setLoading] = useState(false);
  const [codeRequestLoading, setCodeRequestLoading] = useState(false);

  const token = useMemo(() => localStorage.getItem('token') || '', []);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await api.get('/api/settings/danger/deletion-status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatus(response.data as DeletionStatus);
        setMessage(response.data?.scheduled ? 'Your account is scheduled for deletion.' : 'No deletion is currently scheduled.');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unable to load deletion status.';
        setMessage(errorMessage);
      }
    };

    void loadStatus();
  }, [token]);

  const requestCode = async () => {
    setCodeRequestLoading(true);
    setMessage('Sending cancellation code…');

    try {
      await api.post('/api/settings/danger/deletion-cancel-code', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('A cancellation code has been sent to your email.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to send cancellation code.';
      setMessage(errorMessage);
    } finally {
      setCodeRequestLoading(false);
    }
  };

  const submitCancel = async () => {
    setLoading(true);
    setMessage('Verifying cancellation code…');

    try {
      const response = await api.post('/api/settings/danger/deletion-cancel', { code }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reactivationAtIso = (response.data as { reactivationAtIso?: string })?.reactivationAtIso || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      window.localStorage.setItem('pendingDeletionRecoveryUntil', reactivationAtIso);
      setMessage('Deletion cancelled successfully. Full access will return after 24 hours. Redirecting…');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to cancel deletion.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReusableConfirmationPage
      eyebrow="Pending deletion"
      title="Your account is scheduled for deletion"
      description="Sign-in is paused while your account is marked for deletion. You can request a code by email and confirm cancellation here, then wait 24 hours for normal access to return."
      statusLabel={status?.scheduled ? `Deletion in ${formatDaysLeft(status.daysLeft)} · code expires ${status.codeExpiresAt ? new Date(status.codeExpiresAt).toLocaleString() : 'soon'}` : 'No active deletion request'}
      statusTone="warning"
      primaryActionLabel={loading ? 'Confirming…' : 'Cancel deletion'}
      secondaryActionLabel={codeRequestLoading ? 'Sending code…' : 'Send cancellation code'}
      onPrimaryAction={submitCancel}
      onSecondaryAction={requestCode}
      footerNote={`${message || 'After cancellation, your account stays in a recovery state for 24 hours before returning to normal access.'}${recoveryUntil ? ` Recovery ends at ${new Date(recoveryUntil).toLocaleString()}.` : ''}`}
    >
      <div style={{ display: 'grid', gap: '10px', marginTop: '18px' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.textMuted }} htmlFor="pending-deletion-code">
            Email verification code
          </label>
          <input
            id="pending-deletion-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter the 6-digit code"
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: '18px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, padding: '12px 14px', outline: 'none' }}
          />
        </div>
      </div>
    </ReusableConfirmationPage>
  );
};

export default PendingDeletionPage;
