import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, Plus, RefreshCw } from 'lucide-react';
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
  price?: number;
  ownerName?: string;
};

const RentalsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [availableBots, setAvailableBots] = useState<RentalBot[]>([]);
  const [myBots, setMyBots] = useState<RentalBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingBotId, setListingBotId] = useState('');
  const [listingPrice, setListingPrice] = useState('');

  const cardStyle: React.CSSProperties = { padding: 16, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, font: 'inherit' };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 999, padding: '10px 15px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer' };

  const loadRentals = async () => {
    setLoading(true);
    setError('');

    const [availableResult, mineResult] = await Promise.allSettled([
      api.get('/api/rentals'),
      api.get('/api/rentals/mine'),
    ]);

    if (availableResult.status === 'fulfilled') {
      const data = availableResult.value.data;
      setAvailableBots(data?.bots || data || []);
    } else {
      setError(availableResult.reason?.response?.data?.message || 'Unable to load Rentals right now. Please try again.');
    }

    if (mineResult.status === 'fulfilled') {
      const data = mineResult.value.data;
      setMyBots(data?.bots || data || []);
    }

    setLoading(false);
  };

  useEffect(() => { void loadRentals(); }, []);

  const rentBot = async (bot: RentalBot) => {
    const botId = bot.botId || '';
    if (!botId) return;
    setRentingId(botId);
    setError('');
    setMessage('');
    try {
      await api.post(`/api/rentals/${botId}/rent`);
      setMessage(`${bot.name} has been added to your Rentals.`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to rent this bot. Please try again.');
    } finally {
      setRentingId('');
    }
  };

  const listBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!listingBotId.trim() || !listingPrice || Number(listingPrice) <= 0) {
      setError('Choose a bot and enter a rental price greater than zero.');
      return;
    }
    try {
      await api.post('/api/rentals', { botId: listingBotId.trim(), rentalPrice: Number(listingPrice) });
      setMessage('Your bot is now listed in Rentals.');
      setListingBotId('');
      setListingPrice('');
      setShowListingForm(false);
      await loadRentals();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to list your bot. Please try again.');
    }
  };

  const renderBot = (bot: RentalBot, showRentButton: boolean) => {
    const botId = bot.botId || bot._id || bot.id || bot.name;
    const price = bot.rentalPrice ?? bot.price;
    return <article key={botId} style={{ ...cardStyle, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot size={22} color={theme.primary} /><div><h3 style={{ margin: 0, fontSize: '1rem' }}>{bot.name}</h3><small style={{ color: theme.textMuted }}>{bot.symbol || 'Flexible strategy'}{bot.ownerName ? ` · Listed by ${bot.ownerName}` : ''}</small></div></div>
      <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.5 }}>{bot.description || 'A community-created bot available through Rentals.'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><strong>{price !== undefined ? `${price} per period` : 'Price set by owner'}</strong>{showRentButton && <button type="button" disabled={rentingId === botId} onClick={() => void rentBot(bot)} style={buttonStyle}>{rentingId === botId ? <InlineLoadingDots /> : 'Rent bot'}</button>}</div>
    </article>;
  };

  return <HybridTheme mode={themeMode}>
    <Helmet><title>Rentals | KingsHall</title></Helmet>
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' }}>
      <div style={{ width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => navigate('/market')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' }}><ArrowLeft size={17} /> Market</button>
        <section style={{ marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
          <div style={{ padding: '3px 4px 10px' }}><h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850 }}>Rentals</h2><p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 }}>Rent bots created by the community, or list your own bots so other users can rent them.</p></div>
          {error && <NotificationBanner tone="error" title="Rentals unavailable" message={error} />}{message && <NotificationBanner tone="success" title="Rentals updated" message={message} />}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, margin: '4px 0 14px' }}><button type="button" onClick={() => setShowListingForm((current) => !current)} style={buttonStyle}><Plus size={16} /> List a bot</button><button type="button" onClick={() => void loadRentals()} style={{ ...buttonStyle, background: theme.surfaceMuted, color: theme.text }}><RefreshCw size={16} /> Refresh</button></div>
          {showListingForm && <form onSubmit={listBot} style={{ ...cardStyle, display: 'grid', gap: 12, marginBottom: 18 }}><h3 style={{ margin: 0, fontSize: '1rem' }}>List your bot</h3><label>Bot ID<input value={listingBotId} onChange={(event) => setListingBotId(event.target.value)} placeholder="Enter your created bot ID" style={inputStyle} /></label><label>Rental price per period<input type="number" min="0.01" step="0.01" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="10" style={inputStyle} /></label><button type="submit" style={buttonStyle}>Publish listing</button></form>}
          {loading ? <div style={{ padding: 30, textAlign: 'center' }}><InlineLoadingDots /></div> : <div style={{ display: 'grid', gap: 18 }}><section><h3 style={{ margin: 0, fontSize: '1rem' }}>Available in Rentals</h3>{availableBots.length ? <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{availableBots.map((bot) => renderBot(bot, true))}</div> : <p style={{ color: theme.textMuted }}>No bots are listed yet. Be the first to list one.</p>}</section><section><h3 style={{ margin: 0, fontSize: '1rem' }}>Your bot listings</h3>{myBots.length ? <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{myBots.map((bot) => renderBot(bot, false))}</div> : <p style={{ color: theme.textMuted }}>Your created bots will appear here when you list them.</p>}</section></div>}
        </section>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default RentalsPage;
