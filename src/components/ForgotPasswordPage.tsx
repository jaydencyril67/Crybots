import React, { useEffect, useMemo, useState } from 'react';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const steps = [
  {
    title: 'Email address',
    description: 'Enter the email linked to your account.',
    field: 'email',
    placeholder: 'Enter your email',
  },
  {
    title: 'Full name',
    description: 'Enter your first and last name exactly as they appear on the account.',
    field: 'fullName',
    placeholder: 'First name and last name',
  },
  {
    title: 'Verification code',
    description: 'We will send a 4-digit code to your email once your details match.',
    field: 'code',
    placeholder: 'Enter 4-digit code',
  },
  {
    title: 'New password',
    description: 'Choose a new secure password for your account.',
    field: 'password',
    placeholder: 'Create a new password',
  },
] as const;

type StepField = (typeof steps)[number]['field'];

type FormState = Record<StepField, string>;

type FieldErrors = Partial<Record<StepField, string>>;

const initialState: FormState = {
  email: '',
  fullName: '',
  code: '',
  password: '',
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
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
    background: theme.surfaceMuted,
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    insetInline: 0,
    top: 0,
    height: '1px',
    background: theme.primary,
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
    color: theme.primary,
  },
  brandSub: {
    margin: '6px 0 0',
    fontSize: 'clamp(13px, 1.5vw, 15px)',
    color: theme.textMuted,
  },
  backButton: {
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    color: theme.text,
    borderRadius: '999px',
    width: '44px',
    height: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 'clamp(20px, 4vw, 32px)',
    alignItems: 'stretch',
    position: 'relative' as const,
    zIndex: 1,
    padding: 'clamp(16px, 3vw, 24px)',
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  heroCard: { borderRadius: 0, border: 'none', borderBottom: `1px solid ${theme.borderGlass}`, background: 'transparent', padding: '0 0 16px' },
  title: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.45rem, 2.4vw, 2rem)',
    lineHeight: 1.08,
    letterSpacing: '-0.03em',
  },
  titleAccent: {
    display: 'block',
    color: theme.primary,
    WebkitBackgroundClip: 'initial',
    backgroundClip: 'initial',
  },
  lead: {
    margin: '10px 0 0',
    fontSize: '14px',
    lineHeight: 1.6,
    color: theme.textMuted,
  },
  summaryBox: { display: 'grid', gap: '8px', marginTop: '16px', padding: '12px 0', borderRadius: 0, border: 'none', borderTop: `1px solid ${theme.borderGlass}`, background: 'transparent' },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
  },
  summaryKey: {
    color: theme.textMuted,
    fontSize: '12px',
  },
  summaryValue: {
    color: theme.text,
    fontWeight: 700,
    textAlign: 'right' as const,
    overflowWrap: 'anywhere' as const,
    fontSize: '12px',
  },
  inlineError: {
    margin: '10px 0 0',
    color: theme.danger,
    fontSize: '12px',
    fontWeight: 600,
  },
  inlineNote: {
    margin: '8px 0 0',
    color: theme.textMuted,
    fontSize: '11px',
    lineHeight: 1.5,
  },
  passwordChecklist: {
    margin: '10px 0 0',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gap: '6px',
  },
  passwordChecklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    lineHeight: 1.5,
    color: theme.textMuted,
  },
  passwordChecklistIcon: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  panel: { borderRadius: 0, border: 'none', background: 'transparent', padding: '16px 0 0', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
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
    background: theme.surfaceMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: theme.primary,
  },
  stepLabel: {
    margin: 0,
    color: theme.primary,
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
    color: theme.textMuted,
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
    color: theme.textMuted,
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
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '108px',
  },
  buttonGhost: {
    background: theme.surfaceGlass,
    color: theme.text,
    border: `1px solid ${theme.border}`,
  },
  buttonPrimary: {
    background: theme.primary,
    color: theme.textInverse,
  },
  footerNote: {
    margin: '18px 0 0',
    color: theme.textMuted,
    fontSize: '13px',
    lineHeight: 1.6,
  },
  icon: {
    width: '20px',
    height: '20px',
    color: theme.primary,
    flexShrink: 0,
  },
});

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, ' ');

