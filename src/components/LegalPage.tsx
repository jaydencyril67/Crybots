import React, { ReactNode } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';

type LegalSection = {
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  title: string;
  eyebrow: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '1040px', margin: '0 auto', padding: 'clamp(18px, 4vw, 48px) clamp(14px, 3vw, 28px) 48px', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '7px', border: `1px solid ${theme.borderGlass}`, borderRadius: '12px', padding: '9px 12px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontWeight: 750 },
  hero: { marginTop: '26px', padding: 'clamp(22px, 4vw, 42px)', border: `1px solid ${theme.borderGlass}`, borderRadius: '26px', background: `linear-gradient(135deg, ${theme.surfaceElevated}, ${theme.surfaceGlass})`, boxShadow: '0 18px 50px rgba(0,0,0,0.16)' },
  eyebrow: { margin: 0, color: theme.primary, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' as const },
  title: { margin: '10px 0 12px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05, letterSpacing: '-0.04em', fontWeight: 950 },
  summary: { margin: 0, maxWidth: '75ch', color: theme.textMuted, lineHeight: 1.75, fontSize: '1rem' },
  updated: { margin: '18px 0 0', color: theme.textMuted, fontSize: '0.8rem' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '14px', marginTop: '18px', padding: '10px', border: `1px solid ${theme.borderGlass}`, borderRadius: '16px', background: theme.surfaceGlass, boxSizing: 'border-box' as const },
  section: { padding: 'clamp(18px, 3vw, 28px)', border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', background: theme.surfaceMuted },
  sectionTitle: { margin: '0 0 11px', fontSize: '1.16rem', lineHeight: 1.25, fontWeight: 900 },
  body: { margin: 0, color: theme.textMuted, lineHeight: 1.78, fontSize: '0.94rem' },
  list: { margin: '10px 0 0', paddingLeft: '21px', color: theme.textMuted, lineHeight: 1.78, fontSize: '0.94rem' },
  note: { display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '18px', padding: '15px 17px', border: `1px solid ${theme.borderGlass}`, borderRadius: '16px', color: theme.textMuted, lineHeight: 1.65, fontSize: '0.86rem', background: theme.surfaceMuted },
});

const LegalPage = ({ title, eyebrow, summary, updated, sections }: LegalPageProps) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  return (
    <HybridTheme>
      <Helmet><title>{title} | CryBots</title><meta name="description" content={summary} /></Helmet>
      <div style={styles.page}>
        <main style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/about')}><ArrowLeft size={16} aria-hidden="true" /> About</button>
          <header style={styles.hero}>
            <p style={styles.eyebrow}>{eyebrow}</p>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.summary}>{summary}</p>
            <p style={styles.updated}>Last updated: {updated}</p>
          </header>
          <div style={styles.layout}>
            {sections.map((section) => <section key={section.title} style={styles.section}><h2 style={styles.sectionTitle}>{section.title}</h2><div style={styles.body}>{section.content}</div></section>)}
          </div>
          <div style={styles.note}><ShieldCheck size={19} color={theme.primary} aria-hidden="true" /><span>These pages explain CryBots’s current practices in plain language. They do not replace any agreement, risk disclosure, or legal advice that may apply to your use of digital-asset services.</span></div>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default LegalPage;
