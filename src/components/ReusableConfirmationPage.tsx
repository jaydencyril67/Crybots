import React from 'react';
import AppHeader from './AppHeader';
import HybridTheme from './HybridTheme';
import NowBar from './NowBar';

type ReusableConfirmationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel?: string;
  statusTone?: 'neutral' | 'warning' | 'danger' | 'success';
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  footerNote?: string;
  children?: React.ReactNode;
};

const toneStyles = {
  neutral: { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#ffffff' },
  warning: { borderColor: 'rgba(245,158,11,0.32)', background: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  danger: { borderColor: 'rgba(239,68,68,0.32)', background: 'rgba(239,68,68,0.12)', color: '#f87171' },
  success: { borderColor: 'rgba(34,197,94,0.32)', background: 'rgba(34,197,94,0.12)', color: '#4ade80' },
};

const styles = {
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
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
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.82rem',
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: '#f87171',
  },
  title: {
    margin: '10px 0 0',
    fontSize: '1.9rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: '#ffffff',
  },
  description: {
    margin: '10px 0 0',
    fontSize: '0.95rem',
    lineHeight: 1.7,
    color: '#b3b3b3',
    maxWidth: '68ch',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.08)',
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
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    fontWeight: 800,
    color: '#ffffff',
    background: 'rgba(239,68,68,0.92)',
  },
  secondaryButton: {
    borderRadius: '18px',
    padding: '12px 18px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    fontWeight: 800,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.05)',
  },
  footerNote: {
    margin: '14px 0 0',
    fontSize: '0.88rem',
    lineHeight: 1.6,
    color: '#a3a3a3',
  },
};

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
  const statusStyle = toneStyles[statusTone];

  return (
    <HybridTheme mode="dark">
      <div style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          <div style={styles.content}>
            <section style={styles.card}>
              <p style={styles.eyebrow}>{eyebrow}</p>
              <h1 style={styles.title}>{title}</h1>
              <p style={styles.description}>{description}</p>
              {statusLabel ? <div style={{ ...styles.status, ...statusStyle }}>{statusLabel}</div> : null}
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
