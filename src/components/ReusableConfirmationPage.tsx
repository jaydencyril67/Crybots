import React from 'react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type ReusableConfirmationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel?: React.ReactNode;
  statusTone?: 'neutral' | 'warning' | 'danger' | 'success';
  primaryActionLabel: React.ReactNode;
  secondaryActionLabel?: React.ReactNode;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  footerNote?: React.ReactNode;
  children?: React.ReactNode;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '18px',
    marginTop: '18px',
  },
  card: {
    ...createHybridCardStyles(theme).card,
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.82rem',
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: theme.danger,
  },
  title: {
    margin: '10px 0 0',
    fontSize: '1.9rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: theme.text,
  },
  description: {
    margin: '10px 0 0',
    fontSize: '0.95rem',
    lineHeight: 1.7,
    color: theme.textMuted,
    maxWidth: '68ch',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    padding: '10px 14px',
    fontSize: '0.85rem',
    fontWeight: 800,
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '18px',
  },
  primaryButton: {
    borderRadius: '18px',
    padding: '12px 18px',
    border: `1px solid ${theme.borderGlass}`,
    cursor: 'pointer',
    fontWeight: 800,
    color: theme.textInverse,
    background: theme.danger,
  },
  secondaryButton: {
    borderRadius: '18px',
    padding: '12px 18px',
    border: `1px solid ${theme.borderGlass}`,
    cursor: 'pointer',
    fontWeight: 800,
    color: theme.text,
    background: theme.surfaceGlass,
  },
  footerNote: {
    margin: '14px 0 0',
    fontSize: '0.88rem',
    lineHeight: 1.6,
    color: theme.textMuted,
  },
});

const getStatusStyle = (theme: typeof HYBRID_THEME_TOKENS.dark, tone: ReusableConfirmationPageProps['statusTone']) => ({
  color: tone === 'danger' ? theme.danger : tone === 'warning' ? theme.warning : tone === 'success' ? theme.success : theme.text,
});

const ReusableConfirmationPage = ({
  eyebrow,
  title,
  description,
  statusLabel,
  statusTone = 'neutral',
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  footerNote,
  children,
}: ReusableConfirmationPageProps) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <div style={styles.shell}>
          
          <div style={styles.content}>
            <section style={styles.card}>
              <p style={styles.eyebrow}>{eyebrow}</p>
              <h1 style={styles.title}>{title}</h1>
              <p style={styles.description}>{description}</p>
              {statusLabel ? <div style={{ ...styles.status, ...getStatusStyle(theme, statusTone) }}>{statusLabel}</div> : null}
              {children}
              <div style={styles.buttonRow}>
                <button type="button" style={styles.primaryButton} onClick={onPrimaryAction}>
                  {primaryActionLabel}
                </button>
                {secondaryActionLabel && onSecondaryAction ? (
                  <button type="button" style={styles.secondaryButton} onClick={onSecondaryAction}>
                    {secondaryActionLabel}
                  </button>
                ) : null}
              </div>
              {footerNote ? <p style={styles.footerNote}>{footerNote}</p> : null}
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ReusableConfirmationPage;
