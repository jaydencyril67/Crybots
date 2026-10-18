import React from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { Helmet } from 'react-helmet-async';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleDollarSign, ShieldCheck, TrendingUp, Users, Activity, Layers3, Sparkles } from 'lucide-react';
import { isTokenValid } from '../utils/auth';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';

const stats = [
  { value: '$2.4B+', label: '24h trading volume' },
  { value: '140+', label: 'global markets' },
  { value: '99.98%', label: 'platform uptime' },
];

const features = [
  { icon: ShieldCheck, title: 'Protection at every layer', description: 'Account safeguards and risk monitoring designed to keep your trading activity protected.' },
  { icon: TrendingUp, title: 'Strategies that work for you', description: 'Rent, build, and buy automated bots, then keep an eye on their performance in one place.' },
  { icon: CircleDollarSign, title: 'Assets without the friction', description: 'Manage deposits, withdrawals, and supported digital assets through a streamlined workspace.' },
  { icon: Users, title: 'Made for real people', description: 'A clear, connected toolkit for curious newcomers and experienced market participants.' },
];

const steps = [
  'Sign in to open your CryBots workspace.',
  'Fund your account using a supported payment method.',
  'Choose a strategy and follow its activity from your dashboard.',
];

const LandingPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  const handleDashboardClick = () => {
    const token = window.localStorage.getItem('token');
    navigate(isAdminToken(token) ? '/admin-home' : token && isTokenValid(token) ? '/home' : '/signin');
  };

  const handleGetStartedClick = () => navigate('/signin');

  const card = {
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    boxShadow: `inset 0 1px 0 ${theme.surfaceShine}`,
    borderRadius: '22px',
    minWidth: 0,
  } as const;

  const primaryButton = {
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: '14px',
    padding: '13px 18px',
    minHeight: '46px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    fontWeight: 700,
    color: theme.text,
    background: theme.surfaceElevated,
    cursor: 'pointer',
  } as const;

  const secondaryButton = {
    ...primaryButton,
    background: theme.surfaceGlass,
    border: `1px solid ${theme.borderGlass}`,
    fontWeight: 600,
  } as const;

  return (
    <HybridTheme mode={themeMode}>
      <>
        <Helmet>
          <title>CryBots | Crypto Trading Bots</title>
          <meta name="description" content="CryBots brings automated crypto strategies, bot tools, and digital asset management into one connected workspace." />
        </Helmet>

        <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, overflow: 'hidden' }}>
          <style>{`
            .cb-prism-shell, .cb-prism-shell * { box-sizing: border-box; }
            .cb-prism-shell { width: 100%; max-width: 1208px; margin: 0 auto; padding: 18px clamp(12px, 2.5vw, 24px) 38px; display: grid; gap: 16px; min-width: 0; }
            .cb-prism-shell section, .cb-prism-shell article, .cb-prism-shell aside, .cb-prism-shell footer { min-width: 0; }
            .cb-prism-shell button { max-width: 100%; white-space: normal; line-height: 1.35; }
            .cb-prism-shell p, .cb-prism-shell h1, .cb-prism-shell h2, .cb-prism-shell h3, .cb-prism-shell strong, .cb-prism-shell span { overflow-wrap: anywhere; }
            .cb-prism-intro { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(260px, .9fr); gap: clamp(18px, 3vw, 32px); align-items: stretch; }
            .cb-prism-copy { padding: clamp(20px, 3vw, 34px); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; position: relative; overflow: hidden; }
            .cb-prism-copy:after { content: ''; position: absolute; width: 190px; height: 190px; right: -88px; top: -90px; border: 1px solid ${theme.borderStrong}; transform: rotate(35deg); border-radius: 36px; pointer-events: none; }
            .cb-prism-eyebrow { display: inline-flex; align-items: center; gap: 8px; border: 1px solid ${theme.borderGlass}; border-radius: 999px; padding: 7px 11px; color: ${theme.textMuted}; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 18px; }
            .cb-prism-title { font-size: clamp(28px, 4.2vw, 48px); line-height: 1.08; letter-spacing: -.035em; margin: 0; max-width: 620px; font-weight: 700; }
            .cb-prism-lead { color: ${theme.textMuted}; line-height: 1.7; font-size: 15px; max-width: 540px; margin: 16px 0 0; }
            .cb-prism-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; width: 100%; }
            .cb-prism-preview { padding: clamp(16px, 2.4vw, 24px); display: grid; align-content: space-between; gap: 20px; position: relative; overflow: hidden; }
            .cb-prism-preview:before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, ${theme.surfaceShine}, transparent 44%); opacity: .45; pointer-events: none; }
            .cb-prism-preview > * { position: relative; }
            .cb-prism-overline { font-size: 11px; text-transform: uppercase; letter-spacing: .18em; color: ${theme.textMuted}; margin: 0; }
            .cb-prism-value { font-size: clamp(25px, 3.3vw, 36px); letter-spacing: -.03em; margin: 8px 0 0; font-weight: 700; overflow-wrap: anywhere; }
            .cb-prism-change { display: inline-flex; gap: 6px; align-items: center; color: ${theme.success}; font-size: 12px; margin-top: 8px; }
            .cb-prism-orbit { width: 116px; height: 116px; flex-shrink: 0; border-radius: 34px; border: 1px solid ${theme.borderStrong}; transform: rotate(28deg); display: grid; place-items: center; position: relative; }
            .cb-prism-orbit:before, .cb-prism-orbit:after { content: ''; position: absolute; inset: 11px; border: 1px solid ${theme.borderGlass}; border-radius: 27px; }
            .cb-prism-orbit:after { inset: 25px; border-radius: 20px; transform: rotate(35deg); background: ${theme.surfaceGlass}; }
            .cb-prism-orbit svg { position: relative; z-index: 1; transform: rotate(-28deg); }
            .cb-prism-preview-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
            .cb-prism-market-list { display: grid; gap: 0; }
            .cb-prism-market { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid ${theme.borderGlass}; font-size: 13px; }
            .cb-prism-market-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
            .cb-prism-coin { width: 30px; height: 30px; border: 1px solid ${theme.borderGlass}; background: ${theme.surface}; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; }
            .cb-prism-market-sub { color: ${theme.textMuted}; font-size: 11px; margin-top: 3px; }
            .cb-prism-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
            .cb-prism-stat { padding: 17px 18px; }
            .cb-prism-stat-value { font-size: clamp(21px, 2.6vw, 28px); font-weight: 700; letter-spacing: -.025em; margin: 0; }
            .cb-prism-stat-label { font-size: 12px; color: ${theme.textMuted}; margin: 7px 0 0; line-height: 1.5; }
            .cb-prism-section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; padding: 4px 2px; }
            .cb-prism-section-kicker { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: ${theme.textMuted}; margin: 0 0 8px; }
            .cb-prism-section-title { font-size: clamp(22px, 3vw, 30px); letter-spacing: -.025em; margin: 0; line-height: 1.2; }
            .cb-prism-features { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .cb-prism-feature { padding: 20px; }
            .cb-prism-feature-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 13px; border: 1px solid ${theme.borderGlass}; background: ${theme.surface}; color: ${theme.text}; }
            .cb-prism-feature h3 { font-size: 15px; line-height: 1.4; margin: 17px 0 8px; }
            .cb-prism-feature p { font-size: 13px; line-height: 1.65; color: ${theme.textMuted}; margin: 0; }
            .cb-prism-how { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 28px; padding: clamp(20px, 3vw, 30px); }
            .cb-prism-step { display: grid; grid-template-columns: 40px minmax(0, 1fr); align-items: start; gap: 14px; padding: 14px 0; border-bottom: 1px solid ${theme.borderGlass}; }
            .cb-prism-step:last-child { border-bottom: 0; padding-bottom: 0; }
            .cb-prism-step-number { width: 38px; height: 38px; border: 1px solid ${theme.borderGlass}; background: ${theme.surface}; border-radius: 12px; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
            .cb-prism-step p { color: ${theme.textMuted}; font-size: 13px; line-height: 1.65; margin: 7px 0 0; }
            @media (max-width: 960px) {
              .cb-prism-intro { grid-template-columns: minmax(0, 1fr); }
              .cb-prism-preview { gap: 22px; }
              .cb-prism-features { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .cb-prism-how { grid-template-columns: minmax(0, 1fr); gap: 12px; }
            }
            @media (max-width: 640px) {
              .cb-prism-shell { padding: 12px 12px 26px; gap: 12px; }
              .cb-prism-copy { padding: 21px 17px; }
              .cb-prism-title { font-size: clamp(27px, 7.2vw, 36px); letter-spacing: -.025em; }
              .cb-prism-lead { font-size: 14px; line-height: 1.65; }
              .cb-prism-actions { display: grid; grid-template-columns: minmax(0, 1fr); gap: 9px; }
              .cb-prism-actions button { width: 100%; min-width: 0; }
              .cb-prism-preview { padding: 16px; }
              .cb-prism-preview-top { align-items: center; gap: 10px; }
              .cb-prism-orbit { width: 78px; height: 78px; border-radius: 24px; }
              .cb-prism-orbit:before { inset: 7px; border-radius: 17px; }
              .cb-prism-orbit:after { inset: 16px; border-radius: 12px; }
              .cb-prism-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .cb-prism-stat:last-child { grid-column: 1 / -1; }
              .cb-prism-stat { padding: 14px; }
              .cb-prism-features { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
              .cb-prism-feature { padding: 15px; }
              .cb-prism-how { padding: 19px 16px; }
              .cb-prism-section-head { align-items: flex-start; }
            }
            @media (max-width: 420px) {
              .cb-prism-shell { padding-inline: 9px; }
              .cb-prism-copy { padding: 19px 14px; }
              .cb-prism-eyebrow { font-size: 10px; letter-spacing: .045em; max-width: 100%; }
              .cb-prism-preview-top { align-items: flex-start; }
              .cb-prism-orbit { width: 60px; height: 60px; border-radius: 19px; }
              .cb-prism-orbit:before { inset: 6px; border-radius: 13px; }
              .cb-prism-orbit:after { inset: 13px; border-radius: 9px; }
              .cb-prism-orbit svg { width: 21px; height: 21px; }
              .cb-prism-value { font-size: clamp(22px, 7vw, 28px); }
              .cb-prism-market { gap: 8px; font-size: 12px; }
              .cb-prism-market-name { gap: 7px; }
              .cb-prism-market-sub { font-size: 10px; }
              .cb-prism-coin { width: 27px; height: 27px; }
              .cb-prism-stats, .cb-prism-features { grid-template-columns: minmax(0, 1fr); }
              .cb-prism-stat:last-child { grid-column: auto; }
              .cb-prism-stat { padding: 14px 15px; }
              .cb-prism-feature { padding: 16px; }
              .cb-prism-step { grid-template-columns: 34px minmax(0, 1fr); gap: 10px; }
              .cb-prism-step-number { width: 32px; height: 32px; }
              .cb-prism-section-title { font-size: 22px; }
            }
            @media (prefers-reduced-motion: reduce) {
              .cb-prism-shell *, .cb-prism-shell *::before, .cb-prism-shell *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
            }
          `}</style>

          <div className="cb-prism-shell">
            <section className="cb-prism-intro">
              <div className="cb-prism-copy" style={card}>
                <p className="cb-prism-eyebrow"><Sparkles size={14} /> A clearer way to automate</p>
                <h1 className="cb-prism-title">Your strategy.<br />A sharper way to move.</h1>
                <p className="cb-prism-lead">Build your approach to crypto with automated bot strategies, useful account tools, and a single place to follow what matters.</p>
                <div className="cb-prism-actions">
                  <button type="button" onClick={handleGetStartedClick} style={primaryButton}>Sign in <ArrowUpRight size={17} /></button>
                  <button type="button" onClick={handleDashboardClick} style={secondaryButton}>Open dashboard <ArrowDownRight size={16} /></button>
                </div>
              </div>

              <aside className="cb-prism-preview" style={card} aria-label="Illustrative portfolio preview">
                <div className="cb-prism-preview-top">
                  <div>
                    <p className="cb-prism-overline">Portfolio overview</p>
                    <p className="cb-prism-value">$128,480.22</p>
                    <span className="cb-prism-change"><TrendingUp size={14} /> +18.4% this month</span>
                  </div>
                  <div className="cb-prism-orbit" aria-hidden="true"><Layers3 size={27} /></div>
                </div>
                <div className="cb-prism-market-list">
                  <div className="cb-prism-market">
                    <div className="cb-prism-market-name"><span className="cb-prism-coin">₿</span><div><strong>Bitcoin</strong><div className="cb-prism-market-sub">BTC · Strategy active</div></div></div>
                    <span>+12.2%</span>
                  </div>
                  <div className="cb-prism-market">
                    <div className="cb-prism-market-name"><span className="cb-prism-coin">Ξ</span><div><strong>Ethereum</strong><div className="cb-prism-market-sub">ETH · Strategy active</div></div></div>
                    <span>+8.5%</span>
                  </div>
                  <div className="cb-prism-market">
                    <div className="cb-prism-market-name"><span className="cb-prism-coin">◎</span><div><strong>Solana</strong><div className="cb-prism-market-sub">SOL · Strategy active</div></div></div>
                    <span>+15.1%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textMuted, fontSize: 11 }}>
                  <Activity size={14} /> Illustrative interface preview
                </div>
              </aside>
            </section>

            <section className="cb-prism-stats" aria-label="Platform highlights">
              {stats.map((stat) => (
                <div key={stat.label} className="cb-prism-stat" style={card}>
                  <p className="cb-prism-stat-value">{stat.value}</p>
                  <p className="cb-prism-stat-label">{stat.label}</p>
                </div>
              ))}
            </section>

            <section style={{ display: 'grid', gap: 14 }}>
              <div className="cb-prism-section-head">
                <div><p className="cb-prism-section-kicker">Inside CryBots</p><h2 className="cb-prism-section-title">Everything in its right place.</h2></div>
                <p style={{ margin: 0, color: theme.textMuted, fontSize: 13, lineHeight: 1.6, maxWidth: 360 }}>A connected set of tools, arranged to make the next step easier to find.</p>
              </div>
              <div className="cb-prism-features">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return <article key={feature.title} className="cb-prism-feature" style={card}>
                    <div className="cb-prism-feature-icon"><Icon size={19} /></div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>;
                })}
              </div>
            </section>

            <section className="cb-prism-how" style={card}>
              <div>
                <p className="cb-prism-section-kicker">Get moving</p>
                <h2 className="cb-prism-section-title">A simple path from setup to strategy.</h2>
                <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.7, margin: '12px 0 0' }}>Start with the essentials, then use the tools that fit your goals. Your dashboard keeps the pieces together.</p>
              </div>
              <div>
                {steps.map((step, index) => <div className="cb-prism-step" key={step}>
                  <div className="cb-prism-step-number">0{index + 1}</div><p>{step}</p>
                </div>)}
              </div>
            </section>

            <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '8px 2px', color: theme.textMuted, fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={14} /> Built around your workflow</span>
              <span>CryBots · Automated strategy workspace</span>
            </footer>
          </div>
        </main>
      </>
    </HybridTheme>
  );
};

export default LandingPage;
