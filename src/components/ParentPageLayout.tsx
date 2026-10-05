import React from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

export type ParentPageCard = {
  label: string;
  description: string;
  route?: string;
};

type ParentPageLayoutProps = {
  title: string;
  description: string;
  cards: ParentPageCard[];
  showHeader?: boolean;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'hidden' as const, background: theme.background, color: theme.text, boxSizing: 'border-box' as const },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 0', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '18px', marginTop: '18px' },
  section: { display: 'grid', gap: '10px' },
  title: { margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', color: theme.text },
  description: { margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7, maxWidth: '62ch' },
  cardGrid: { display: 'grid', gap: '10px', marginTop: '6px' },
  card: { display: 'grid', gridTemplateColumns: 'minmax(110px, 0.35fr) minmax(0, 1fr) auto', alignItems: 'center', gap: '14px', padding: '12px 14px', borderRadius: '14px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, textAlign: 'left' as const, boxSizing: 'border-box' as const, backdropFilter: 'blur(24px) saturate(1.15)', WebkitBackdropFilter: 'blur(24px) saturate(1.15)' },
  cardTitle: { margin: 0, fontSize: '0.95rem', fontWeight: 850 },
  cardSubtext: { margin: 0, color: theme.textMuted, fontSize: '0.84rem', lineHeight: 1.4, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  viewButton: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', justifySelf: 'end' },
});

const ParentPageLayout = ({ title, description, cards, showHeader = false }: ParentPageLayoutProps) => {
  const { themeMode } = useAppTheme();
  const styles = getStyles(HYBRID_THEME_TOKENS[themeMode]);

  return (
    <HybridTheme>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            {showHeader && title && description ? (
              <section style={styles.section}>
                <h2 style={styles.title}>{title}</h2>
                <p style={styles.description}>{description}</p>
              </section>
            ) : null}
            <div style={styles.cardGrid}>
              {cards.map((card) => (
                <article key={card.label} style={styles.card}>
                  <h3 style={styles.cardTitle}>{card.label}</h3>
                  <p style={styles.cardSubtext}>{card.description}</p>
                  <button type="button" style={styles.viewButton} onClick={card.route ? () => navigate(card.route as string) : undefined} disabled={!card.route}>View</button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HybridTheme>
  );
};

export default ParentPageLayout;
