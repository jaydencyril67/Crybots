import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Fingerprint, KeyRound, Wallet, UserRound, Bell, Sparkles, SkipForward, type LucideIcon } from 'lucide-react';
import { useAppTheme, type AppThemePreference } from './AppTheme';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { navigate } from '../utils/navigate';

type SetupStep = { id: string; title: string; description: string; detail: string; route: string; icon: LucideIcon };

const setupSteps: SetupStep[] = [
  { id: 'profile', title: 'Add a profile photo', description: 'Make your account feel like yours.', detail: 'Choose a clear photo or avatar in your profile details.', route: '/details', icon: UserRound },
  { id: 'security-code', title: 'Create a security code', description: 'Add an extra check for sensitive account actions.', detail: 'You can create or manage your security code in Security.', route: '/security', icon: KeyRound },
  { id: 'biometric', title: 'Enable biometric security', description: 'Use a passkey where your device supports it.', detail: 'Fingerprint, face unlock, or a compatible security key may be available.', route: '/security', icon: Fingerprint },
  { id: 'two-factor', title: 'Bind an authenticator', description: 'Protect sign-ins with a rotating 2FA code.', detail: 'Set up an authenticator app and safely store your recovery details.', route: '/security', icon: ShieldCheck },
  { id: 'wallet', title: 'Add a wallet address', description: 'Save a supported wallet for the network you use.', detail: 'Double-check the network and address before saving; blockchain transfers can be irreversible.', route: '/manage', icon: Wallet },
  { id: 'notifications', title: 'Review notifications', description: 'Choose how you keep up with account activity.', detail: 'Review your alerts and notification preferences.', route: '/alert', icon: Bell },
];

