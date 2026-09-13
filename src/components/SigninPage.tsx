import React, { useMemo, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

const signInMethods = [
  { value: 'password', title: 'Password', description: 'Use your account password to sign in.' },
  { value: 'code', title: 'Email sign-in code', description: 'Receive a 3-digit code by email.' },
] as const;

type SignInMethod = (typeof signInMethods)[number]['value'];

type FormState = {
  email: string;
  password: string;
  code: string;
};

const initialState: FormState = {
  email: '',
  password: '',
  code: '',
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflow: 'hidden',
  },
  shell: {
    position: 'relative' as const,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'clamp(20px, 3vw, 32px) clamp(16px, 2.5vw, 24px) 40px',
  },
  glow: {
    position: 'absolute' as const,
    inset: 0,
    background:
      'radial-gradient(circle at top left, rgba(34,211,238,0.18), transparent 34%), radial-gradient(circle at 85% 20%, rgba(168,85,247,0.2), transparent 28%), linear-gradient(180deg, #09111f 0%, #050816 100%)',
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    insetInline: 0,
    top: 0,
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.7), transparent)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap' as const,
    position: 'relative' as const,
    zIndex: 1,
    marginBottom: '24px',
  },
  brandBlock: {
    minWidth: 0,
    flex: '1 1 220px',
  },
  brandKicker: {
    margin: 0,
    fontSize: 'clamp(14px, 1.6vw, 16px)',
    fontWeight: 800,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: '#67e8f9',
  },
  brandSub: {
    margin: '6px 0 0',
    fontSize: 'clamp(13px, 1.5vw, 15px)',
    color: 'rgba(255,255,255,0.62)',
  },
  backButton: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    borderRadius: '999px',
    width: '44px',
    height: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 'clamp(20px, 4vw, 32px)',
    alignItems: 'stretch',
    position: 'relative' as const,
    zIndex: 1,
  },
  heroCard: {
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    padding: '18px',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  title: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)',
    lineHeight: 1.08,
    letterSpacing: '-0.03em',
  },
  titleAccent: {
    display: 'block',
    background: 'linear-gradient(90deg, #67e8f9 0%, #ffffff 45%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: {
    margin: '10px 0 0',
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.68)',
  },
  panel: {
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    padding: 'clamp(22px, 4vw, 30px)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
  },
  headerCopy: {
    display: 'grid',
    gap: '10px',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '18px',
  },
  progressBar: {
    flex: '1 1 220px',
    height: '10px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #67e8f9, #c4b5fd)',
  },
  stepLabel: {
    margin: 0,
    color: '#67e8f9',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.25em',
    fontWeight: 800,
  },
  stepTitle: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
    lineHeight: 1.1,
  },
  stepDesc: {
    margin: '10px 0 0',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    fontSize: '15px',
  },
  form: {
    marginTop: '24px',
    display: 'grid',
    gap: '16px',
  },
  field: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.72)',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(6,10,20,0.9)',
    color: '#ffffff',
    padding: '15px 16px',
    fontSize: '16px',
    outline: 'none',
  },
  optionGrid: {
    display: 'grid',
    gap: '12px',
  },
  optionCard: {
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(10,16,32,0.72)',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    textAlign: 'left' as const,
    color: '#ffffff',
  },
  optionCardActive: {
    border: '1px solid rgba(34,211,238,0.45)',
    background: 'rgba(34,211,238,0.08)',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '6px',
  },
  button: {
    border: 'none',
    borderRadius: '999px',
    padding: '13px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '120px',
  },
  buttonGhost: {
    background: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  buttonPrimary: {
    background: '#ffffff',
    color: '#050816',
    boxShadow: 'none',
  },
  footerNote: {
    margin: '18px 0 0',
    color: 'rgba(255,255,255,0.55)',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  linkButton: {
    marginTop: '10px',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: '#67e8f9',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'none',
  },
  icon: {
    width: '20px',
    height: '20px',
    color: '#67e8f9',
    flexShrink: 0,
  },
  iconLarge: {
    width: '24px',
    height: '24px',
    color: '#67e8f9',
    flexShrink: 0,
  },
};

const SigninPage = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [method, setMethod] = useState<SignInMethod | null>(null);
  const [step, setStep] = useState<'email' | 'method' | 'password' | 'code'>('email');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isCodeLocked, setIsCodeLocked] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [resendStatus, setResendStatus] = useState('');
  const showResendConfirmationLink = submitError.toLowerCase().includes('confirm your email before signing in');

  const progress = step === 'email' ? 25 : step === 'method' ? 50 : step === 'password' || step === 'code' ? 75 : 100;

  const handleReturn = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.pathname = '/dashboard';
  };

  const canContinue = useMemo(() => form.email.trim().length > 0, [form.email]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError('');
    setResendStatus('');
  };

  const emailInputStyle =
    form.email && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email)
      ? { ...styles.input, borderColor: 'rgba(248, 113, 113, 0.9)', boxShadow: '0 0 0 1px rgba(248, 113, 113, 0.35)', background: 'rgba(127, 29, 29, 0.14)' }
      : styles.input;

  const signInDisabled = isSubmitting || !canContinue || (step === 'code' && !form.code.trim()) || (step === 'password' && !form.password.trim());

  const handleNext = () => {
    if (!canContinue) return;
    setStep('method');
  };

  const handleBack = () => {
    if (step === 'method') {
      setStep('email');
      setMethod(null);
      setSubmitError('');
      return;
    }

    if (step === 'password' || step === 'code') {
      setStep('method');
      setSubmitError('');
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.pathname = '/dashboard';
    }
  };

  const handleStartSignin = async (selectedMethod: SignInMethod) => {
    setSubmitError('');
    setIsSubmitting(true);
    setMethod(selectedMethod);

    try {
      const response = await api.post('/api/auth/signin/start', {
        email: form.email,
        method: selectedMethod,
      });

      if (selectedMethod === 'password') {
        setStep('password');
        return;
      }

      setCodeSent(true);
      setStep('code');
      setIsCodeLocked(false);
      setAttemptsLeft(5 - (response.data?.attemptsUsed || 0));
      setResendStatus(response.data?.message || 'Confirmation code resent successfully.');
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
      const message = response?.data?.message || 'Unable to start sign in right now. Please try again.';
      setResendStatus('');
      setSubmitError(message);
      if (response?.status === 423) {
        setIsCodeLocked(true);
      }
      setMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSignin = async () => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/signin', {
        email: form.email,
        password: form.password,
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      window.location.pathname = '/dashboard';
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to sign you in right now. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSignin = async () => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/signin/verify-code', {
        email: form.email,
        code: form.code,
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      window.location.pathname = '/dashboard';
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
      const message = response?.data?.message || 'Unable to verify code right now. Please try again.';
      setSubmitError(message);
      if (response?.status === 423) {
        setIsCodeLocked(true);
      }
      if (response?.status === 400 && message.toLowerCase().includes('attempt')) {
        setAttemptsLeft((currentLeft) => Math.max(0, currentLeft - 1));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!form.email.trim() || isResendingCode) return;

    setSubmitError('');
    setResendStatus('');
    setIsResendingCode(true);

    try {
      const response = await api.post('/api/auth/resend-confirmation', {
        email: form.email,
      });

      setResendStatus(response.data?.message || 'Confirmation email resent successfully.');
      setCodeSent(false);
      setStep('email');
      setIsCodeLocked(false);
      setAttemptsLeft(5);
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
      const message = response?.data?.message || 'Unable to resend confirmation email right now. Please try again.';
      setSubmitError(message);
    } finally {
      setIsResendingCode(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Sign in</title>
        <meta name="description" content="Sign in to your KingsHall Exchange account using email and your preferred secure method." />
      </Helmet>

      <main style={styles.page}>
        <section style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={styles.glow} />
          <div style={styles.topLine} />

          <div style={styles.shell}>
            <header style={styles.header}>
              <button type="button" aria-label="Go back" onClick={handleReturn} style={styles.backButton}>
                <ArrowLeft size={18} />
              </button>
              <div style={styles.brandBlock}>
                <p style={styles.brandKicker}>KingsHall Exchange</p>
                <p style={styles.brandSub}>Accounts must be confirmed by email before sign in.</p>
              </div>
            </header>

            <div style={styles.grid}>
              <article style={styles.heroCard}>
                <h1 style={styles.title}>
                  Welcome back.
                  <span style={styles.titleAccent}>Sign in fast.</span>
                </h1>
                <p style={styles.lead}>Enter your email once, then choose password or email code to continue. Email-code sign in is protected with a 5-attempt lockout.</p>
              </article>

              <article style={styles.panel}>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                  </div>
                  <div>{step === 'email' ? 'Step 1 of 3' : step === 'method' ? 'Step 2 of 3' : 'Step 3 of 3'}</div>
                </div>

                <div style={styles.headerCopy}>
                  {step === 'email' ? (
                    <>
                      <p style={styles.stepLabel}>Email</p>
                      <h2 style={styles.stepTitle}>Start with your account email</h2>
                      <p style={styles.stepDesc}>We’ll use this to show your sign-in choices and keep the flow secure.</p>
                    </>
                  ) : step === 'method' ? (
                    <>
                      <p style={styles.stepLabel}>Choose method</p>
                      <h2 style={styles.stepTitle}>Pick how you want to sign in</h2>
                      <p style={styles.stepDesc}>Password is instant if you remember it. Code sign-in sends a 3-digit email code through Resend.</p>
                    </>
                  ) : step === 'password' ? (
                    <>
                      <p style={styles.stepLabel}>Password</p>
                      <h2 style={styles.stepTitle}>Enter your password</h2>
                      <p style={styles.stepDesc}>This is your standard sign-in route.</p>
                    </>
                  ) : (
                    <>
                      <p style={styles.stepLabel}>Email code</p>
                      <h2 style={styles.stepTitle}>Enter the 3-digit code</h2>
                      <p style={styles.stepDesc}>{codeSent ? 'We sent the code to your email. Check your inbox and spam folder if needed.' : 'Request a code to continue.'}</p>
                      {codeSent ? (
                        <button type="button" onClick={handleResendCode} disabled={isResendingCode || isSubmitting} style={styles.linkButton}>
                          {isResendingCode ? 'Resending confirmation email…' : 'Resend confirmation email'}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>

                <div style={styles.form}>
                  {step === 'email' ? (
                    <div style={styles.field}>
                      <label style={styles.label} htmlFor="signin-email">Email</label>
                      <input id="signin-email" style={emailInputStyle} type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Enter your email" autoComplete="email" />
                    </div>
                  ) : null}

                  {step === 'method' ? (
                    <div style={styles.optionGrid}>
                      {signInMethods.map((option) => (
                        <button key={option.value} type="button" style={{ ...styles.optionCard, ...(method === option.value ? styles.optionCardActive : {}) }} onClick={() => handleStartSignin(option.value)} disabled={isSubmitting}>
                          <KeyRound size={20} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{option.title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px', lineHeight: 1.5 }}>{option.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {step === 'password' ? (
                    <div style={styles.field}>
                      <label style={styles.label} htmlFor="signin-password">Password</label>
                      <input id="signin-password" style={styles.input} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Enter your password" autoComplete="current-password" />
                    </div>
                  ) : null}

                  {step === 'code' ? (
                    <div style={styles.field}>
                      <label style={styles.label} htmlFor="signin-code">Sign-in code</label>
                      <input id="signin-code" style={styles.input} inputMode="numeric" maxLength={3} value={form.code} onChange={(event) => updateField('code', event.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="000" autoComplete="one-time-code" />
                      <div style={styles.footerNote}>{isCodeLocked ? 'This account is locked for 2 hours.' : `Attempts left: ${attemptsLeft} • Code expires after 10 minutes.`}</div>

                    </div>
                  ) : null}

                  {submitError || resendStatus ? (
                    <div>
                      {submitError ? <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{submitError}</p> : null}
                      {resendStatus ? <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>{resendStatus}</p> : null}
                      {showResendConfirmationLink ? (
                        <button type="button" onClick={handleResendCode} disabled={isResendingCode || isSubmitting} style={styles.linkButton}>
                          {isResendingCode ? 'Resending confirmation email…' : 'Resend confirmation email'}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div style={styles.navRow}>
                  <button type="button" onClick={handleBack} style={{ ...styles.button, ...styles.buttonGhost }}>Back</button>
                  {step === 'email' ? (
                    <button type="button" onClick={handleNext} style={{ ...styles.button, ...styles.buttonPrimary }} disabled={!canContinue}>Continue</button>
                  ) : step === 'password' ? (
                    <button type="button" onClick={handlePasswordSignin} style={{ ...styles.button, ...styles.buttonPrimary }} disabled={signInDisabled}>Sign in</button>
                  ) : step === 'code' ? (
                    <button type="button" onClick={handleCodeSignin} style={{ ...styles.button, ...styles.buttonPrimary }} disabled={signInDisabled}>Verify code</button>
                  ) : null}
                </div>
              </article>
              <article style={styles.heroCard}>
                <p style={styles.stepLabel}>Need help?</p>
                <h2 style={styles.stepTitle}>Forgot your password?</h2>
                <p style={styles.stepDesc}>Use the recovery flow to verify your account and reset access securely.</p>
                <a
                  href="/forgot-password"
                  style={{
                    ...styles.button,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '42px',
                    padding: '0 16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(103,232,249,0.35)',
                    background: 'rgba(103,232,249,0.08)',
                    color: '#67e8f9',
                    textDecoration: 'none',
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(103,232,249,0.14)',
                  }}
                >
                  Forgot password?
                </a>
              </article>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default SigninPage;