const validateField = (field: StepField, value: string, form?: FormState) => {
  const trimmed = value.trim();

  if (field === 'email') {
    if (!trimmed) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.';
  }

  if (field === 'fullName') {
    if (!trimmed) return 'Full name is required.';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return 'Enter both your first and last name.';
  }

  if (field === 'code') {
    if (!trimmed) return 'Verification code is required.';
    if (!/^\d{4}$/.test(trimmed)) return 'Enter the 4-digit code sent to your email.';
  }

  if (field === 'password') {
    if (!trimmed) return 'New password is required.';
    if (trimmed.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(trimmed)) return 'Password should include at least one uppercase letter.';
    if (!/[a-z]/.test(trimmed)) return 'Password should include at least one lowercase letter.';
    if (!/\d/.test(trimmed)) return 'Password should include at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(trimmed)) return 'Password should include at least one symbol.';
    if (form?.password && form.password !== value) return 'Passwords do not match.';
  }

  if (field === 'code' && !/^[0-9]{4}$/.test(trimmed)) return 'Verification code must contain exactly 4 digits.';

  return '';
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(8);
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
      color: theme.primary,
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
    stepLabel: {
      ...styles.stepLabel,
      color: theme.primary,
    },
    progressBar: {
      ...styles.progressBar,
      background: theme.borderGlass,
    },
    progressFill: {
      ...styles.progressFill,
      background: theme.primary,
    },
    card: { ...styles.panel, border: 'none', background: 'transparent', color: theme.text, padding: '0 0 16px', borderBottom: `1px solid ${theme.borderGlass}`, borderRadius: 0 },
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
    hint: {
      ...styles.inlineNote,
      color: theme.textMuted,
    },
    helper: {
      ...styles.footerNote,
      color: theme.textMuted,
    },
    listItem: {
      ...styles.passwordChecklistItem,
      color: theme.textMuted,
    },
    actionButton: {
      ...styles.button,
      ...styles.buttonGhost,
      borderColor: theme.borderGlass,
      background: theme.surfaceGlass,
      color: theme.text,
    },
    actionButtonPrimary: {
      ...styles.button,
      ...styles.buttonPrimary,
      background: theme.primary,
      color: theme.textInverse,
    },
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const displaySummary = useMemo(() => ({
    email: form.email,
    fullName: form.fullName,
  }), [form.email, form.fullName]);

  const updateField = (field: StepField, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setErrors((currentErrors) => ({ ...currentErrors, [field]: validateField(field, value) }));
      return next;
    });
    setStatus('');
  };

  const goNext = async () => {
    const field = currentStep.field;
    const value = form[field];
    const error = validateField(field, value, form);

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      if (field === 'email') {
        const response = await api.post('/api/auth/forgot-password/check-email', {
          email: normalizeEmail(form.email),
        });
        const message = response.data?.message;
        setStatus(message || 'Email found. Continue with your full name.');
        setStep(1);
        return;
      }

      if (field === 'fullName') {
        const response = await api.post('/api/auth/forgot-password/start', {
          email: normalizeEmail(form.email),
          fullName: normalizeFullName(form.fullName),
        });
        const message = response.data?.message;
        setStatus(message || 'Email found. We sent a 4-digit code to your email.');
        setStep(2);
        return;
      }

      if (field === 'code') {
        const response = await api.post('/api/auth/forgot-password/verify', {
          email: normalizeEmail(form.email),
          code: form.code.trim(),
        });
        const message = response.data?.message;
        setStatus(message || 'Code verified. Create your new password.');
        setStep(3);
        return;
      }

      if (confirmPassword !== form.password) {
        setErrors((prev) => ({ ...prev, password: 'Passwords do not match.' }));
        return;
      }

      const response = await api.post('/api/auth/forgot-password/reset', {
        email: normalizeEmail(form.email),
        code: form.code.trim(),
        password: form.password,
      });
      const message = response.data?.message;
      setForm(initialState);
      setConfirmPassword('');
      setErrors({});
      setStatus(message || 'Password updated successfully.');
      setCompleted(true);
      setRedirectCountdown(8);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStatus('');
    if (step > 0) {
      setStep((prev) => prev - 1);
      return;
    }
    navigate('/signin');
  };

  useEffect(() => {
    if (!completed) return;

    if (redirectCountdown <= 0) {
      navigate('/signin');
      return;
    }

    const timer = window.setTimeout(() => {
      setRedirectCountdown((currentCountdown) => currentCountdown - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [completed, redirectCountdown]);

  const passwordHasLetter = /[A-Za-z]/.test(form.password);
  const passwordHasNumber = /\d/.test(form.password);
  const passwordHasMinLength = form.password.length >= 8;
  const passwordHasUppercase = /[A-Z]/.test(form.password);
  const passwordHasLowercase = /[a-z]/.test(form.password);
  const passwordHasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
  const passwordMeetsRequirement = passwordHasLetter && passwordHasNumber && passwordHasMinLength && passwordHasUppercase && passwordHasLowercase && passwordHasSymbol;
  const passwordChecklist = [
    { label: 'At least 8 characters', met: passwordHasMinLength },
    { label: 'One uppercase letter', met: passwordHasUppercase },
    { label: 'One lowercase letter', met: passwordHasLowercase },
    { label: 'One number', met: passwordHasNumber },
    { label: 'One symbol', met: passwordHasSymbol },
  ];
  const passwordErrorMessage = currentStep.field === 'password' && form.password && !passwordMeetsRequirement ? 'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.' : '';
  const activeError = currentStep.field === 'password' ? passwordErrorMessage || errors.password || (confirmPassword && confirmPassword !== form.password ? 'Passwords do not match.' : '') : errors[currentStep.field];

  return (
    <>
      <Helmet>
        <title>Forgot Password | CryBots</title>
        <meta
          name="description"
          content="Reset your account password by verifying your email, full name, and a 4-digit recovery code."
        />
      </Helmet>
      <div style={hybridStyles.page}>
        <div style={styles.shell}>
          <div style={hybridStyles.glow} />
          <div style={hybridStyles.topLine} />
          <header style={styles.header}>
            <button type="button" style={hybridStyles.backButton} onClick={goBack} aria-label="Go back">
              <ArrowLeft style={styles.icon} />
            </button>
            <div style={styles.brandBlock}>
              <p style={hybridStyles.brandKicker}>CryBots</p>
              <p style={hybridStyles.brandSub}>Secure recovery flow</p>
            </div>
          </header>

          <div style={styles.grid}>
            <section style={hybridStyles.card}>
              <p style={hybridStyles.stepLabel}>Password recovery</p>
              <h2 style={styles.title}>
                <span style={styles.titleAccent}>Reset your password safely.</span>
                Confirm your identity, receive a 4-digit code, and set a new password.
              </h2>
              {completed ? (
                <NotificationBanner
                  tone="success"
                  title="Password reset complete"
                  message={(
                    <>
                      <span>Your new password has been saved. You can now sign in with it.</span>
                      <br />
                      <span>Redirecting to sign in in {redirectCountdown} second{redirectCountdown === 1 ? '' : 's'}...</span>
                    </>
                  )}
                />
              ) : null}
            </section>

            <section style={styles.panel}>
              <div style={styles.progressWrap}>
                <div style={hybridStyles.progressBar}>
                  <div style={{ ...hybridStyles.progressFill, width: `${progress}%` }} />
                </div>
                <p style={hybridStyles.stepLabel}>Step {step + 1} of {steps.length}</p>
              </div>

              <h2 style={styles.stepTitle}>{currentStep.title}</h2>
              <p style={styles.stepDesc}>{currentStep.description}</p>

              <div style={styles.form}>
                <label style={styles.field} htmlFor={currentStep.field}>
                  <span style={styles.label}>{currentStep.title}</span>
                  <input
                    id={currentStep.field}
                    type={currentStep.field === 'password' ? 'password' : 'text'}
                    placeholder={currentStep.placeholder}
                    value={form[currentStep.field]}
                    onChange={(event) => updateField(currentStep.field, currentStep.field === 'code' ? event.target.value.replace(/\D/g, '').slice(0, 4) : event.target.value)}
                    inputMode={currentStep.field === 'code' ? 'numeric' : undefined}
                    maxLength={currentStep.field === 'code' ? 4 : undefined}
                    style={hybridStyles.input}
                    autoComplete={currentStep.field === 'email' ? 'email' : currentStep.field === 'password' ? 'new-password' : 'one-time-code'}
                  />
                </label>

                {currentStep.field === 'password' ? (
                  <label style={styles.field} htmlFor="confirmPassword">
                    <span style={styles.label}>Confirm password</span>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(event) => {
                        const nextConfirmPassword = event.target.value;
                        setConfirmPassword(nextConfirmPassword);
                        setStatus('');
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          password:
                            nextConfirmPassword && nextConfirmPassword !== form.password
                              ? 'Passwords do not match.'
                              : validateField('password', form.password),
                        }));
                      }}
                      style={hybridStyles.input}
                      autoComplete="new-password"
                    />
                  </label>
                ) : null}

                {currentStep.field === 'password' ? (
                  <p style={hybridStyles.hint}>Live validation checks password length, uppercase, lowercase, number, symbol, and confirmation match.</p>
                ) : null}
                {currentStep.field === 'password' ? (
                  <ul style={styles.passwordChecklist}>
                    {passwordChecklist.map((item) => (
                      <li key={item.label} style={styles.passwordChecklistItem}>
                        <CheckCircle2
                          style={{
                            ...styles.passwordChecklistIcon,
                            color: item.met ? theme.success : theme.textMuted,
                          }}
                        />
                        <span style={{ color: item.met ? theme.success : theme.textMuted }}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {activeError ? <NotificationBanner tone="error" title="Check your details" message={activeError} /> : null}
                {status ? <NotificationBanner tone="success" title="Recovery update" message={status} /> : null}

                <div style={styles.navRow}>
                  <button
                    type="button"
                    style={hybridStyles.actionButton}
                    onClick={goBack}
                  >
                    {step === 0 ? 'Back to sign in' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    style={hybridStyles.actionButtonPrimary}
                    onClick={goNext}
                    disabled={loading}
                  >
                    {loading ? <LoadingDots /> : step === steps.length - 1 ? 'Reset password' : 'Continue'}
                  </button>
                </div>
              </div>

              <p style={hybridStyles.helper}>
                {!completed
                  ? 'We only send the recovery code after your email and account name match.'
                  : 'Please return to sign in and use your updated password.'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
