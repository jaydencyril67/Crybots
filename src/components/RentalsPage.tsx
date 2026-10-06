import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';
import InlineLoadingDots from './InlineLoadingDots';
import { useAppTheme } from './AppTheme';

type RentalBot = {
  _id?: string;
  id?: string;
  botId?: string;
  name: string;
  description?: string;
  symbol?: string;
  efficiency?: number;
  rentalPrice?: number;
  rentalDuration?: number;
  rentalDurationUnit?: 'hours' | 'days' | 'weeks' | 'months';
  rentalExpiresAt?: string;
  price?: number;
  ownerName?: string;
  ownerId?: string;
  isOwner?: boolean;
};

const RentalsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [activeView, setActiveView] = useState<'browse' | 'list'>('browse');
  const [availableBots, setAvailableBots] = useState<RentalBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState('');
  const [unlistingId, setUnlistingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [listingSaving, setListingSaving] = useState(false);
  const [listingBotId, setListingBotId] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingDuration, setListingDuration] = useState('');
  const [listingDurationUnit, setListingDurationUnit] = useState<'hours' | 'days' | 'weeks' | 'months'>('days');
  const [durationMenuOpen, setDurationMenuOpen] = useState(false);
  const [listingPricing, setListingPricing] = useState<{ rentalPriceMin: number; rentalPriceMax: number; qualityScore: number; qualityTier: string } | null>(null);
  const [listingPricingLoading, setListingPricingLoading] = useState(false);

  const cardStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit' };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 999, padding: '9px 13px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', font: 'inherit' };

  useEffect(() => {
    if (!/^\d{6}$/.test(listingBotId.trim()) || !listingDuration || !Number.isInteger(Number(listingDuration)) || Number(listingDuration) < 1) {
      setListingPricing(null);
      return;
    }
    let active = true;
    setListingPricingLoading(true);
    api.get('/api/rentals/pricing', { params: { botId: listingBotId.trim(), duration: Number(listingDuration), unit: listingDurationUnit } })
      .then((response) => { if (active) setListingPricing(response.data || null); })
      .catch(() => { if (active) setListingPricing(null); })
      .finally(() => { if (active) setListingPricingLoading(false); });
    return () => { active = false; };
  }, [listingBotId, listingDuration, listingDurationUnit]);

  const loadRentals = async () => {
    setLoading(true);
    setError('');

    const availableResult = await Promise.allSettled([
      api.get('/api/rentals'),
    ]).then(([result]) => result);

    if (availableResult.status === 'fulfilled') {
      const data = availableResult.value.data;
      setAvailableBots(data?.bots || data || []);
    } else {
      setError(availableResult.reason?.response?.data?.message || 'Unable to load Rentals right now. Please try again.');
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadRentals();
  }, []);

  const rentBot = async (bot: RentalBot) => {
    const botId = bot.botId || '';
    if (!botId) return;
    setRentingId(botId);
    setError('');
    setMessage('');
    try {
      await api.post(`/api/rentals/${botId}/rent`);
      setMessage(`${bot.name} has been added to your Rentals.`);
      setAvailableBots((current) => current.filter((availableBot) => (availableBot.botId || availableBot._id || availableBot.id) !== botId));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to rent this bot. Please try again.');
    } finally {
      setRentingId('');
    }
  };

  const unlistBot = async (bot: RentalBot) => {
    const botId = bot.botId || '';
    if (!botId) return;
    setUnlistingId(botId);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/api/rentals/${botId}/unlist`);
      setMessage(response.data?.message || 'Your bot has been unlisted from Rentals.');
      await loadRentals();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to unlist this bot from Rentals. Please try again.');
    } finally {
      setUnlistingId('');
    }
  };

  const listBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!listingBotId.trim() || !listingPrice || Number(listingPrice) <= 0 || !listingDuration || !Number.isInteger(Number(listingDuration)) || Number(listingDuration) < 1) {
      setError('Choose a bot, enter a rental duration, and enter a rental price greater than zero.');
      return;
    }
    if (listingPricing && (Number(listingPrice) < listingPricing.rentalPriceMin || Number(listingPrice) > listingPricing.rentalPriceMax)) {
      setError(`Rental price must be between ${listingPricing.rentalPriceMin.toFixed(2)} and ${listingPricing.rentalPriceMax.toFixed(2)} USDT for this period.`);
      return;
    }
    setListingSaving(true);
    try {
      await api.post('/api/rentals', { botId: listingBotId.trim(), rentalPrice: Number(listingPrice), rentalDuration: Number(listingDuration), rentalDurationUnit: listingDurationUnit });
      setMessage('Your bot is now listed in Rentals.');
      setListingBotId('');
      setListingPrice('');
      setListingDuration('');
      setListingDurationUnit('days');
      setActiveView('browse');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to list your bot. Please try again.');
    } finally {
      setListingSaving(false);
    }
  };

  const renderBot = (bot: RentalBot, showRentButton: boolean) => {
    const botId = bot.botId || bot._id || bot.id || bot.name;
    const price = bot.rentalPrice ?? bot.price;
    const duration = bot.rentalDuration ? `${bot.rentalDuration} ${bot.rentalDurationUnit || 'days'}` : '';
    return <article key={botId} style={{ ...cardStyle, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot size={20} color={theme.primary} /><div><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>{bot.name}</h3><small style={{ color: theme.textMuted, fontSize: '0.78rem' }}>{bot.symbol || 'Flexible strategy'}{bot.ownerName ? ` · Listed by ${bot.ownerName}` : ''}</small></div></div>
      <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.45 }}>{bot.description || 'A community-created bot available through Rentals.'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><strong style={{ fontSize: '0.86rem' }}>{price !== undefined ? `${price} · ${duration || 'period'}` : 'Price set by owner'}</strong>{bot.isOwner ? <button type="button" disabled={unlistingId === botId} onClick={() => void unlistBot(bot)} style={{ ...buttonStyle, background: theme.surfaceGlass, color: theme.text, border: `1px solid ${theme.borderGlass}`, cursor: unlistingId === botId ? 'wait' : 'pointer' }}>{unlistingId === botId ? <InlineLoadingDots /> : 'Unlist'}</button> : showRentButton && <button type="button" disabled={rentingId === botId} onClick={() => void rentBot(bot)} style={buttonStyle}>{rentingId === botId ? <InlineLoadingDots /> : 'Rent bot'}</button>}</div>
    </article>;
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>Rentals | KingsHall</title></Helmet>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' }}>
      <div style={{ width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={17} /> Market</button>
        <section style={{ marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
          <div style={{ padding: '3px 4px 10px' }}><h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850 }}>Rentals</h2><p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.4 }}>Rent community bots or list your own bot for others.</p></div>
          <div style={{ display: 'flex', gap: 8, margin: '4px 0 14px', padding: 4, borderRadius: 12, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}` }}>
            {(['browse', 'list'] as const).map((view) => <button key={view} type="button" onClick={() => setActiveView(view)} style={{ flex: 1, border: 0, borderRadius: 10, padding: '7px 10px', background: activeView === view ? theme.primary : 'transparent', color: activeView === view ? theme.textInverse : theme.text, fontWeight: 800, cursor: 'pointer' }}>{view === 'browse' ? 'Browse' : 'List'}</button>)}
          </div>
          {error && <NotificationBanner tone="error" title="Rentals unavailable" message={error} />}{message && <NotificationBanner tone="success" title="Rentals updated" message={message} />}
          {loading ? <div style={{ padding: 30, textAlign: 'center' }}><InlineLoadingDots /></div> : activeView === 'browse' ? <section><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Available in Rentals</h3>{availableBots.length ? <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{availableBots.map((bot) => renderBot(bot, true))}</div> : <p style={{ color: theme.textMuted, fontSize: '0.82rem' }}>No bots from other users are listed yet.</p>}</section> : <form onSubmit={listBot} style={{ ...cardStyle, display: 'grid', gap: 12, marginTop: 18 }}><h3 style={{ margin: 0, fontSize: '1rem' }}>List your bot</h3><label>Bot ID<input value={listingBotId} onChange={(event) => setListingBotId(event.target.value)} placeholder="Enter your created bot ID" style={inputStyle} /></label><label>Rental duration<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><input type="number" min="1" step="1" value={listingDuration} onChange={(event) => setListingDuration(event.target.value)} placeholder="30" style={inputStyle} /><div style={{ position: 'relative' }}><button type="button" onClick={() => setDurationMenuOpen((current) => !current)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer', textAlign: 'left' }}><span>{listingDurationUnit.charAt(0).toUpperCase() + listingDurationUnit.slice(1)}</span><ChevronDown size={16} style={{ transform: durationMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }} /></button>{durationMenuOpen && <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: 6, padding: 8, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)' }}>{(['hours', 'days', 'weeks', 'months'] as const).map((unit) => <button key={unit} type="button" onClick={() => { setListingDurationUnit(unit); setDurationMenuOpen(false); }} style={{ border: `1px solid ${listingDurationUnit === unit ? theme.primary : theme.borderGlass}`, borderRadius: 9, padding: '9px 10px', background: listingDurationUnit === unit ? theme.surfaceGlass : theme.surfaceMuted, color: theme.text, cursor: 'pointer', textAlign: 'left' }}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</button>)}</div>}</div></div></label><label>Rental price for this period<input type="number" min={listingPricing?.rentalPriceMin ?? 0.01} max={listingPricing?.rentalPriceMax} step="0.01" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="10" style={inputStyle} />{listingPricing && <small style={{ color: theme.textMuted, fontWeight: 500 }}>{listingPricingLoading ? 'Checking bot quality…' : `Allowed range: ${listingPricing.rentalPriceMin.toFixed(2)}–${listingPricing.rentalPriceMax.toFixed(2)} USDT · ${listingPricing.qualityTier} quality (${listingPricing.qualityScore}/100)`}</small>}</label><button type="submit" disabled={listingSaving} style={{ ...buttonStyle, cursor: listingSaving ? 'wait' : 'pointer' }}>{listingSaving ? <InlineLoadingDots /> : 'Publish listing'}</button></form>}
        </section>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default RentalsPage;
