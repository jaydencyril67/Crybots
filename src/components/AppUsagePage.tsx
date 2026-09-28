import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import LoadingDots from './LoadingDots';
import api from '../api/axios';
import { navigate } from '../utils/navigate';

type UsageResponse = { usage?: Record<string, number> };

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/details': 'Details',
  '/manage': 'Manage account',
  '/theme-settings': 'Theme settings',
  '/nowbar-settings': 'NowBar settings',
  '/nowbar-color': 'NowBar color',
  '/nowbar-button-color': 'NowBar button color',
  '/portfolio': 'Portfolio',
  '/portfolio/statistics': 'Portfolio statistics',
  '/agent': 'Agent',
  '/agent/tools': 'Agent tools',
  '/agent/stats': 'Agent statistics',
  '/agent/menu': 'Agent menu',
  '/exchange': 'Exchange',
  '/my-space': 'My Space',
  '/market': 'Market',
  '/records': 'Records',
  '/contact': 'Contact',
  '/options': 'Options',
  '/library': 'Library',
  '/about': 'About',
  '/information': 'Information',
  '/privacy-policy': 'Privacy policy',
  '/community-standards': 'Community standards',
  '/developer': 'Developer',
  '/asset': 'Asset',
  '/danger': 'Danger zone',
  '/pending-deletion': 'Pending deletion',
  '/security': 'Security',
  '/withdrawals': 'Withdrawals',
  '/transfer': 'Transfer',
  '/deposit': 'Deposit',
  '/transactions': 'Transactions',
  '/notifications': 'Notifications',
  '/alert-settings': 'Alert settings',
  '/app-usage': 'App Usage',
};

const AppUsagePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = {
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
      maxWidth: '920px',
      margin: '0 auto',
      padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
      boxSizing: 'border-box' as const,
    },
    content: {
      paddingTop: '8px',
      display: 'grid',
      gap: '14px',
      marginTop: '14px',
    },
    rowList: {
      display: 'grid',
      gap: '10px',
      width: '100%',
      minWidth: 0,
      padding: '18px',
      borderRadius: '22px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
      boxSizing: 'border-box' as const,
    },
    row: {
      width: '100%',
      maxWidth: '100%',
      background: theme.surfaceMuted,
      border: `1px solid ${theme.borderGlass}`,
      borderRadius: '15px',
      padding: '13px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      minWidth: 0,
      boxSizing: 'border-box' as const,
    },
    rowLabel: {
      margin: 0,
      color: theme.textMuted,
      fontSize: '0.74rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      fontWeight: 800,
    },
    rowValue: {
      margin: 0,
      color: theme.primary,
      fontSize: '0.94rem',
      fontWeight: 800,
      lineHeight: 1.5,
      textAlign: 'right' as const,
      wordBreak: 'break-word' as const,
      overflowWrap: 'anywhere' as const,
    },
  };
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<UsageResponse>('/api/app-usage/me')
      .then((response) => setUsage(response.data.usage || {}))
      .catch((requestError: any) => setError(requestError?.response?.data?.message || 'Unable to load app usage.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" onClick={() => navigate('/records')} style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={17} /> Records</button>
          <div style={styles.content}>
            {error ? <NotificationBanner tone="error" title="App usage unavailable" message={error} /> : null}
            <div style={styles.rowList} aria-live="polite">
              {Object.entries(pageLabels).map(([page, label]) => (
                <div key={page} style={styles.row}>
                  <p style={styles.rowLabel}>{label}</p>
                  <p style={styles.rowValue}>
                    {loading ? <LoadingDots /> : `${usage[page] || 0} ${usage[page] === 1 ? 'Visit' : 'Visits'}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export { pageLabels };
export default AppUsagePage;
