import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleUser, CreditCard, Lock, Mail, Shield, Sparkles } from 'lucide-react';

const steps = [
  { title: 'First name', description: 'Tell us how to address you.', field: 'firstName', placeholder: 'Enter your first name' },
  { title: 'Last name', description: 'Add your family name.', field: 'lastName', placeholder: 'Enter your last name' },
  { title: 'Gender', description: 'Choose the option that fits you best.', field: 'gender' },
  { title: 'Date of birth', description: 'We use this for account verification.', field: 'dob' },
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
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '999px',
    border: '1px solid rgba(34,211,238,0.18)',
    background: 'rgba(34,211,238,0.1)',
    padding: '10px 14px',
    color: '#cffafe',
    fontSize: '14px',
    fontWeight: 600,
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
    cursor: 'pointer',
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
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    padding: 'clamp(22px, 4vw, 32px)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  title: {
    margin: '18px 0 0',
    fontSize: 'clamp(2.2rem, 4vw, 3.8rem)',
    lineHeight: 1.02,
    letterSpacing: '-0.04em',
  },
  titleAccent: {
    display: 'block',
    background: 'linear-gradient(90deg, #67e8f9 0%, #ffffff 45%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: {
    margin: '18px 0 0',
    fontSize: 'clamp(15px, 2vw, 18px)',
    lineHeight: 1.8,
    color: 'rgba(255,255,255,0.72)',
  },
  featureList: {
    display: 'grid',
    gap: '14px',
    marginTop: '28px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(10,16,32,0.72)',
    padding: '16px 18px',
  },
  featureText: {
    margin: 0,
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  summaryBox: {
    display: 'grid',
    gap: '10px',
    marginTop: '20px',
    padding: '16px',
    borderRadius: '20px',
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
    color: 'rgba(255,255,255,0.62)',
    fontSize: '13px',
  },
  summaryValue: {
    color: '#ffffff',
    fontWeight: 700,
    textAlign: 'right' as const,
    overflowWrap: 'anywhere',
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
  radioRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  radioCard: {
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(10,16,32,0.72)',
    padding: '14px 16px',
    cursor: 'pointer',
  },
  radioCardActive: {
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
    boxShadow: '0 12px 40px rgba(255,255,255,0.08)',
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
  iconLarge: {
    width: '24px',
    height: '24px',
    color: '#67e8f9',
    flexShrink: 0,
  },
};

const SignupPage = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);

  const current = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const isLastStep = stepIndex === steps.length - 1;

  const handleReturn = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.pathname = '/';
  };

  const canContinue = useMemo(() => {
    const value = form[current.field];
    return value.trim().length > 0;
  }, [current.field, form]);

  const updateField = (field: StepField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!canContinue) return;
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

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
              style={styles.input}
              type={current.field === 'password' ? 'password' : current.field === 'email' ? 'email' : 'text'}
              value={form[current.field]}
              onChange={(event) => updateField(current.field, event.target.value)}
              placeholder={current.placeholder}
              autoComplete={current.field}
            />
          </div>
        );
      case 'gender':
        return (
          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <div style={styles.radioRow}>
              {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => {
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
            <input
              id={current.field}
              style={styles.input}
              type="date"
              value={form.dob}
              onChange={(event) => updateField('dob', event.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Signup</title>
        <meta
          name="description"
          content="Create your KingsHall Exchange account with a modern step-by-step signup flow."
        />
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
                <p style={styles.brandSub}>Secure signup experience, no auth wired yet.</p>
              </div>
              <div style={styles.badge}>
                <Sparkles style={styles.icon} />
                Progressive signup
              </div>
            </header>

            <div style={styles.grid}>
              <article style={styles.heroCard}>
                <div style={styles.badge}>
                  <Shield style={styles.icon} />
                  KingsHall onboarding
                </div>
                <h1 style={styles.title}>
                  Join the platform.
                  <span style={styles.titleAccent}>One step at a time.</span>
                </h1>
                <p style={styles.lead}>
                  Complete your profile in a guided flow. We will not authenticate anything yet — this is just the signup page structure.
                </p>

                <div style={styles.featureList}>
                  <div style={styles.featureItem}>
                    <CircleUser style={styles.iconLarge} />
                    <p style={styles.featureText}>Simple fields arranged in a smooth progression.</p>
                  </div>
                  <div style={styles.featureItem}>
                    <Mail style={styles.iconLarge} />
                    <p style={styles.featureText}>Email and password are saved only in local page state for now.</p>
                  </div>
                  <div style={styles.featureItem}>
                    <CreditCard style={styles.iconLarge} />
                    <p style={styles.featureText}>Designed to be easy to connect to backend auth later.</p>
                  </div>
                </div>
              </article>

              <article style={styles.panel}>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                  </div>
                  <div style={styles.badge}>
                    Step {stepIndex + 1} of {steps.length}
                  </div>
                </div>

                <p style={styles.stepLabel}>{current.title}</p>
                <h2 style={styles.stepTitle}>Let’s set up your profile</h2>
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
                      disabled={!canContinue}
                      style={{
                        ...styles.button,
                        ...styles.buttonPrimary,
                        opacity: canContinue ? 1 : 0.55,
                        cursor: canContinue ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Continue <ArrowRight style={{ ...styles.icon, display: 'inline-block', marginLeft: '6px' }} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canContinue}
                      style={{
                        ...styles.button,
                        ...styles.buttonPrimary,
                        opacity: canContinue ? 1 : 0.55,
                        cursor: canContinue ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Finish setup <CheckCircle2 style={{ ...styles.icon, display: 'inline-block', marginLeft: '6px' }} />
                    </button>
                  )}
                </div>

                <p style={styles.footerNote}>
                  This page currently stores form data locally only. Next we can connect it to your actual signup/auth flow.
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
