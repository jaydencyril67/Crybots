import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShieldCheck, KeyRound, Smartphone, Fingerprint, Laptop2, LockKeyhole, LogOut, Trash2, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api/axios';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';
import { useAppTheme } from './AppTheme';
import LoadingDots from './LoadingDots';
import ReusableConfirmationPage from './ReusableConfirmationPage';
import NotificationBanner from './NotificationBanner';
import { createPasskey, isWebAuthnAvailable } from '../utils/webauthn';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { logWebAuthnDebug } from '../utils/webauthnDebug';

type SecurityDevice = {
  id?: string;
  name?: string;
  ip?: string;
  location?: string;
  lastActiveAt?: string;
  status?: string;
};

type SessionData = {
  tokenHash: string;
  ip: string;
  deviceType: string;
  location: string;
  country: string;
  city?: string;
  region?: string;
  createdAt: string;
};

type SecurityLogin = {
  id?: string;
  device?: string;
  ip?: string;
  location?: string;
  createdAt?: string;
  success?: boolean;
};

type WebAuthnCredential = { id: string; createdAt?: string };

type SecurityMeResponse = {
  user?: {
    securityCodeSet?: boolean;
    securityCodeChangeAvailableAt?: string | null;
    twoFactorEnabled?: boolean;
    biometricEnabled?: boolean;
    webauthnCredentials?: WebAuthnCredential[];
    hardwareKeyEnabled?: boolean;
    maxActiveSessions?: number;
  };
  devices?: SecurityDevice[];
  logins?: SecurityLogin[];
};

