import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NotificationBanner from './NotificationBanner';
import LoadingDots from './LoadingDots';
import ReusableDatePage from './ReusableDatePage';
import { navigate } from '../utils/navigate';

const EnableAccountPage = () => {
  const { themeMode: mode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[mode];
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') || '');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [showDobPage, setShowDobPage] = useState(false);
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
  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
  const canRequestCode = Boolean(email.trim() && normalizedFullName && normalizedFullName.split(' ').length >= 2 && dob);
  const maxDob = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  })();

  const requestCode = async () => {
    if (!canRequestCode || isLoading) return;
    setMessage('');
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/enable-account/code', { email: email.trim().toLowerCase(), fullName: normalizedFullName, dob });
      setCodeSent(true);
      setMessage(response.data?.message || 'A verification code has been sent to your email.');
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      setMessage(response?.data?.message || 'Unable to send the verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const enableAccount = async () => {
    if (!codeSent || code.length !== 4 || isLoading) return;
    setMessage('');
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/enable-account/confirm', { email: email.trim().toLowerCase(), fullName: normalizedFullName, dob, code });
      setSuccess(true);
      setMessage(response.data?.message || 'Account enablement confirmed. Your account will be available after a 1-hour review.');
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      setMessage(response?.data?.message || 'Unable to submit the account enablement request.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showDobPage) {
    return (
      <ReusableDatePage
        title="Date of birth"
        description="Select the date of birth saved on your account, then confirm to continue."
        value={dob}
        min="1900-01-01"
        max={maxDob}
        cancelLabel="Back"
        showNowBar={false}
        onConfirm={(value) => {
          setDob(value);
          setShowDobPage(false);
        }}
        onCancel={() => setShowDobPage(false)}
      />
    );
  }

  return (
    <>
      <Helmet><title>CryBots | Enable account</title></Helmet>
      <main style={{ minHeight: '100vh', padding: 'clamp(14px, 2.5vw, 24px) clamp(12px, 2vw, 18px) 32px', boxSizing: 'border-box', display: 'grid', alignItems: 'start', justifyItems: 'center' }}>
        <section style={{ width: '100%', maxWidth: '520px', boxSizing: 'border-box', padding: 'clamp(22px, 5vw, 38px)', borderRadius: '22px', background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, color: theme.primary, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Account recovery</p>
          <h1 style={{ color: theme.text, margin: '12px 0 10px' }}>Enable account</h1>
          <p style={{ color: theme.textMuted, lineHeight: 1.6, marginTop: 0 }}>Confirm the details on your account. We will send a verification code to your account email before submitting your account enablement request.</p>
          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            <label style={{ color: theme.text }}>Email<input style={fieldStyle} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
            <label style={{ color: theme.text }}>Full name on account<input style={fieldStyle} type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="First name and last name" autoComplete="name" /></label>
            <label style={{ color: theme.text }}>Date of birth<button type="button" style={{ ...fieldStyle, textAlign: 'left' as const, cursor: 'pointer' }} onClick={() => setShowDobPage(true)}>{dob || 'Select your date of birth'}</button></label>
            {codeSent ? <label style={{ color: theme.text }}>Email verification code<input style={fieldStyle} inputMode="numeric" maxLength={4} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" autoComplete="one-time-code" /></label> : null}
            {message ? <NotificationBanner tone={success ? 'success' : 'warning'} title={success ? 'Enablement request received' : 'Action required'} message={message} /> : null}
            {!success ? <button type="button" onClick={codeSent ? enableAccount : requestCode} disabled={isLoading || (codeSent ? code.length !== 4 : !canRequestCode)} style={{ padding: '14px 18px', border: 0, borderRadius: 12, cursor: 'pointer', background: theme.primary, color: theme.textInverse, fontWeight: 800 }}>{isLoading ? <LoadingDots /> : codeSent ? 'Enable account' : 'Email me a verification code'}</button> : <button type="button" onClick={() => navigate('/signin')} style={{ padding: '14px 18px', border: 0, borderRadius: 12, cursor: 'pointer', background: theme.primary, color: theme.textInverse, fontWeight: 800 }}>Return to sign in</button>}
            {!success && codeSent ? <button type="button" onClick={requestCode} disabled={isLoading || !canRequestCode} style={{ border: 0, background: 'transparent', color: theme.primary, cursor: 'pointer' }}>Request a new code</button> : null}
          </div>
        </section>
      </main>
    </>
  );
};

export default EnableAccountPage;
