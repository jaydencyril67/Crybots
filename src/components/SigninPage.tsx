import React, { useMemo, useState } from 'react';
import api from '../api/axios';
import { notifyAuthChanged } from '../utils/notificationEvents';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, KeyRound, ShieldCheck, Mail } from 'lucide-react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const supportedEmailDomains = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'kingshall.online',
  'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'mac.com', 'proton.me',
  'protonmail.com', 'aol.com', 'zoho.com', 'gmx.com', 'gmx.net', 'yandex.com',
  'mail.com', 'fastmail.com', 'tuta.com', 'tutanota.com',
]);
import { authenticateWithPasskey, isWebAuthnAvailable } from '../utils/webauthn';

const signInMethods = [
  { value: 'password', title: 'Password', description: 'Use your account password to sign in.' },
  { value: 'code', title: 'Email sign-in code', description: 'Receive a 4-digit code by email.' },
  { value: 'passkey', title: 'Biometric / passkey', description: 'Use your fingerprint, face, or security key.' },
] as const;


type SignInMethod = (typeof signInMethods)[number]['value'];

type FormState = {
  email: string;
  password: string;
  code: string;
  twoFactorCode: string;
  };

const initialState: FormState = {
  email: '',
  password: '',
  code: '',
  twoFactorCode: '',
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflow: 'hidden',
  },
  shell: {
    position: 'relative' as const,
    maxWidth: '1160px',
    margin: '0 auto',
    padding: 'clamp(14px, 2.4vw, 24px) clamp(12px, 2.2vw, 20px) 28px',
  },
  glow: {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    insetInline: 0,
    top: 0,
    height: '1px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
    position: 'relative' as const,
    zIndex: 1,
    marginBottom: '18px',
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
  },
  brandSub: {
    margin: '6px 0 0',
    fontSize: 'clamp(13px, 1.5vw, 15px)',
  },
  backButton: {
    border: '1px solid transparent',
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
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 'clamp(20px, 4vw, 32px)',
    alignItems: 'stretch',
    position: 'relative' as const,
    zIndex: 1,
    padding: '18px',
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
  },
  heroCard: {
    borderRadius: '24px',
    padding: '18px',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  title: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.45rem, 2.4vw, 2rem)',
    lineHeight: 1.08,
    letterSpacing: '-0.03em',
  },
  titleAccent: {
    display: 'block',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: {
    margin: '10px 0 0',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  panel: {
    borderRadius: '32px',
    padding: 'clamp(18px, 3.2vw, 24px)',
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
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '18px',
  },
  progressBar: {
    flex: '1 1 220px',
    height: '10px',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
  },
  stepLabel: {
    margin: 0,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.25em',
    fontWeight: 800,
  },
  stepTitle: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.5rem, 2.6vw, 2.05rem)',
    lineHeight: 1.1,
  },
  stepDesc: {
    margin: '10px 0 0',
    lineHeight: 1.7,
    fontSize: '15px',
  },
  form: {
    marginTop: '18px',
    display: 'grid',
    gap: '16px',
  },
  field: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    padding: '10px 12px',
    outline: 'none',
    fontSize: '0.9rem',
  },
  optionGrid: {
    display: 'grid',
    gap: '12px',
  },
  optionCard: {
    borderRadius: '18px',
    border: '1px solid transparent',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    textAlign: 'left' as const,
  },
  optionCardActive: {
    border: '1px solid transparent',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '6px',
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginTop: '18px',
  },
  switchText: {
    fontSize: '14px',
  },
  switchLink: {
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: 700,
    padding: 0,
    cursor: 'pointer',
  },
  button: {
    border: 'none',
    borderRadius: '999px',
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '108px',
  },
  buttonGhost: {
    border: '1px solid transparent',
  },
  buttonPrimary: {
  },
  footerNote: {
    margin: '18px 0 0',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  linkButton: {
    marginTop: '10px',
    padding: 0,
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  icon: {
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },
  iconLarge: {
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
});

const SigninPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const hybridStyles = {
    page: {
      ...styles.page,
      background: theme.background,
      color: theme.text,
    },
    glow: {
      ...styles.glow,
      background: theme.background,
    },
    topLine: {
      ...styles.topLine,
      background: theme.border,
    },
    brandKicker: {
      ...styles.brandKicker,
      color: theme.text,
    },
    brandSub: {
      ...styles.brandSub,
      color: theme.textMuted,
    },
    backButton: {
      ...styles.backButton,
      borderColor: theme.borderGlass,
      background: theme.surfaceGlass,
      color: theme.text,
    },
    heroCard: {
      ...styles.heroCard,
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceMuted,
      color: theme.text,

    },
    titleAccent: {
      ...styles.titleAccent,
      background: 'none',
      WebkitBackgroundClip: 'unset',
      backgroundClip: 'unset',
      color: theme.primary,
    },
    lead: {
      ...styles.lead,
      color: theme.textMuted,
    },
    panel: {
      ...styles.panel,
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceMuted,
      color: theme.text,
    },
    progressBar: {
      ...styles.progressBar,
      background: theme.borderGlass,
    },
    progressFill: {
      ...styles.progressFill,
      background: theme.primary,
    },
    stepLabel: {
      ...styles.stepLabel,
      color: theme.primary,
    },
    stepDesc: {
      ...styles.stepDesc,
      color: theme.textMuted,
    },
    label: {
      ...styles.label,
      color: theme.textMuted,
    },
    input: {
      ...styles.input,
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      color: theme.text,
    },
    optionCard: {
      ...styles.optionCard,
      borderColor: theme.borderGlass,
      background: theme.surfaceGlass,
      color: theme.text,
    },
    optionCardActive: {
      ...styles.optionCardActive,
      borderColor: theme.primarySoft,
      background: theme.primarySoft,
    },
    switchText: {
      ...styles.switchText,
      color: theme.textMuted,
    },
    switchLink: {
      ...styles.switchLink,
      color: theme.primary,
    },
    buttonGhost: {
      ...styles.buttonGhost,
      borderColor: theme.borderGlass,
      background: theme.surfaceGlass,
      color: theme.text,
    },
    buttonPrimary: {
      ...styles.buttonPrimary,
      background: theme.primary,
      color: theme.textInverse,
    },
    footerNote: {
      ...styles.footerNote,
      color: theme.textMuted,
    },
    linkButton: {
      ...styles.linkButton,
      color: theme.primary,
    },
    icon: {
      ...styles.icon,
      color: theme.primary,
    },
    iconLarge: {
      ...styles.iconLarge,
      color: theme.primary,
    },
  };
  const [form, setForm] = useState<FormState>(initialState);
  const [method, setMethod] = useState<SignInMethod | null>(null);
  const [passkeyOptions, setPasskeyOptions] = useState<any | null>(null);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [step, setStep] = useState<'email' | 'method' | 'password' | 'code'>('email');
  const [submitError, setSubmitError] = useState('');
  
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isCodeLocked, setIsCodeLocked] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const showResendConfirmationLink = submitError.toLowerCase().includes('confirm your email before signing in') || resendStatus.toLowerCase().includes('confirmation email has been sent');

  const progress = step === 'email' ? 20 : step === 'method' ? 40 : step === 'password' ? 60 : 80;

  const handleReturn = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate('/home');
  };

  const canContinue = useMemo(() => form.email.trim().length > 0, [form.email]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError('');
    setResendStatus('');
  };

  const emailInputStyle = hybridStyles.input;

  /* Email checks intentionally run only when Continue is clicked. */
  const emailValidationMessage = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return 'Enter your email address to continue.';
    if (!emailPattern.test(normalizedEmail)) return 'Enter a valid email address.';
    const domain = normalizedEmail.split('@')[1];
    if (!supportedEmailDomains.has(domain)) return 'Use an email address from a supported provider.';
    return '';
  };

  const signInDisabled = isSubmitting || !canContinue || (step === 'code' && (!form.code.trim() || (twoFactorRequired && form.twoFactorCode.length !== 6))) || (step === 'password' && (!form.password.trim() || (twoFactorRequired && form.twoFactorCode.length !== 6)));

  const handleNext = async () => {
    const email = form.email.trim().toLowerCase();
    const validationMessage = emailValidationMessage(email);
    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/api/auth/signin/check-email', { email });
      const { data: options } = await api.post('/api/webauthn/authenticate/options', { email });
      const hasPasskey = Array.isArray(options.allowCredentials) && options.allowCredentials.length > 0;
      setPasskeyAvailable(hasPasskey);
      setPasskeyOptions(hasPasskey ? options : null);
      setStep('method');
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      setPasskeyAvailable(false);
      setPasskeyOptions(null);
      setSubmitError(response?.data?.message || 'Unable to check this email right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      navigate('/home');
    }
  };

  const handleStartSignin = async (selectedMethod: SignInMethod) => {
    setSubmitError('');
    setMethod(selectedMethod);
    setTwoFactorRequired(false);

    if (selectedMethod === 'password') {
      setStep('password');
      return;
    }

    if (selectedMethod === 'passkey') {
      if (!isWebAuthnAvailable()) {
        setSubmitError('Passkeys are not supported by this browser.');
        setMethod(null);
        return;
      }
      setIsSubmitting(true);
      try {
        const options = passkeyOptions || (await api.post('/api/webauthn/authenticate/options', { email: form.email.trim().toLowerCase() })).data;
        if (!Array.isArray(options.allowCredentials) || options.allowCredentials.length === 0) {
          throw new Error('Biometric security is not enabled for this account.');
        }
        const assertion = await authenticateWithPasskey(options);
        const response = await api.post('/api/webauthn/authenticate/verify', assertion);
        if (response.data?.token) {
          localStorage.setItem('token', response.data.token);
          notifyAuthChanged();
        }
        if (response.data?.user) localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/home');
      } catch (error) {
        const response = (error as { response?: { data?: { message?: string } } })?.response;
        setSubmitError(response?.data?.message || (error as Error)?.message || 'Unable to authenticate with your passkey.');
        setMethod(null);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/signin/start', {
        email: form.email,
        method: selectedMethod,
      });

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
        ...(twoFactorRequired ? { twoFactorCode: form.twoFactorCode } : {}),
      });

      

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        notifyAuthChanged();
      }

      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (typeof response.data.user.firstName === 'string' && response.data.user.firstName.trim()) {
          localStorage.setItem('firstName', response.data.user.firstName.trim());
          localStorage.setItem('kingshall_first_name', response.data.user.firstName.trim());
        }
      }

      navigate(response.data?.isAdmin ? '/admin-home' : '/home');
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string; twoFactorRequired?: boolean; accountStatus?: string } } })?.response;
      const message = response?.data?.message || `Unable to sign you in right now. Please try again. (${response?.status || 'network error'})`;
      if (response?.data?.twoFactorRequired) {
        setTwoFactorRequired(true);
        setSubmitError('Enter the 6-digit code from your authenticator app to continue.');
      } else if (response?.status === 423 && message.toLowerCase().includes('pending deletion')) {
        setSubmitError(message);
        setMethod(null);
      } else if (response?.status === 423 && response?.data?.accountStatus === 'self_excluded') {
        setSubmitError(message);
        setMethod(null);
      } else if (response?.status === 423 && response?.data?.accountStatus === 'disabled') {
        setSubmitError(message);
        setMethod(null);
      } else {
        setSubmitError(message);
      }
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
        ...(twoFactorRequired ? { twoFactorCode: form.twoFactorCode } : {}),
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        notifyAuthChanged();
      }

      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (typeof response.data.user.firstName === 'string' && response.data.user.firstName.trim()) {
          localStorage.setItem('firstName', response.data.user.firstName.trim());
          localStorage.setItem('kingshall_first_name', response.data.user.firstName.trim());
        }
      }

      navigate(response.data?.isAdmin ? '/admin-home' : '/home');
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string; twoFactorRequired?: boolean; accountStatus?: string } } })?.response;
      const message = response?.data?.message || 'Unable to verify code right now. Please try again.';
      if (response?.data?.twoFactorRequired) {
        setTwoFactorRequired(true);
        setSubmitError('Enter the 6-digit code from your authenticator app to continue.');
      } else {
        setSubmitError(message);
      }
      if (response?.status === 423 && response?.data?.accountStatus === 'disabled') {
        setIsCodeLocked(false);
      } else if (response?.status === 423) {
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
      const response = await api.post('/api/auth/signin/start', {
        email: form.email,
        method: 'code',
      });

      setCodeSent(true);
      setStep('code');
      setIsCodeLocked(false);
      setAttemptsLeft(5 - (response.data?.attemptsUsed || 0));
      if (response.data?.confirmationEmailSent) {
        setSubmitError('');
        setResendStatus('A new confirmation email has been sent.');
      }
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
      const message = response?.data?.message || 'Unable to resend code right now. Please try again.';
      setSubmitError(message);
      if (response?.status === 423) {
        setIsCodeLocked(true);
      }
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

      <main style={hybridStyles.page}>
        <section style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={hybridStyles.glow} />
          <div style={hybridStyles.topLine} />

          <div style={styles.shell}>
            

            <div style={styles.grid}>
              <article style={hybridStyles.heroCard}>
                <h2 style={{ ...styles.title, color: theme.text }}>
                  Welcome back.
                  <span style={hybridStyles.titleAccent}>Sign in fast.</span>
                </h2>
                <p style={hybridStyles.lead}>Enter your email once, then choose password or email code to continue. Email-code sign in is protected with a 5-attempt lockout.</p>
              </article>

              <article style={hybridStyles.panel}>
                <div style={styles.progressWrap}>
                  <div style={hybridStyles.progressBar}>
                    <div style={{ ...hybridStyles.progressFill, width: `${progress}%` }} />
                  </div>
                  <div style={{ color: theme.textMuted }}>{step === 'email' ? 'Step 1 of 3' : step === 'method' ? 'Step 2 of 3' : step === 'password' || step === 'code' ? 'Step 3 of 3' : 'Step 4 of 4'}</div>
                </div>

                <div style={styles.headerCopy}>
                  {step === 'email' ? (
                    <>
                      <p style={hybridStyles.stepLabel}>Email</p>
                      <h3 style={{ ...styles.stepTitle, color: theme.text }}>Start with your account email</h3>
                      <p style={hybridStyles.stepDesc}>We’ll use this to show your sign-in choices and keep the flow secure.</p>
                    </>
                  ) : step === 'method' ? (
                    <>
                      <p style={hybridStyles.stepLabel}>Choose method</p>
                      <h2 style={{ ...styles.stepTitle, color: theme.text }}>Pick how you want to sign in</h2>
                      <p style={hybridStyles.stepDesc}>Password is instant if you remember it. Code sign-in sends a 4-digit email code through Resend.</p>
                    </>
                  ) : step === 'password' ? (
                    <>
                      <p style={hybridStyles.stepLabel}>Password</p>
                      <h2 style={{ ...styles.stepTitle, color: theme.text }}>Enter your password</h2>
                      <p style={hybridStyles.stepDesc}>This is your standard sign-in route.</p>
                    </>
                  ) : (
                    <>
                      <p style={hybridStyles.stepLabel}>Code</p>
                      <h2 style={{ ...styles.stepTitle, color: theme.text }}>Enter your email code</h2>
                      <p style={hybridStyles.stepDesc}>We sent a sign-in code to your email address.</p>
                    </>
                  )}
                </div>

                <div style={styles.form}>
                  {step === 'email' ? (
                    <div style={styles.field}>
                      <label style={hybridStyles.label} htmlFor="signin-email">Email</label>
                      <input id="signin-email" style={emailInputStyle} type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Enter your email" autoComplete="email" />
                    </div>
                  ) : null}

                  {step === 'method' ? (
                    <div style={styles.optionGrid}>
                      {signInMethods.filter((option) => option.value !== 'passkey' || passkeyAvailable).map((option) => (
                        <button key={option.value} type="button" style={{ ...hybridStyles.optionCard, ...(method === option.value ? hybridStyles.optionCardActive : {}) }} onClick={() => handleStartSignin(option.value)} disabled={isSubmitting}>
                          {isSubmitting && method === option.value ? <InlineLoadingDots /> : <KeyRound size={20} />}
                          <div>
                            <div style={{ fontWeight: 700, color: theme.text }}>{option.title}</div>
                            <div style={{ color: theme.textMuted, fontSize: '13px', lineHeight: 1.5 }}>{option.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {step === 'password' ? (
                    <div style={styles.field}>
                      <label style={hybridStyles.label} htmlFor="signin-password">Password</label>
                      <input id="signin-password" style={hybridStyles.input} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Enter your password" autoComplete="current-password" />
                      {twoFactorRequired ? (
                        <>
                          <label style={hybridStyles.label} htmlFor="signin-2fa-password">Authenticator code</label>
                          <input id="signin-2fa-password" style={hybridStyles.input} inputMode="numeric" maxLength={6} value={form.twoFactorCode} onChange={(event) => updateField('twoFactorCode', event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit authenticator code" autoComplete="one-time-code" />
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {step === 'code' ? (
                    <div style={styles.field}>
                      <label style={hybridStyles.label} htmlFor="signin-code">Sign-in code</label>
                      <input id="signin-code" style={hybridStyles.input} inputMode="numeric" maxLength={4} value={form.code} onChange={(event) => updateField('code', event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" autoComplete="one-time-code" />
                      {twoFactorRequired ? (
                        <>
                          <label style={hybridStyles.label} htmlFor="signin-2fa-code">Authenticator code</label>
                          <input id="signin-2fa-code" style={hybridStyles.input} inputMode="numeric" maxLength={6} value={form.twoFactorCode} onChange={(event) => updateField('twoFactorCode', event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit authenticator code" autoComplete="one-time-code" />
                        </>
                      ) : null}
                      <div style={hybridStyles.footerNote}>{isCodeLocked ? 'This account is locked for 2 hours.' : `Attempts left: ${attemptsLeft} • Code expires after 10 minutes.`}</div>
                    </div>
                  ) : null}

                  {submitError || resendStatus ? (
                    <div>
                      {submitError ? <NotificationBanner tone="error" title="Action required" message={submitError} /> : null}
                      {resendStatus ? <NotificationBanner tone="success" title="Update received" message={resendStatus} /> : null}
                      {showResendConfirmationLink ? (
                        <button type="button" onClick={handleResendCode} disabled={isResendingCode || isSubmitting} style={hybridStyles.linkButton}>
                          {isResendingCode ? <InlineLoadingDots /> : 'Resend confirmation code'}
                        </button>
                      ) : null}
                      {submitError.toLowerCase().includes('pending deletion') ? (
                        <button type="button" onClick={() => navigate(`/pending-deletion?email=${encodeURIComponent(form.email.trim())}`)} style={hybridStyles.linkButton}>
                          Cancel deletion request
                        </button>
                      ) : null}
                      {submitError.toLowerCase().includes('account disabled') ? (
                        <button type="button" onClick={() => navigate(`/enable-account?email=${encodeURIComponent(form.email.trim())}`)} style={hybridStyles.linkButton}>
                          Enable account
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div style={styles.navRow}>
                  <button type="button" onClick={handleBack} style={{ ...styles.button, ...hybridStyles.buttonGhost }}>Back</button>
                  {step === 'email' ? (
                    <button type="button" onClick={handleNext} style={{ ...styles.button, ...hybridStyles.buttonPrimary }} disabled={isSubmitting}>{isSubmitting ? <InlineLoadingDots /> : 'Continue'}</button>
                  ) : step === 'password' ? (
                    <button type="button" onClick={handlePasswordSignin} style={{ ...styles.button, ...hybridStyles.buttonPrimary }} disabled={signInDisabled}>{isSubmitting ? <InlineLoadingDots /> : 'Sign in'}</button>
                  ) : step === 'code' ? (
                    <button type="button" onClick={handleCodeSignin} style={{ ...styles.button, ...hybridStyles.buttonPrimary }} disabled={signInDisabled}>{isSubmitting ? <InlineLoadingDots /> : 'Verify code'}</button>
                  ) : (
                    <button type="button" onClick={handleCodeSignin} style={{ ...styles.button, ...styles.buttonPrimary }} disabled={signInDisabled}>{isSubmitting ? <InlineLoadingDots /> : 'Verify code'}</button>
                  )}
                </div>
                <div style={styles.switchRow}>
                  <span style={hybridStyles.switchText}>New to KingsHall?</span>
                  <button type="button" onClick={() => { navigate('/signup'); }} style={hybridStyles.switchLink}>
                    Signup here
                  </button>
                </div>
              </article>
              <article style={hybridStyles.heroCard}>
                <p style={hybridStyles.stepLabel}>Need help?</p>
                <h2 style={{ ...styles.stepTitle, color: theme.text }}>Forgot your password?</h2>
                <p style={hybridStyles.stepDesc}>Use your email code to verify your account and reset access securely.</p>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{
                    ...styles.button,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '42px',
                    padding: '0 16px',
                    borderRadius: '14px',
                    border: `1px solid ${theme.primarySoft}`,
                    background: theme.primarySoft,
                    color: theme.primary,
                    fontWeight: 700,

                  }}
                >
                  Forgot password?
                </button>
              </article>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default SigninPage;
