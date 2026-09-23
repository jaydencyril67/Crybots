import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

export type NotificationTone = 'error' | 'success' | 'info' | 'warning';

type NotificationBannerProps = {
  tone?: NotificationTone;
  title: string;
  message: React.ReactNode;
};

const styles = {
  banner: {
    marginTop: '18px',
    padding: '14px 16px',
    borderRadius: '18px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  icon: {
    width: '20px',
    height: '20px',
    flexShrink: 0,
    marginTop: '2px',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: 700,
  },
  message: {
    margin: '6px 0 0',
    fontSize: '13px',
    lineHeight: 1.6,
  },
} as const;

const getToneStyles = (theme: typeof HYBRID_THEME_TOKENS.dark): Record<NotificationTone, { border: string; background: string; color: string; icon: React.ReactNode }> => ({
  error: {
    border: `1px solid ${theme.danger}`,
    background: 'rgba(185, 28, 28, 0.12)',
    color: theme.danger,
    icon: <AlertTriangle />,
  },
  success: {
    border: `1px solid ${theme.success}`,
    background: 'rgba(22, 101, 52, 0.12)',
    color: theme.success,
    icon: <CheckCircle2 />,
  },
  info: {
    border: `1px solid ${theme.primary}`,
    background: 'rgba(37, 99, 235, 0.12)',
    color: theme.primary,
    icon: <Info />,
  },
  warning: {
    border: `1px solid ${theme.warning}`,
    background: 'rgba(180, 83, 9, 0.14)',
    color: theme.warning,
    icon: <ShieldCheck />,
  },
});

const NotificationBanner = ({ tone = 'info', title, message }: NotificationBannerProps) => {
  const { themeMode } = useAppTheme();
  const [isVisible, setIsVisible] = useState(true);
  const appTheme = HYBRID_THEME_TOKENS[themeMode];
  const toneStyles = getToneStyles(appTheme)[tone];

  useEffect(() => {
    setIsVisible(true);
    const timeout = window.setTimeout(() => setIsVisible(false), 6000);

    return () => window.clearTimeout(timeout);
  }, [message, title, tone]);

  if (!isVisible) return null;

  return (
    <div style={{ ...styles.banner, border: toneStyles.border, background: toneStyles.background, color: toneStyles.color }} role="alert" aria-live="polite">
      <span style={styles.icon}>{toneStyles.icon}</span>
      <div>
        <strong style={styles.title}>{title}</strong>
        <p style={{ ...styles.message, color: toneStyles.color }}>{message}</p>
      </div>
    </div>
  );
};

export default NotificationBanner;
