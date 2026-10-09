import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, BarChart3, Bot, CheckCircle2, Clock3, Crown, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type ScopeTier = 'moderate' | 'advanced';
type RankRow = Record<string, string | number | null>;
type Rankings = {
  profitableBots?: RankRow[];
  dailySymbols?: RankRow[];
  topCreators?: RankRow[];
  commerceEfficiency?: RankRow[];
  rentalEfficiency?: RankRow[];
};
type WorldScopeResponse = {
  access?: { tier: ScopeTier | null; active: boolean; prices: Record<ScopeTier, number>; paidAmount?: number; purchasedAt?: string; lifetimeAccess?: boolean };
  walletBalance?: number;
  asOf?: string;
  timezone?: string;
  windows?: Record<string, string>;
  rankings?: Rankings | null;
  message?: string;
};
type RankingSection = { id: keyof Rankings; title: string; subtitle: string; icon: React.ComponentType<{ size?: number }>; tier: ScopeTier; columns: { key: string; label: string; format?: 'usdt' | 'percent' | 'date' }[] };

const sections: RankingSection[] = [
  { id: 'profitableBots', title: 'Most Profitable Bots', subtitle: 'Ranked by the sum of recorded realized bot settlement profit and loss.', icon: Bot, tier: 'moderate', columns: [{ key: 'name', label: 'Bot' }, { key: 'symbol', label: 'Symbol' }, { key: 'realizedProfit', label: 'Net P/L', format: 'usdt' }, { key: 'settlementDays', label: 'Settlements' }] },
  { id: 'dailySymbols', title: 'Top Daily Traded Symbols', subtitle: 'Symbols ranked by recorded realized bot P/L for the current UTC day.', icon: BarChart3, tier: 'moderate', columns: [{ key: 'symbol', label: 'Symbol' }, { key: 'realizedProfit', label: 'Net P/L', format: 'usdt' }, { key: 'settlementCount', label: 'Settlements' }, { key: 'botCount', label: 'Bots' }] },
  { id: 'topCreators', title: 'Top Bot Creators', subtitle: 'Creators ranked by the realized performance of bots they created. Creator IDs are anonymized.', icon: Users, tier: 'moderate', columns: [{ key: 'creator', label: 'Creator' }, { key: 'realizedProfit', label: 'Net P/L', format: 'usdt' }, { key: 'profitableBotCount', label: 'Bots' }, { key: 'settlementDays', label: 'Settlements' }] },
  { id: 'commerceEfficiency', title: 'Highest-Efficiency Bots for Sale', subtitle: 'Currently available Commerce listings, ranked by the bot efficiency stored by the server.', icon: Zap, tier: 'advanced', columns: [{ key: 'name', label: 'Bot' }, { key: 'symbol', label: 'Symbol' }, { key: 'efficiency', label: 'Efficiency', format: 'percent' }, { key: 'tradeDirection', label: 'Direction' }] },
  { id: 'rentalEfficiency', title: 'Highest-Efficiency Bots for Rent', subtitle: 'Currently available Rentals listings, ranked by the bot efficiency stored by the server.', icon: Trophy, tier: 'advanced', columns: [{ key: 'name', label: 'Bot' }, { key: 'symbol', label: 'Symbol' }, { key: 'efficiency', label: 'Efficiency', format: 'percent' }, { key: 'tradeDirection', label: 'Direction' }] },
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
  const [selectedTier, setSelectedTier] = useState<ScopeTier>('moderate');
  const [activeSection, setActiveSection] = useState<keyof Rankings>('profitableBots');
  const [showPricing, setShowPricing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<ScopeTier | null>(null);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadWorldScope(); }, [loadWorldScope]);

  const tier = data?.access?.tier || null;
  const canUseAdvanced = tier === 'advanced';
  const canUseModerate = Boolean(tier);
  const visibleSections = useMemo(() => sections.filter((section) => section.tier === 'moderate' ? canUseModerate : canUseAdvanced), [canUseModerate, canUseAdvanced]);
  const selectedSection = visibleSections.find((section) => section.id === activeSection) || visibleSections[0] || sections.find((section) => section.id === activeSection) || sections[0];
  const SectionIcon = selectedSection.icon;
  const activeRows = (data?.rankings?.[selectedSection.id] || []) as RankRow[];

  const purchase = async (requestedTier: ScopeTier) => {
    setPurchasing(requestedTier);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/api/worldscope/purchase', { tier: requestedTier });
      setMessage(response.data?.message || 'WorldScope access updated.');
      await loadWorldScope();
      setSelectedTier(requestedTier);
      setActiveSection(requestedTier === 'advanced' ? 'commerceEfficiency' : 'profitableBots');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to purchase WorldScope access. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', paddingBottom: 100, overflowX: 'hidden', background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: 980, margin: '0 auto', padding: 'clamp(14px, 3vw, 28px)', boxSizing: 'border-box' },
    back: { display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: 10, padding: '8px 11px', fontWeight: 750, marginBottom: 16, cursor: 'pointer' },
    hero: { border: `1px solid ${theme.borderGlass}`, background: 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(168,85,247,0.17))', borderRadius: 20, padding: '20px 18px', display: 'grid', gap: 12, marginBottom: 18 },
    eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 7, color: theme.primary, fontSize: '.74rem', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' as const },
    title: { margin: 0, fontSize: 'clamp(1.55rem, 5vw, 2.1rem)', lineHeight: 1.1, letterSpacing: '-.04em', fontWeight: 950 },
    subtitle: { margin: 0, color: theme.textMuted, fontSize: '.92rem', lineHeight: 1.65, maxWidth: '68ch' },
    status: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: theme.textMuted, flexWrap: 'wrap' as const },
    sectionTitle: { margin: '20px 0 10px', fontSize: '1.05rem', fontWeight: 900 },
    tierGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 265px), 1fr))', gap: 12 },
    tierCard: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, borderRadius: 17, padding: 16, display: 'grid', gap: 12, minWidth: 0 },
    tierHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    tierName: { margin: 0, fontSize: '1rem', fontWeight: 900 },
    price: { fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-.04em' },
    muted: { color: theme.textMuted, fontSize: '.78rem', lineHeight: 1.55 },
    featureList: { display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none', color: theme.textMuted, fontSize: '.84rem', lineHeight: 1.45 },
    button: { width: '100%', border: `1px solid ${theme.borderGlass}`, borderRadius: 11, padding: '11px 13px', color: theme.text, background: theme.surfaceMuted, fontWeight: 850, cursor: 'pointer' },
    selected: { borderColor: theme.primary, boxShadow: `0 0 0 1px ${theme.primary} inset` },
    notice: { border: `1px solid ${theme.borderGlass}`, borderRadius: 12, background: theme.surfaceMuted, color: theme.textMuted, padding: '11px 13px', fontSize: '.8rem', lineHeight: 1.55, marginTop: 12 },
    tabRow: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 5, marginBottom: 12 },
    tab: { flex: '0 0 auto', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '9px 12px', background: theme.surfaceGlass, color: theme.textMuted, fontSize: '.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' as const },
    rankingCard: { border: `1px solid ${theme.borderGlass}`, borderRadius: 16, padding: 15, background: theme.surfaceGlass, display: 'grid', gap: 10, marginBottom: 10, minWidth: 0 },
    rankingHead: { display: 'flex', alignItems: 'flex-start', gap: 11 },
    iconBox: { width: 38, height: 38, flex: '0 0 38px', display: 'grid', placeItems: 'center', borderRadius: 12, background: 'rgba(56,189,248,.12)', color: theme.primary },
    smallText: { margin: '4px 0 0', color: theme.textMuted, fontSize: '.82rem', lineHeight: 1.5 },
    tableWrap: { overflowX: 'auto' as const, width: '100%' },
    table: { width: '100%', minWidth: 430, borderCollapse: 'collapse' as const, fontSize: '.8rem' },
    th: { textAlign: 'left' as const, color: theme.textMuted, fontSize: '.7rem', textTransform: 'uppercase' as const, letterSpacing: '.06em', padding: '10px 8px', borderBottom: `1px solid ${theme.borderGlass}` },
    td: { padding: '11px 8px', borderBottom: `1px solid ${theme.borderGlass}`, verticalAlign: 'top' as const },
    message: { borderRadius: 11, padding: '11px 12px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, fontSize: '.84rem', lineHeight: 1.5, margin: '10px 0' },
    footer: { marginTop: 16, color: theme.textMuted, fontSize: '.76rem', lineHeight: 1.6 },
  };

  const accessActive = Boolean(data?.access?.active);
  const priceModerate = data?.access?.prices?.moderate ?? 10;
  const priceAdvanced = data?.access?.prices?.advanced ?? 25;
  const advancedCharge = tier === 'moderate' ? priceAdvanced - priceModerate : priceAdvanced;
  const rankTitles: Record<string, string> = { profitableBots: 'Most Profitable Bots', dailySymbols: 'Top Daily Traded Symbols', topCreators: 'Top Bot Creators', commerceEfficiency: 'Highest-Efficiency Bots for Sale', rentalEfficiency: 'Highest-Efficiency Bots for Rent' };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <main style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/store')}><ArrowLeft size={16} /> Store</button>
          <section style={styles.hero}>
            <div style={styles.eyebrow}><Activity size={15} /> Live platform intelligence</div>
            <h1 style={styles.title}>WorldScope</h1>
            <p style={styles.subtitle}>Live rankings built from CryBots' recorded bot settlements and currently available listings. Profit rankings use realized bot profit and loss recorded by the server; efficiency rankings use the stored efficiency of bots listed now.</p>
            <div style={styles.status}>
              {loading ? <><RefreshCw size={14} /> Refreshing platform data…</> : data?.asOf ? <><CheckCircle2 size={14} color="#22c55e" /> Data snapshot: {new Date(data.asOf).toLocaleString()} · UTC daily window</> : <><Clock3 size={14} /> Waiting for live ranking data</>}
              <button type="button" onClick={() => void loadWorldScope()} disabled={loading} style={{ border: 0, background: 'transparent', color: theme.primary, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' }}><RefreshCw size={13} /> Refresh</button>
            </div>
            <div style={styles.status}><ShieldCheck size={14} /> Real database results only — empty categories stay empty until there are qualifying records.</div>
          </section>

          {error && <div role="alert" style={{ ...styles.message, borderColor: '#ef4444' }}>{error}</div>}
          {message && <div role="status" style={styles.message}>{message}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={{ ...styles.sectionTitle, marginTop: 4 }}>Choose your scope</h2>
            <button type="button" onClick={() => setShowPricing((value) => !value)} style={{ border: 0, background: 'transparent', color: theme.primary, fontWeight: 800, fontSize: '.78rem', cursor: 'pointer' }}>{showPricing ? 'Hide plans' : 'Show plans'}</button>
          </div>

          {showPricing && <div style={styles.tierGrid}>
            <article style={{ ...styles.tierCard, ...(selectedTier === 'moderate' ? styles.selected : {}) }}>
              <div style={styles.tierHeader}><h3 style={styles.tierName}>Moderate Scope</h3><ShieldCheck size={19} color={theme.primary} /></div>
              <div><span style={styles.price}>{priceModerate} <span style={{ ...styles.muted, fontWeight: 700 }}>USDT</span></span><div style={styles.muted}>One-time · Lifetime access</div></div>
              <ul style={styles.featureList}><li>✓ Top 5 most profitable bots</li><li>✓ Top 5 daily bot-traded symbols</li><li>✓ Top 5 bot creators by realized bot performance</li></ul>
              <button type="button" disabled={loading || purchasing !== null || tier === 'moderate' || tier === 'advanced'} style={{ ...styles.button, ...(tier ? { opacity: .65, cursor: 'default' } : { background: theme.primary, color: theme.textInverse }) }} onClick={() => void purchase('moderate')}>{tier === 'moderate' || tier === 'advanced' ? 'Moderate access unlocked' : purchasing === 'moderate' ? 'Unlocking…' : 'Unlock Moderate Scope · 10 USDT'}</button>
            </article>
            <article style={{ ...styles.tierCard, ...(selectedTier === 'advanced' ? styles.selected : {}) }}>
              <div style={styles.tierHeader}><h3 style={styles.tierName}>Advance Scope</h3><Crown size={19} color="#a855f7" /></div>
              <div><span style={styles.price}>{priceAdvanced} <span style={{ ...styles.muted, fontWeight: 700 }}>USDT</span></span><div style={styles.muted}>One-time · Lifetime full access</div></div>
              <ul style={styles.featureList}><li>✓ Everything in Moderate Scope</li><li>✓ Top 5 highest-efficiency bots available for sale</li><li>✓ Top 5 highest-efficiency bots available for rent</li></ul>
              <button type="button" disabled={loading || purchasing !== null || tier === 'advanced'} style={{ ...styles.button, ...(tier === 'advanced' ? { opacity: .65, cursor: 'default' } : { background: theme.primary, color: theme.textInverse }) }} onClick={() => void purchase('advanced')}>{tier === 'advanced' ? 'Advance access unlocked' : purchasing === 'advanced' ? 'Unlocking…' : tier === 'moderate' ? `Upgrade to Advance · ${advancedCharge} USDT` : 'Unlock Advance Scope · 25 USDT'}</button>
            </article>
          </div>}

          <div style={styles.notice}><LockKeyhole size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> {accessActive ? <>Your <strong>{tier === 'advanced' ? 'Advance' : 'Moderate'} Scope</strong> access is active{data?.access?.lifetimeAccess ? ' for lifetime access' : ''}. Wallet balance: <strong>{Number(data?.walletBalance || 0).toFixed(2)} USDT</strong>. {tier === 'moderate' && 'Upgrade to Advance for 15 USDT to unlock all ranking categories.'}</> : <>Rankings are locked until you unlock a scope. Wallet balance: <strong>{Number(data?.walletBalance || 0).toFixed(2)} USDT</strong>. Payment is deducted from your in-app USDT balance; access is checked by the backend on every ranking request.</>}</div>

          <h2 style={styles.sectionTitle}>Live ranking dashboard</h2>
          {accessActive && visibleSections.length > 0 ? <>
            <div style={styles.tabRow} role="tablist" aria-label="WorldScope rankings">
              {visibleSections.map((section) => <button key={section.id} type="button" role="tab" aria-selected={selectedSection.id === section.id} style={{ ...styles.tab, ...(selectedSection.id === section.id ? { color: theme.text, borderColor: theme.primary, background: theme.surfaceMuted } : {}) }} onClick={() => setActiveSection(section.id)}>{section.title}</button>)}
            </div>
            <section style={styles.rankingCard}>
              <div style={styles.rankingHead}>
                <div style={styles.iconBox}><SectionIcon size={20} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '.98rem', fontWeight: 900 }}>{selectedSection.title}</h3>
                  <p style={styles.smallText}>{selectedSection.subtitle}</p>
                </div>
                {selectedSection.tier === 'advanced' && <span style={{ fontSize: '.65rem', fontWeight: 900, color: '#a855f7', border: '1px solid rgba(168,85,247,.4)', padding: '4px 7px', borderRadius: 99 }}>ADVANCE</span>}
              </div>
              {loading ? <div style={styles.message}>Loading current rankings…</div> : activeRows.length === 0 ? <div style={styles.message}>No qualifying records are available for this ranking yet. Nothing has been fabricated or filled with sample data.</div> : <div style={styles.tableWrap}><table style={styles.table}><thead><tr><th style={styles.th}>Rank</th>{selectedSection.columns.map((column) => <th key={column.key} style={styles.th}>{column.label}</th>)}</tr></thead><tbody>{activeRows.slice(0, 5).map((row, index) => <tr key={String(row.botId || row.symbol || row.creator || index)}><td style={{ ...styles.td, fontWeight: 900 }}>#{index + 1}</td>{selectedSection.columns.map((column) => <td key={column.key} style={styles.td}>{formatCell(row[column.key], column.format)}</td>)}</tr>)}</tbody></table></div>}
              <div style={styles.muted}>Ranking window: {data?.windows?.[selectedSection.id === 'profitableBots' ? 'botProfitability' : selectedSection.id === 'dailySymbols' ? 'dailySymbols' : selectedSection.id === 'topCreators' ? 'creatorProfitability' : 'listings'] || 'server-recorded data'}.</div>
            </section>
          </> : <section style={styles.rankingCard}>
            <div style={styles.rankingHead}><div style={styles.iconBox}><LockKeyhole size={20} /></div><div><h3 style={{ margin: 0, fontSize: '.98rem', fontWeight: 900 }}>Unlock the live rankings</h3><p style={styles.smallText}>Choose Moderate Scope or Advance Scope above to see current database-backed results.</p></div></div>
            {sections.map((section) => <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 0', borderTop: `1px solid ${theme.borderGlass}`, color: theme.textMuted, fontSize: '.84rem' }}><LockKeyhole size={15} /><span style={{ flex: 1 }}>{rankTitles[section.id]}</span><span style={{ fontSize: '.68rem', fontWeight: 900 }}>{section.tier === 'advanced' ? 'ADVANCE' : 'MODERATE'}</span></div>)}
          </section>}

          <div style={styles.footer}><Sparkles size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> Profit rankings are calculated from recorded settlement entries; daily symbol ranking uses the current UTC date. Listing rankings only include bots currently available in Commerce or Rentals. Creator identifiers are anonymized. The figures reflect recorded app data, not a promise of future returns.</div>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default WorldScopePage;
