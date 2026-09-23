import React from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type AgentDestination = {
  label: string;
  description: string;
  path: string;
};

const destinations: AgentDestination[] = [
  { label: 'Stats', description: 'Review your referrals, earnings, rankings, and progress.', path: '/agent/stats' },
  { label: 'Tools', description: 'Manage your referral code, invite link, and QR code.', path: '/agent/tools' },
  { label: 'Menu', description: 'Change referral settings and manage your agent earnings.', path: '/agent/menu' },
];

const AgentPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  return (
    <HybridTheme>
      <div style={styles.page(theme)}>
        <main style={styles.shell}>
          <section style={styles.header}>
            <h1 style={styles.title(theme)}>Agent</h1>
            <p style={styles.description(theme)}>Manage your referrals, tools, performance, and rewards.</p>
          </section>
          <section style={styles.list} aria-label="Agent pages">
            {destinations.map((destination) => (
              <button key={destination.path} type="button" style={styles.card(theme)} onClick={() => navigate(destination.path)}>
                <span style={styles.cardCopy}>
                  <strong style={styles.cardTitle}>{destination.label}</strong>
                  <span style={styles.cardDescription(theme)}>{destination.description}</span>
                </span>
              </button>
            ))}
          </section>
        </main>
      </div>
    </HybridTheme>
  );
};

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  header: { display: 'grid', gap: 10, marginTop: 18 },
  title: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, color: theme.text, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em' }),
  description: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }),
  list: { display: 'grid', gap: 10, marginTop: 22 },
  card: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 6, width: '100%', padding: '16px 18px', border: `1px solid ${theme.borderGlass}`, borderRadius: 18, background: theme.surfaceGlass, color: theme.text, textAlign: 'left' as const, cursor: 'pointer', boxSizing: 'border-box' as const }),
  cardCopy: { display: 'grid', gap: 5 },
  cardTitle: { fontSize: '1rem', fontWeight: 800 },
  cardDescription: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.6 }),
};

export default AgentPage;
