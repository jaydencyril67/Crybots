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
    background: theme.primarySoft,
    color: theme.danger,
    icon: <AlertTriangle />,
  },
  success: {
    border: `1px solid ${theme.success}`,
    background: theme.highlightSoft,
    color: theme.success,
    icon: <CheckCircle2 />,
  },
  info: {
    border: `1px solid ${theme.primary}`,
    background: theme.primarySoft,
    color: theme.primary,
    icon: <Info />,
  },
  warning: {
    border: `1px solid ${theme.warning}`,
    background: theme.highlightSoft,
    color: theme.warning,
    icon: <ShieldCheck />,
  },
});

const NotificationBanner = ({ tone = 'info', title, message }: NotificationBannerProps) => {
  const { themeMode } = useAppTheme();
  const [isVisible, setIsVisible] = useState(true);
  const theme = getToneStyles(HYBRID_THEME_TOKENS[themeMode])[tone];

  useEffect(() => {
    setIsVisible(true);
    const timeout = window.setTimeout(() => setIsVisible(false), 6000);

    return () => window.clearTimeout(timeout);
  }, [message, title, tone]);

  if (!isVisible) return null;

  return (
    <div style={{ ...styles.banner, border: theme.border, background: theme.background, color: theme.color }} role="alert" aria-live="polite">
      <span style={styles.icon}>{theme.icon}</span>
      <div>
        <strong style={styles.title}>{title}</strong>
        <p style={{ ...styles.message, color: theme.color }}>{message}</p>
      </div>
    </div>
  );
};

export default NotificationBanner;
