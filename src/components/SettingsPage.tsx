import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, LockKeyhole, ShieldCheck, Trash2, WalletCards } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type MeResponse = {
  user?: {
    uid?: string;
    email?: string;
    walletAddress?: string;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
  };
};

type StatusState = {
  kind: 'idle' | 'success' | 'error';
  message: string;
};

type WalletValidationState = {
  valid: boolean;
  message: string;
};

const passwordRuleMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.';
const trc20WalletPattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  panel: {
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(14,18,33,0.92), rgba(9,12,24,0.86))',
    boxShadow: '0 22px 80px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    overflow: 'hidden',
  },
  body: {
    padding: 'clamp(18px, 4vw, 30px)',
    display: 'grid',
    gap: '18px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '18px',
  } as const,
  card: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardText: {
    margin: '10px 0 0',
    color: '#9db0d1',
    lineHeight: 1.6,
  },
  formGrid: {
    display: 'grid',
    gap: '12px',
    marginTop: '14px',
  },
  field: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#d7e2f8',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(7,12,24,0.92)',
    color: '#ffffff',
    padding: '13px 14px',
    outline: 'none',
  },
  helper: {
    fontSize: '0.85rem',
    color: '#95a8ca',
    lineHeight: 1.5,
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: '10px',
    marginTop: '4px',
  },
  button: {
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '12px 16px',
    fontWeight: 700,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.06)',
    cursor: 'pointer',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
    border: 'none',
  },
  dangerButton: {
    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    border: 'none',
  },
};

const passwordMeetsRule = (value: string) => {
  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;
};

