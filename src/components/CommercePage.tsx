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
  symbol?: string;
  efficiency?: number;
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
  const [unlistingId, setUnlistingId] = useState('');
  const [listingSaving, setListingSaving] = useState(false);
  const [listingBotId, setListingBotId] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingPricing, setListingPricing] = useState<{ botValue: number; salePriceMin: number; salePriceMax: number; qualityScore: number; qualityTier: string } | null>(null);
  const [listingPricingLoading, setListingPricingLoading] = useState(false);

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

  const cardStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit' };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 999, padding: '9px 13px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', font: 'inherit' };

  useEffect(() => {
    if (!/^\d{6}$/.test(listingBotId.trim())) {
      setListingPricing(null);
      return;
    }
    let active = true;
    setListingPricingLoading(true);
    api.get('/api/commerce/pricing', { params: { botId: listingBotId.trim() } })
      .then((response) => { if (active) setListingPricing(response.data || null); })
      .catch(() => { if (active) setListingPricing(null); })
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
    return <article key={botId} style={{ ...cardStyle, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot size={20} color={theme.primary} /><div><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>{bot.name}</h3><small style={{ color: theme.textMuted, fontSize: '0.78rem' }}>{bot.symbol || 'Flexible strategy'}{bot.sellerName ? ` · Listed by ${bot.sellerName}` : ''}</small></div></div>
      <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem' }}>Permanent ownership · Efficiency {bot.efficiency ?? 0}% · Bot ID {bot.botId || 'Unavailable'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><strong style={{ fontSize: '0.86rem' }}>{bot.price !== undefined ? `${bot.price} USDT` : 'Price unavailable'}</strong>{bot.isOwner ? <button type="button" disabled={unlistingId === botId} onClick={() => void unlistBot(bot)} style={{ ...buttonStyle, background: theme.surfaceGlass, color: theme.text, border: `1px solid ${theme.borderGlass}`, cursor: unlistingId === botId ? 'wait' : 'pointer' }}>{unlistingId === botId ? <InlineLoadingDots /> : 'Unlist'}</button> : <button type="button" disabled={buyingId === botId} onClick={() => void buyBot(bot)} style={buttonStyle}>{buyingId === botId ? <InlineLoadingDots /> : 'Buy bot'}</button>}</div>
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
          {loading ? <div style={{ padding: 30, textAlign: 'center' }}><InlineLoadingDots /></div> : activeView === 'browse' ? <section><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Bots available to buy</h3>{availableBots.length ? <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{availableBots.map(renderBot)}</div> : <p style={{ color: theme.textMuted, fontSize: '0.82rem' }}>No bots are listed for sale yet.</p>}</section> : <form onSubmit={listBot} style={{ ...cardStyle, display: 'grid', gap: 12 }}><h3 style={{ margin: 0, fontSize: '1rem' }}>Sell your bot</h3><p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem' }}>You keep ownership until another user buys the bot. Sale proceeds are credited to your USDT balance.</p><label style={{ display: 'grid', gap: 7, fontSize: '0.85rem', fontWeight: 700 }}>Bot ID<input value={listingBotId} onChange={(event) => setListingBotId(event.target.value)} placeholder="Enter your created bot ID" style={inputStyle} /></label><label style={{ display: 'grid', gap: 7, fontSize: '0.85rem', fontWeight: 700 }}>Sale price in USDT{listingPricing ? <>
        <input type="range" min={listingPricing.salePriceMin} max={listingPricing.salePriceMax} step="0.01" value={Number(listingPrice) || listingPricing.salePriceMin} onChange={(event) => setListingPrice(event.target.value)} disabled={listingPricingLoading} style={{ width: '100%', accentColor: theme.primary, cursor: listingPricingLoading ? 'wait' : 'pointer' }} aria-label="Sale price" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: theme.textMuted, fontSize: '0.75rem' }}><span>{listingPricing.salePriceMin.toFixed(2)} USDT</span><strong style={{ color: theme.text }}>{(Number(listingPrice) || listingPricing.salePriceMin).toFixed(2)} USDT</strong><span>{listingPricing.salePriceMax.toFixed(2)} USDT</span></div>
      </> : <input type="number" min="0.01" step="0.01" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="Enter a bot ID first" style={inputStyle} />}{listingPricing && <small style={{ color: theme.textMuted, fontWeight: 500 }}>{listingPricingLoading ? 'Calculating Bot Value…' : `Bot Value: ${listingPricing.botValue.toFixed(2)} USDT · Allowed sale range: ${listingPricing.salePriceMin.toFixed(2)}–${listingPricing.salePriceMax.toFixed(2)} USDT · ${listingPricing.qualityTier} (${listingPricing.qualityScore}/100)`}</small>}</label><button type="submit" disabled={listingSaving} style={{ ...buttonStyle, cursor: listingSaving ? 'wait' : 'pointer' }}>{listingSaving ? <InlineLoadingDots /> : 'Publish sale listing'}</button></form>}
        </section>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default CommercePage;
