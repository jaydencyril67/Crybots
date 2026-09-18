import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../utils/navigation';
import api from '../api/axios';
import ReusableConfirmationPage from './ReusableConfirmationPage';

type DeletionStatus = {
  scheduled: boolean;
  deletionScheduledAtIso?: string;
  daysLeft?: number;
  codeSentAt?: string;
  codeExpiresAt?: string;
};

const formatDaysLeft = (daysLeft?: number) => {
  if (!daysLeft || Number.isNaN(daysLeft)) return 'Unknown';
  return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
};

const PendingDeletionPage = () => {
  const navigate = useNavigate();
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
      await api.post('/api/settings/danger/deletion-cancel', { code }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Deletion cancelled successfully. Redirecting…');
      window.localStorage.setItem('ke:navigation-redirect', '/dashboard');
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
      description="Sign-in is paused until you cancel the deletion request. You can request a code by email and confirm cancellation here."
      statusLabel={status?.scheduled ? `Deletion in ${formatDaysLeft(status.daysLeft)} · code expires ${status.codeExpiresAt ? new Date(status.codeExpiresAt).toLocaleString() : 'soon'}` : 'No active deletion request'}
      statusTone="warning"
      primaryActionLabel={loading ? 'Confirming…' : 'Cancel deletion'}
      secondaryActionLabel={codeRequestLoading ? 'Sending code…' : 'Send cancellation code'}
      onPrimaryAction={submitCancel}
      onSecondaryAction={requestCode}
      footerNote={message}
    >
      <div style={{ display: 'grid', gap: '10px', marginTop: '18px' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8f8f8f' }} htmlFor="pending-deletion-code">
            Email verification code
          </label>
          <input
            id="pending-deletion-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter the 6-digit code"
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#ffffff', padding: '12px 14px', outline: 'none' }}
          />
        </div>
      </div>
    </ReusableConfirmationPage>
  );
};

export default PendingDeletionPage;
