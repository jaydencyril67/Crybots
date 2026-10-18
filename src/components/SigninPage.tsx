import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { notifyAuthChanged } from '../utils/notificationEvents';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type Step = 'identity' | 'method' | 'access-code' | 'one-time';
type KingsHallUser = { id?: string; firstName?: string; lastName?: string; email?: string; uid?: string; usdtBalance?: number; profilePicture?: string; coverPhoto?: string };
type SessionResponse = { token?: string; user?: KingsHallUser; isAdmin?: boolean; status?: string; accessCodeSet?: boolean; requestId?: string; challengeCode?: string; expiresAt?: string; message?: string };
const configuredAdminEmail = (process.env.REACT_APP_ADMIN_EMAIL || process.env.ADMIN_EMAIL)?.trim().toLowerCase();
const getPostSigninRoute = (email: unknown, isAdmin: boolean) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return isAdmin || (Boolean(configuredAdminEmail) && normalizedEmail === configuredAdminEmail) ? '/admin-home' : '/home';
};

const SigninPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [identity, setIdentity] = useState('');
  const [step, setStep] = useState<Step>('identity');
  const [accessCodeAvailable, setAccessCodeAvailable] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [challengeCode, setChallengeCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identity.trim() || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post<SessionResponse>('/api/auth/kingshall/lookup', { identity: identity.trim() });
      if (!data.exists) throw new Error('No eligible KingsHall account was found.');
      setAccessCodeAvailable(data.accessCodeSet === true);
      setStep('method');
    } catch (e) { setError(messageFromError(e, 'Unable to check this identity with KingsHall.')); }
    finally { setBusy(false); }
  };

  const handleAccessCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post<SessionResponse>('/api/auth/kingshall/access-code', { identity: identity.trim(), accessCode });
      saveSession(data);
    } catch (e) { setError(messageFromError(e, 'Unable to sign in with the Access Code.')); }
    finally { setBusy(false); }
  };

  const startOneTimeCode = async () => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post<SessionResponse>('/api/auth/kingshall/request', { identity: identity.trim() });
      if (!data.requestId || !data.challengeCode) throw new Error('KingsHall did not create a sign-in request.');
      setRequestId(data.requestId);
      setChallengeCode(data.challengeCode);
      setExpiresAt(data.expiresAt || '');
      setStep('one-time');
      setNotice('Open your signed-in KingsHall app and enter this two-digit code in the approval window.');
    } catch (e) { setError(messageFromError(e, 'Unable to request approval from KingsHall.')); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (step !== 'one-time' || !requestId) return;
    let stopped = false;
    let inFlight = false;
    const poll = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        const { data } = await api.post<SessionResponse>('/api/auth/kingshall/status', { requestId });
        if (stopped) return;
        if (data.status === 'authenticated') {
          stopped = true;
          saveSession(data);
        } else if (data.status === 'denied' || data.status === 'expired' || data.status === 'consumed') {
          stopped = true;
          setError(data.status === 'denied' ? 'The sign-in request was denied in KingsHall.' : 'This sign-in request has expired. Start again.');
          setRequestId(''); setChallengeCode(''); setStep('identity');
        }
      } catch (e) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (!stopped && (status === 410 || status === 404)) {
          stopped = true; setError('This sign-in request has expired. Start again.'); setRequestId(''); setChallengeCode(''); setStep('identity');
        }
      } finally { inFlight = false; }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 2500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [step, requestId]);

  const resetFlow = () => {
    if (step === 'one-time' && requestId) api.post('/api/auth/kingshall/cancel', { requestId }).catch(() => {});
    setStep('identity'); setAccessCode(''); setRequestId(''); setChallengeCode(''); setExpiresAt(''); setError(''); setNotice('');
  };
  const handleReturn = () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/home');
  };

  const glass = { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' } as const;
  const button = { minHeight: 46, border: 'none', borderRadius: 999, padding: '12px 18px', fontWeight: 750, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%', cursor: busy ? 'wait' : 'pointer', background: theme.primary, color: theme.textInverse, boxSizing: 'border-box' as const };
  const secondaryButton = { ...button, background: theme.surfaceGlass, color: theme.text, border: `1px solid ${theme.borderGlass}` };
  const input = { width: '100%', minHeight: 48, boxSizing: 'border-box' as const, borderRadius: 13, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '12px 14px', fontSize: 15, outline: 'none' };
  const label = { display: 'block', fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: 650 as const };

  return (
    <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, padding: 'clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
      <Helmet>
        <title>CryBots | Sign in with KingsHall</title>
        <meta name="description" content="Sign in to CryBots securely through your KingsHall identity." />
      </Helmet>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={handleReturn} aria-label="Go back" style={{ ...glass, color: theme.text, borderRadius: 999, width: 44, height: 44, display: 'grid', placeItems: 'center', flexShrink: 0 }}><ArrowLeft size={18} /></button>
          <div>
            <p style={{ margin: 0, color: theme.primary, fontSize: 12, fontWeight: 800, letterSpacing: '.16em' }}>CRYBOTS · KINGSHALL ID</p>
            <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: 13 }}>One identity. Secure access.</p>
          </div>
        </header>
        <section style={{ ...glass, borderRadius: 24, padding: 'clamp(20px, 5vw, 30px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ ...glass, width: 48, height: 48, borderRadius: 15, display: 'grid', placeItems: 'center', color: theme.primary, flexShrink: 0 }}>
              {step === 'one-time' ? <Smartphone size={23} /> : step === 'access-code' ? <KeyRound size={23} /> : <ShieldCheck size={23} />}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.45rem, 4vw, 1.9rem)', lineHeight: 1.15 }}>{step === 'identity' ? 'Sign in to CryBots' : step === 'method' ? 'Choose your sign-in method' : step === 'access-code' ? 'Sign in with Access Code' : 'Approve in KingsHall'}</h1>
              <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 13, lineHeight: 1.5 }}>{step === 'identity' ? 'Use the email or username linked to your KingsHall account.' : step === 'method' ? 'KingsHall controls your available authentication methods.' : step === 'access-code' ? 'Enter your six-digit KingsHall Access Code.' : 'Keep this page open while you approve the request in KingsHall.'}</p>
            </div>
          </div>

          {step === 'identity' && <form onSubmit={handleLookup} style={{ display: 'grid', gap: 16 }}>
            <div><label htmlFor="signin-identity" style={label}>Email or Username</label><input id="signin-identity" style={input} value={identity} onChange={event => setIdentity(event.target.value)} placeholder="Enter your email or username" autoComplete="username" autoCapitalize="none" required /></div>
            <button type="submit" style={button} disabled={busy || !identity.trim()}>{busy ? <LoadingDots /> : 'Sign In'}</button>
          </form>}

          {step === 'method' && <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, color: theme.textMuted, fontSize: 13, overflowWrap: 'anywhere' }}>Account: <strong style={{ color: theme.text }}>{identity.trim()}</strong></p>
            {accessCodeAvailable && <button type="button" style={secondaryButton} onClick={() => { setStep('access-code'); setError(''); }}><KeyRound size={18} /> Sign in with Access Code</button>}
            <button type="button" style={secondaryButton} onClick={() => void startOneTimeCode()} disabled={busy}><Smartphone size={18} /> {busy ? <LoadingDots /> : 'Sign in with One-Time Code'}</button>
            <button type="button" style={{ border: 0, background: 'transparent', color: theme.primary, padding: 10, fontWeight: 700 }} onClick={resetFlow}>Use a different account</button>
          </div>}

          {step === 'access-code' && <form onSubmit={handleAccessCode} style={{ display: 'grid', gap: 16 }}>
            <div><label htmlFor="signin-access-code" style={label}>Six-digit Access Code</label><input id="signin-access-code" style={{ ...input, textAlign: 'center', letterSpacing: '.35em', fontSize: 20 }} type="password" inputMode="numeric" autoComplete="off" value={accessCode} onChange={event => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" minLength={6} maxLength={6} pattern="[0-9]{6}" required /></div>
            <button type="submit" style={button} disabled={busy || accessCode.length !== 6}>{busy ? <LoadingDots /> : 'Verify Access Code'}</button>
            <button type="button" style={{ border: 0, background: 'transparent', color: theme.primary, padding: 8, fontWeight: 700 }} onClick={() => { setStep('method'); setAccessCode(''); setError(''); }}>Back to sign-in methods</button>
          </form>}

          {step === 'one-time' && <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ ...glass, borderRadius: 20, padding: 20, textAlign: 'center' }}>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: 12, fontWeight: 800, letterSpacing: '.15em' }}>YOUR TWO-DIGIT CHALLENGE</p>
              <p aria-label={'Challenge code ' + challengeCode} style={{ margin: '10px 0', fontSize: 'clamp(3rem, 15vw, 4.5rem)', lineHeight: 1, letterSpacing: '.2em', fontWeight: 850, color: theme.primary }}>{challengeCode}</p>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: 13, lineHeight: 1.6 }}>Open KingsHall on a device where you are signed in. Enter these two digits in the CryBots sign-in approval modal.</p>
            </div>
            <p role="status" style={{ margin: 0, color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>Waiting for KingsHall approval… {expiresAt ? 'This request expires in about five minutes.' : ''}</p>
            <button type="button" style={secondaryButton} onClick={resetFlow}>Cancel sign-in</button>
          </div>}

          {error && <p role="alert" style={{ margin: '16px 0 0', padding: '11px 13px', borderRadius: 12, background: 'rgba(220,60,60,.10)', border: '1px solid rgba(220,80,80,.28)', color: theme.text, fontSize: 13, lineHeight: 1.5 }}>{error}</p>}
          {notice && step === 'one-time' && <p role="status" style={{ margin: '10px 0 0', color: theme.textMuted, fontSize: 13, lineHeight: 1.5 }}>{notice}</p>}
          <p style={{ margin: '20px 0 0', paddingTop: 14, borderTop: `1px solid ${theme.borderGlass}`, color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}>Authentication is handled by KingsHall. Never approve a sign-in request you did not initiate.</p>
        </section>
      </div>
    </main>
  );
};

export default SigninPage;
