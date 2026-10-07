import React, { useMemo, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Lock, Mail } from 'lucide-react';
import InlineLoadingDots from './InlineLoadingDots';
import NotificationBanner from './NotificationBanner';
import ReusableDatePage from './ReusableDatePage';
import { navigate } from '../utils/navigate';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const steps = [
  { title: 'First name', description: 'Tell us how to address you.', field: 'firstName', placeholder: 'Enter your first name' },
  { title: 'Last name', description: 'Add your family name.', field: 'lastName', placeholder: 'Enter your last name' },
  { title: 'Gender', description: 'Choose the option that fits you best.', field: 'gender' },
  { title: 'Date of birth', description: 'You must be at least 18 years old to create an account.', field: 'dob' },
  { title: 'Email', description: 'This will be your login and notification email.', field: 'email', placeholder: 'Enter your email' },
  { title: 'Password', description: 'Create a strong password for your account.', field: 'password', placeholder: 'Create a password' },
] as const;

type StepField = (typeof steps)[number]['field'];

type FormState = Record<StepField, string>;

const initialState: FormState = {
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  email: '',
  password: '',
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
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
    padding: '10px',
    borderRadius: '16px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
  },
  heroCard: {
    borderRadius: '24px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
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
  summaryBox: {
    display: 'grid',
    gap: '8px',
    marginTop: '16px',
    padding: '12px',
    borderRadius: '16px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceShine,
  },
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
  panel: {
    borderRadius: '16px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    padding: 'clamp(18px, 3.2vw, 24px)',
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
    background: theme.surfaceMuted,
    overflow: 'hidden',
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
  radioRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  radioCard: {
    borderRadius: '18px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceElevated,
    color: theme.text,
    padding: '14px 16px',
    cursor: 'pointer',
  },
  radioCardActive: {
    border: `1px solid ${theme.primary}`,
    background: theme.primarySoft,
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
    color: theme.textMuted,
    fontSize: '14px',
  },
  switchLink: {
    border: 'none',
    background: 'transparent',
    color: theme.primary,
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
  iconLarge: {
    width: '24px',
    height: '24px',
    color: theme.primary,
    flexShrink: 0,
  },
});

const SignupPage = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [dobError, setDobError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showDobPage, setShowDobPage] = useState(false);
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  const current = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const isLastStep = stepIndex === steps.length - 1;

  const handleReturn = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate('/');
  };

  const canContinue = useMemo(() => {
    const value = form[current.field];
    return value.trim().length > 0;
  }, [current.field, form]);

  const updateField = (field: StepField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'dob') {
      setDobError('');
    }
    if (field === 'email') {
      setEmailError('');
    }
    setSubmitError('');
  };

  const emailInputStyle =
    form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? { ...styles.input, borderColor: theme.danger, background: theme.surface }
      : styles.input;

  const passwordHasLetter = /[A-Za-z]/.test(form.password);
  const passwordHasNumber = /\d/.test(form.password);
  const passwordHasMinLength = form.password.length >= 8;
  const passwordHasUppercase = /[A-Z]/.test(form.password);
  const passwordHasLowercase = /[a-z]/.test(form.password);
  const passwordHasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
  const passwordMeetsRequirement = passwordHasLetter && passwordHasNumber && passwordHasMinLength && passwordHasUppercase && passwordHasLowercase && passwordHasSymbol;
  const passwordNotice = 'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.';
  const passwordErrorMessage = form.password && !passwordMeetsRequirement ? passwordNotice : '';
  const passwordInputStyle =
    passwordErrorMessage
      ? { ...styles.input, borderColor: theme.danger, background: theme.surface }
      : styles.input;

  const isAtLeast18 = (value: string) => {
    if (!value) return false;

    const dob = new Date(value);
    if (Number.isNaN(dob.getTime())) return false;

    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    return dob <= eighteenYearsAgo;
  };

  const dobMeetsRequirement = current.field === 'dob' ? isAtLeast18(form.dob) : true;

  const handleNext = async () => {
    if (current.field === 'email') {
      const email = form.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Enter a valid email address to continue.');
        return;
      }

      setEmailError('');
      setIsCheckingEmail(true);
      try {
        await api.post('/api/auth/signup/check-email', { email });
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Unable to verify this email right now. Please try again.';
        setEmailError(message);
        return;
      } finally {
        setIsCheckingEmail(false);
      }
    }

    if (current.field === 'dob' && !isAtLeast18(form.dob)) {
      setDobError('You must be at least 18 years old to continue.');
      return;
    }

    if (current.field === 'password' && !passwordMeetsRequirement) {
      setPasswordError(passwordNotice);
      return;
    }

    setDobError('');
    setPasswordError('');
    if (!canContinue || !dobMeetsRequirement) return;
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleFinish = async () => {
    if (!passwordMeetsRequirement) {
      setPasswordError(passwordNotice);
      return;
    }

    if (!isAtLeast18(form.dob)) {
      setDobError('You must be at least 18 years old to continue.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/signup', {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        dob: form.dob,
        email: form.email,
        password: form.password,
        referralCode: new URLSearchParams(window.location.search).get('ref') || undefined,
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (typeof response.data.user.firstName === 'string' && response.data.user.firstName.trim()) {
          localStorage.setItem('firstName', response.data.user.firstName.trim());
          localStorage.setItem('kingshall_first_name', response.data.user.firstName.trim());
        }
      }

      setSubmitError('');
      setStepIndex(steps.length - 1);
      navigate('/signup-confirmation-sent');
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to create your account right now. Please try again.';
      setSubmitError(message);

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const passwordChecklist = [
    { label: 'At least 8 characters', met: passwordHasMinLength },
    { label: 'One uppercase letter', met: passwordHasUppercase },
    { label: 'One lowercase letter', met: passwordHasLowercase },
    { label: 'One number', met: passwordHasNumber },
    { label: 'One symbol', met: passwordHasSymbol },
  ];

  const maxDob = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  }, []);

  if (showDobPage) {
    return (
      <ReusableDatePage
        title="Date of birth"
        description="You must be at least 18 years old to create an account. Enter your birthday and confirm to continue."
        value={form.dob}
        min="1900-01-01"
        max={maxDob}
        cancelLabel="Back"
        showNowBar={false}
        onConfirm={(value) => {
          updateField('dob', value);
          setShowDobPage(false);
        }}
        onCancel={() => setShowDobPage(false)}
      />
    );
  }

  const currentField = (() => {
    switch (current.field) {
      case 'firstName':
      case 'lastName':
      case 'email':
      case 'password':
        return (
          <div style={styles.field}>
            <label style={styles.label} htmlFor={current.field}>
              {current.title}
            </label>
            <input
              id={current.field}
              style={current.field === 'email' ? emailInputStyle : current.field === 'password' ? passwordInputStyle : styles.input}
              type={current.field === 'password' ? 'password' : current.field === 'email' ? 'email' : 'text'}
              value={form[current.field]}
              onChange={(event) => updateField(current.field, event.target.value)}
              placeholder={current.placeholder}
              autoComplete={current.field}
            />
            {current.field === 'password' ? <p style={styles.inlineNote}>{passwordNotice}</p> : null}
            {current.field === 'password' ? (
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
            {current.field === 'email' && emailError ? <NotificationBanner tone="error" title="Check your email" message={emailError} /> : null}
            {current.field === 'password' && passwordErrorMessage ? <p style={styles.inlineError}>{passwordErrorMessage}</p> : null}
          </div>
        );
      case 'gender':
        return (
          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <div style={styles.radioRow}>
              {['Male', 'Female'].map((option) => {
                const active = form.gender === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('gender', option)}
                    style={{
                      ...styles.radioCard,
                      ...(active ? styles.radioCardActive : null),
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'dob':
        return (
          <div style={styles.field}>
            <label style={styles.label} htmlFor={current.field}>
              Date of birth
            </label>
            <button
              id={current.field}
              type="button"
              onClick={() => setShowDobPage(true)}
              style={{
                ...styles.input,
                textAlign: 'left',
                cursor: 'pointer',
                ...(form.dob && !dobMeetsRequirement
                  ? { borderColor: theme.danger, background: theme.surface }
                  : null),
              }}
            >
              {form.dob || 'Select your date of birth'}
            </button>
            {dobError ? <NotificationBanner tone="error" title="Check your details" message={dobError} /> : null}
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <Helmet>
        <title>CryBots | Signup</title>
        <meta
          name="description"
          content="Create your CryBots trading bot account with a modern step-by-step signup flow."
        />
      </Helmet>

      <main style={styles.page}>
        <section style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={styles.glow} />
          <div style={styles.topLine} />

          <div style={styles.shell}>
            

            <div style={styles.grid}>
              <article style={styles.heroCard}>
                <h2 style={styles.title}>
                  Quick signup.
                  <span style={styles.titleAccent}>Simple start.</span>
                </h2>
                <p style={styles.lead}>Just a short guided flow.</p>
              </article>

              <article style={styles.panel}>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                  </div>
                  <div>
                    Step {stepIndex + 1} of {steps.length}
                  </div>
                </div>

                <p style={styles.stepLabel}>{current.title}</p>
                <h3 style={styles.stepTitle}>Let’s set up your profile</h3>
                <p style={styles.stepDesc}>{current.description}</p>

                <div style={styles.form}>{currentField}</div>

                {stepIndex === steps.length - 1 ? (
                  <div style={styles.summaryBox}>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryKey}>First name</span>
                      <span style={styles.summaryValue}>{form.firstName || '—'}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryKey}>Last name</span>
                      <span style={styles.summaryValue}>{form.lastName || '—'}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryKey}>Gender</span>
                      <span style={styles.summaryValue}>{form.gender || '—'}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryKey}>Date of birth</span>
                      <span style={styles.summaryValue}>{form.dob || '—'}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryKey}>Email</span>
                      <span style={styles.summaryValue}>{form.email || '—'}</span>
                    </div>
                  </div>
                ) : null}

                <div style={styles.navRow}>
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={stepIndex === 0}
                    style={{
                      ...styles.button,
                      ...styles.buttonGhost,
                      opacity: stepIndex === 0 ? 0.45 : 1,
                      cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Back
                  </button>

                  {!isLastStep ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canContinue || isCheckingEmail}
                      style={{
                        ...styles.button,
                        ...styles.buttonPrimary,
                        opacity: canContinue && !isCheckingEmail ? 1 : 0.55,
                        cursor: canContinue && !isCheckingEmail ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {isCheckingEmail ? <InlineLoadingDots /> : <>Next <ArrowRight style={{ ...styles.icon, display: 'inline-block', marginLeft: '6px' }} /></>}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={!canContinue || isSubmitting}
                      style={{
                        ...styles.button,
                        ...styles.buttonPrimary,
                        opacity: canContinue && !isSubmitting ? 1 : 0.55,
                        cursor: canContinue && !isSubmitting ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {isSubmitting ? <InlineLoadingDots /> : <>Finish <CheckCircle2 style={{ ...styles.icon, display: 'inline-block', marginLeft: '6px' }} /></>}
                    </button>
                  )}
                </div>

                {submitError ? <NotificationBanner tone="warning" title="One more step" message={submitError} /> : null}
                <div style={styles.switchRow}>
                  <span style={styles.switchText}>Have an account?</span>
                  <button type="button" onClick={() => { navigate('/signin'); }} style={styles.switchLink}>
                    Sign in here
                  </button>
                </div>
                <p style={styles.footerNote}>
                  Your account will be created on the CryBotss backend when you finish signup.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default SignupPage;
