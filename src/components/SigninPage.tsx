import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import api from '../api/axios';
import { notifyAuthChanged } from '../utils/notificationEvents';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, LoaderCircle, KeyRound } from 'lucide-react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type KingsHallUser = { id?: string; firstName?: string; lastName?: string; email?: string; uid?: string; usdtBalance?: number; profilePicture?: string; coverPhoto?: string };
type SessionResponse = { token?: string; user?: KingsHallUser; isAdmin?: boolean; message?: string };
type NativeKingsHallAccountPlugin = { chooseAccount(): Promise<{ email?: string; cancelled?: boolean }> };
const configuredAdminEmail = (process.env.REACT_APP_ADMIN_EMAIL || process.env.ADMIN_EMAIL)?.trim().toLowerCase();
const KINGSHALL_SIGNIN = 'https://kingshall.online/signin';
const ACCOUNT_HINT_KEY = 'kingshall_account_hint';
const getBrowserAccountHint = () => {
  const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith('kh_account_hint='));
  if (cookie) {
    try {
      const email = decodeURIComponent(cookie.slice('kh_account_hint='.length)).trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        localStorage.setItem(ACCOUNT_HINT_KEY, email);
        return email;
      }
    } catch {}
  }
  const saved = (localStorage.getItem(ACCOUNT_HINT_KEY) || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved) ? saved : '';
};
const getPostSigninRoute = (email: unknown, isAdmin: boolean) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return isAdmin || (Boolean(configuredAdminEmail) && normalizedEmail === configuredAdminEmail) ? '/admin-home' : '/home';
};
const DeviceAccount = registerPlugin<NativeKingsHallAccountPlugin>('KingsHallAccount');
const isNativeAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const SigninPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [identity, setIdentity] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accountDetected, setAccountDetected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const returnedEmail = params.get('kingshall_account') || hashParams.get('kingshall_account');
    if (returnedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(returnedEmail)) {
      localStorage.setItem(ACCOUNT_HINT_KEY, returnedEmail.trim().toLowerCase());
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
      setNotice('KingsHall account saved on this browser. Press the button to continue.');
    }
  }, []);

  const saveSession = (data: SessionResponse, fallbackIdentity = identity) => {
    if (!data.token || !data.user) throw new Error('KingsHall did not return a valid CryBots session.');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (typeof data.user.firstName === 'string' && data.user.firstName.trim()) {
      localStorage.setItem('firstName', data.user.firstName.trim());
      localStorage.setItem('kingshall_first_name', data.user.firstName.trim());
    }
    notifyAuthChanged();
    navigate(getPostSigninRoute(data.user.email || fallbackIdentity, data.isAdmin === true));
  };

  const messageFromError = (e: unknown, fallback: string) => {
    const response = (e as { response?: { data?: { message?: string; error?: string } } })?.response;
    return response?.data?.message || response?.data?.error || (e as Error)?.message || fallback;
  };

  const redirectToKingsHall = () => {
    const returnTo = window.location.origin + '/signin';
    const url = new URL(KINGSHALL_SIGNIN);
    url.searchParams.set('app', 'crybots');
    url.searchParams.set('returnTo', returnTo);
    window.location.assign(url.toString());
  };

  const startSignin = async () => {
    if (busy) return;
    const loadingStartedAt = Date.now();
    setBusy(true); setError(''); setNotice('');
    try {
      // Let the loading overlay render, then keep it visible for at least five seconds
      // so account detection feels deliberate even when the hint is available instantly.
      await new Promise(resolve => window.setTimeout(resolve, 250));
      let selectedEmail = '';
      if (isNativeAndroid()) {
        if (!Capacitor.isPluginAvailable('KingsHallAccount')) throw new Error('This CryBots APK needs an update to use the KingsHall account manager.');
        const result = await DeviceAccount.chooseAccount();
        if (result.cancelled) {
          setNotice('Choose a KingsHall account to continue. If none appears, sign in to KingsHall first.');
          return;
        }
        selectedEmail = (result.email || '').trim().toLowerCase();
        if (!selectedEmail) {
          setNotice('No KingsHall account found on this device. Sign in to KingsHall, then return to CryBots.');
          return;
        }
      } else {
        selectedEmail = getBrowserAccountHint();
        if (!selectedEmail) {
          window.alert('No Account found pls signup or login on KingsHall to continue');
          redirectToKingsHall();
          return;
        }
      }
      const remainingLoadingTime = 5000 - (Date.now() - loadingStartedAt);
      if (remainingLoadingTime > 0) {
        await new Promise(resolve => window.setTimeout(resolve, remainingLoadingTime));
      }
      setIdentity(selectedEmail);
      setAccountDetected(true);
      setNotice('KingsHall account detected. Enter the bound Access Code to continue.');
    } catch (e) {
      setError(messageFromError(e, 'Unable to detect a KingsHall account.'));
    } finally {
      setBusy(false);
    }
  };

  const handleAccessCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !identity || accessCode.length !== 6) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post<SessionResponse>('/api/auth/kingshall/access-code', { identity, accessCode });
      saveSession(data, identity);
    } catch (e) {
      setError(messageFromError(e, 'KingsHall could not verify this Access Code.'));
    } finally {
      setBusy(false);
      setAccessCode('');
    }
  };

  const resetAccount = () => {
    setIdentity(''); setAccessCode(''); setAccountDetected(false); setError(''); setNotice('');
  };
  const glass: React.CSSProperties = { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' };
  const button: React.CSSProperties = { minHeight: 46, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '12px 18px', fontWeight: 750, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%', cursor: busy ? 'wait' : 'pointer', background: theme.surfaceGlass, color: theme.text, boxSizing: 'border-box', boxShadow: theme.mode === 'dark' ? 'inset 0 1px rgba(255,255,255,.13), 0 4px 14px rgba(0,0,0,.22)' : 'inset 0 1px rgba(255,255,255,.48), 0 4px 14px rgba(30,30,30,.10)', backdropFilter: 'blur(12px) saturate(125%)', WebkitBackdropFilter: 'blur(12px) saturate(125%)' };
  const input: React.CSSProperties = { width: '100%', minHeight: 48, boxSizing: 'border-box', borderRadius: 13, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '12px 14px', fontSize: 15, outline: 'none' };

  return (
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, padding: 'clamp(14px, 3vw, 28px)', boxSizing: 'border-box', display: 'grid', placeItems: 'center' }}>
      <style>{'@keyframes kh-signin-spin { to { transform: rotate(360deg); } }'}</style>
      <Helmet><title>CryBots | Sign in with KingsHall</title><meta name="description" content="Sign in securely to CryBots through your KingsHall account." /></Helmet>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <section style={{ ...glass, borderRadius: 24, padding: 'clamp(22px, 6vw, 34px)', textAlign: 'center' }}>
          <div style={{ width: 54, height: 54, margin: '0 auto 14px', display: 'grid', placeItems: 'center', borderRadius: '50%', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.primary }}><ShieldCheck size={25} /></div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', lineHeight: 1.2 }}>{accountDetected ? 'Confirm your KingsHall account' : 'Sign in to CryBots'}</h1>
          <p style={{ margin: '9px 0 22px', color: theme.textMuted, fontSize: 13, lineHeight: 1.6 }}>{accountDetected ? identity : 'Continue with the KingsHall account saved on this device or browser.'}</p>

          {!accountDetected && <button type="button" aria-label="Sign in with KingsHall" onClick={() => void startSignin()} disabled={busy} style={{ width: 88, height: 88, borderRadius: '50%', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, display: 'grid', placeItems: 'center', margin: '0 auto', cursor: busy ? 'wait' : 'pointer', backdropFilter: 'blur(12px) saturate(125%)', WebkitBackdropFilter: 'blur(12px) saturate(125%)', boxShadow: theme.mode === 'dark' ? 'inset 0 1px rgba(255,255,255,.13), 0 4px 14px rgba(0,0,0,.22)' : 'inset 0 1px rgba(255,255,255,.48), 0 4px 14px rgba(30,30,30,.10)' }}>{busy ? <LoadingDots /> : <KeyRound size={28} />}</button>}
          {!accountDetected && <p style={{ margin: '12px 0 0', color: theme.text, fontWeight: 700, fontSize: 14 }}>Sign in with KingsHall</p>}

          {accountDetected && <form onSubmit={handleAccessCode} style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            <label htmlFor="signin-access-code" style={{ fontSize: 13, color: theme.textMuted, fontWeight: 650 }}>Bound six-digit Access Code</label>
            <input id="signin-access-code" style={{ ...input, textAlign: 'center', letterSpacing: '.35em', fontSize: 20 }} type="password" inputMode="numeric" autoComplete="off" value={accessCode} onChange={event => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" minLength={6} maxLength={6} pattern="[0-9]{6}" required />
            <button type="submit" style={button} disabled={busy || accessCode.length !== 6}>{busy ? <LoadingDots /> : 'Verify and continue'}</button>
            <button type="button" onClick={resetAccount} style={{ border: 0, background: 'transparent', color: theme.primary, padding: 8, fontWeight: 700, cursor: 'pointer' }}>Use another account</button>
          </form>}

          {notice && <p role="status" style={{ margin: '16px 0 0', color: theme.textMuted, fontSize: 13, lineHeight: 1.6 }}>{notice}</p>}
          {error && <p role="alert" style={{ margin: '16px 0 0', padding: '11px 13px', borderRadius: 12, background: 'rgba(220,60,60,.10)', border: '1px solid rgba(220,80,80,.28)', color: theme.text, fontSize: 13, lineHeight: 1.5 }}>{error}</p>}
          <p style={{ margin: '22px 0 0', paddingTop: 14, borderTop: `1px solid ${theme.borderGlass}`, color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}>KingsHall verifies your Access Code. CryBots never stores it.</p>
        </section>
      </div>
      {busy && <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.52)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}><div style={{ ...glass, borderRadius: 22, padding: 24, minWidth: 120, display: 'grid', justifyItems: 'center', gap: 12, color: theme.text }}><LoaderCircle size={34} style={{ animation: 'kh-signin-spin 1s linear infinite' }} /><span style={{ fontSize: 13, fontWeight: 650 }}>Checking KingsHall…</span></div></div>}
    </main>
  );
};

export default SigninPage;
