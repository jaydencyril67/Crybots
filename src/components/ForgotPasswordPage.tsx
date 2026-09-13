import React, { useMemo, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

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
    description: 'We will send a 3-digit code to your email once your details match.',
    field: 'code',
    placeholder: 'Enter 3-digit code',
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
  summaryBox: {
    display: 'grid',
    gap: '8px',
    marginTop: '16px',
    padding: '12px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
  },
  summaryKey: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
  },
  summaryValue: {
    color: '#ffffff',
    fontWeight: 700,
    textAlign: 'right' as const,
    overflowWrap: 'anywhere' as const,
    fontSize: '12px',
  },
  inlineError: {
    margin: '10px 0 0',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: 600,
  },
  inlineNote: {
    margin: '8px 0 0',
    color: 'rgba(255,255,255,0.62)',
    fontSize: '11px',
    lineHeight: 1.5,
  },
  panel: {
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    padding: 'clamp(22px, 4vw, 30px)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
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
    cursor: 'default',
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
  icon: {
    width: '20px',
    height: '20px',
    color: '#67e8f9',
    flexShrink: 0,
  },
  successBox: {
    marginTop: '18px',
    padding: '14px 16px',
    borderRadius: '18px',
    border: '1px solid rgba(74,222,128,0.3)',
    background: 'rgba(74,222,128,0.08)',
    color: '#d1fae5',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
} as const;

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
    if (!/^\d{3}$/.test(trimmed)) return 'Enter the 3-digit code sent to your email.';
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

  if (field === 'code' && !/^[0-9]{3}$/.test(trimmed)) return 'Verification code must contain exactly 3 digits.';

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
        const response = await api.post('/api/auth/forgot-password/start', {
          email: normalizeEmail(form.email),
          fullName: normalizeFullName(form.fullName),
        });
        const message = response.data?.message;
        setStatus(message || 'Email accepted. Continue with your full name.');
        setStep(1);
        return;
      }

      if (field === 'fullName') {
        setStatus('Full name matched. We sent a 3-digit code to your email.');
        setStep(2);
        return;
      }

      if (field === 'code') {
        const response = await api.post('/api/auth/forgot-password/verify-code', {
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
      setStatus(message || 'Password updated successfully.');
      setCompleted(true);
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
    window.location.href = '/signin';
  };

  const activeError = currentStep.field === 'password' ? errors.password || (confirmPassword && confirmPassword !== form.password ? 'Passwords do not match.' : '') : errors[currentStep.field];

  return (
    <>
      <Helmet>
        <title>Forgot Password | Kingshall</title>
        <meta
          name="description"
          content="Reset your account password by verifying your email, full name, and a 3-digit recovery code."
        />
      </Helmet>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.glow} />
          <div style={styles.topLine} />
          <header style={styles.header}>
            <button type="button" style={styles.backButton} onClick={goBack} aria-label="Go back">
              <ArrowLeft style={styles.icon} />
            </button>
            <div style={styles.brandBlock}>
              <p style={styles.brandKicker}>Kingshall</p>
              <p style={styles.brandSub}>Secure recovery flow</p>
            </div>
          </header>

          <div style={styles.grid}>
            <section style={styles.heroCard}>
              <p style={styles.stepLabel}>Password recovery</p>
              <h1 style={styles.title}>
                <span style={styles.titleAccent}>Reset your password safely.</span>
                Confirm your identity, receive a 3-digit code, and set a new password.
              </h1>
              {completed ? (
                <div style={styles.successBox}>
                  <CheckCircle2 style={styles.icon} />
                  <div>
                    <strong>Password reset complete.</strong>
                    <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.78)', fontSize: '13px', lineHeight: 1.6 }}>
                      Your new password has been saved. You can now sign in with it.
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            <section style={styles.panel}>
              <div style={styles.progressWrap}>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
                <p style={styles.stepLabel}>Step {step + 1} of {steps.length}</p>
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
                    onChange={(event) => updateField(currentStep.field, event.target.value)}
                    style={styles.input}
                    autoComplete={currentStep.field === 'email' ? 'email' : currentStep.field === 'password' ? 'new-password' : 'off'}
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
                      style={styles.input}
                      autoComplete="new-password"
                    />
                  </label>
                ) : null}

                {currentStep.field === 'password' ? (
                  <p style={styles.inlineNote}>Live validation checks password length, uppercase, lowercase, number, symbol, and confirmation match.</p>
                ) : null}

                {activeError ? <p style={styles.inlineError}>{activeError}</p> : null}
                {status ? (
                  <div style={styles.successBox}>
                    <ShieldCheck style={styles.icon} />
                    <div>
                      <strong>Recovery update</strong>
                      <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.78)', fontSize: '13px', lineHeight: 1.6 }}>
                        {status}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div style={styles.navRow}>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.buttonGhost }}
                    onClick={goBack}
                  >
                    {step === 0 ? 'Back to sign in' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={goNext}
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : step === steps.length - 1 ? 'Reset password' : 'Continue'}
                  </button>
                </div>
              </div>

              <p style={styles.footerNote}>
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
