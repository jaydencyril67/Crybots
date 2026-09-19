import React, { useEffect, useMemo, useState } from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type ReusableDatePageProps = {
  title: string;
  description: string;
  value?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  min?: string;
  max?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  label?: string;
  mode?: 'auto' | 'date' | 'datetime-local' | 'time';
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
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
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: '18px',
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.82rem',
    fontWeight: 800,
    color: theme.textMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  title: {
    margin: '8px 0 0',
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: theme.text,
  },
  description: {
    margin: '8px 0 0',
    fontSize: '0.92rem',
    color: theme.textMuted,
    lineHeight: 1.7,
    maxWidth: '62ch',
  },
  field: {
    display: 'grid',
    gap: '6px',
    marginTop: '14px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: theme.textMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '18px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    color: theme.text,
    padding: '12px 14px',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '18px',
  },
  actionButton: {
    borderRadius: '18px',
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 800,
    background: theme.primary,
    color: theme.textInverse,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.borderGlass,
  },
  secondaryButton: {
    borderRadius: '18px',
    padding: '12px 18px',
    border: `1px solid ${theme.borderGlass}`,
    cursor: 'pointer',
    fontWeight: 800,
    background: theme.surfaceMuted,
    color: theme.text,
  },
});

const ReusableDatePage = ({
  title,
  description,
  value = '',
  onConfirm,
  onCancel,
  min,
  max,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  label,
  mode = 'auto',
}: ReusableDatePageProps) => {
  const resolvedMode: 'date' | 'datetime-local' | 'time' =
    mode === 'auto' ? (value.includes('T') ? 'datetime-local' : 'date') : mode;
  const resolvedLabel = label ?? (resolvedMode === 'time' ? 'Time' : resolvedMode === 'datetime-local' ? 'Date and time' : 'Date');
  const inputType = resolvedMode;
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [date, setDate] = useState(value);

  useEffect(() => {
    setDate(value);
  }, [value]);

  const parsedMax = useMemo(() => max, [max]);

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <div style={styles.shell}>
          
          <div style={styles.content}>
            <section style={styles.card}>
              <p style={styles.eyebrow}>Hybrid picker</p>
              <h1 style={styles.title}>{title}</h1>
              <p style={styles.description}>{description}</p>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="reusable-date-input">{resolvedLabel}</label>
                <input
                  id="reusable-date-input"
                  style={styles.input}
                  type={inputType}
                  value={date}
                  min={min}
                  max={parsedMax}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.secondaryButton} onClick={onCancel}>{cancelLabel}</button>
                <button type="button" style={styles.actionButton} onClick={() => onConfirm(date)}>{confirmLabel}</button>
              </div>
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default ReusableDatePage;
