import React from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, CircleDollarSign, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import InstallAppButton from './InstallAppButton';
import { isTokenValid } from '../utils/auth';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';

const stats = [
  { value: '$2.4B+', label: '24h trading volume' },
  { value: '140+', label: 'global markets' },
  { value: '99.98%', label: 'platform uptime' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Institution-grade security',
    description: 'Multi-layer protection, cold storage, and real-time risk monitoring keep every transaction protected.',
  },
  {
    icon: TrendingUp,
    title: 'Smart bot strategies',
    description: 'Rent, build, and buy automated trading bots with dashboards for confident crypto strategy decisions.',
  },
  {
    icon: CircleDollarSign,
    title: 'Fast deposits & withdrawals',
    description: 'Move funds quickly with low-friction crypto rails and streamlined asset management.',
  },
  {
    icon: Users,
    title: 'Built for modern investors',
    description: 'Join a premium ecosystem designed for individuals, teams, and long-term builders.',
  },
];

const steps = [
  'Create your CryBots profile in minutes.',
  'Fund your account with crypto or supported payment rails.',
  'Trade, invest, and track your growth in one elegant dashboard.',
];

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflow: 'hidden',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    position: 'relative' as const,
    maxWidth: '1160px',
    margin: '0 auto',
    padding: 'clamp(14px, 2.5vw, 24px) clamp(12px, 2vw, 20px) 32px',
  },
  glow: {
    position: 'absolute' as const,
    inset: 0,
    background: theme.background,
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    insetInline: 0,
    top: 0,
    height: '1px',
    background: theme.borderStrong,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    padding: '14px 20px',
    borderRadius: '999px',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    position: 'relative' as const,
    zIndex: 1,
    flexWrap: 'wrap' as const,
  },
  brandBlock: {
    minWidth: 0,
    flex: '1 1 220px',
  },
  brandKicker: {
    fontSize: 'clamp(14px, 1.6vw, 16px)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.22em',
    color: theme.textMuted,
    margin: 0,
    fontWeight: 800,
  },
  brandSub: {
    margin: '6px 0 0',
    fontSize: 'clamp(13px, 1.5vw, 15px)',
    color: theme.textMuted,
  },
  buttonPrimary: {
    borderRadius: '999px',
    background: theme.surfaceGlass,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    padding: '12px 20px',
    fontWeight: 800,
    width: 'clamp(104px, 36vw, 160px)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  buttonSecondary: {
    border: `1px solid ${theme.borderGlass}`,
    borderRadius: '999px',
    background: theme.surfaceGlass,
    color: theme.text,
    padding: '12px 20px',
    fontWeight: 700,
    width: 'clamp(104px, 36vw, 160px)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 'clamp(20px, 4vw, 44px)',
    alignItems: 'center',
    padding: 'clamp(28px, 5vw, 56px) 0 clamp(28px, 4vw, 44px)',
    position: 'relative' as const,
    zIndex: 1,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '999px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    color: theme.text,
    padding: '8px 14px',
    fontSize: '13px',
    marginBottom: '18px',
    maxWidth: '100%',
  },
  heading: {
    fontSize: 'clamp(2.3rem, 5vw, 4.4rem)',
    lineHeight: 1.02,
    margin: 0,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    wordBreak: 'break-word' as const,
  },
  gradientText: {
    display: 'block',
    background: `linear-gradient(90deg, ${theme.text} 0%, ${theme.textMuted} 45%, ${theme.text} 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: {
    marginTop: '18px',
    maxWidth: '680px',
    fontSize: 'clamp(15px, 1.8vw, 17px)',
    lineHeight: 1.65,
    color: theme.textMuted,
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginTop: '28px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonLink: {
    textDecoration: 'none',
  },
  buttonLinkButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    font: 'inherit',
    color: theme.text,
  },
  statsGroup: {
    marginTop: '26px',
    display: 'grid',
    gap: '10px',
    padding: '10px',
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
  },
  statCard: {
    borderRadius: '15px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    padding: '14px',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    minWidth: 0,
  },
  statValue: {
    fontSize: 'clamp(22px, 3vw, 28px)',
    fontWeight: 700,
    margin: 0,
    wordBreak: 'break-word' as const,
  },
  statLabel: {
    margin: '10px 0 0',
    fontSize: '14px',
    color: theme.textMuted,
  },
  panelWrap: {
    position: 'relative' as const,
  },
  panelGlow: {
    position: 'absolute' as const,
    inset: '-24px',
    borderRadius: '32px',
    background: `linear-gradient(135deg, ${theme.primarySoft}, ${theme.primarySoft}, transparent)`,
    filter: 'none',
  },
  panel: {
    position: 'relative' as const,
    borderRadius: '26px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '18px',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  },
  signupPreviewWrap: {
    marginTop: '24px',
    overflow: 'hidden',
    borderRadius: '24px',
    border: `1px solid ${theme.border}`,
  },
  panelInner: {
    borderRadius: '20px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '18px',
  },
  panelTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  smallText: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '14px',
  },
  bigText: {
    margin: '6px 0 0',
    fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)',
    fontWeight: 700,
    wordBreak: 'break-word' as const,
  },
  badge: {
    borderRadius: '999px',
    background: theme.surfaceGlass,
    color: theme.textMuted,
    padding: '8px 14px',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '16px',
    marginTop: '24px',
  },
  miniCard: {
    borderRadius: '22px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    padding: '18px',
    minWidth: 0,
  },
  miniLabel: {
    margin: 0,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.25em',
    color: theme.textMuted,
  },
  miniValue: {
    margin: '12px 0 0',
    fontSize: '24px',
    fontWeight: 700,
  },
  miniDesc: {
    margin: '10px 0 0',
    fontSize: '14px',
    color: theme.textMuted,
  },
  assetList: {
    marginTop: '24px',
    display: 'grid',
    gap: '12px',
  },
  assetItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    borderRadius: '18px',
    background: theme.surfaceGlass,
    padding: '14px 16px',
    flexWrap: 'wrap' as const,
  },
  sectionGroup: {
    display: 'grid',
    gap: '10px',
    padding: '10px',
    borderRadius: '28px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '10px',
    position: 'relative' as const,
    zIndex: 1,
    paddingBottom: '32px',
  },
  featureCard: {
    borderRadius: '18px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceMuted,
    padding: '24px',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    minWidth: 0,
  },
  featureTitle: {
    margin: '18px 0 0',
    fontSize: '18px',
    fontWeight: 700,
  },
  featureDesc: {
    margin: '12px 0 0',
    fontSize: '14px',
    lineHeight: 1.7,
    color: theme.textMuted,
  },
  howSection: {
    borderRadius: '28px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '10px',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    position: 'relative' as const,
    zIndex: 1,
    marginBottom: '16px',
  },
  howGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '32px',
    borderRadius: '20px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceMuted,
    padding: '24px',
    alignItems: 'start',
  },
  howHeading: {
    margin: '12px 0 0',
    fontSize: 'clamp(2rem, 3vw, 3rem)',
    lineHeight: 1.1,
  },
  stepsGrid: {
    display: 'grid',
    gap: '14px',
  },
  stepItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    borderRadius: '22px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    padding: '18px',
    minWidth: 0,
    flexWrap: 'wrap' as const,
  },
  stepNum: {
    width: '42px',
    height: '42px',
    minWidth: '42px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '999px',
    background: theme.surfaceGlass,
    color: theme.text,
    fontWeight: 700,
    fontSize: '14px',
  },
  stepText: {
    margin: 0,
    paddingTop: '8px',
    fontSize: '14px',
    lineHeight: 1.75,
    color: theme.textMuted,
  },
  icon: {
    color: theme.textMuted,
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  checkIcon: {
    color: theme.highlight,
    width: '26px',
    height: '26px',
    flexShrink: 0,
  },
});


const LandingPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  const handleHomeClick = () => {
    const token = window.localStorage.getItem('token');
    navigate(isAdminToken(token) ? '/admin-home' : token && isTokenValid(token) ? '/home' : '/signin');
  };

  const handleGetStartedClick = () => {
    navigate('/signup');
  };

  return (
    <HybridTheme>
      <>
        <Helmet>
          <title>CryBots | Crypto Trading Bots</title>
          <meta
            name="description"
            content="CryBots is a crypto trading bot platform where users can rent, build, and buy automated bots, monitor strategies, and manage digital assets. "
          />
        </Helmet>

        <main style={styles.page}>
          <section style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={styles.glow} />
            <div style={styles.topLine} />

        <div style={styles.shell}>
          

          <div style={styles.heroGrid}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={styles.heading}>
                Automate smarter.
                <span style={styles.gradientText}>Trade with a plan.</span>
              </h2>
              <p style={{ ...styles.lead, marginLeft: 'auto', marginRight: 'auto' }}>
                CryBots brings together bot rentals, strategy building, bot purchases, crypto market automation, and account tools in a clean,
                modern experience built for serious users.
              </p>

              <div style={styles.buttonRow}>
                <button type="button" onClick={handleGetStartedClick} style={{ ...styles.buttonPrimary, cursor: 'pointer' }}>
                  Get started
                </button>
                <button type="button" onClick={handleHomeClick} style={{ ...styles.buttonSecondary, cursor: 'pointer' }}>
                  Dashboard
                </button>
              </div>

              <div style={styles.statsGroup}>
                <div style={styles.statsGrid}>
                {stats.map((stat) => (
                  <div key={stat.label} style={styles.statCard}>
                    <div style={styles.statValue}>{stat.value}</div>
                    <div style={styles.statLabel}>{stat.label}</div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            <div id="signup" style={styles.panelWrap}>
              <div style={styles.panelGlow} />
              <div style={styles.panel}>
                <div style={styles.panelInner}>
                  <div style={styles.panelTop}>
                    <div>
                      <p style={styles.smallText}>Portfolio value</p>
                      <p style={styles.bigText}>$128,480.22</p>
                    </div>
                    <div style={styles.badge}>+18.4% this month</div>
                  </div>

                  <div style={styles.cardGrid}>
                    <div style={styles.miniCard}>
                      <p style={styles.miniLabel}>Active balance</p>
                      <p style={styles.miniValue}>4.82 BTC</p>
                      <p style={styles.miniDesc}>Managed across automated strategies.</p>
                    </div>
                    <div style={styles.miniCard}>
                      <p style={styles.miniLabel}>Security score</p>
                      <div style={{ ...styles.miniValue, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 style={styles.checkIcon} />
                        98/100
                      </div>
                      <p style={styles.miniDesc}>Encrypted, verified, and monitored.</p>
                    </div>
                  </div>

                  <div style={styles.assetList}>
                    {['Bitcoin', 'Ethereum', 'Solana'].map((asset, index) => (
                      <div key={asset} style={styles.assetItem}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{asset}</span>
                        <span style={{ fontSize: '14px', color: 'inherit' }}>{['+12.2%', '+8.5%', '+15.1%'][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section style={styles.sectionGroup}>
            <div style={styles.sectionGrid}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} style={styles.featureCard}>
                  <Icon style={styles.icon} />
                  <h2 style={styles.featureTitle}>{feature.title}</h2>
                  <p style={styles.featureDesc}>{feature.description}</p>
                </article>
              );
            })}
            </div>
          </section>

          <section style={styles.howSection}>
            <div style={styles.howGrid}>
              <div>
                <p style={{ ...styles.smallText, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'inherit' }}>
                  How it works
                </p>
                <h2 style={styles.howHeading}>A smooth path from signup to growth.</h2>
              </div>
              <div style={styles.stepsGrid}>
                {steps.map((step, index) => (
                  <div key={step} style={styles.stepItem}>
                    <div style={styles.stepNum}>0{index + 1}</div>
                    <p style={styles.stepText}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
      </>
    </HybridTheme>
  );
};

export default LandingPage;