const SettingsPage = () => {
  const [uid, setUid] = useState('');
  const [uidAvailable, setUidAvailable] = useState<boolean | null>(null);
  const [uidEditorActive, setUidEditorActive] = useState(false as boolean);
  const [uidChecking, setUidChecking] = useState(false);
  const [uidCardSaving, setUidCardSaving] = useState(false);
  const [passwordCardSaving, setPasswordCardSaving] = useState(false);
  const [walletCardSaving, setWalletCardSaving] = useState(false);
  const [securityCardSaving, setSecurityCardSaving] = useState(false);
  const [activeCard, setActiveCard] = useState<'password' | 'wallet' | 'security' | 'uid' | null>(null);
  const [initialUid, setInitialUid] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletValidation, setWalletValidation] = useState<WalletValidationState>({ valid: false, message: 'Enter a valid TRC-20 wallet address.' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupMessage, setTwoFactorSetupMessage] = useState('');
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false);
  const [twoFactorQrUrl, setTwoFactorQrUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<StatusState>({ kind: 'idle', message: '' });
  const [deactivating, setDeactivating] = useState(false);

  const uidDigits = uid.replace(/\D/g, '').slice(0, 5);
  const uidReadyToSave = Boolean(uidEditorActive && uidDigits.length === 5 && uidAvailable !== false);
  const showUidSaveButton = Boolean(activeCard === 'uid' && uidReadyToSave) || uidCardSaving;

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/auth/me');
        const user = data.user;
        const loadedUid = (user?.uid ?? '').replace(/\D/g, '').slice(0, 5);
        setUid(loadedUid);
        setInitialUid(loadedUid);
        setActiveCard(null);
        setWalletAddress(user?.walletAddress ?? '');
        setWalletValidation({ valid: Boolean(user?.walletAddress && trc20WalletPattern.test(user.walletAddress)), message: user?.walletAddress && trc20WalletPattern.test(user.walletAddress) ? 'TRC-20 wallet format looks valid.' : 'Enter a valid TRC-20 wallet address.' });
        setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
        setTwoFactorSecret(user?.twoFactorSecret ?? '');
        setTwoFactorToken('');
      } catch {
        navigate('/signin');
      }
    };

    void loadAccount();
  }, []);

  useEffect(() => {
    const trimmedUid = uid.trim();

    if (trimmedUid.length !== 5) {
      setUidAvailable(null);
      return;
    }

    setUidEditorActive(true);

    if (trimmedUid === initialUid) {
      setUidAvailable(true);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setUidChecking(true);
      try {
        const { data } = await api.get<{ available?: boolean }>('/api/settings/uid-check', {
          params: { uid: trimmedUid },
        });
        setUidAvailable(Boolean(data.available));
      } catch {
        if (!controller.signal.aborted) {
          setUidAvailable(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setUidChecking(false);
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [uid]);

  const passwordValid = useMemo(() => passwordMeetsRule(newPassword), [newPassword]);
  const passwordMismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordCanSave = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && passwordValid && !passwordMismatch;
  const passwordFieldStyle = newPassword.length > 0 && !passwordValid
    ? { ...styles.input, borderColor: 'rgba(239, 68, 68, 0.9)', boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.35)' }
    : styles.input;
  const confirmPasswordFieldStyle = confirmPassword.length > 0 && passwordMismatch
    ? { ...styles.input, borderColor: 'rgba(239, 68, 68, 0.9)', boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.35)' }
    : styles.input;
  const currentPasswordFieldStyle = styles.input;
  const walletAddressChanged = walletAddress.trim() !== '';
  const walletCanSave = walletAddressChanged && walletValidation.valid;
  const twoFactorConfigured = Boolean(twoFactorSecret);
  const twoFactorSetupAvailable = !twoFactorSecret;
  const securityCanSave = Boolean(twoFactorToken.trim());
  const shouldShowSecurityActions = twoFactorConfigured;
  const shouldShowSecuritySetup = !twoFactorConfigured;

  const handleDeleteTwoFactor = async () => {
    const trimmedToken = twoFactorToken.trim();

    if (!trimmedToken) {
      showStatus('error', 'Enter the 2FA code from your authenticator app.');
      return;
    }

    setSecurityCardSaving(true);
    try {
      const deleteResponse = await api.post('/api/two-factor/delete', { token: trimmedToken });
      showStatus('success', deleteResponse.data?.message || '2FA deleted successfully.');
      setTwoFactorEnabled(false);
      setTwoFactorSecret('');
      setTwoFactorQrUrl('');
      setTwoFactorToken('');
      setActiveCard(null);
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to delete 2FA.');
    } finally {
      setSecurityCardSaving(false);
    }
  };

  const showStatus = (kind: StatusState['kind'], message: string) => {
    setStatus({ kind, message });
  };

  const clearActiveIfMatches = (card: typeof activeCard) => {
    setActiveCard((current) => (current === card ? null : current));
  };

  const handleSetupTwoFactor = async () => {
    setTwoFactorSetupMessage('');
    setTwoFactorSetupLoading(true);

    try {
      const { data } = await api.post('/api/two-factor/setup');
      setTwoFactorSecret(data?.secret ?? '');
      setTwoFactorQrUrl(data?.otpauthUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.otpauthUrl)}` : '');
      setTwoFactorSetupMessage('Scan the QR code in your authenticator app, then enter the 6-digit code to enable 2FA.');
      setTwoFactorEnabled(false);
      setActiveCard('security');
      showStatus('success', '2FA setup created. Complete setup before leaving this page.');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to create 2FA setup right now.');
    } finally {
      setTwoFactorSetupLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      showStatus('error', 'Enter your current password to update your password.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      showStatus('error', 'Enter and confirm your new password.');
      return;
    }

    if (!passwordValid) {
      showStatus('error', passwordRuleMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      showStatus('error', 'New password and confirmation must match.');
      return;
    }

    setPasswordCardSaving(true);
    try {
      await api.patch('/api/settings/password', {
        currentPassword,
        newPassword,
      });
      showStatus('success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveCard(null);
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update your password.');
    } finally {
      setPasswordCardSaving(false);
    }
  };

  const handleSaveUid = async () => {
    const nextUid = uid.replace(/\D/g, '').slice(0, 5);

    if (nextUid.length !== 5) {
      showStatus('error', 'UID must be exactly 5 digits.');
      return;
    }

    if (uidAvailable === false) {
      showStatus('error', 'That UID is already taken.');
      return;
    }

    setUidCardSaving(true);
    try {
      await api.patch('/api/settings/uid', {
        uid: nextUid,
      });
      showStatus('success', 'UID updated successfully.');
      setUidAvailable(null);
      setInitialUid(nextUid);
      setUidEditorActive(false);
      setActiveCard(null);
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update your UID.');
    } finally {
      setUidCardSaving(false);
    }
  };

  const handleSaveWallet = async () => {
    const trimmedWallet = walletAddress.trim();

    if (!trc20WalletPattern.test(trimmedWallet)) {
      setWalletValidation({ valid: false, message: 'Wallet address must be a valid TRC-20 address starting with T.' });
      showStatus('error', 'Enter a valid TRC-20 wallet address before saving.');
      return;
    }

    setWalletCardSaving(true);
    try {
      await api.patch('/api/settings/wallet', {
        walletAddress: trimmedWallet,
      });
      setWalletValidation({ valid: true, message: 'TRC-20 wallet format looks valid.' });
      showStatus('success', 'Wallet address saved successfully.');
      setActiveCard(null);
    } catch (error: any) {
      setWalletValidation({ valid: false, message: 'Enter a valid TRC-20 wallet address.' });
      showStatus('error', error?.response?.data?.message || 'Unable to save wallet address.');
    } finally {
      setWalletCardSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    const trimmedToken = twoFactorToken.trim();

    if (!trimmedToken) {
      showStatus('error', 'Enter the 2FA code from your authenticator app.');
      return;
    }

    setSecurityCardSaving(true);
    try {
      if (!twoFactorConfigured) {
        const enableResponse = await api.post('/api/two-factor/enable', {
          token: trimmedToken,
        });
        if (enableResponse.data?.message) {
          showStatus('success', enableResponse.data.message);
        } else {
          showStatus('success', '2FA enabled successfully.');
        }
        setTwoFactorEnabled(true);
      } else if (twoFactorEnabled) {
        const disableResponse = await api.post('/api/two-factor/disable', { token: trimmedToken });
        showStatus('success', disableResponse.data?.message || '2FA disabled successfully.');
        setTwoFactorEnabled(false);
      } else {
        const enableResponse = await api.post('/api/two-factor/enable', {
          token: trimmedToken,
        });
        if (enableResponse.data?.message) {
          showStatus('success', enableResponse.data.message);
        } else {
          showStatus('success', '2FA enabled successfully.');
        }
        setTwoFactorEnabled(true);
      }
      setTwoFactorToken('');
      setActiveCard(null);
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update security settings.');
    } finally {
      setSecurityCardSaving(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = window.confirm('Deactivate your account? This can be restored only by support.');
    if (!confirmed) {
      return;
    }

    setDeactivating(true);
    try {
      await api.post('/api/settings/deactivate');
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('kingshall_user');
      navigate('/');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to deactivate your account.');
    } finally {
      setDeactivating(false);
    }
  };

  const uidStatus = useMemo(() => {
    if (uid.replace(/\D/g, '').slice(0, 5).length !== 5) {
      return 'UID must be exactly 5 digits.';
    }
    if (uidChecking) {
      return 'Checking UID availability...';
    }
    if (uidAvailable === true) {
      return 'UID is available.';
    }
    if (uidAvailable === false) {
      return 'UID is already in use.';
    }
    return 'Enter exactly 5 digits to check availability.';
  }, [uid, uidAvailable, uidChecking]);

  return (
    <div style={styles.page}>
      <Helmet>
        <title>Settings | KingsHall Exchange</title>
      </Helmet>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.panel}>
          <div style={styles.body}>
            {status.kind !== 'idle' ? (
              <NotificationBanner
                tone={status.kind === 'success' ? 'success' : 'error'}
                title={status.kind === 'success' ? 'Settings updated' : 'Check your details'}
                message={status.message}
              />
            ) : null}

            <div style={styles.grid}>
              <section style={styles.card}>
                <h2 style={styles.cardTitle}><LockKeyhole size={18} /> Change password</h2>
                <p style={styles.cardText}>{passwordRuleMessage}</p>
                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>Current password</span>
                    <input
                      style={currentPasswordFieldStyle}
                      type="password"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value);
                        setActiveCard('password');
                      }}
                      onFocus={() => setActiveCard('password')}
                    />
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>New password</span>
                    <input
                      style={styles.input}
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setActiveCard('password');
                      }}
                      onFocus={() => setActiveCard('password')}
                    />
                    <span style={styles.helper}>{passwordRuleMessage}</span>
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>Confirm new password</span>
                    <input
                      style={confirmPasswordFieldStyle}
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setActiveCard('password');
                      }}
                      onFocus={() => setActiveCard('password')}
                    />
                    {passwordMismatch ? <span style={{ ...styles.helper, color: '#fca5a5' }}>Passwords do not match.</span> : null}
                  </label>
                </div>
                {((activeCard === 'password' && passwordCanSave) || passwordCardSaving) ? (
                  <div style={styles.buttonRow}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSavePassword()} disabled={passwordCardSaving || !passwordCanSave}>
                      {passwordCardSaving ? 'Saving...' : 'Save password'}
                    </button>
                  </div>
                ) : null}
              </section>

              <section style={styles.card}>
                <h2 style={styles.cardTitle}><ShieldCheck size={18} /> Security controls</h2>
                <p style={styles.cardText}>Turn on extra account security now. You can set up an authenticator app and keep email recovery available as fallback.</p>
                <div style={styles.formGrid}>
                  {!twoFactorConfigured ? (
                    <>
                      <button type="button" style={{ ...styles.button, ...styles.primaryButton }} onClick={() => { setActiveCard('security'); void handleSetupTwoFactor(); }} disabled={twoFactorSetupLoading}>
                        {twoFactorSetupLoading ? 'Preparing 2FA setup...' : 'Setup 2FA'}
                      </button>
                      {twoFactorSetupMessage ? <span style={styles.helper}>{twoFactorSetupMessage}</span> : null}
                      {twoFactorQrUrl ? (
                        <div style={{ ...styles.field, gap: '10px', alignItems: 'center' }}>
                          <span style={styles.label}>QR code</span>
                          <img src={twoFactorQrUrl} alt="2FA QR code" style={{ width: '220px', height: '220px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#ffffff' }} />
                          <span style={styles.helper}>Scan this QR code with Google Authenticator, Authy, or another TOTP app.</span>
                        </div>
                      ) : null}
                      {twoFactorSecret ? (
                        <div style={{ ...styles.field, gap: '10px' }}>
                          <span style={styles.label}>Authenticator secret</span>
                          <code style={{ ...styles.input, display: 'block', paddingTop: '12px', minHeight: 'auto', wordBreak: 'break-all' }}>{twoFactorSecret}</code>
                          <span style={styles.helper}>Add this secret manually if you cannot scan the QR code.</span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <label style={styles.field}>
                        <span style={styles.label}>2FA status</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ ...styles.helper, color: twoFactorEnabled ? '#86efac' : '#fbbf24' }}>
                            {twoFactorEnabled ? '2FA is active' : '2FA is set up but currently disabled'}
                          </span>
                          <CheckCircle2 size={16} color={twoFactorEnabled ? '#86efac' : '#fbbf24'} />
                        </div>
                        <span style={styles.helper}>Enter your current authenticator code to toggle 2FA or delete it entirely.</span>
                      </label>
                      <label style={styles.field}>
                        <span style={styles.label}>2FA code</span>
                        <input
                          style={styles.input}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={twoFactorToken}
                          onChange={(event) => {
                            setTwoFactorToken(event.target.value.replace(/\D/g, '').slice(0, 8));
                            setActiveCard('security');
                          }}
                          onFocus={() => setActiveCard('security')}
                          placeholder="Enter current 2FA code"
                        />
                        <span style={styles.helper}>Use the current code from your authenticator app.</span>
                      </label>
                      <div style={styles.buttonRow}>
                        <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => { setActiveCard('security'); void handleSaveSecurity(); }} disabled={securityCardSaving || !securityCanSave}>
                          {securityCardSaving ? 'Saving...' : (twoFactorEnabled ? 'Turn 2FA off' : 'Turn 2FA on')}
                        </button>
                        <button style={{ ...styles.button, ...styles.dangerButton }} type="button" onClick={() => { setActiveCard('security'); void handleDeleteTwoFactor(); }} disabled={securityCardSaving || !twoFactorToken.trim()}>
                          Delete 2FA
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>


              <section style={styles.card}>
                <h2 style={styles.cardTitle}><WalletCards size={18} /> Withdrawal wallet</h2>
                <p style={styles.cardText}>Bind your TRC-20 wallet address now so withdrawals can be added later without changing your profile again.</p>
                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>TRC-20 wallet address</span>
                    <input
                      style={styles.input}
                      value={walletAddress}
                      onChange={(event) => {
                        const nextValue = event.target.value.trim();
                        setWalletAddress(nextValue);
                        setWalletValidation({
                          valid: trc20WalletPattern.test(nextValue),
                          message: trc20WalletPattern.test(nextValue)
                            ? 'TRC-20 wallet format looks valid.'
                            : 'Wallet address must be 34 characters, start with T, and use valid TRC-20 characters only.',
                        });
                        setActiveCard('wallet');
                      }}
                      onFocus={() => setActiveCard('wallet')}
                      inputMode="text"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    />
                    <span style={styles.helper}>{walletValidation.message}</span>
                  </label>
                </div>
                {((activeCard === 'wallet' && walletCanSave) || walletCardSaving) ? (
                  <div style={styles.buttonRow}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSaveWallet()} disabled={walletCardSaving || !walletCanSave}>
                      {walletCardSaving ? 'Saving...' : 'Save wallet'}
                    </button>
                  </div>
                ) : null}
              </section>

              <section style={styles.card}>
                <h2 style={styles.cardTitle}><CheckCircle2 size={18} /> UID settings</h2>
                <p style={styles.cardText}>Choose a unique 5-digit account UID. Digits only; validation runs live as you type so you can see availability right away.</p>
                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>UID</span>
                    <input
                      style={styles.input}
                      value={uid}
                      onChange={(event) => {
                        setUid(event.target.value.replace(/\D/g, '').slice(0, 5));
                        setUidAvailable(null);
                        setUidEditorActive(true);
                        setActiveCard('uid');
                      }}
                      onFocus={() => { setUidEditorActive(true); setActiveCard('uid'); }}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="Enter 5 digits"
                    />
                    <span style={styles.helper}>{uidStatus}</span>
                  </label>
                </div>
              </section>
            </div>

            <section style={styles.card}>
              <h2 style={styles.cardTitle}><Trash2 size={18} /> Account deactivation</h2>
              <p style={styles.cardText}>Deactivate your account if you no longer want to use KingsHall Exchange. This action can remove access immediately.</p>
              <div style={styles.buttonRow}>
                <button style={{ ...styles.button, ...styles.dangerButton }} type="button" onClick={() => void handleDeactivate()} disabled={deactivating}>
                  {deactivating ? 'Deactivating...' : 'Deactivate account'}
                </button>
              </div>
            </section>

          </div>
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default SettingsPage;
