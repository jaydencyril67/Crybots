import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, Shield } from 'lucide-react';

const steps = [
  { title: 'Email', description: 'Enter the email connected to your KingsHall account.', field: 'email', placeholder: 'Enter your email', type: 'email' },
  { title: 'Sign-in method', description: 'Choose how you want to sign in today.', field: 'method' },
] as const;

type StepField = (typeof steps)[number]['field'];

type FormState = {
  email: string;
  method: string;
};

const initialState: FormState = {
  email: '',
  method: '',
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

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValidEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  const emailInputStyle =
    form.email && !isValidEmail(form.email)
      ? { ...styles.input, borderColor: 'rgba(248, 113, 113, 0.9)', boxShadow: '0 0 0 1px rgba(248, 113, 113, 0.35)', background: 'rgba(127, 29, 29, 0.14)' }
      : styles.input;

  const handleNext = () => {
    if (!canContinue) return;
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentField = (() => {
    switch (current.field) {
      case 'email':
        return (
          <div style={styles.field}>
            <label style={styles.label} htmlFor="signin-email">
              Email
            </label>
            <input
              id="signin-email"
              style={current.field === 'email' ? emailInputStyle : styles.input}
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder={current.placeholder}
              autoComplete="email"
            />
          </div>
        );
      case 'method':
        return (
          <div style={styles.field}>
            <label style={styles.label}>Choose a sign-in method</label>
            <div style={styles.optionGrid}>
              {[
                { value: 'email-code', title: 'Email one-time code', description: 'We’ll send a secure code to your inbox.', icon: Mail },
                { value: 'password', title: 'Password', description: 'Sign in with your account password.', icon: KeyRound },
              ].map(({ value, title, description, icon: Icon }) => {
                const active = form.method === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField('method', value)}
                    style={{
                      ...styles.optionCard,
                      ...(active ? styles.optionCardActive : null),
                    }}
                  >
                    <Icon style={styles.iconLarge} />
                    <span>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>{title}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px', lineHeight: 1.5 }}>{description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

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
                <p style={styles.brandSub}>Secure sign-in flow, no auth wired yet.</p>
              </div>
            </header>

            <div style={styles.grid}>
              <article style={styles.heroCard}>
                <h1 style={styles.title}>
                  Welcome back.
                  <span style={styles.titleAccent}>Sign in fast.</span>
                </h1>
                <p style={styles.lead}>A simple guided sign-in flow built to connect to backend auth later.</p>
              </article>

              <article style={styles.panel}>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                  </div>
                  <div>Step {stepIndex + 1} of {steps.length}</div>
                </div>

                <p style={styles.stepLabel}>{current.title}</p>
                <h2 style={styles.stepTitle}>Let’s verify your access</h2>
                <p style={styles.stepDesc}>{current.description}</p>

                <div style={styles.form}>{currentField}</div>

                {stepIndex === steps.length - 1 ? (
                  <div style={styles.footerNote}>
                    Your email is already captured above. Choose the method you want to continue with.
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
                      Next
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
                      Continue
                    </button>
                  )}
                </div>

                <p style={styles.footerNote}>
                  This sign-in page currently stores values in local page state only.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default SigninPage;
