import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Clock3, History } from 'lucide-react';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import api from '../api/axios';
import { navigate } from '../utils/navigate';

type Activity = {
  id: string;
  action: string;
  title: string;
  description: string;
  method: string;
  path: string;
  createdAt: string;
};

type ActivityResponse = { activities?: Activity[] };

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' },
  shell: { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: 'clamp(14px, 3vw, 28px) clamp(8px, 1.5vw, 16px) 40px', boxSizing: 'border-box' as const },
  back: { alignSelf: 'start', display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  list: { display: 'grid', gap: '10px', marginTop: '22px', padding: '18px', border: `1px solid ${theme.borderGlass}`, borderRadius: '22px', background: theme.surfaceGlass },
  item: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', padding: '18px 16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', background: theme.surfaceMuted },
  icon: { color: theme.primary, marginTop: '2px' },
  title: { margin: 0, fontSize: '0.98rem', fontWeight: 800 },
  description: { margin: '4px 0 8px', color: theme.textMuted, lineHeight: 1.5, fontSize: '0.9rem' },
  date: { display: 'flex', alignItems: 'center', gap: '5px', margin: 0, color: theme.textMuted, fontSize: '0.78rem' },
  badge: { display: 'inline-flex', alignItems: 'center', marginBottom: '6px', padding: '3px 8px', borderRadius: '999px', background: theme.surfaceMuted, color: theme.primary, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  empty: { display: 'grid', placeItems: 'center', gap: '8px', padding: '42px 18px', border: `1px solid ${theme.borderGlass}`, borderRadius: '18px', color: theme.textMuted, textAlign: 'center' as const },
});

const formatAction = (action: string) => {
  const labels: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Removed',
    submit: 'Submitted',
    enable: 'Enabled',
    disable: 'Disabled',
    login: 'Signed in',
    logout: 'Signed out',
    other: 'Completed',
  };

  return labels[action] || 'Completed';
};

const getReadableActivity = (activity: Activity) => {
  if (/^\/api\/webauthn\/register\/verify$/.test(activity.path)) {
    return {
      title: 'Biometric security enabled',
      description: 'You enabled biometric security for your account.',
    };
  }

  if (/^\/api\/webauthn\/credentials(?:\/|$)/.test(activity.path)) {
    return {
      title: 'Biometric security disabled',
      description: 'You disabled biometric security for your account.',
    };
  }

  return {
    title: activity.title || formatAction(activity.action),
    description: activity.description,
  };
};

const formatDate = (createdAt: string) => {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

const ActivityLogPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivities = useCallback(async () => {
    try {
      const response = await api.get<ActivityResponse>('/api/activity/me');
      setActivities(response.data.activities || []);
      setError('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load your activity log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities();
    const interval = window.setInterval(() => { void loadActivities(); }, 60000);
    return () => window.clearInterval(interval);
  }, [loadActivities]);

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/records')}><ArrowLeft size={17} /> Records</button>
          {error ? <NotificationBanner tone="error" title="Activity log unavailable" message={error} /> : null}
          <div style={styles.list} aria-live="polite">
            {loading ? <div style={styles.empty} role="status" aria-label="Loading activity"><LoadingDots /></div> : null}
            {!loading && !activities.length ? <div style={styles.empty}><History size={25} /><span>No major activity recorded in the last 24 hours.</span></div> : null}
            {activities.map((activity) => {
              const readableActivity = getReadableActivity(activity);

              return (
                <article key={activity.id} style={styles.item}>
                  <Clock3 size={19} style={styles.icon} aria-hidden="true" />
                  <div>
                    <span style={styles.badge}>{formatAction(activity.action)}</span>
                    <h2 style={styles.title}>{readableActivity.title}</h2>
                    <p style={styles.description}>{readableActivity.description}</p>
                    <p style={styles.date}><Clock3 size={13} aria-hidden="true" /> {formatDate(activity.createdAt)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default ActivityLogPage;
