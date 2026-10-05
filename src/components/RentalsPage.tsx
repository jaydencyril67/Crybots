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
  const [activeView, setActiveView] = useState<'browse' | 'list'>('browse');
  const [availableBots, setAvailableBots] = useState<RentalBot[]>([]);
  const [myBots, setMyBots] = useState<RentalBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [listingSaving, setListingSaving] = useState(false);
  const [listingBotId, setListingBotId] = useState('');
  const [listingPrice, setListingPrice] = useState('');

  const cardStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, font: 'inherit' };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 999, padding: '9px 13px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer', font: 'inherit' };

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

  const listBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!listingBotId.trim() || !listingPrice || Number(listingPrice) <= 0) {
      setError('Choose a bot and enter a rental price greater than zero.');
      return;
    }
    setListingSaving(true);
    try {
      await api.post('/api/rentals', { botId: listingBotId.trim(), rentalPrice: Number(listingPrice) });
      setMessage('Your bot is now listed in Rentals.');
      setListingBotId('');
      setListingPrice('');
      setShowListingForm(false);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to list your bot. Please try again.');
    } finally {
      setListingSaving(false);
    }
  };

  const renderBot = (bot: RentalBot, showRentButton: boolean) => {
    const botId = bot.botId || bot._id || bot.id || bot.name;
    const price = bot.rentalPrice ?? bot.price;
    return <article key={botId} style={{ ...cardStyle, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot size={20} color={theme.primary} /><div><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>{bot.name}</h3><small style={{ color: theme.textMuted, fontSize: '0.78rem' }}>{bot.symbol || 'Flexible strategy'}{bot.ownerName ? ` · Listed by ${bot.ownerName}` : ''}</small></div></div>
      <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.45 }}>{bot.description || 'A community-created bot available through Rentals.'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><strong style={{ fontSize: '0.86rem' }}>{price !== undefined ? `${price} per period` : 'Price set by owner'}</strong>{showRentButton && <button type="button" disabled={rentingId === botId} onClick={() => void rentBot(bot)} style={buttonStyle}>{rentingId === botId ? <InlineLoadingDots /> : 'Rent bot'}</button>}</div>
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
          {loading ? <div style={{ padding: 30, textAlign: 'center' }}><InlineLoadingDots /></div> : activeView === 'browse' ? <section><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Available in Rentals</h3>{availableBots.length ? <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{availableBots.map((bot) => renderBot(bot, true))}</div> : <p style={{ color: theme.textMuted, fontSize: '0.82rem' }}>No bots from other users are listed yet.</p>}</section> : <>{myBots.length > 0 && <section><h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Your listings</h3><div style={{ display: 'grid', gap: 10, marginTop: 10 }}>{myBots.map((bot) => renderBot(bot, false))}</div></section>}<form onSubmit={listBot} style={{ ...cardStyle, display: 'grid', gap: 12, marginTop: 18 }}><h3 style={{ margin: 0, fontSize: '1rem' }}>List your bot</h3><label>Bot ID<input value={listingBotId} onChange={(event) => setListingBotId(event.target.value)} placeholder="Enter your created bot ID" style={inputStyle} /></label><label>Rental price per period<input type="number" min="0.01" step="0.01" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="10" style={inputStyle} /></label><button type="submit" disabled={listingSaving} style={{ ...buttonStyle, cursor: listingSaving ? 'wait' : 'pointer' }}>{listingSaving ? <InlineLoadingDots /> : 'Publish listing'}</button></form></>}
        </section>
      </div><NowBar />
    </main>
  </HybridTheme>;
};

export default RentalsPage;
