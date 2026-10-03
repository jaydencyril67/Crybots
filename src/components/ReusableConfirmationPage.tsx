import React from 'react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';

export type ConfirmationDetail = {
  label: React.ReactNode;
  value: React.ReactNode;
};

type ReusableConfirmationPageProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  context?: React.ReactNode;
  details?: ConfirmationDetail[];
  warning?: React.ReactNode;
  warningTone?: 'warning' | 'danger';
  statusLabel?: React.ReactNode;
  statusTone?: 'neutral' | 'warning' | 'danger' | 'success';
  primaryActionLabel: React.ReactNode;
  processingActionLabel?: React.ReactNode;
  secondaryActionLabel?: React.ReactNode;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  isProcessing?: boolean;
  primaryActionDisabled?: boolean;
  footerNote?: React.ReactNode;
  children?: React.ReactNode;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '90px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '1160px',
    margin: '0 auto',
    padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px',
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
  context: {
    margin: '18px 0 0',
    padding: '14px 16px',
    borderRadius: '16px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    color: theme.text,
    lineHeight: 1.6,
  },
  details: {
    display: 'grid',
    gap: '10px',
    margin: '18px 0 0',
  },
  detail: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '18px',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.borderGlass}`,
  },
  detailLabel: {
    color: theme.textMuted,
    fontSize: '0.84rem',
    fontWeight: 700,
  },
  detailValue: {
    color: theme.text,
    fontSize: '0.9rem',
    fontWeight: 800,
    textAlign: 'right' as const,
  },
  warning: {
    margin: '18px 0 0',
    padding: '14px 16px',
    borderRadius: '16px',
    border: `1px solid ${theme.borderGlass}`,
    lineHeight: 1.6,
    fontSize: '0.9rem',
    fontWeight: 700,
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
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
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

const getWarningStyle = (theme: typeof HYBRID_THEME_TOKENS.dark, tone: ReusableConfirmationPageProps['warningTone']) => ({
  color: tone === 'danger' ? theme.danger : theme.warning,
  background: tone === 'danger' ? theme.primarySoft : theme.surfaceMuted,
});

const ReusableConfirmationPage = ({
  eyebrow,
  title,
  description,
  context,
  details,
  warning,
  warningTone = 'warning',
  statusLabel,
  statusTone = 'neutral',
  primaryActionLabel,
  processingActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  isProcessing = false,
  primaryActionDisabled = false,
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
              {eyebrow ? <p style={styles.eyebrow}>{eyebrow}</p> : null}
              <h1 style={styles.title}>{title}</h1>
              {description ? <div style={styles.description}>{description}</div> : null}
              {context ? <div style={styles.context}>{context}</div> : null}
              {details?.length ? (
                <div style={styles.details}>
                  {details.map((detail, index) => (
                    <div key={index} style={styles.detail}>
                      <span style={styles.detailLabel}>{detail.label}</span>
                      <span style={styles.detailValue}>{detail.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {warning ? <div style={{ ...styles.warning, ...getWarningStyle(theme, warningTone) }}>{warning}</div> : null}
              {statusLabel ? <div style={{ ...styles.status, ...getStatusStyle(theme, statusTone) }}>{statusLabel}</div> : null}
              {children}
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={{ ...styles.primaryButton, ...(isProcessing || primaryActionDisabled ? styles.disabledButton : {}) }}
                  onClick={onPrimaryAction}
                  disabled={isProcessing || primaryActionDisabled}
                >
                  {isProcessing ? <InlineLoadingDots /> : primaryActionLabel}
                </button>
                {secondaryActionLabel && onSecondaryAction ? (
                  <button type="button" style={styles.secondaryButton} onClick={onSecondaryAction} disabled={isProcessing}>
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
