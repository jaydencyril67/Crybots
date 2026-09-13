import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

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

const toneStyles: Record<NotificationTone, { border: string; background: string; color: string; icon: React.ReactNode }> = {
  error: {
    border: '1px solid rgba(248,113,113,0.32)',
    background: 'rgba(248,113,113,0.08)',
    color: '#fee2e2',
    icon: <AlertTriangle />,
  },
  success: {
    border: '1px solid rgba(74,222,128,0.3)',
    background: 'rgba(74,222,128,0.08)',
    color: '#d1fae5',
    icon: <CheckCircle2 />,
  },
  info: {
    border: '1px solid rgba(96,165,250,0.3)',
    background: 'rgba(96,165,250,0.08)',
    color: '#dbeafe',
    icon: <Info />,
  },
  warning: {
    border: '1px solid rgba(251,191,36,0.3)',
    background: 'rgba(251,191,36,0.08)',
    color: '#fef3c7',
    icon: <ShieldCheck />,
  },
};

const NotificationBanner = ({ tone = 'info', title, message }: NotificationBannerProps) => {
  const theme = toneStyles[tone];

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
