import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';

type CommerceBot = {
  _id?: string;
  botId?: string;
  name: string;
  symbolType?: string;
  symbol?: string;
  efficiency?: number;
  tradeDirection?: string;
  minTradeAmount?: number;
  maxTradeAmount?: number;
  retainerAmount?: number;
  price?: number;
  sellerName?: string;
  sellerId?: string;
  isOwner?: boolean;
  active?: boolean;
};

const CommercePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [activeView, setActiveView] = useState<'browse' | 'sell'>('browse');
  const [availableBots, setAvailableBots] = useState<CommerceBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState('');
  const [confirmingBuyBotId, setConfirmingBuyBotId] = useState('');
  const [unlistingId, setUnlistingId] = useState('');
  const [listingSaving, setListingSaving] = useState(false);
  const [listingBotId, setListingBotId] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingPricing, setListingPricing] = useState<{ botValue: number; salePriceMin: number; salePriceMax: number; qualityScore: number; qualityTier: string } | null>(null);
  const [listingPricingLoading, setListingPricingLoading] = useState(false);
  const [expandedBotId, setExpandedBotId] = useState('');

  useEffect(() => {
    if (!listingPricing) return;
    setListingPrice((current) => {
      const value = Number(current);
      if (!Number.isFinite(value)) return listingPricing.salePriceMin.toFixed(2);
      return Math.min(listingPricing.salePriceMax, Math.max(listingPricing.salePriceMin, value)).toFixed(2);
    });
  }, [listingPricing]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const outerCardStyle: React.CSSProperties = { display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const cardStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit' };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 999, padding: '9px 13px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', font: 'inherit' };

  useEffect(() => {
    if (!/^\d{6}$/.test(listingBotId.trim())) {
      setListingPricing(null);
      return;
    }
    let active = true;
    api.get('/api/market/check-owned-id', { params: { botId: listingBotId.trim() } })
      .then(() => {
        if (!active) return;
        setListingPricingLoading(true);
        return api.get('/api/commerce/pricing', { params: { botId: listingBotId.trim() } });
      })
      .then((response) => { if (active && response) setListingPricing(response.data || null); })
      .catch((requestError: any) => {
        if (!active) return;
        setListingPricing(null);
        if (requestError?.response?.status === 404) setError('Bot ID not found.');
        else if (requestError?.response?.status === 409) setError(requestError?.response?.data?.message || 'Deactivate this bot before listing it for sale.');
      })
      .finally(() => { if (active) setListingPricingLoading(false); });
    return () => { active = false; };
  }, [listingBotId]);

  const loadCommerce = async () => {
    setLoading(true);
    setError('');
    const availableResult = await Promise.allSettled([
      api.get('/api/commerce'),
    ]).then(([result]) => result);
    if (availableResult.status === 'fulfilled') {
      const data = availableResult.value.data;
      setAvailableBots(data?.bots || data || []);
    } else {
      setError(availableResult.reason?.response?.data?.message || 'Unable to load Commerce right now. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadCommerce();
  }, []);

  const buyBot = async (bot: CommerceBot) => {
    const botId = bot.botId || '';
    if (!botId) return;
    setBuyingId(botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/commerce/${botId}/buy`);
      setMessage(response.data?.message || `${bot.name} was purchased successfully.`);
      await loadCommerce();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to purchase this bot. Please try again.');
    } finally {
      setBuyingId('');
    }
  };

  const unlistBot = async (bot: CommerceBot) => {
    const botId = bot.botId || '';
    if (!botId) return;
    setUnlistingId(botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/commerce/${botId}/unlist`);
      setMessage(response.data?.message || 'Your bot has been unlisted from Commerce.');
      await loadCommerce();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to unlist this bot from Commerce. Please try again.');
    } finally {
      setUnlistingId('');
    }
  };

  const listBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!listingBotId.trim() || !listingPrice || Number(listingPrice) <= 0) {
      setError('Enter a bot ID and a sale price greater than zero.');
      return;
    }
    if (listingPricing && (Number(listingPrice) < listingPricing.salePriceMin || Number(listingPrice) > listingPricing.salePriceMax)) {
      setError(`Sale price must be between ${listingPricing.salePriceMin.toFixed(2)} and ${listingPricing.salePriceMax.toFixed(2)} USDT for this bot.`);
      return;
    }
    setListingSaving(true);
    try {
      await api.post('/api/commerce', { botId: listingBotId.trim(), price: Number(listingPrice) });
      setMessage('Your bot is now listed in Commerce.');
      setError('');
      setListingBotId('');
      setListingPrice('');
      setActiveView('browse');
      await loadCommerce();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to list your bot for sale. Please try again.');
    } finally {
      setListingSaving(false);
    }
  };

  const renderBot = (bot: CommerceBot) => {
    const botId = bot.botId || bot._id || bot.name;
    const expanded = expandedBotId === botId;
    return <article key={botId} style={outerCardStyle}>
      <section style={{ ...cardStyle, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 850, overflowWrap: 'anywhere' }}>{bot.name}</h3>
            <small style={{ color: theme.textMuted, overflowWrap: 'anywhere' }}>{bot.sellerName ? `Listed by ${bot.sellerName}` : 'Listed by —'}</small>
          </div>
          <button type="button" onClick={() => setExpandedBotId((current) => current === botId ? '' : botId)} style={{ flexShrink: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '7px 12px', background: theme.surfaceMuted, color: theme.primary, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
            {expanded ? 'Hide' : 'View'}
          </button>
        </div>

        {expanded && <div style={{ display: 'grid', gap: 10, paddingTop: 10, borderTop: `1px solid ${theme.borderGlass}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Market category</small><strong style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{bot.symbolType || 'crypto'}</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Trading symbol</small><strong style={{ fontSize: '0.88rem', overflowWrap: 'anywhere' }}>{bot.symbol || 'Not set'}</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Min activation</small><strong style={{ fontSize: '0.88rem' }}>{Number(bot.minTradeAmount ?? 0).toFixed(2)} USDT</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Max activation</small><strong style={{ fontSize: '0.88rem' }}>{Number(bot.maxTradeAmount ?? 0).toFixed(2)} USDT</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Retainer</small><strong style={{ fontSize: '0.88rem' }}>{Number(bot.retainerAmount ?? 0).toFixed(2)} USDT</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Trade direction</small><strong style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{bot.tradeDirection || 'long'}</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Efficiency</small><strong style={{ fontSize: '0.88rem' }}>{bot.efficiency ?? 0}%</strong></div>
            <div><small style={{ display: 'block', color: theme.textMuted, fontSize: '0.72rem' }}>Sale price</small><strong style={{ fontSize: '0.88rem', color: theme.primary }}>{bot.price !== undefined ? String(bot.price) + ' USDT' : 'Unavailable'}</strong></div>
          </div>
          <div style={{ width: '100%' }}>
            {bot.isOwner ? <button type="button" disabled={unlistingId === botId} onClick={() => void unlistBot(bot)} style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box', background: theme.surfaceGlass, color: theme.text, border: `1px solid ${theme.borderGlass}`, cursor: unlistingId === botId ? 'wait' : 'pointer' }}>{unlistingId === botId ? <InlineLoadingDots /> : 'Unlist'}</button> : confirmingBuyBotId === botId ? <div role="alertdialog" aria-label={`Confirm purchase of ${bot.name}`} style={{ display: 'grid', gap: 8, width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${theme.primary}`, background: theme.surfaceGlass }}><p style={{ margin: 0, color: theme.text, fontSize: '0.8rem', lineHeight: 1.4 }}>Buy <strong>{bot.name}</strong> for <strong>{Number(bot.price ?? 0).toFixed(2)} USDT</strong>?</p><div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => setConfirmingBuyBotId('')} disabled={buyingId === botId} style={{ flex: 1, border: `1px solid ${theme.borderGlass}`, borderRadius: 9, padding: '8px 10px', background: theme.surfaceMuted, color: theme.text, fontWeight: 800, cursor: 'pointer' }}>Cancel</button><button type="button" onClick={() => void buyBot(bot)} disabled={buyingId === botId} style={{ flex: 1, border: `1px solid ${theme.primary}`, borderRadius: 9, padding: '8px 10px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: buyingId === botId ? 'wait' : 'pointer' }}>{buyingId === botId ? <InlineLoadingDots /> : 'Confirm purchase'}</button></div></div> : <button type="button" disabled={Boolean(buyingId) || Boolean(confirmingBuyBotId)} onClick={() => setConfirmingBuyBotId(botId)} style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box', opacity: confirmingBuyBotId && confirmingBuyBotId !== botId ? 0.55 : 1 }}>Buy bot</button>}
          </div>
        </div>}
      </section>
    </article>;
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>Commerce | KingsHall</title></Helmet>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' }}>
      <div style={{ width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={17} /> Market</button>
        <section style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', gap: 8, margin: '0 0 14px', padding: 4, borderRadius: 12, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}` }}>
            {(['browse', 'sell'] as const).map((view) => <button key={view} type="button" onClick={() => setActiveView(view)} style={{ flex: 1, border: `1px solid ${theme.border}`, borderRadius: '9px', padding: '8px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', ...(activeView === view ? { borderColor: theme.primary, color: theme.primary } : {}) }}>{view === 'browse' ? 'Browse' : 'Sell'}</button>)}
          </div>
          {error && <NotificationBanner tone="error" title="Commerce unavailable" message={error} />}{message && <NotificationBanner tone="success" title="Commerce updated" message={message} />}
          {loading ? <div style={{ padding: 30, textAlign: 'center' }}><InlineLoadingDots /></div> : activeView === 'browse' ? <section><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Bots available to buy</h3>{availableBots.length ? <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{availableBots.map(renderBot)}</div> : <p style={{ color: theme.textMuted, fontSize: '0.82rem' }}>No bots are listed for sale yet.</p>}</section> : <form onSubmit={listBot} style={{ ...cardStyle, display: 'grid', gap: 12 }}><h3 style={{ margin: 0, fontSize: '1rem' }}>Sell your bot</h3><p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem' }}>You keep ownership until another user buys the bot. Sale proceeds are credited to your USDT balance.</p><label style={{ display: 'grid', gap: 7, fontSize: '0.85rem', fontWeight: 700 }}>Bot ID<input value={listingBotId} onChange={(event) => setListingBotId(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Enter 6-digit bot ID" style={inputStyle} /></label><label style={{ display: 'grid', gap: 7, fontSize: '0.85rem', fontWeight: 700 }}>Sale price in USDT{listingPricing ? <>
        <input type="range" min={listingPricing.salePriceMin} max={listingPricing.salePriceMax} step="0.01" value={Number(listingPrice) || listingPricing.salePriceMin} onChange={(event) => setListingPrice(event.target.value)} disabled={listingPricingLoading} style={{ width: '100%', accentColor: theme.primary, cursor: listingPricingLoading ? 'wait' : 'pointer' }} aria-label="Sale price" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: theme.textMuted, fontSize: '0.75rem' }}><span>{listingPricing.salePriceMin.toFixed(2)} USDT</span><strong style={{ color: theme.text }}>{(Number(listingPrice) || listingPricing.salePriceMin).toFixed(2)} USDT</strong><span>{listingPricing.salePriceMax.toFixed(2)} USDT</span></div>
      </> : <>
        <input type="range" min="0" max="0" step="0.01" value="0" disabled style={{ width: '100%', accentColor: theme.primary, opacity: 0.7 }} aria-label="Sale price" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: theme.textMuted, fontSize: '0.75rem' }}><span>0.00 USDT</span><strong style={{ color: theme.text }}>0.00 USDT</strong><span>0.00 USDT</span></div>
      </>}{listingPricing && <small style={{ color: theme.textMuted, fontWeight: 500 }}>{listingPricingLoading ? 'Calculating Bot Value…' : `Bot Value: ${listingPricing.botValue.toFixed(2)} USDT · Allowed sale range: ${listingPricing.salePriceMin.toFixed(2)}–${listingPricing.salePriceMax.toFixed(2)} USDT · ${listingPricing.qualityTier} (${listingPricing.qualityScore}/100)`}</small>}</label><button type="submit" disabled={listingSaving} style={{ ...buttonStyle, cursor: listingSaving ? 'wait' : 'pointer' }}>{listingSaving ? <InlineLoadingDots /> : 'Publish sale listing'}</button></form>}
        </section>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default CommercePage;