type SessionsApiResponse = {
  sessions: SessionData[];
  currentTokenHash: string;
};

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '90px',
    background: theme.background,
    color: theme.text,
  },
  shell: {
    width: '100%',
    maxWidth: '920px',
    margin: '0 auto',
    padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'grid',
    gap: '14px',
    marginTop: '14px',
  },
  portfolioBack: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '12px' },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: theme.text,
  },
  sectionText: {
    margin: '8px 0 0',
    fontSize: '0.92rem',
    color: theme.textMuted,
    lineHeight: 1.7,
    maxWidth: '64ch',
  },
  block: {
    display: 'grid',
    gap: '12px',
    paddingTop: '8px',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  table: {
    width: '100%',
    minWidth: '920px',
    borderCollapse: 'separate' as const,
    borderSpacing: 0,
  },
  tableHeadCell: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: theme.textMuted,
    borderBottom: `1px solid ${theme.border}`,
    whiteSpace: 'nowrap' as const,
  },
  tableCell: {
    padding: '11px',
    borderBottom: `1px solid ${theme.border}`,
    verticalAlign: 'top' as const,
  },
  tableRow: {
    background: theme.highlightSoft,
  },
  tableRowCurrent: {
    background: theme.primarySoft,
  },
  tableLabel: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.78rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  tableValue: {
    margin: '6px 0 0',
    color: theme.text,
    fontSize: '0.95rem',
    fontWeight: 800,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
  tableMeta: {
    display: 'none',
  },
  rowList: {
    display: 'grid',
    gap: '14px',
    gridTemplateColumns: '1fr',
    width: '100%',
    minWidth: 0,
  },
  row: {
    display: 'grid',
    gap: '6px',
    width: '100%',
    maxWidth: '100%',
    padding: '10px 0',
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    textAlign: 'left' as const,
    minWidth: 0,
    boxSizing: 'border-box' as const,
  },
  rowLabel: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.74rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  rowValue: {
    margin: 0,
    color: theme.text,
    fontSize: '0.94rem',
    fontWeight: 800,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
  note: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.82rem',
    lineHeight: 1.4,
  },
  control: {
    display: 'grid',
    gap: '10px',
    marginTop: '8px',
    alignItems: 'start',
    width: '100%',
    minWidth: 0,
  },
  card: {
    padding: '16px',
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    display: 'grid',
    gap: '14px',
    boxSizing: 'border-box' as const,
  },
  '@media (max-width: 640px)': {
    page: { paddingBottom: '90px' },
    shell: { maxWidth: '100%', padding: '14px 12px 24px' },
    content: { gap: '14px', marginTop: '14px' },
    card: { ...createHybridCardStyles(theme).card, ...createHybridCardStyles(theme).cardMobile },
    table: { minWidth: '820px' },
    rowList: { gap: '14px', gridTemplateColumns: '1fr', width: '100%', minWidth: 0 },
    row: { padding: '14px', borderRadius: '16px', maxWidth: '100%' },
    control: { gridTemplateColumns: '1fr', gap: '8px', width: '100%', minWidth: 0 },
    buttonRow: { gridTemplateColumns: '1fr', gap: '8px', width: '100%', minWidth: 0 },
    button: { width: '100%' },
    input: { width: '100%' },
    sectionTitle: { fontSize: '1.15rem' },
    sectionText: { maxWidth: '100%' },
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    padding: '10px 12px',
    outline: 'none',
    fontSize: '0.9rem',
  },
  selectTrigger: {
    width: '100%',
    boxSizing: 'border-box' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    borderRadius: '14px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    color: theme.text,
    padding: '11px 12px',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  selectMenu: {
    position: 'absolute' as const,
    zIndex: 10,
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    display: 'grid',
    gap: '6px',
    padding: '8px',
    borderRadius: '16px',
    background: theme.mode === 'dark' ? 'rgba(12,12,12,0.96)' : 'rgba(238,237,232,0.97)',
    border: `1px solid ${theme.borderStrong}`,
    boxShadow: theme.mode === 'dark' ? '0 18px 40px rgba(0,0,0,.62)' : '0 18px 40px rgba(30,30,30,.18)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  selectOption: {
    width: '100%',
    borderRadius: '12px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.mode === 'dark' ? 'rgba(42,42,42,0.94)' : 'rgba(220,219,213,0.96)',
    color: theme.text,
    padding: '10px 12px',
    textAlign: 'left' as const,
    cursor: 'pointer',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  button: {
    border: 'none',
    borderRadius: '999px',
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '108px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: theme.primary,
    color: theme.textInverse,
    fontSize: '0.88rem',
  },
  dangerButton: {
    background: theme.danger,
    color: theme.textInverse,
  },
  mutedButton: {
    color: theme.textMuted,
    fontWeight: 700,
  },
  status: {
    margin: '8px 0 0',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: theme.textMuted,
  },
  inlineError: {
    margin: '6px 0 0',
    color: theme.danger,
    fontSize: '0.82rem',
    lineHeight: 1.4,
  },
});

const securityCodeChangeCooldownMs = 30 * 24 * 60 * 60 * 1000;

const SecurityPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [maxActiveSessions, setMaxActiveSessions] = useState(2);
  const [savingMaxSessions, setSavingMaxSessions] = useState(false);
  const [securityCodeEmailCode, setSecurityCodeEmailCode] = useState('');
  const [securityCodeEmailCodeRequested, setSecurityCodeEmailCodeRequested] = useState(false);
  const [requestingSecurityCodeEmailCode, setRequestingSecurityCodeEmailCode] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [confirmSecurityCode, setConfirmSecurityCode] = useState('');
  const [status, setStatus] = useState<{ kind: SaveState; text: string; section: string }>({ kind: 'idle', text: '', section: 'security' });
  const [logins, setLogins] = useState<SecurityLogin[]>([]);
  const [securityCodeSet, setSecurityCodeSet] = useState(false);
  const [securityCodeChangeAvailableAt, setSecurityCodeChangeAvailableAt] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorConfigured, setTwoFactorConfigured] = useState(false);
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorUri, setTwoFactorUri] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorCodeError, setTwoFactorCodeError] = useState('');
  const [twoFactorKeyCopied, setTwoFactorKeyCopied] = useState(false);
  const [showDelete2faConfirmation, setShowDelete2faConfirmation] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [passkeys, setPasskeys] = useState<WebAuthnCredential[]>([]);
  const [hardwareKeyEnabled, setHardwareKeyEnabled] = useState(false);
  const [savingSecurityCode, setSavingSecurityCode] = useState(false);
  const [saving2fa, setSaving2fa] = useState(false);
  const [savingSecurityQuestion, setSavingSecurityQuestion] = useState(false);
  const [savingBiometric, setSavingBiometric] = useState(false);
  const [savingHardware, setSavingHardware] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentTokenHash, setCurrentTokenHash] = useState('');
  const [removingSession, setRemovingSession] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<SecurityMeResponse>('/api/settings/me');
        setSecurityCodeSet(Boolean(data.user?.securityCodeSet));
        setSecurityCodeChangeAvailableAt(data.user?.securityCodeChangeAvailableAt ?? null);
        setTwoFactorEnabled(Boolean(data.user?.twoFactorEnabled));
        setBiometricEnabled(Boolean(data.user?.biometricEnabled));
        try {
          const { data: passkeyData } = await api.get<{ credentials?: WebAuthnCredential[] }>('/api/webauthn/credentials');
          setPasskeys(passkeyData.credentials ?? []);
        } catch {
          // Passkey status is non-critical to the rest of the security page.
        }

        const { data: twoFactorStatus } = await api.get<{ configured?: boolean; enabled?: boolean }>('/api/settings/2fa');
        setTwoFactorConfigured(Boolean(twoFactorStatus.configured));
        setTwoFactorEnabled(Boolean(twoFactorStatus.enabled));
        setHardwareKeyEnabled(Boolean(data.user?.hardwareKeyEnabled));
        setMaxActiveSessions(Math.min(10, Math.max(1, data.user?.maxActiveSessions ?? 2)));

        setLogins(data.logins ?? []);
      } catch {
        setStatus({ kind: 'error', text: 'Unable to load security details right now.', section: 'security' });
      } finally {
        setLoading(false);
      }

      try {
        const { data } = await api.get<SessionsApiResponse>('/api/auth/sessions');
        setSessions(data.sessions ?? []);
        setCurrentTokenHash(data.currentTokenHash ?? '');
      } catch {
        // sessions fetch is non-critical
      } finally {
        setSessionsLoading(false);
      }
    };
    void load();
  }, []);

  const currentLoginCount = useMemo(() => sessions.length, [sessions.length]);

  const handleMaxSessionsSave = async () => {
    const value = Number(maxActiveSessions);
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      return showStatus('error', 'Choose a whole number between 1 and 10 active sessions.', 'sessions');
    }

    setSavingMaxSessions(true);
    try {
      const { data } = await api.patch<{ maxActiveSessions: number }>('/api/settings/max-active-sessions', { maxActiveSessions: value });
      setMaxActiveSessions(data.maxActiveSessions);
      showStatus('success', 'Maximum active sessions updated successfully.', 'sessions');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to update the maximum active sessions.'), 'sessions');
    } finally {
      setSavingMaxSessions(false);
    }
  };

  const handleRemoveSession = async (tokenHash: string) => {
    setRemovingSession(tokenHash);
    try {
      await api.delete(`/api/auth/sessions/${tokenHash}`);
      setSessions((prev) => prev.filter((s) => s.tokenHash !== tokenHash));
      setStatus({ kind: 'success', text: 'Device session removed successfully.', section: 'sessions' });
    } catch (error: any) {
      setStatus({
        kind: 'error',
        text: getFriendlyErrorMessage(error, 'Unable to remove this device session. Please try again.'),
        section: 'sessions',
      });
    } finally {
      setRemovingSession(null);
    }
  };

  const showStatus = (kind: SaveState, text: string, section = 'security') => setStatus({ kind, text, section });
  const renderStatus = (section: string) => status.kind !== 'idle' && status.section === section ? (
    <NotificationBanner
      tone={status.kind === 'success' ? 'success' : 'error'}
      title={status.kind === 'success' ? 'Security settings updated' : 'Check your details'}
      message={status.text}
    />
  ) : null;

  const securityCodeChangeLocked = Boolean(securityCodeChangeAvailableAt && new Date(securityCodeChangeAvailableAt).getTime() > Date.now());
  const securityCodeChangeDate = securityCodeChangeAvailableAt ? new Date(securityCodeChangeAvailableAt) : null;
  const securityCodeChangeMessage = securityCodeChangeLocked && securityCodeChangeDate && !Number.isNaN(securityCodeChangeDate.getTime())
    ? `You can change your security code again after ${securityCodeChangeDate.toLocaleDateString()}.`
    : 'For your protection, you can change your security code only once every 30 days.';

  const handleSecurityCodeEmailCodeRequest = async () => {
    setRequestingSecurityCodeEmailCode(true);
    try {
      await api.post('/api/withdrawals/security-code/email-code');
      setSecurityCodeEmailCodeRequested(true);
      setSecurityCodeEmailCode('');
      showStatus('success', 'A verification code was sent to your account email. It expires in 10 minutes.', 'securityCode');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to send the email verification code.'), 'securityCode');
    } finally {
      setRequestingSecurityCodeEmailCode(false);
    }
  };

  const handleSecurityCodeSave = async () => {
    if (!securityCodeEmailCodeRequested || !/^\d{4}$/.test(securityCodeEmailCode)) {
      return showStatus('error', 'Request and enter the 4-digit email verification code first.', 'securityCode');
    }
    if (securityCode.length !== 6 || securityCode !== confirmSecurityCode) {
      return showStatus('error', 'Security code must be 6 digits and match confirmation.', 'securityCode');
    }
    setSavingSecurityCode(true);
    try {
      await api.patch('/api/withdrawals/security-code', { emailCode: securityCodeEmailCode, securityCode });
      setSecurityCodeSet(true);
      setSecurityCodeChangeAvailableAt(new Date(Date.now() + securityCodeChangeCooldownMs).toISOString());
      setSecurityCodeEmailCode('');
      setSecurityCodeEmailCodeRequested(false);
      setSecurityCode('');
      setConfirmSecurityCode('');
      showStatus('success', 'Security code updated successfully.', 'securityCode');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to update your security code. Please check your details and try again.'), 'securityCode');
    } finally {
      setSavingSecurityCode(false);
    }
  };

  const handleSetup2fa = async () => {
    setSaving2fa(true);
    try {
      const { data } = await api.post<{ secret: string; otpauthUrl: string }>('/api/settings/2fa/setup');
      setTwoFactorSecret(data.secret);
      setTwoFactorUri(data.otpauthUrl);
      setTwoFactorConfigured(true);
      setTwoFactorSetupOpen(true);
      setTwoFactorCode('');
      setTwoFactorCodeError('');
      showStatus('success', 'Scan the QR code with your authenticator app, then enter the generated code to enable 2FA.', 'twoFactor');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to start two-factor authentication. Please try again.'), 'twoFactor');
    } finally {
      setSaving2fa(false);
    }
  };

  const handleCopyTwoFactorKey = async () => {
    if (!twoFactorSecret) return;

    try {
      await navigator.clipboard.writeText(twoFactorSecret);
      setTwoFactorKeyCopied(true);
      showStatus('success', 'Manual key copied to clipboard.', 'twoFactor');
      window.setTimeout(() => setTwoFactorKeyCopied(false), 2000);
    } catch {
      showStatus('error', 'Unable to copy the manual key.', 'twoFactor');
    }
  };

  const handleToggle2fa = async () => {
    if (!twoFactorCode.trim()) {
      setTwoFactorCodeError('Enter the 6-digit authenticator code before continuing.');
      return showStatus('error', 'Enter the 6-digit authenticator code before continuing.', 'twoFactor');
    }
    if (twoFactorCode.length !== 6) {
      setTwoFactorCodeError('Enter the complete 6-digit authenticator code.');
      return showStatus('error', 'Enter the complete 6-digit authenticator code.', 'twoFactor');
    }
    setTwoFactorCodeError('');
    setSaving2fa(true);
    try {
      const endpoint = twoFactorEnabled ? '/api/settings/2fa/disable' : '/api/settings/2fa/enable';
      await api.post(endpoint, { code: twoFactorCode.trim() });
      const enabling = !twoFactorEnabled;
      setTwoFactorEnabled(enabling);
      if (enabling) setTwoFactorSetupOpen(false);
      setTwoFactorCode('');
      setTwoFactorCodeError('');
      showStatus('success', twoFactorEnabled ? 'Two-factor authentication disabled.' : 'Two-factor authentication enabled.', 'twoFactor');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to update two-factor authentication. Please try again.'), 'twoFactor');
    } finally {
      setSaving2fa(false);
    }
  };

  const handleDelete2fa = async () => {
    if (!twoFactorCode.trim()) {
      setTwoFactorCodeError('Enter the 6-digit authenticator code before deleting 2FA.');
      return showStatus('error', 'Enter the 6-digit authenticator code before deleting 2FA.', 'twoFactor');
    }
    if (twoFactorCode.length !== 6) {
      setTwoFactorCodeError('Enter the complete 6-digit authenticator code.');
      return showStatus('error', 'Enter the complete 6-digit authenticator code.', 'twoFactor');
    }
    setTwoFactorCodeError('');
    setShowDelete2faConfirmation(true);
  };

  const confirmDelete2fa = async () => {
    setSaving2fa(true);
    try {
      await api.delete('/api/settings/2fa', { data: { code: twoFactorCode.trim() } });
      setTwoFactorConfigured(false);
      setTwoFactorSetupOpen(false);
      setTwoFactorEnabled(false);
      setTwoFactorSecret('');
      setTwoFactorUri('');
      setTwoFactorCode('');
      setTwoFactorCodeError('');
      showStatus('success', 'All two-factor authentication data was deleted.', 'twoFactor');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to remove two-factor authentication. Please try again.'), 'twoFactor');
    } finally {
      setSaving2fa(false);
      setShowDelete2faConfirmation(false);
    }
  };

  const handleToggleBiometric = async () => {
    if (!biometricEnabled && !passkeys.length) {
      return showStatus('error', 'Bind a passkey first, then enable biometric sign-in.', 'biometric');
    }
    setSavingBiometric(true);
    try {
      const enabled = !biometricEnabled;
      await api.patch('/api/settings/biometric', { enabled });
      setBiometricEnabled(enabled);
      showStatus('success', enabled ? 'Biometric sign-in enabled.' : 'Biometric sign-in disabled. Your bound passkeys remain saved.', 'biometric');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to update biometric sign-in.'), 'biometric');
    } finally {
      setSavingBiometric(false);
    }
  };

  const handleBindBiometric = async () => {
    if (!isWebAuthnAvailable()) return showStatus('error', 'Passkeys are not supported by this browser or device.', 'biometric');
    setSavingBiometric(true);
    try {
      const { data: options } = await api.post('/api/webauthn/register/options');
      const credential = await createPasskey(options);
      const { data } = await api.post('/api/webauthn/register/verify', credential);
      setPasskeys(data.credentials ?? []);
      showStatus('success', 'Passkey bound successfully. Enable biometric sign-in separately when you are ready.', 'biometric');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to bind this passkey.'), 'biometric');
    } finally {
      setSavingBiometric(false);
    }
  };

  const handleUnbindPasskey = async (credentialId: string) => {
    setSavingBiometric(true);
    try {
      const { data } = await api.delete<{ credentials?: WebAuthnCredential[] }>(`/api/webauthn/credentials/${encodeURIComponent(credentialId)}`);
      const next = data.credentials ?? [];
      setPasskeys(next);
      if (!next.length) setBiometricEnabled(false);
      showStatus('success', next.length ? 'Passkey unbound successfully.' : 'Passkey unbound. Biometric sign-in was disabled because no passkeys remain.', 'biometric');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to unbind this passkey.'), 'biometric');
    } finally {
      setSavingBiometric(false);
    }
  };

  const handleToggleHardware = async () => {
    setSavingHardware(true);
    try {
      showStatus('success', 'Hardware security will be wired to the backend next.', 'hardware');
    } finally {
      setSavingHardware(false);
    }
  };

  const handleSecurityQuestionSave = async () => {
    setSavingSecurityQuestion(true);
    try {
      await api.patch('/api/settings/security-question', {});
      showStatus('success', 'Security question updated successfully.', 'security');
    } catch (error: any) {
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to update your security question. Please try again.'));
    } finally {
      setSavingSecurityQuestion(false);
    }
  };

  if (showDelete2faConfirmation) {
    return (
      <ReusableConfirmationPage
        eyebrow="Two-factor authentication"
        title="Remove 2FA from this account?"
        description="You are about to delete the authenticator configuration currently protecting your account."
        context="After removal, this authenticator will no longer be required when you sign in. You can set up 2FA again later."
        details={[
          { label: 'Verification required', value: 'Current authenticator code' },
          { label: 'Account protection', value: '2FA will be disabled' },
          { label: 'Recovery', value: 'Available by setting it up again' },
        ]}
        warning="This removes all saved two-factor authentication data. Make sure you have another way to secure your account before continuing."
        warningTone="danger"
        statusLabel="This action cannot be undone."
        statusTone="danger"
        primaryActionLabel="Delete 2FA data"
        processingActionLabel="Deleting 2FA data…"
        secondaryActionLabel="Go back"
        onPrimaryAction={() => { void confirmDelete2fa(); }}
        onSecondaryAction={() => setShowDelete2faConfirmation(false)}
        isProcessing={saving2fa}
        footerNote="Your current authenticator code will be submitted only when you confirm."
      />
    );
  }

  return (
    <HybridTheme mode={themeMode}>
      <style>{`.security-control {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      @media (max-width: 640px) {
        .security-control {
          grid-template-columns: 1fr;
        }
        .security-control > button {
          width: 100%;
        }
      }`}</style>
      <div style={styles.page}>
        <div style={styles.shell}>
          <Helmet>
            <title>CryBots | Security</title>
          </Helmet>
          
          <div style={styles.content}>
            <button type="button" style={styles.portfolioBack} onClick={() => navigate('/profile')}><ArrowLeft size={17} /> Profile</button>
            <div style={styles.rowList}>
              <div style={styles.card}>
                <div style={styles.row}>
                <p style={styles.rowLabel}><Smartphone size={16} /> Devices logged in</p>
                <p style={styles.rowValue}>{sessionsLoading ? <LoadingDots /> : `${currentLoginCount} active device${currentLoginCount === 1 ? '' : 's'} • max ${maxActiveSessions} per account`}</p>
                <div className="security-control" style={styles.control}>
                  <label style={styles.note} htmlFor="max-active-sessions">Maximum active sessions</label>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: theme.text, fontWeight: 700 }}><span>{maxActiveSessions} device{maxActiveSessions === 1 ? '' : 's'}</span><span style={{ color: theme.textMuted, fontSize: '0.8rem' }}>1–10</span></div>
                    <input id="max-active-sessions" type="range" min="1" max="10" step="1" value={maxActiveSessions} onChange={(event) => setMaxActiveSessions(Number(event.target.value))} disabled={savingMaxSessions} aria-label="Maximum active sessions" style={{ width: '100%', accentColor: theme.primary, cursor: savingMaxSessions ? 'not-allowed' : 'grab', opacity: savingMaxSessions ? 0.65 : 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, fontSize: '0.72rem' }}>{Array.from({ length: 10 }, (_, index) => <span key={index + 1}>{index + 1}</span>)}</div>
                  </div>
                  <button type="button" style={styles.button} onClick={() => void handleMaxSessionsSave()} disabled={savingMaxSessions}>{savingMaxSessions ? <LoadingDots /> : 'Save session limit'}</button>
                </div>
                {renderStatus('sessions')}
                <p style={styles.note}>Choose how many devices can stay signed in at once. The default is 2, and you can allow from 1 up to 10.</p>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeadCell}>Device</th>
                        <th style={styles.tableHeadCell}>IP address</th>
                        <th style={styles.tableHeadCell}>Location</th>
                        <th style={styles.tableHeadCell}>Country</th>
                        <th style={styles.tableHeadCell}>Login date</th>
                        <th style={styles.tableHeadCell}>Login time</th>
                        <th style={styles.tableHeadCell}>Status</th>
                        <th style={styles.tableHeadCell}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsLoading ? (
                        <tr><td style={styles.tableCell} colSpan={8}><LoadingDots /></td></tr>
                      ) : sessions.length === 0 ? (
                        <tr>
                          <td style={styles.tableCell} colSpan={8}>
                            <p style={styles.note}>No active sessions found.</p>
                          </td>
                        </tr>
                      ) : sessions.map((session, index) => {
                        const isCurrent = session.tokenHash === currentTokenHash;
                        return (
                          <tr key={session.tokenHash ?? `session-${index}`} style={isCurrent ? styles.tableRowCurrent : styles.tableRow}>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}><Laptop2 size={14} /> Device</p>
                              <p style={styles.tableValue}>{session.deviceType || 'Unknown device'}</p>
                            </td>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}>IP address</p>
                              <p style={styles.tableValue}>{session.ip || 'IP not available'}</p>
                            </td>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}>Location</p>
                              <p style={styles.tableValue}>{session.location || 'Location unavailable'}</p>
                            </td>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}>Country</p>
                              <p style={styles.tableValue}>{session.country || 'Country unavailable'}</p>
                            </td>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}>Login date</p>
                              <p style={styles.tableValue}>{new Date(session.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            </td>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}>Login time</p>
                              <p style={styles.tableValue}>{new Date(session.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td style={styles.tableCell}>
                              <p style={styles.tableLabel}>Status</p>
                              <p style={styles.tableValue}>{isCurrent ? 'Current device' : `Device ${index + 1}`}</p>
                            </td>
                            <td style={styles.tableCell}>
                              {isCurrent ? (
                                <></>
                              ) : (
                                <button
                                  type="button"
                                  style={{ ...styles.button, ...styles.dangerButton, fontSize: '0.85rem' }}
                                  onClick={() => void handleRemoveSession(session.tokenHash)}
                                  disabled={removingSession === session.tokenHash}
                                >
                                  <LogOut size={14} />
                                  {removingSession === session.tokenHash ? 'Removing...' : 'Force logout device'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {renderStatus('sessions')}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.row}>
                <p style={styles.rowLabel}><LockKeyhole size={16} /> Security code</p>
                <p style={styles.rowValue}>{securityCodeSet ? 'Security code is active' : 'Security code not set yet'}</p>
                <p style={styles.note}>{securityCodeChangeMessage}</p>
                <div className="security-control" style={styles.control}>
                  <div style={styles.buttonRow}>
                    <button type="button" style={styles.button} onClick={() => void handleSecurityCodeEmailCodeRequest()} disabled={requestingSecurityCodeEmailCode || securityCodeChangeLocked}>
                      {requestingSecurityCodeEmailCode ? <LoadingDots /> : securityCodeEmailCodeRequested ? 'Resend email code' : 'Send email code'}
                    </button>
                  </div>
                  {securityCodeEmailCodeRequested ? <input style={styles.input} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={securityCodeEmailCode} onChange={(event) => setSecurityCodeEmailCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4-digit email verification code" /> : null}
                  <input style={{ ...styles.input, WebkitTextSecurity: 'disc' } as React.CSSProperties} type="text" inputMode="numeric" autoComplete="off" maxLength={6} value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit security code" />
                  <input style={{ ...styles.input, WebkitTextSecurity: 'disc' } as React.CSSProperties} type="text" inputMode="numeric" autoComplete="off" maxLength={6} value={confirmSecurityCode} onChange={(event) => setConfirmSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Confirm security code" />
                  <button type="button" style={styles.button} onClick={() => void handleSecurityCodeSave()} disabled={savingSecurityCode || securityCodeChangeLocked}>{savingSecurityCode ? <LoadingDots /> : 'Save'}</button>
                </div>
                {renderStatus('securityCode')}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.row}>
                <p style={styles.rowLabel}><ShieldCheck size={16} /> 2FA</p>
                <p style={styles.rowValue}>{twoFactorEnabled ? 'Two-factor authentication enabled' : twoFactorConfigured ? 'Authenticator configured but disabled' : 'Two-factor authentication not set up'}</p>
                {!twoFactorConfigured ? (
                  <div style={styles.buttonRow}>
                    <button type="button" style={styles.button} onClick={() => void handleSetup2fa()} disabled={saving2fa}>{saving2fa ? <LoadingDots /> : 'Set up 2FA'}</button>
                  </div>
                ) : twoFactorSetupOpen ? (
                  <div style={styles.control}>
                    {twoFactorUri ? (
                      <div style={{ display: 'grid', gap: '8px', justifyItems: 'start' }}>
                        <QRCodeCanvas value={twoFactorUri} size={180} includeMargin />
                        <p style={styles.note}>Scan this QR code in Google Authenticator, Authy, or another TOTP app.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                          <p style={{ ...styles.note, wordBreak: 'break-all' as const, margin: 0 }}>Manual key: {twoFactorSecret}</p>
                          <button
                            type="button"
                            onClick={() => void handleCopyTwoFactorKey()}
                            disabled={!twoFactorSecret}
                            aria-label={twoFactorKeyCopied ? 'Manual key copied' : 'Copy manual key'}
                            title={twoFactorKeyCopied ? 'Copied' : 'Copy manual key'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '30px',
                              height: '30px',
                              padding: 0,
                              border: 'none',
                              borderRadius: '8px',
                              background: 'transparent',
                              color: twoFactorKeyCopied ? theme.success : theme.textMuted,
                              cursor: twoFactorSecret ? 'pointer' : 'not-allowed',
                              flexShrink: 0,
                            }}
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <input style={twoFactorCodeError ? { ...styles.input, borderColor: theme.danger, background: theme.surface } : styles.input} inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={(event) => { setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setTwoFactorCodeError(''); }} placeholder="6-digit authenticator code" autoComplete="one-time-code" aria-invalid={Boolean(twoFactorCodeError)} />
                    {twoFactorCodeError ? <p style={styles.inlineError}>{twoFactorCodeError}</p> : null}
                    <div style={styles.buttonRow}>
                      <button type="button" style={styles.button} onClick={() => void handleToggle2fa()} disabled={saving2fa}>{saving2fa ? <LoadingDots /> : 'Enable 2FA'}</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.control}>
                    <input style={twoFactorCodeError ? { ...styles.input, borderColor: theme.danger, background: theme.surfaceMuted } : styles.input} inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={(event) => { setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setTwoFactorCodeError(''); }} placeholder="6-digit authenticator code" autoComplete="one-time-code" aria-invalid={Boolean(twoFactorCodeError)} />
                    {twoFactorCodeError ? <p style={styles.inlineError}>{twoFactorCodeError}</p> : null}
                    <div style={styles.buttonRow}>
                      <button type="button" style={styles.button} onClick={() => void handleToggle2fa()} disabled={saving2fa}>{saving2fa ? <LoadingDots /> : twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}</button>
                      {twoFactorConfigured ? <button type="button" style={{ ...styles.button, ...styles.dangerButton }} onClick={() => void handleDelete2fa()} disabled={saving2fa}>{saving2fa ? <LoadingDots /> : <><Trash2 size={16} /> Unbind 2FA</>}</button> : null}
                    </div>
                  </div>
                )}
                {renderStatus('twoFactor')}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.row}>
                <p style={styles.rowLabel}><Fingerprint size={16} /> Biometric</p>
                <p style={styles.rowValue}>{biometricEnabled ? 'Biometric sign-in enabled' : 'Biometric sign-in disabled'} · {passkeys.length} bound passkey{passkeys.length === 1 ? '' : 's'}</p>
                <p style={styles.note}>Binding a passkey does not turn on login enforcement. Only the enabled switch makes biometric verification required during sign-in.</p>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.button} onClick={() => void handleBindBiometric()} disabled={savingBiometric}>{savingBiometric ? <LoadingDots /> : 'Bind passkey'}</button>
                  <button type="button" style={styles.button} onClick={() => void handleToggleBiometric()} disabled={savingBiometric || (!biometricEnabled && !passkeys.length)}>{savingBiometric ? <LoadingDots /> : biometricEnabled ? 'Disable biometric sign-in' : 'Enable biometric sign-in'}</button>
                </div>
                {passkeys.map((passkey, index) => <div key={passkey.id} style={{ ...styles.row, padding: '8px 0', borderBottom: index < passkeys.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                  <p style={styles.rowValue}>Bound passkey {index + 1}</p>
                  <p style={styles.note}>Added {passkey.createdAt ? new Date(passkey.createdAt).toLocaleDateString() : 'date unavailable'}</p>
                  <button type="button" style={{ ...styles.button, ...styles.dangerButton, alignSelf: 'start' }} onClick={() => void handleUnbindPasskey(passkey.id)} disabled={savingBiometric}>{savingBiometric ? <LoadingDots /> : 'Unbind passkey'}</button>
                </div>)}
                {renderStatus('biometric')}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.row}>
                <p style={styles.rowLabel}><Laptop2 size={16} /> Hardware security</p>
                <p style={styles.rowValue}>{hardwareKeyEnabled ? 'Hardware security enabled' : 'Hardware security disabled'}</p>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.button} onClick={() => void handleToggleHardware()} disabled={savingHardware}>{savingHardware ? <LoadingDots /> : hardwareKeyEnabled ? 'Disable hardware security' : 'Enable hardware security'}</button>
                </div>
                {renderStatus('hardware')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default SecurityPage;
