import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, BarChart3, Bot, CheckCircle2, Clock3, Crown, LockKeyhole, ShieldCheck, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type ScopeTier = 'moderate' | 'advanced';
type BillingCycle = 'monthly' | 'yearly';
type RankRow = Record<string, string | number | null>;
type Rankings = { profitableBots?: RankRow[]; dailySymbols?: RankRow[]; topCreators?: RankRow[]; commerceEfficiency?: RankRow[]; rentalEfficiency?: RankRow[] };
type WorldScopeResponse = {
  access?: { tier: ScopeTier | null; active: boolean; prices: Record<BillingCycle, Record<ScopeTier, number>>; billingCycle?: BillingCycle | null; paidAmount?: number; purchasedAt?: string; expiresAt?: string | null; lifetimeAccess?: boolean };
  walletBalance?: number; asOf?: string; timezone?: string; windows?: Record<string, string>; rankings?: Rankings | null; message?: string;
};
type RankingSection = { id: keyof Rankings; title: string; subtitle: string; icon: React.ComponentType<{ size?: string | number }>; tier: ScopeTier; columns: { key: string; label: string; format?: 'usdt' | 'percent' | 'date' }[] };

const sections: RankingSection[] = [
  { id: 'profitableBots', title: 'Most Profitable Bots', subtitle: 'Top bots by total recorded realized settlement profit and loss.', icon: Bot, tier: 'moderate', columns: [{ key: 'name', label: 'Bot' }, { key: 'symbol', label: 'Symbol' }, { key: 'realizedProfit', label: 'Net P/L', format: 'usdt' }, { key: 'settlementDays', label: 'Settlements' }] },
  { id: 'dailySymbols', title: 'Top Daily Traded Symbols', subtitle: 'Symbols ranked by realized bot P/L recorded for the current UTC day.', icon: BarChart3, tier: 'moderate', columns: [{ key: 'symbol', label: 'Symbol' }, { key: 'realizedProfit', label: 'Net P/L', format: 'usdt' }, { key: 'settlementCount', label: 'Settlements' }, { key: 'botCount', label: 'Bots' }] },
  { id: 'topCreators', title: 'Top Bot Crew', subtitle: 'The five users with the highest lifetime bot-creation counts. Every successfully created bot counts, whether it is kept, sold, rented, or delisted. Creator emails are masked for privacy (for example, jayde***).', icon: Users, tier: 'moderate', columns: [{ key: 'creator', label: 'Creator' }, { key: 'createdBotCount', label: 'Bots Created' }] },
  { id: 'commerceEfficiency', title: 'Highest-Efficiency Bots for Sale', subtitle: 'Currently available Commerce listings, sorted by stored bot efficiency.', icon: Zap, tier: 'advanced', columns: [{ key: 'name', label: 'Bot' }, { key: 'symbol', label: 'Symbol' }, { key: 'efficiency', label: 'Efficiency', format: 'percent' }, { key: 'tradeDirection', label: 'Direction' }] },
  { id: 'rentalEfficiency', title: 'Highest-Efficiency Bots for Rent', subtitle: 'Currently available Rentals listings, sorted by stored bot efficiency.', icon: Trophy, tier: 'advanced', columns: [{ key: 'name', label: 'Bot' }, { key: 'symbol', label: 'Symbol' }, { key: 'efficiency', label: 'Efficiency', format: 'percent' }, { key: 'tradeDirection', label: 'Direction' }] },
];
const formatCell = (value: RankRow[string], format?: 'usdt' | 'percent' | 'date') => {
  if (value === null || value === undefined || value === '') return '—';
  if (format === 'usdt') return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  if (format === 'percent') return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (format === 'date') return new Date(String(value)).toLocaleString();
  return String(value);
};

const WorldScopePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<WorldScopeResponse | null>(null);
  const [activeSection, setActiveSection] = useState<keyof Rankings>('profitableBots');
  const isRankingsPage = window.location.pathname === '/worldscope-rankings' || window.location.hash.startsWith('#/worldscope-rankings');
  const [screen, setScreen] = useState<'intro' | 'payments'>(() => new URLSearchParams(window.location.search).get('plans') === '1' ? 'payments' : 'intro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedTier, setSelectedTier] = useState<ScopeTier>('moderate');
  const [confirmTier, setConfirmTier] = useState<ScopeTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadWorldScope = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<WorldScopeResponse>('/api/worldscope');
      setData(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load WorldScope. Please sign in and try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isRankingsPage) return;
    setScreen(new URLSearchParams(window.location.search).get('plans') === '1' ? 'payments' : 'intro');
  }, [isRankingsPage]);

  useEffect(() => {
    void loadWorldScope();
    const refreshInterval = window.setInterval(() => { void loadWorldScope(); }, 60_000);
    return () => window.clearInterval(refreshInterval);
  }, [loadWorldScope]);

  const tier = data?.access?.tier || null;
  const accessActive = Boolean(data?.access?.active);
  const canUseAdvanced = tier === 'advanced';
  const canUseModerate = Boolean(tier);
  const visibleSections = useMemo(() => sections.filter(section => section.tier === 'moderate' ? canUseModerate : canUseAdvanced), [canUseModerate, canUseAdvanced]);
  const selectedSection = visibleSections.find(section => section.id === activeSection) || visibleSections[0] || sections[0];
  const SectionIcon = selectedSection.icon;
  const activeRows = (data?.rankings?.[selectedSection.id] || []) as RankRow[];
  const prices = data?.access?.prices || { monthly: { moderate: 1, advanced: 2.5 }, yearly: { moderate: 10, advanced: 25 } };
  const expiresAt = data?.access?.expiresAt ? new Date(data.access.expiresAt) : null;

  const purchase = async (requestedTier: ScopeTier) => {
    setPurchasing(true); setError(''); setMessage('');
    try {
      const response = await api.post('/api/worldscope/purchase', { tier: requestedTier, billingCycle });
      setMessage(response.data?.message || 'WorldScope subscription activated.');
      await loadWorldScope();
      setSelectedTier(requestedTier);
      setActiveSection(requestedTier === 'advanced' ? 'commerceEfficiency' : 'profitableBots');
      navigate('/worldscope-rankings');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to purchase this WorldScope plan. Please try again.');
    } finally { setPurchasing(false); }
  };

  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', paddingBottom: 90, overflowX: 'hidden', overflowY: 'auto', background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' },
    back: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: 10, padding: '7px 10px', fontSize: '.84rem', fontWeight: 700, marginBottom: 12, cursor: 'pointer' },
    hero: { border: `1px solid ${theme.borderGlass}`, background: 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(168,85,247,0.17))', borderRadius: 20, padding: 'clamp(18px, 4vw, 28px)', display: 'grid', gap: 13, marginBottom: 16 },
    eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 7, color: theme.primary, fontSize: '.74rem', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' as const },
    title: { margin: 0, fontSize: 'clamp(1.15rem, 3vw, 1.45rem)', lineHeight: 1.25, letterSpacing: '-.03em', fontWeight: 900 },
    subtitle: { margin: 0, color: theme.textMuted, fontSize: '.92rem', lineHeight: 1.7, maxWidth: '64ch' },
    sectionTitle: { margin: '14px 0 10px', fontSize: 'clamp(1.15rem, 3vw, 1.45rem)', fontWeight: 900, letterSpacing: '-.03em' },
    muted: { color: theme.textMuted, fontSize: '.82rem', lineHeight: 1.5 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 },
    outerCard: { padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, minWidth: 0 },
    card: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, borderRadius: 15, padding: 14, display: 'grid', alignContent: 'start', gap: 12, minWidth: 0, boxSizing: 'border-box' as const },
    button: { width: '100%', minWidth: 108, border: 'none', borderRadius: 999, padding: '11px 16px', color: theme.text, background: theme.surfaceMuted, fontWeight: 700, fontSize: '.88rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', boxSizing: 'border-box' as const },
    primaryButton: { background: theme.primary, color: theme.textInverse, borderColor: theme.primary },
    confirmPanel: { display: 'grid', gap: 10, padding: 12, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, marginTop: 10 },
    confirmPrompt: { margin: 0, color: theme.textMuted, fontSize: '.86rem', lineHeight: 1.5 },
    confirmActions: { display: 'flex', gap: 8, width: '100%' },
    cancelConfirm: { flex: 1, borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '8px 13px', fontSize: '.82rem', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer' },
    confirmPurchase: { flex: 1, borderRadius: 999, border: `1px solid ${theme.primary}`, padding: '8px 13px', fontSize: '.82rem', fontWeight: 800, color: theme.textInverse, background: theme.primary, cursor: 'pointer' },
    featureList: { display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none', color: theme.textMuted, fontSize: '.88rem', lineHeight: 1.5 },
    notice: { border: `1px solid ${theme.borderGlass}`, borderRadius: 13, background: theme.surfaceMuted, color: theme.textMuted, padding: '12px 13px', fontSize: '.82rem', lineHeight: 1.5, marginTop: 12 },
    status: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, color: theme.textMuted, fontSize: '.82rem', lineHeight: 1.5 },
    tabRow: { display: 'flex', flexWrap: 'nowrap' as const, gap: 8, paddingBottom: 8, marginBottom: 12, width: '100%', overflowX: 'auto' as const, overflowY: 'hidden' as const, WebkitOverflowScrolling: 'touch' as const, scrollbarWidth: 'thin' as const },
    tab: { flex: '0 0 auto', minWidth: 'max-content', minHeight: 42, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '11px 16px', background: theme.surfaceGlass, color: theme.textMuted, fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, boxSizing: 'border-box' as const },
    rankingCard: { border: `1px solid ${theme.borderGlass}`, borderRadius: 15, padding: 14, background: theme.surfaceGlass, display: 'grid', gap: 10, marginBottom: 10, minWidth: 0, boxSizing: 'border-box' as const },
    rankingHead: { display: 'flex', alignItems: 'flex-start', gap: 11 },
    iconBox: { width: 38, height: 38, flex: '0 0 38px', display: 'grid', placeItems: 'center', borderRadius: 12, background: 'rgba(56,189,248,.12)', color: theme.primary },
    tableWrap: { overflowX: 'auto' as const, width: '100%' },
    table: { width: '100%', minWidth: 430, borderCollapse: 'collapse' as const, fontSize: '.8rem' },
    th: { textAlign: 'left' as const, color: theme.textMuted, fontSize: '.7rem', textTransform: 'uppercase' as const, letterSpacing: '.06em', padding: '10px 8px', borderBottom: `1px solid ${theme.borderGlass}` },
    td: { padding: '11px 8px', borderBottom: `1px solid ${theme.borderGlass}`, verticalAlign: 'top' as const },
    message: { borderRadius: 13, padding: '12px 13px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, fontSize: '.88rem', lineHeight: 1.5, margin: '10px 0' },
    footer: { marginTop: 14, color: theme.textMuted, fontSize: '.82rem', lineHeight: 1.5 },
  };

  const loaderStyle = `@keyframes worldscopeDotPulse { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } } .worldscope-dot-loader { width: 5px; height: 5px; border-radius: 50%; background: currentColor; display: inline-block; animation: worldscopeDotPulse 1s infinite ease-in-out; } .worldscope-dot-loader:nth-child(2) { animation-delay: .15s; } .worldscope-dot-loader:nth-child(3) { animation-delay: .3s; }`;
  return <HybridTheme mode={themeMode}>
    <style>{loaderStyle}</style>
    <div style={styles.page}>
      <main style={styles.shell}>
        <button type="button" style={styles.back} onClick={() => navigate(isRankingsPage ? '/worldscope' : '/store')}><ArrowLeft size={16} /> {isRankingsPage ? 'WorldScope' : 'Store'}</button>
        <div style={{ ...styles.outerCard, marginBottom: 16 }}>
          <section style={{ ...styles.hero, marginBottom: 0, background: theme.surfaceMuted }}>
            <div style={styles.eyebrow}><Activity size={15} /> CryBots platform intelligence</div>
            <h1 style={styles.title}>{isRankingsPage ? 'WorldScope Rankings' : 'WorldScope'}</h1>
            <p style={styles.subtitle}>{isRankingsPage ? 'Explore platform rankings built from recorded bot settlements and currently available Commerce and Rentals listings.' : 'Understand what is happening across the platform. WorldScope brings together rankings from recorded bot settlements and currently available Commerce and Rentals listings, so you can compare real app activity instead of relying on guesswork.'}</p>
            <div style={styles.status}>{loading ? <><span aria-label="Loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /></span> Checking your access…</> : accessActive ? <><CheckCircle2 size={14} color="#22c55e" /> Subscription active</> : <><LockKeyhole size={14} /> Paid subscription required</>} {data?.asOf && <>· Data snapshot {new Date(data.asOf).toLocaleString()}</>}</div>
          </section>
        </div>

        {error && <div role="alert" style={{ ...styles.message, borderColor: '#ef4444' }}>{error}</div>}
        {message && <div role="status" style={styles.message}>{message}</div>}

        {!isRankingsPage && screen === 'intro' && <>
          <h2 style={styles.sectionTitle}>What WorldScope gives you</h2>
          <div style={styles.grid}>
            <div style={styles.outerCard}><article style={styles.card}><div style={styles.eyebrow}><Bot size={17} /> Bot performance</div><h3 style={{ margin: 0 }}>See what is working</h3><p style={styles.subtitle}>Compare the five bots with the strongest recorded realized profit and loss across settlement history.</p></article></div>
            <div style={styles.outerCard}><article style={styles.card}><div style={styles.eyebrow}><BarChart3 size={17} /> Daily activity</div><h3 style={{ margin: 0 }}>Track active symbols</h3><p style={styles.subtitle}>See which five symbols rank highest by recorded bot settlement performance for the current UTC day.</p></article></div>
            <div style={styles.outerCard}><article style={styles.card}><div style={styles.eyebrow}><Users size={17} /> Creator insights</div><h3 style={{ margin: 0 }}>Discover top creators</h3><p style={styles.subtitle}>See the five users who have successfully created the most bots, regardless of whether those bots were sold, rented, or delisted. Creator emails are masked for privacy (for example, jayde***).</p></article></div>
            <div style={styles.outerCard}><article style={styles.card}><div style={styles.eyebrow}><Crown size={17} /> Advanced listings</div><h3 style={{ margin: 0 }}>Compare bots to buy or rent</h3><p style={styles.subtitle}>Advance Scope adds the five highest-efficiency currently available Commerce bots and five available Rentals bots.</p></article></div>
          </div>
          <div style={styles.notice}><ShieldCheck size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> WorldScope is a paid feature. Rankings are based on recorded CryBots data; they do not guarantee future profits or trading results. Your in-app USDT balance is charged when you confirm a plan.</div>
          <div style={{ ...styles.outerCard, marginTop: 14 }}>
            <div style={styles.card}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Choose when you're ready</h2>
              <p style={styles.subtitle}>Preview the subscription plans first. You can choose Moderate Scope for core rankings or Advance Scope for all five categories.</p>
              <button type="button" disabled={loading} style={{ ...styles.button, ...styles.primaryButton, opacity: loading ? 0.8 : 1 }} onClick={() => accessActive ? navigate('/worldscope-rankings') : setScreen('payments')}>{loading ? <span aria-label="Loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /></span> : accessActive ? <>View WorldScope Rankings <ArrowLeft size={15} style={{ display: 'inline', transform: 'rotate(180deg)', verticalAlign: 'middle', marginLeft: 4 }} /></> : <>Preview payment plans <ArrowLeft size={15} style={{ display: 'inline', transform: 'rotate(180deg)', verticalAlign: 'middle', marginLeft: 4 }} /></>}</button>
            </div>
          </div>
        </>}

        {!isRankingsPage && screen === 'payments' && <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={styles.sectionTitle}>WorldScope subscription</h2>
            <button type="button" style={{ ...styles.button, width: 'auto', minWidth: 0, padding: '9px 12px' }} onClick={() => { window.history.replaceState({}, '', '/worldscope'); setScreen('intro'); }}><ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Overview</button>
          </div>
          <p style={styles.subtitle}>Select a billing period, then choose the access level you want. Subscriptions expire at the end of the selected period and are not automatically renewed.</p>
          <div style={{ display: 'flex', gap: 8, margin: '14px 0', padding: 4, borderRadius: 999, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }}>
            {(['monthly', 'yearly'] as BillingCycle[]).map(cycle => <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)} style={{ ...styles.button, flex: 1, textTransform: 'capitalize', ...(billingCycle === cycle ? styles.primaryButton : { background: 'transparent', color: theme.textMuted }) }}>{cycle}{cycle === 'yearly' ? ' · Save more' : ''}</button>)}
          </div>
          <div style={styles.grid}>
            {(['moderate', 'advanced'] as ScopeTier[]).map(plan => {
              const advanced = plan === 'advanced';
              const price = prices[billingCycle][plan];
              const features = advanced ? ['Top 5 most profitable bots', 'Top 5 daily bot-traded symbols', 'Top 5 creators by recorded bot performance', 'Top 5 highest-efficiency bots for sale', 'Top 5 highest-efficiency bots for rent'] : ['Top 5 most profitable bots', 'Top 5 daily bot-traded symbols', 'Top 5 creators by recorded bot performance'];
              return <div key={plan} style={styles.outerCard}><article style={{ ...styles.card, borderColor: selectedTier === plan ? theme.primary : theme.borderGlass }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><h3 style={{ margin: 0, fontSize: '1.03rem' }}>{advanced ? 'Advance Scope' : 'Moderate Scope'}</h3>{advanced ? <Crown size={19} color="#a855f7" /> : <ShieldCheck size={19} color={theme.primary} />}</div>
                <div><span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{price.toFixed(2).replace(/\.00$/, '')}</span> <strong>USDT</strong><div style={styles.muted}>per {billingCycle === 'monthly' ? 'month' : 'year'}</div></div>
                <ul style={styles.featureList}>{features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
                <button type="button" disabled={loading || purchasing} style={{ ...styles.button, ...(selectedTier === plan ? styles.primaryButton : {}) }} onClick={() => { setSelectedTier(plan); setConfirmTier(plan); setError(''); setMessage(''); }}>{confirmTier === plan ? 'Confirmation open' : `Subscribe · ${price.toFixed(2).replace(/\.00$/, '')} USDT`}</button>
                {confirmTier === plan ? <div style={styles.confirmPanel} role="alertdialog" aria-label={`Confirm ${advanced ? 'Advance Scope' : 'Moderate Scope'} subscription`}>
                  <p style={styles.confirmPrompt}>Confirm your WorldScope subscription before payment.</p>
                  <div style={styles.status}><strong>Plan:</strong> {advanced ? 'Advance Scope' : 'Moderate Scope'} · {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</div>
                  <div style={styles.status}><strong>Charge:</strong> {price.toFixed(2).replace(/\.00$/, '')} USDT</div>
                  <div style={styles.status}><strong>Available balance:</strong> {Number(data?.walletBalance || 0).toFixed(2)} USDT</div>
                  <p style={styles.confirmPrompt}>Your in-app USDT balance will be charged only after you confirm. This plan does not renew automatically.</p>
                  <div style={styles.confirmActions}>
                    <button type="button" style={styles.cancelConfirm} disabled={purchasing} onClick={() => setConfirmTier(null)}>Cancel</button>
                    <button type="button" style={styles.confirmPurchase} disabled={loading || purchasing} onClick={() => void purchase(plan)}>{purchasing ? 'Activating…' : 'Confirm subscription'}</button>
                  </div>
                </div> : null}
              </article></div>;
            })}
          </div>
          <div style={styles.notice}><LockKeyhole size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> Available balance: <strong>{Number(data?.walletBalance || 0).toFixed(2)} USDT</strong>. Monthly pricing is 1 USDT for Moderate and 2.50 USDT for Advance; yearly pricing is 10 USDT and 25 USDT respectively. Yearly plans cost less than paying monthly for 12 months.</div>
        </>}

        {isRankingsPage && !accessActive && <>
          <div style={styles.outerCard}>
            <section style={{ ...styles.card, textAlign: 'center' as const, justifyItems: 'center' }}>
              <div style={styles.iconBox}><LockKeyhole size={20} /></div>
              <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>Subscription required</h2>
              <p style={styles.subtitle}>{loading ? 'Checking your WorldScope subscription…' : 'WorldScope Rankings are available to users with an active Moderate Scope or Advance Scope subscription.'}</p>
              <button type="button" style={{ ...styles.button, ...styles.primaryButton }} onClick={() => navigate('/worldscope?plans=1')}>View subscription plans</button>
              <button type="button" style={styles.button} onClick={() => navigate('/worldscope')}>Back to WorldScope overview</button>
            </section>
          </div>
        </>}
        {isRankingsPage && accessActive && <>
          <div style={{ ...styles.outerCard, marginBottom: 14 }}>
            <div style={styles.card}>
            <div style={styles.status}><CheckCircle2 size={16} color="#22c55e" /> <strong>{tier === 'advanced' ? 'Advance Scope' : 'Moderate Scope'} active</strong> · {data?.access?.lifetimeAccess ? 'Legacy lifetime access' : `${data?.access?.billingCycle || 'subscription'} plan`}</div>
            <div style={styles.status}>Wallet balance: <strong>{Number(data?.walletBalance || 0).toFixed(2)} USDT</strong>{expiresAt && <> · Expires {expiresAt.toLocaleDateString()}</>}</div>
            {tier !== 'advanced' && <button type="button" style={styles.button} onClick={() => navigate('/worldscope?plans=1')}>Upgrade to Advance Scope</button>}
            {expiresAt && expiresAt.getTime() <= Date.now() + 7 * 86400000 && <button type="button" style={{ ...styles.button, ...styles.primaryButton }} onClick={() => navigate('/worldscope?plans=1')}>Renew subscription</button>}
            </div>
          </div>
          <h2 style={styles.sectionTitle}>Your live rankings</h2>
          <div style={styles.status}>{loading ? <><span aria-label="Loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /></span> Fetching selected ranking…</> : data?.asOf ? <><Clock3 size={14} /> Snapshot {new Date(data.asOf).toLocaleString()} · UTC daily window</> : 'Waiting for ranking data'}</div>
          <div style={styles.tabRow} role="tablist" aria-label="WorldScope rankings">
            {visibleSections.map(section => <button key={section.id} type="button" role="tab" aria-selected={selectedSection.id === section.id} style={{ ...styles.tab, ...(selectedSection.id === section.id ? { color: theme.textInverse, borderColor: theme.primary, background: theme.primary } : {}) }} onClick={() => { if (selectedSection.id === section.id) return; setActiveSection(section.id); void loadWorldScope(); }}>{section.title}</button>)}
          </div>
          <div style={styles.outerCard}>
          <section style={{ ...styles.rankingCard, background: theme.surfaceMuted }}>
            <div style={styles.rankingHead}><div style={styles.iconBox}><SectionIcon size={20} /></div><div style={{ flex: 1, minWidth: 0 }}><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{selectedSection.title}</h3><p style={{ ...styles.subtitle, fontSize: '.88rem', marginTop: 5 }}>{selectedSection.subtitle}</p></div>{selectedSection.tier === 'advanced' && <span style={{ fontSize: '.74rem', fontWeight: 900, color: '#a855f7' }}>ADVANCE</span>}</div>
            {loading ? <div style={{ ...styles.message, display: 'flex', alignItems: 'center', gap: 8 }}><span aria-label="Loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /><span className="worldscope-dot-loader" /></span> Fetching fresh ranking data…</div> : activeRows.length === 0 ? <div style={styles.message}>No qualifying records are available for this ranking yet. No sample numbers are shown.</div> : <div style={styles.tableWrap}><table style={styles.table}><thead><tr><th style={styles.th}>Rank</th>{selectedSection.columns.map(column => <th key={column.key} style={styles.th}>{column.label}</th>)}</tr></thead><tbody>{activeRows.slice(0, 5).map((row, index) => <tr key={String(row.botId || row.symbol || row.creator || index)}><td style={{ ...styles.td, fontWeight: 900 }}>#{index + 1}</td>{selectedSection.columns.map(column => <td key={column.key} style={styles.td}>{formatCell(row[column.key], column.format)}</td>)}</tr>)}</tbody></table></div>}
            <div style={styles.muted}>Window: {data?.windows?.[selectedSection.id === 'profitableBots' ? 'botProfitability' : selectedSection.id === 'dailySymbols' ? 'dailySymbols' : selectedSection.id === 'topCreators' ? 'creatorCreationCounts' : 'listings'] || 'server-recorded data'}.</div>
          </section>
          </div>
          <div style={styles.footer}><Sparkles size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> Profit rankings use recorded settlement entries. Daily symbol ranking uses the current UTC date. Listing rankings only include currently available bots. Rankings describe recorded app activity and are not a promise of future returns.</div>
        </>}
      </main>
      <NowBar />
    </div>
  </HybridTheme>;
};

export default WorldScopePage;