const OnboardingWizard = () => {
  const { themeMode, themePreference, setThemePreference } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [stepIndex, setStepIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [opening, setOpening] = useState(false);
  const themeChoices: Array<{ key: AppThemePreference; label: string; description: string; preview: 'dark' | 'light' }> = [
    { key: 'dark', label: 'Dark', description: 'Deep, focused surfaces', preview: 'dark' },
    { key: 'light', label: 'Light', description: 'Bright and easy to read', preview: 'light' },
    { key: 'system', label: 'System', description: 'Follow your device', preview: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark' },
    { key: 'shift', label: 'Shift', description: 'Light by day, dark at night', preview: new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'light' : 'dark' },
  ];
  const current = setupSteps[stepIndex];
  const completedCount = skipped.length;
  const progress = Math.round(((stepIndex + 1) / setupSteps.length) * 100);
  const styles = useMemo(() => ({
    page: { minHeight: '100vh', padding: 'clamp(16px, 4vw, 36px) 14px 32px', boxSizing: 'border-box' as const, background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: '760px', margin: '0 auto' },
    top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '22px' },
    brand: { color: theme.primary, fontSize: '12px', fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase' as const },
    panel: { border: '1px solid ' + theme.borderGlass, background: theme.surfaceGlass, borderRadius: '24px', padding: 'clamp(18px, 4vw, 30px)', boxShadow: '0 18px 60px rgba(0,0,0,.12)', backdropFilter: 'blur(18px)' },
    progressTrack: { height: '6px', borderRadius: '99px', overflow: 'hidden', background: theme.borderGlass, marginTop: '18px' },
    progress: { height: '100%', width: progress + '%', borderRadius: '99px', background: theme.primary, transition: 'width .25s ease' },
    eyebrow: { color: theme.primary, fontSize: '11px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' as const, margin: '0 0 10px' },
    heading: { fontSize: 'clamp(1.65rem, 5vw, 2.4rem)', lineHeight: 1.08, letterSpacing: '-.04em', margin: '0 0 12px' },
    muted: { color: theme.textMuted, lineHeight: 1.65, fontSize: '14px', margin: 0 },
    themeCard: { marginTop: '20px', border: '1px solid ' + theme.borderGlass, background: theme.surfaceMuted, borderRadius: '18px', padding: '15px' },
    themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '9px', marginTop: '12px' },
    themeChoice: { minWidth: 0, textAlign: 'left' as const, borderRadius: '13px', padding: '11px', cursor: 'pointer', background: theme.surface, color: theme.text, border: '1px solid ' + theme.borderGlass },
    themeSwatch: { height: '32px', borderRadius: '8px', marginBottom: '9px', border: '1px solid ' + theme.borderGlass },
    stepCard: { marginTop: '22px', border: '1px solid ' + theme.borderGlass, background: theme.surfaceMuted, borderRadius: '20px', padding: '18px' },
    icon: { width: '48px', height: '48px', borderRadius: '15px', background: theme.primarySoft, color: theme.primary, display: 'grid', placeItems: 'center', marginBottom: '16px' },
    stepTitle: { margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 850 },
    actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' },
    primary: { border: 'none', borderRadius: '13px', padding: '13px 15px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '46px' },
    secondary: { border: '1px solid ' + theme.border, borderRadius: '13px', padding: '12px 15px', background: theme.surface, color: theme.text, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '46px' },
    list: { display: 'grid', gap: '8px', marginTop: '20px' },
    listRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '12px', background: theme.surfaceMuted, border: '1px solid ' + theme.borderGlass, fontSize: '13px' },
    dot: { width: '8px', height: '8px', borderRadius: '50%', background: theme.textMuted, flexShrink: 0 },
  }), [theme, progress]);

  const finish = () => {
    localStorage.setItem('crybots_onboarding_completed', 'true');
    localStorage.setItem('crybots_onboarding_skipped', JSON.stringify(skipped));
    setFinished(true);
    navigate('/home');
  };
  const skipStep = () => {
    const nextSkipped = skipped.includes(current.id) ? skipped : [...skipped, current.id];
    setSkipped(nextSkipped);
    setOpening(false);
    if (stepIndex >= setupSteps.length - 1) {
      localStorage.setItem('crybots_onboarding_completed', 'true');
      localStorage.setItem('crybots_onboarding_skipped', JSON.stringify(nextSkipped));
      navigate('/home');
    } else {
      setStepIndex((previous) => Math.min(previous + 1, setupSteps.length - 1));
    }
  };
  const openStep = () => {
    setOpening(true);
    localStorage.setItem('crybots_onboarding_return_step', current.id);
    navigate(current.route);
  };

  return (
    <>
      <Helmet><title>CryBots | Get set up</title><meta name="description" content="A guided setup for your CryBots account." /></Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.top}>
            <div><div style={styles.brand}>CryBots · Quick setup</div><p style={{ ...styles.muted, marginTop: '5px' }}>Powered by KingsHall</p></div>
            <button type="button" onClick={finish} style={{ ...styles.secondary, minHeight: '40px', padding: '9px 12px' }}>Skip all</button>
          </div>
          <section style={styles.panel}>
            {finished ? <><div style={styles.icon}><Check size={23} /></div><h1 style={styles.heading}>You’re all set.</h1><p style={styles.muted}>You can finish any skipped setup later from your account pages.</p><button type="button" style={{ ...styles.primary, width: '100%', marginTop: '20px' }} onClick={() => navigate('/home')}>Go to CryBots <ArrowRight size={17} /></button></> : <>
              <p style={styles.eyebrow}><Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Your account, your way</p>
              <h1 style={styles.heading}>Let’s get your account ready.</h1>
              <p style={styles.muted}>A few quick steps can make your account safer and easier to use. Do what you can now — every step can be skipped, and you can return later.</p>
              <section style={styles.themeCard}>
                <div style={{ fontWeight: 850, fontSize: '14px' }}>Choose your appearance</div>
                <p style={{ ...styles.muted, marginTop: '4px', fontSize: '12px' }}>Preview and apply your preferred CryBots theme. You can change it any time in Options.</p>
                <div style={styles.themeGrid}>
                  {themeChoices.map((choice) => {
                    const previewTheme = HYBRID_THEME_TOKENS[choice.preview];
                    const selected = themePreference === choice.key;
                    return <button key={choice.key} type="button" aria-pressed={selected} onClick={() => setThemePreference(choice.key)} style={{ ...styles.themeChoice, borderColor: selected ? theme.primary : theme.borderGlass, boxShadow: selected ? '0 0 0 1px ' + theme.primary : 'none' }}>
                      <div style={{ ...styles.themeSwatch, background: previewTheme.background, boxShadow: 'inset 0 -10px 0 ' + previewTheme.surfaceGlass }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px', fontWeight: 850, fontSize: '13px' }}>{choice.label}{selected ? <Check size={15} /> : null}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px', lineHeight: 1.4, marginTop: '4px' }}>{choice.description}</div>
                    </button>;
                  })}
                </div>
              </section>
              <div style={styles.progressTrack}><div style={styles.progress} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '9px', color: theme.textMuted, fontSize: '12px' }}><span>Step {stepIndex + 1} of {setupSteps.length}</span><span>{completedCount} skipped</span></div>
              <article style={styles.stepCard}>
                <div style={styles.icon}><current.icon size={23} /></div>
                <h2 style={styles.stepTitle}>{current.title}</h2>
                <p style={styles.muted}>{current.description}</p>
                <p style={{ ...styles.muted, marginTop: '10px', fontSize: '13px' }}>{current.detail}</p>
                <div style={styles.actions}>
                  <button type="button" style={styles.secondary} onClick={skipStep}><SkipForward size={16} /> Skip this</button>
                  <button type="button" style={styles.primary} onClick={openStep} disabled={opening}>{opening ? 'Opening…' : <>Set up <ArrowRight size={16} /></>}</button>
                </div>
              </article>
              <div style={styles.list}>
                {setupSteps.map((step, index) => <div key={step.id} style={{ ...styles.listRow, borderColor: index === stepIndex ? theme.primary : theme.borderGlass }}><span style={{ ...styles.dot, background: skipped.includes(step.id) ? theme.textMuted : index < stepIndex ? theme.primary : theme.borderGlass }} /> <span style={{ flex: 1 }}>{step.title}</span>{skipped.includes(step.id) ? <span style={{ color: theme.textMuted, fontSize: '11px' }}>Skipped</span> : index === stepIndex ? <span style={{ color: theme.primary, fontSize: '11px', fontWeight: 800 }}>CURRENT</span> : null}</div>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '18px' }}>
                <button type="button" style={styles.secondary} disabled={stepIndex === 0} onClick={() => { setOpening(false); setStepIndex((previous) => Math.max(0, previous - 1)); }}><ArrowLeft size={16} /> Back</button>
                <button type="button" style={styles.secondary} onClick={() => { setOpening(false); if (stepIndex === setupSteps.length - 1) finish(); else setStepIndex((previous) => previous + 1); }}>{stepIndex === setupSteps.length - 1 ? 'Finish setup' : 'Next step'} <ArrowRight size={16} /></button>
              </div>
            </>}
          </section>
        </div>
      </main>
    </>
  );
};

export default OnboardingWizard;
