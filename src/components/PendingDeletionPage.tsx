import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import { navigate } from '../utils/navigate';

const PendingDeletionPage = () => {
  const { themeMode: mode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[mode];
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') || '');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '13px 14px',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceMuted,
    color: theme.text,
    fontSize: '15px',
  };
  const canRequestCode = Boolean(email.trim() && name.trim() && dob);

  const requestCode = async () => {
    if (!canRequestCode || isLoading) return;
    setMessage('');
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/pending-deletion/code', { email, name, dob });
      setCodeSent(true);
      setMessage(response.data?.message || 'A verification code has been sent to your email.');
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      setMessage(response?.data?.message || 'Unable to send the verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeletion = async () => {
    if (!codeSent || code.length !== 4 || isLoading) return;
    setMessage('');
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/pending-deletion/cancel', { email, name, dob, code });
      setSuccess(true);
      setMessage(response.data?.message || 'Account deletion cancelled successfully.');
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      setMessage(response?.data?.message || 'Unable to cancel account deletion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>KingsHall Exchange | Cancel account deletion</title></Helmet>
      <main style={{ minHeight: '100vh', padding: '48px 20px', display: 'grid', placeItems: 'center' }}>
        <section style={{ width: 'min(100%, 520px)', padding: 'clamp(22px, 5vw, 38px)', borderRadius: '26px', background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: '0 18px 60px rgba(0,0,0,.18)' }}>
          <p style={{ margin: 0, color: theme.primary, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Account recovery</p>
          <h1 style={{ color: theme.text, margin: '12px 0 10px' }}>Cancel account deletion</h1>
          <p style={{ color: theme.textMuted, lineHeight: 1.6, marginTop: 0 }}>Confirm the details on your account. We will send a verification code to your account email before restoring access.</p>
          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            <label style={{ color: theme.text }}>Email<input style={fieldStyle} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
            <label style={{ color: theme.text }}>Name on account<input style={fieldStyle} type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
            <label style={{ color: theme.text }}>Date of birth<input style={fieldStyle} type="date" value={dob} onChange={(event) => setDob(event.target.value)} /></label>
            {codeSent ? <label style={{ color: theme.text }}>Email verification code<input style={fieldStyle} inputMode="numeric" maxLength={4} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" autoComplete="one-time-code" /></label> : null}
            {message ? <NotificationBanner tone={success ? 'success' : 'warning'} title={success ? 'Deletion cancelled' : 'Action required'} message={message} /> : null}
            {!success ? <button type="button" onClick={codeSent ? cancelDeletion : requestCode} disabled={isLoading || (codeSent ? code.length !== 4 : !canRequestCode)} style={{ padding: '14px 18px', border: 0, borderRadius: 12, cursor: 'pointer', background: theme.primary, color: theme.textInverse, fontWeight: 800 }}>{isLoading ? <InlineLoadingDots /> : codeSent ? 'Cancel deletion' : 'Email me a verification code'}</button> : <button type="button" onClick={() => navigate('/signin')} style={{ padding: '14px 18px', border: 0, borderRadius: 12, cursor: 'pointer', background: theme.primary, color: theme.textInverse, fontWeight: 800 }}>Return to sign in</button>}
            {!success && codeSent ? <button type="button" onClick={requestCode} disabled={isLoading || !canRequestCode} style={{ border: 0, background: 'transparent', color: theme.primary, cursor: 'pointer' }}>Request a new code</button> : null}
          </div>
        </section>
      </main>
    </>
  );
};

export default PendingDeletionPage;
