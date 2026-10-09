import React, { useState } from 'react';
import { Activity, ArrowLeft, BarChart3, Bot, Crown, LockKeyhole, ShieldCheck, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type ScopeTier = 'moderate' | 'advanced';

const rankingSections = [
  { id: 'profitable-bots', title: 'Most Profitable Bots', subtitle: 'Top 5 bots by verified realized profit across CryBots.', icon: Bot, tier: 'moderate' as ScopeTier },
  { id: 'daily-symbols', title: 'Top Daily Traded Symbols', subtitle: 'Symbols producing the strongest bot-trading results today.', icon: BarChart3, tier: 'moderate' as ScopeTier },
  { id: 'bot-creators', title: 'Top Bot Creators', subtitle: 'Creators ranked by the realized performance of their bots.', icon: Users, tier: 'moderate' as ScopeTier },
  { id: 'commerce-efficiency', title: 'Highest-Efficiency Bots for Sale', subtitle: 'The leading eligible bots currently listed in Commerce.', icon: Zap, tier: 'advanced' as ScopeTier },
  { id: 'rental-efficiency', title: 'Highest-Efficiency Bots for Rent', subtitle: 'The leading eligible bots currently listed in Rentals.', icon: Trophy, tier: 'advanced' as ScopeTier },
];

const WorldScopePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [selectedTier, setSelectedTier] = useState<ScopeTier>('moderate');
  const [activeSection, setActiveSection] = useState(rankingSections[0].id);
  const [showPricing, setShowPricing] = useState(true);

  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', paddingBottom: '100px', overflowX: 'hidden', background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: '980px', margin: '0 auto', padding: 'clamp(14px, 3vw, 28px)', boxSizing: 'border-box' },
    back: { display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, borderRadius: 10, padding: '8px 11px', fontWeight: 750, marginBottom: 16, cursor: 'pointer' },
    hero: { border: `1px solid ${theme.borderGlass}`, background: 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(168,85,247,0.17))', borderRadius: 20, padding: '20px 18px', display: 'grid', gap: 12, marginBottom: 18 },
    eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 7, color: theme.primary, fontSize: '.74rem', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' as const },
    title: { margin: 0, fontSize: 'clamp(1.55rem, 5vw, 2.1rem)', lineHeight: 1.1, letterSpacing: '-.04em', fontWeight: 950 },
    subtitle: { margin: 0, color: theme.textMuted, fontSize: '.92rem', lineHeight: 1.65, maxWidth: '68ch' },
    status: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: theme.textMuted },
    dot: { width: 8, height: 8, borderRadius: 99, background: '#f59e0b', boxShadow: '0 0 12px rgba(245,158,11,.35)' },
    sectionTitle: { margin: '20px 0 10px', fontSize: '1.05rem', fontWeight: 900 },
    tierGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 265px), 1fr))', gap: 12 },
    tierCard: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, borderRadius: 17, padding: 16, display: 'grid', gap: 12, minWidth: 0 },
    tierHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    tierName: { margin: 0, fontSize: '1rem', fontWeight: 900 },
    price: { fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-.04em' },
    priceSuffix: { color: theme.textMuted, fontSize: '.78rem', fontWeight: 600, letterSpacing: 0 },
    featureList: { display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none', color: theme.textMuted, fontSize: '.84rem', lineHeight: 1.45 },
    choose: { width: '100%', border: `1px solid ${theme.borderGlass}`, borderRadius: 11, padding: '11px 13px', color: theme.text, background: theme.surfaceMuted, fontWeight: 850, cursor: 'pointer' },
    selected: { borderColor: theme.primary, boxShadow: `0 0 0 1px ${theme.primary} inset` },
    notice: { border: `1px solid ${theme.borderGlass}`, borderRadius: 12, background: theme.surfaceMuted, color: theme.textMuted, padding: '11px 13px', fontSize: '.8rem', lineHeight: 1.55, marginTop: 12 },
    tabRow: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 5, marginBottom: 12 },
    tab: { flex: '0 0 auto', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '9px 12px', background: theme.surfaceGlass, color: theme.textMuted, fontSize: '.78rem', fontWeight: 800, cursor: 'pointer' },
    rankingCard: { border: `1px solid ${theme.borderGlass}`, borderRadius: 16, padding: 15, background: theme.surfaceGlass, display: 'grid', gap: 10, marginBottom: 10 },
    rankingHead: { display: 'flex', alignItems: 'flex-start', gap: 11 },
    iconBox: { width: 38, height: 38, flex: '0 0 38px', display: 'grid', placeItems: 'center', borderRadius: 12, background: 'rgba(56,189,248,.12)', color: theme.primary },
    smallText: { margin: '4px 0 0', color: theme.textMuted, fontSize: '.82rem', lineHeight: 1.5 },
    lockRow: { border: `1px dashed ${theme.borderGlass}`, borderRadius: 11, padding: 12, display: 'flex', alignItems: 'center', gap: 9, color: theme.textMuted, fontSize: '.82rem' },
    footer: { marginTop: 16, color: theme.textMuted, fontSize: '.76rem', lineHeight: 1.6 },
  };

  const visibleSections = rankingSections.filter((section) => selectedTier === 'advanced' || section.tier === 'moderate');
  const selectedSection = visibleSections.find((section) => section.id === activeSection) || visibleSections[0];
  const SectionIcon = selectedSection.icon;

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <main style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/store')}><ArrowLeft size={16} /> Store</button>
          <section style={styles.hero}>
            <div style={styles.eyebrow}><Activity size={15} /> Global intelligence</div>
            <h1 style={styles.title}>WorldScope</h1>
            <p style={styles.subtitle}>See what is working across CryBots. Explore bot profitability, high-performing symbols, standout creators, and the most efficient bots listed for sale or rent.</p>
            <div style={styles.status}><span style={styles.dot} /> Ranking feed not connected yet — no sample figures are being presented as real data.</div>
          </section>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={{ ...styles.sectionTitle, marginTop: 4 }}>Choose your scope</h2>
            <button type="button" onClick={() => setShowPricing((value) => !value)} style={{ border: 0, background: 'transparent', color: theme.primary, fontWeight: 800, fontSize: '.78rem' }}>{showPricing ? 'Hide plans' : 'Show plans'}</button>
          </div>

          {showPricing && <div style={styles.tierGrid}>
            <article style={{ ...styles.tierCard, ...(selectedTier === 'moderate' ? styles.selected : {}) }}>
              <div style={styles.tierHeader}><h3 style={styles.tierName}>Moderate Scope</h3><ShieldCheck size={19} color={theme.primary} /></div>
              <div><span style={styles.price}>10 <span style={styles.priceSuffix}>USDT</span></span><div style={styles.priceSuffix}>Scope access</div></div>
              <ul style={styles.featureList}>
                <li>✓ Top 5 most profitable bots</li>
                <li>✓ Top 5 daily bot-traded symbols</li>
                <li>✓ Top 5 bot creators by verified bot profit</li>
                <li>✓ Core ranking summaries</li>
              </ul>
              <button type="button" style={{ ...styles.choose, ...(selectedTier === 'moderate' ? { background: theme.primary, color: theme.textInverse } : {}) }} onClick={() => { setSelectedTier('moderate'); if (!visibleSections.some((item) => item.id === activeSection)) setActiveSection(rankingSections[0].id); }}>Preview Moderate Scope</button>
            </article>
            <article style={{ ...styles.tierCard, ...(selectedTier === 'advanced' ? styles.selected : {}) }}>
              <div style={styles.tierHeader}><h3 style={styles.tierName}>Advance Scope</h3><Crown size={19} color="#a855f7" /></div>
              <div><span style={styles.price}>25 <span style={styles.priceSuffix}>USDT</span></span><div style={styles.priceSuffix}>Full scope access</div></div>
              <ul style={styles.featureList}>
                <li>✓ Everything in Moderate Scope</li>
                <li>✓ Top 5 highest-efficiency bots for sale</li>
                <li>✓ Top 5 highest-efficiency bots for rent</li>
                <li>✓ Full ranking categories as they become available</li>
              </ul>
              <button type="button" style={{ ...styles.choose, ...(selectedTier === 'advanced' ? { background: theme.primary, color: theme.textInverse } : {}) }} onClick={() => { setSelectedTier('advanced'); setActiveSection(rankingSections[3].id); }}>Preview Advance Scope</button>
            </article>
          </div>}

          <div style={styles.notice}><LockKeyhole size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> <strong>Checkout is not enabled yet.</strong> These prices are the proposed access tiers. A secure payment flow and server-side entitlement checks must be connected before anyone can buy or unlock paid rankings; selecting a preview does not grant access.</div>

          <h2 style={styles.sectionTitle}>Scope dashboard</h2>
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
            <div style={styles.lockRow}><LockKeyhole size={17} /><span>Ranked results will appear here once the live WorldScope data service is connected.</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6, opacity: .55 }} aria-hidden="true">
              {[1, 2, 3, 4, 5].map((rank) => <div key={rank} style={{ minWidth: 0, borderRadius: 9, border: `1px solid ${theme.borderGlass}`, padding: '9px 5px', textAlign: 'center', background: theme.surfaceMuted }}><div style={{ fontWeight: 900, fontSize: '.8rem' }}>#{rank}</div><div style={{ height: 5, marginTop: 8, borderRadius: 99, background: theme.borderGlass }} /><div style={{ height: 5, width: '65%', margin: '5px auto 0', borderRadius: 99, background: theme.borderGlass }} /></div>)}
            </div>
          </section>

          <div style={styles.footer}><Sparkles size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} /> Rankings should use verified, realized bot performance over clearly stated time windows, with duplicate/spam filtering and privacy-safe public usernames. Efficiency, profitability and daily symbol rankings must be calculated on the server — not inferred from client-side data.</div>
        </main>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default WorldScopePage;
