import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
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
  '/profile': 'Profile',
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
      <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' }}>
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: 'clamp(14px, 3vw, 28px) 16px 40px', boxSizing: 'border-box' }}>
          <button type="button" onClick={() => navigate('/records')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={17} /> Records</button>
          <h1 style={{ margin: '28px 0 8px', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>App Usage</h1>
          <p style={{ margin: 0, color: theme.textMuted }}>See how many times you have opened each protected page.</p>
          {error ? <NotificationBanner tone="error" title="App usage unavailable" message={error} /> : null}
          <section style={{ display: 'grid', gap: '10px', marginTop: '22px', padding: '18px', border: `1px solid ${theme.borderGlass}`, borderRadius: '22px', background: theme.surfaceGlass }} aria-live="polite">
            {loading ? <div style={{ padding: '42px 18px', textAlign: 'center' }}><LoadingDots /></div> : null}
            {!loading && !Object.keys(pageLabels).some((page) => usage[page]) ? <div style={{ display: 'grid', placeItems: 'center', gap: '8px', padding: '42px 18px', color: theme.textMuted, textAlign: 'center' }}><BarChart3 size={25} /><span>No protected pages have been opened yet.</span></div> : null}
            {!loading && Object.entries(pageLabels).map(([page, label]) => (
              <article key={page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', background: theme.surfaceMuted }}>
                <span style={{ fontWeight: 700 }}>{label}</span>
                <strong style={{ color: theme.primary }}>{usage[page] || 0} {usage[page] === 1 ? 'opening' : 'openings'}</strong>
              </article>
            ))}
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export { pageLabels };
export default AppUsagePage;
