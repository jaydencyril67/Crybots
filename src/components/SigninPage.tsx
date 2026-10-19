import React, { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import api from '../api/axios';
import { notifyAuthChanged } from '../utils/notificationEvents';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, LoaderCircle, KeyRound, Fingerprint } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import { authenticateWithPasskey } from '../utils/webauthn';

type KingsHallUser = { id?: string; firstName?: string; lastName?: string; email?: string; username?: string; usdtBalance?: number; profilePicture?: string; coverPhoto?: string };
type SessionResponse = { token?: string; user?: KingsHallUser; isAdmin?: boolean; message?: string; requiresExtraSecurity?: boolean; challengeToken?: string; methods?: Array<'2fa' | 'biometric'> };
type ExternalLoginStart = { requestId: string; loginCode: string; qrToken: string; expiresAt: string; appName: 'CryBots' | 'HallsChat'; deviceLabel: string };
type ExternalLoginStatus = SessionResponse & { status?: string };
type NativeKingsHallAccountPlugin = { chooseAccount(): Promise<{ email?: string; cancelled?: boolean }> };
const configuredAdminEmail = (process.env.REACT_APP_ADMIN_EMAIL || process.env.ADMIN_EMAIL)?.trim().toLowerCase();
const KINGSHALL_SIGNIN = 'https://kingshall.online/signin';
const ACCOUNT_HINT_KEY = 'kingshall_account_hint';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const getSavedBrowserAccounts = () => {
  let accounts: string[] = [];
  const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith('kh_saved_accounts='));
  if (cookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie.slice('kh_saved_accounts='.length)));
      if (Array.isArray(parsed)) accounts = parsed.filter((item): item is string => typeof item === 'string' && EMAIL_PATTERN.test(item.trim().toLowerCase())).map(item => item.trim().toLowerCase());
    } catch {}
  }
  const hint = getBrowserAccountHint();
  if (hint) accounts.push(hint);
  return [...new Set(accounts)].slice(0, 10);
};
const setSelectedBrowserAccount = (email: string) => {
  const selected = email.trim().toLowerCase();
  localStorage.setItem(ACCOUNT_HINT_KEY, selected);
  document.cookie = 'kh_account_hint=' + encodeURIComponent(selected) + '; Domain=.kingshall.online; Path=/; Max-Age=31536000; Secure; SameSite=Lax';
};
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
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [browserAccounts, setBrowserAccounts] = useState<string[]>([]);
  const [challengeToken, setChallengeToken] = useState('');
  const [extraMethods, setExtraMethods] = useState<Array<'2fa' | 'biometric'>>([]);
  const [extraMethod, setExtraMethod] = useState<'2fa' | 'biometric' | ''>('');
  const [extraCode, setExtraCode] = useState('');
  const [externalLogin, setExternalLogin] = useState<ExternalLoginStart | null>(null);
  const [externalLoginBusy, setExternalLoginBusy] = useState(false);

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
      if (isNativeAndroid()) {
        if (!Capacitor.isPluginAvailable('KingsHallAccount')) throw new Error('This CryBots APK needs an update to use the KingsHall account manager.');
        // Keep the APK spinner active for at least five seconds across every account-chooser outcome.
        const result = await DeviceAccount.chooseAccount();
        const remainingLoadingTime = 5000 - (Date.now() - loadingStartedAt);
        if (remainingLoadingTime > 0) await new Promise(resolve => window.setTimeout(resolve, remainingLoadingTime));
        if (result.cancelled) {
          setNotice('Choose a KingsHall account to continue. If none appears, sign in to KingsHall first.');
          return;
        }
        const selectedEmail = (result.email || '').trim().toLowerCase();
        if (!EMAIL_PATTERN.test(selectedEmail)) {
          setShowNoAccountModal(true);
          return;
        }
        setIdentity(selectedEmail);
        setAccountDetected(true);
        setNotice('KingsHall account detected. Enter the bound Access Code to continue.');
        return;
      }

      // Browser/PWA also waits a minimum of five seconds before showing the result.
      const accounts = getSavedBrowserAccounts();
      const remainingLoadingTime = 5000 - (Date.now() - loadingStartedAt);
      if (remainingLoadingTime > 0) await new Promise(resolve => window.setTimeout(resolve, remainingLoadingTime));
      if (accounts.length) {
        setBrowserAccounts(accounts);
        return;
      }
      setShowNoAccountModal(true);
    } catch (e) {
      const remainingLoadingTime = 5000 - (Date.now() - loadingStartedAt);
      if (remainingLoadingTime > 0) await new Promise(resolve => window.setTimeout(resolve, remainingLoadingTime));
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
      if (data.requiresExtraSecurity && data.challengeToken && data.methods?.length) {
        setChallengeToken(data.challengeToken);
        setExtraMethods(data.methods);
        setExtraMethod(data.methods.length === 1 ? data.methods[0] : '');
        setExtraCode('');
        setNotice(data.methods.length > 1 ? 'Access Code verified. Choose one enabled extra-security method to finish signing in.' : 'Access Code verified. Complete the enabled extra-security check to finish signing in.');
        return;
      }
      saveSession(data, identity);
    } catch (e) {
      setError(messageFromError(e, 'KingsHall could not verify this Access Code.'));
    } finally {
      setBusy(false);
      setAccessCode('');
    }
  };

  const verifyExtra2fa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !challengeToken || extraCode.length !== 6) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post<SessionResponse>('/api/auth/kingshall/extra-security/verify-2fa', { challengeToken, code: extraCode });
      saveSession(data, identity);
    } catch (e) {
      setError(messageFromError(e, 'The authenticator code could not be verified.'));
    } finally {
      setBusy(false);
      setExtraCode('');
    }
  };

  const verifyExtraBiometric = async () => {
    if (busy || !challengeToken) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data: options } = await api.post('/api/webauthn/authenticate/options', { challengeToken });
      const credential = await authenticateWithPasskey(options);
      const { data } = await api.post<SessionResponse>('/api/webauthn/authenticate/verify', { challengeToken, ...credential });
      saveSession(data, identity);
    } catch (e) {
      setError(messageFromError(e, 'Biometric verification failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const resetAccount = () => {
    setIdentity(''); setAccessCode(''); setAccountDetected(false); setError(''); setNotice('');
    setChallengeToken(''); setExtraMethods([]); setExtraMethod(''); setExtraCode('');
  };

  const startExternalLogin = async () => {
    if (busy || externalLoginBusy) return;
    setExternalLoginBusy(true); setError(''); setNotice('');
    try {
      const agent = navigator.userAgent;
      const deviceLabel = /Windows/i.test(agent) ? 'Windows browser' : /Macintosh|Mac OS/i.test(agent) ? 'Mac browser' : /Android/i.test(agent) ? 'Android browser' : /iPhone|iPad/i.test(agent) ? 'Apple mobile browser' : 'External browser';
      const { data } = await api.post<ExternalLoginStart>('/api/auth/kingshall/external/request', { deviceLabel });
      setExternalLogin(data);
      setNotice('');
    } catch (e) {
      setError(messageFromError(e, 'Unable to start external-device login.'));
    } finally {
      setExternalLoginBusy(false);
    }
  };

  const cancelExternalLogin = async () => {
    const request = externalLogin;
    if (!request) return;
    setExternalLogin(null);
    setExternalLoginBusy(true);
    setError('');
    try {
      await api.post('/api/auth/kingshall/external/cancel', { requestId: request.requestId });
      setNotice('External-device login cancelled.');
    } catch (e) {
      setError(messageFromError(e, 'The external login request could not be cancelled.'));
    } finally {
      setExternalLoginBusy(false);
    }
  };

  const externalAuthCallbacksRef = useRef({ saveSession, messageFromError });
  externalAuthCallbacksRef.current = { saveSession, messageFromError };

  useEffect(() => {
    if (!externalLogin?.requestId) return;
    let stopped = false;
    let timer: number | undefined;
    const requestId = externalLogin.requestId;
    const poll = async () => {
      try {
        const { data } = await api.post<ExternalLoginStatus>('/api/auth/kingshall/external/status', { requestId });
        if (stopped) return;
        if (data.status === 'authenticated') {
          setExternalLogin(null);
          if (data.requiresExtraSecurity && data.challengeToken && data.methods?.length) {
            setIdentity(data.user?.email || '');
            setAccountDetected(true);
            setChallengeToken(data.challengeToken);
            setExtraMethods(data.methods);
            setExtraMethod(data.methods.length === 1 ? data.methods[0] : '');
            setExtraCode('');
            setNotice(data.methods.length > 1 ? 'Device approved. Complete one enabled CryBots security check to finish signing in.' : 'Device approved. Complete the enabled CryBots security check to finish signing in.');
            return;
          }
          try { externalAuthCallbacksRef.current.saveSession(data, data.user?.email || ''); }
          catch (e) { setError((e as Error).message || 'The approved session could not be completed.'); }
          return;
        }
        if (['denied', 'expired', 'consumed'].includes(String(data.status || ''))) {
          setExternalLogin(null);
          setError(data.status === 'denied' ? 'The external sign-in request was denied.' : 'The external sign-in request expired. Start again on this device.');
          return;
        }
      } catch (e) {
        if (stopped) return;
        const status = (e as { response?: { status?: number } })?.response?.status;
        if ([400, 401, 404, 409, 410, 423].includes(Number(status))) {
          setExternalLogin(null);
          setError(externalAuthCallbacksRef.current.messageFromError(e, 'This external sign-in request is no longer valid.'));
          return;
        }
      }
      if (!stopped) timer = window.setTimeout(() => { void poll(); }, 1800);
    };
    timer = window.setTimeout(() => { void poll(); }, 1500);
    return () => { stopped = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [externalLogin?.requestId]);

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

          {!accountDetected && browserAccounts.length > 0 && <div style={{ display: 'grid', gap: 9, margin: '0 0 16px', textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Saved KingsHall accounts</p>
            <p style={{ margin: 0, color: theme.textMuted, fontSize: 12, lineHeight: 1.5 }}>Choose which account to use for this sign-in request.</p>
            {browserAccounts.map(email => <button key={email} type="button" style={{ ...button, justifyContent: 'flex-start', overflowWrap: 'anywhere', textAlign: 'left' }} onClick={() => { setSelectedBrowserAccount(email); setIdentity(email); setAccountDetected(true); setError(''); setNotice('KingsHall account selected. Enter its bound Access Code to continue.'); }}>{email} <KeyRound size={15} /></button>)}
          </div>}
          {!accountDetected && browserAccounts.length === 0 && <button type="button" aria-label="Sign in with KingsHall" onClick={() => void startSignin()} disabled={busy} style={{ width: 88, height: 88, borderRadius: '50%', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text, display: 'grid', placeItems: 'center', margin: '0 auto', cursor: busy ? 'wait' : 'pointer', backdropFilter: 'blur(12px) saturate(125%)', WebkitBackdropFilter: 'blur(12px) saturate(125%)', boxShadow: theme.mode === 'dark' ? 'inset 0 1px rgba(255,255,255,.13), 0 4px 14px rgba(0,0,0,.22)' : 'inset 0 1px rgba(255,255,255,.48), 0 4px 14px rgba(30,30,30,.10)' }}>{busy ? <LoadingDots /> : <KeyRound size={28} />}</button>}
          {!accountDetected && browserAccounts.length === 0 && <p style={{ margin: '12px 0 0', color: theme.text, fontWeight: 700, fontSize: 14 }}>Sign in with KingsHall</p>}

          {accountDetected && !challengeToken && <form onSubmit={handleAccessCode} style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            <label htmlFor="signin-access-code" style={{ fontSize: 13, color: theme.textMuted, fontWeight: 650 }}>Bound six-digit Access Code</label>
            <input id="signin-access-code" style={{ ...input, textAlign: 'center', letterSpacing: '.35em', fontSize: 20 }} type="password" inputMode="numeric" autoComplete="off" value={accessCode} onChange={event => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" minLength={6} maxLength={6} pattern="[0-9]{6}" required />
            <button type="submit" style={button} disabled={busy || accessCode.length !== 6}>{busy ? <LoadingDots /> : 'Verify and continue'}</button>
            <button type="button" onClick={resetAccount} style={{ border: 0, background: 'transparent', color: theme.primary, padding: 8, fontWeight: 700, cursor: 'pointer' }}>Cancel request</button>
          </form>}

          {challengeToken && <section style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            <div style={{ ...glass, borderRadius: 16, padding: 14 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>Extra security required</p>
              <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 13, lineHeight: 1.5 }}>Your KingsHall Access Code was accepted, but CryBots will not finish sign-in until one enabled security check succeeds.</p>
            </div>
            {extraMethods.length > 1 && <div style={{ display: 'grid', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>Choose one method to continue</p>
              {extraMethods.includes('2fa') && <button type="button" style={button} onClick={() => { setExtraMethod('2fa'); setError(''); }} disabled={busy}>Authenticator app (2FA)</button>}
              {extraMethods.includes('biometric') && <button type="button" style={button} onClick={() => { setExtraMethod('biometric'); setError(''); }} disabled={busy}><Fingerprint size={17} /> Biometric / passkey</button>}
            </div>}
            {extraMethod === '2fa' && <form onSubmit={verifyExtra2fa} style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="signin-extra-2fa" style={{ fontSize: 13, color: theme.textMuted, fontWeight: 650 }}>Six-digit authenticator code</label>
              <input id="signin-extra-2fa" style={{ ...input, textAlign: 'center', letterSpacing: '.3em', fontSize: 20 }} type="password" inputMode="numeric" autoComplete="one-time-code" value={extraCode} onChange={event => setExtraCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" minLength={6} maxLength={6} pattern="[0-9]{6}" required />
              <button type="submit" style={button} disabled={busy || extraCode.length !== 6}>{busy ? <LoadingDots /> : 'Verify 2FA and continue'}</button>
            </form>}
            {extraMethod === 'biometric' && <div style={{ display: 'grid', gap: 10 }}>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: 13, lineHeight: 1.5 }}>Confirm with the passkey/biometric method bound to this CryBots account.</p>
              <button type="button" style={button} onClick={() => void verifyExtraBiometric()} disabled={busy}>{busy ? <LoadingDots /> : <><Fingerprint size={17} /> Verify biometric and continue</>}</button>
            </div>}
            <button type="button" onClick={resetAccount} style={{ border: 0, background: 'transparent', color: theme.primary, padding: 8, fontWeight: 700, cursor: 'pointer' }}>Cancel request</button>
          </section>}
          {notice && <p role="status" style={{ margin: '16px 0 0', color: theme.textMuted, fontSize: 13, lineHeight: 1.6 }}>{notice}</p>}
          {error && <p role="alert" style={{ margin: '16px 0 0', padding: '11px 13px', borderRadius: 12, background: 'rgba(220,60,60,.10)', border: '1px solid rgba(220,80,80,.28)', color: theme.text, fontSize: 13, lineHeight: 1.5 }}>{error}</p>}
          <p style={{ margin: '22px 0 0', paddingTop: 14, borderTop: `1px solid ${theme.borderGlass}`, color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}>KingsHall verifies your Access Code. CryBots never stores it.</p>
          <div style={{ marginTop: 14, color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}>Need an account? <a href={KINGSHALL_SIGNIN} style={{ color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>Create or recover access in KingsHall</a></div>
        </section>
                  <div style={{ ...glass, borderRadius: 16, padding: 14, marginTop: 16, display: 'grid', gap: 10, textAlign: 'left' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Signing in on a device without KingsHall?</p>
              <p style={{ margin: '5px 0 0', color: theme.textMuted, fontSize: 12, lineHeight: 1.55 }}>Approve this device from your signed-in KingsHall account. No saved KingsHall account or Access Code is needed on this device.</p>
            </div>
            {!externalLogin && <button type="button" style={button} disabled={busy || externalLoginBusy || !!challengeToken} onClick={() => void startExternalLogin()}>{externalLoginBusy ? <LoadingDots /> : 'Use external-device login'}</button>}
            {externalLogin && <>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: 12, lineHeight: 1.55 }}>In KingsHall, open External Login and scan this QR code, or enter the code below. This request expires in five minutes.</p>
              <div style={{ justifySelf: 'center', background: '#fff', padding: 10, borderRadius: 14 }}>
                <QRCodeSVG value={JSON.stringify({ type: 'kingshall-external-login-v1', requestId: externalLogin.requestId, qrToken: externalLogin.qrToken, appName: 'CryBots' })} size={196} level="M" includeMargin />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '3px 0 6px', color: theme.textMuted, fontSize: 12 }}>ONE-TIME LOGIN CODE</p>
                <div aria-label={'One-time login code ' + externalLogin.loginCode} style={{ fontSize: 27, letterSpacing: '.2em', fontWeight: 900, overflowWrap: 'anywhere' }}>{externalLogin.loginCode}</div>
                <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 11 }}>Expires {new Date(externalLogin.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p role="status" style={{ margin: 0, color: theme.textMuted, fontSize: 12 }}>Waiting for approval from KingsHall…</p>
              <button type="button" style={{ ...button, background: 'transparent' }} disabled={externalLoginBusy} onClick={() => void cancelExternalLogin()}>Cancel external login</button>
            </>}
          </div>
      </div>
      {showNoAccountModal && <div role="presentation" onClick={() => setShowNoAccountModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.58)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="no-kingshall-account-title" aria-describedby="no-kingshall-account-description" onClick={event => event.stopPropagation()} style={{ ...glass, width: '100%', maxWidth: 360, boxSizing: 'border-box', borderRadius: 22, padding: 24, textAlign: 'center', boxShadow: '0 18px 60px rgba(0,0,0,.28)' }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 14px', display: 'grid', placeItems: 'center', borderRadius: '50%', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.primary }}><KeyRound size={23} /></div>
          <h2 id="no-kingshall-account-title" style={{ margin: 0, fontSize: 19 }}>No KingsHall account found</h2>
          <p id="no-kingshall-account-description" style={{ margin: '10px 0 20px', color: theme.textMuted, fontSize: 14, lineHeight: 1.6 }}>Please sign in to KingsHall first, then return to CryBots to continue.</p>
          <div style={{ display: 'grid', gap: 9 }}>
            <button type="button" style={button} onClick={redirectToKingsHall}>Sign in to KingsHall</button>
            <button type="button" style={{ ...button, background: 'transparent' }} onClick={() => setShowNoAccountModal(false)}>Cancel</button>
          </div>
        </section>
      </div>}
      {busy && <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.52)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}><div style={{ ...glass, borderRadius: 22, padding: 24, minWidth: 120, display: 'grid', justifyItems: 'center', gap: 12, color: theme.text }}><LoaderCircle size={34} style={{ animation: 'kh-signin-spin 1s linear infinite' }} /><span style={{ fontSize: 13, fontWeight: 650 }}>Checking KingsHall…</span></div></div>}
    </main>
  );
};

export default SigninPage;
