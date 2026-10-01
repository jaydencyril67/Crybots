import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CircleDollarSign, Gift, HandCoins, MessageSquare, Settings, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type DashboardMetric = { count: number; amount: number };
type DashboardTotals = {
  users: { total: number; active: number };
  deposits: DashboardMetric & { pending: number };
  withdrawals: DashboardMetric & { pending: number };
  transfers: DashboardMetric;
  trades: DashboardMetric;
  rewards: DashboardMetric;
  openTickets: number;
};

const formatAmount = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminHomePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    api.get<DashboardTotals>('/api/admin/dashboard/totals')
      .then(({ data }) => setTotals(data))
      .catch(() => setError('Unable to load platform totals.'));
  }, []);
  if (!isAdminToken(localStorage.getItem('token'))) return null;

  const metrics = totals ? [
    { label: 'Total users', value: totals.users.total.toLocaleString(), detail: `${totals.users.active.toLocaleString()} active`, icon: Users, color: theme.primary },
    { label: 'Total deposits', value: formatAmount(totals.deposits.amount), detail: `${totals.deposits.count.toLocaleString()} completed`, icon: ArrowDownToLine, color: theme.success },
    { label: 'Total withdrawals', value: formatAmount(totals.withdrawals.amount), detail: `${totals.withdrawals.count.toLocaleString()} completed`, icon: ArrowUpFromLine, color: theme.warning },
    { label: 'Total transfers', value: totals.transfers.count.toLocaleString(), detail: formatAmount(totals.transfers.amount), icon: HandCoins, color: theme.primary },
    { label: 'Total trades', value: totals.trades.count.toLocaleString(), detail: formatAmount(totals.trades.amount), icon: TrendingUp, color: theme.success },
    { label: 'Total rewards', value: formatAmount(totals.rewards.amount), detail: `${totals.rewards.count.toLocaleString()} issued`, icon: Gift, color: theme.warning },
    { label: 'Pending deposits', value: totals.deposits.pending.toLocaleString(), detail: 'Awaiting completion', icon: CircleDollarSign, color: theme.warning },
    { label: 'Open tickets', value: totals.openTickets.toLocaleString(), detail: 'Need attention', icon: MessageSquare, color: theme.primary },
  ] : [];
  return <HybridTheme mode={themeMode}>
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}>
      <div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
          <section style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>Admin Dashboard</h2><button type="button" onClick={() => navigate('/admin/settings')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '9px 14px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontWeight: 800 }}><Settings size={16} /> Settings</button></div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7 }}>Platform-wide totals and administrator tools.</p>
          </section>
          <section style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' }}>
            <ShieldCheck size={22} color={theme.primary} />
            <div><strong style={{ fontSize: '0.95rem' }}>Administrator access active</strong><p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.84rem' }}>Use the admin navigation below to manage the platform.</p></div>
          </section>
          <section style={{ display: 'grid', gap: 10 }}>
            {error ? <NotificationBanner tone="error" title="Dashboard unavailable" message={error} /> : !totals ? <NotificationBanner title="Loading dashboard totals" message="Calculating platform-wide statistics…" /> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
              {metrics.map(({ label, value, detail, icon: Icon, color }) => <article key={label} style={{ display: 'grid', gap: 9, padding: '15px 14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><span style={{ color: theme.textMuted, fontSize: '0.78rem', fontWeight: 800 }}>{label}</span><Icon size={18} color={color} /></div>
                <strong style={{ fontSize: '1.3rem', overflowWrap: 'anywhere' }}>{value}</strong>
                <span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>{detail}</span>
              </article>)}
            </div>}
          </section>
        </div>
      </div>
      <NowBar admin />
    </div>
  </HybridTheme>;
};

export default AdminHomePage;
