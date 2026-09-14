import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LockKeyhole, ShieldCheck, Trash2, WalletCards } from 'lucide-react';
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
    twoFactorBackupCodes?: string[];
  };
};

type StatusState = {
  kind: 'idle' | 'success' | 'error';
  message: string;
};

const passwordRuleMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.';

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
  const [uidChecking, setUidChecking] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupMessage, setTwoFactorSetupMessage] = useState('');
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false);
  const [twoFactorQrUrl, setTwoFactorQrUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<StatusState>({ kind: 'idle', message: '' });
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/auth/me');
        const user = data.user;
        setUid(user?.uid ?? '');
        setWalletAddress(user?.walletAddress ?? '');
        setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
        setTwoFactorSecret(user?.twoFactorSecret ?? '');
        setTwoFactorBackupCodes(Array.isArray(user?.twoFactorBackupCodes) ? (user?.twoFactorBackupCodes ?? []) : []);
      } catch {
        navigate('/signin');
      }
    };

    void loadAccount();
  }, []);

  useEffect(() => {
    const trimmedUid = uid.trim();

    if (trimmedUid.length < 3) {
      setUidAvailable(null);
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

  const showStatus = (kind: StatusState['kind'], message: string) => {
    setStatus({ kind, message });
  };

  const handleSetupTwoFactor = async () => {
    setTwoFactorSetupMessage('');
    setTwoFactorSetupLoading(true);

    try {
      const { data } = await api.post('/api/two-factor/setup');
      setTwoFactorSecret(data?.secret ?? '');
      setTwoFactorQrUrl(data?.otpauthUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.otpauthUrl)}` : '');
      setTwoFactorBackupCodes(Array.isArray(data?.backupCodes) ? data.backupCodes : []);
      setTwoFactorSetupMessage('Scan the QR code in your authenticator app, then save your account settings to enable 2FA.');
      setTwoFactorEnabled(true);
      showStatus('success', '2FA setup created. Complete setup before leaving this page.');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to create 2FA setup right now.');
    } finally {
      setTwoFactorSetupLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPassword) {
      showStatus('error', 'Enter your current password to save settings.');
      return;
    }

    if (newPassword && !passwordValid) {
      showStatus('error', passwordRuleMessage);
      return;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword || newPassword !== confirmPassword) {
        showStatus('error', 'New password and confirmation must match.');
        return;
      }
    }

    if (uid.trim().length < 3) {
      showStatus('error', 'UID must be at least 3 characters long.');
      return;
    }

    if (uidAvailable === false) {
      showStatus('error', 'That UID is already taken.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/settings/account', {
        uid: uid.trim(),
        walletAddress: walletAddress.trim(),
        twoFactorEnabled,
        currentPassword,
        newPassword: newPassword.trim() ? newPassword : undefined,
      });
      if (twoFactorEnabled && twoFactorSecret) {
        const enableResponse = await api.post('/api/two-factor/enable', { token: '', backupCode: twoFactorBackupCodes[0] });
        if (enableResponse.data?.message) {
          showStatus('success', enableResponse.data.message);
        }
      } else if (!twoFactorEnabled) {
        await api.post('/api/two-factor/disable');
      }
      showStatus('success', 'Settings updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
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
    if (uid.trim().length < 3) {
      return 'UID must be at least 3 characters.';
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
    return 'Enter a new UID to check availability.';
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
                    <input style={styles.input} type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>New password</span>
                    <input style={styles.input} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                    <span style={styles.helper}>{passwordRuleMessage}</span>
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>Confirm new password</span>
                    <input style={styles.input} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                    {passwordMismatch ? <span style={{ ...styles.helper, color: '#fca5a5' }}>Passwords do not match.</span> : null}
                  </label>
                </div>
              </section>

              <section style={styles.card}>
                <h2 style={styles.cardTitle}><ShieldCheck size={18} /> Security controls</h2>
                <p style={styles.cardText}>Turn on extra account security now. You can set up an authenticator app and keep email recovery available as fallback.</p>
                <div style={styles.formGrid}>
                  <label style={{ ...styles.field, alignItems: 'start' }}>
                    <span style={styles.label}>2FA protection</span>
                    <input type="checkbox" checked={twoFactorEnabled} onChange={(event) => setTwoFactorEnabled(event.target.checked)} />
                    <span style={styles.helper}>Enable to require an additional verification step on future sign-ins.</span>
                  </label>
                  <button type="button" style={{ ...styles.button, ...styles.primaryButton }} onClick={() => void handleSetupTwoFactor()} disabled={twoFactorSetupLoading}>
                    {twoFactorSetupLoading ? 'Preparing 2FA setup...' : 'Set up authenticator app'}
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
                  {twoFactorBackupCodes.length > 0 ? (
                    <div style={{ ...styles.field, gap: '10px' }}>
                      <span style={styles.label}>Backup codes</span>
                      <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                        {twoFactorBackupCodes.map((code) => (
                          <code key={code} style={{ ...styles.input, display: 'block', paddingTop: '12px', minHeight: 'auto', textAlign: 'center' }}>{code}</code>
                        ))}
                      </div>
                      <span style={styles.helper}>Store these codes safely. They are fallback access if you lose your authenticator app.</span>
                    </div>
                  ) : null}
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
                      onChange={(event) => setWalletAddress(event.target.value)}
                      placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    />
                    <span style={styles.helper}>Use the wallet address that will receive future TRC-20 withdrawals.</span>
                  </label>
                </div>
              </section>

              <section style={styles.card}>
                <h2 style={styles.cardTitle}><CheckCircle2 size={18} /> UID settings</h2>
                <p style={styles.cardText}>Choose a unique account UID. Validation runs live as you type so you can see availability right away.</p>
                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>UID</span>
                    <input style={styles.input} value={uid} onChange={(event) => setUid(event.target.value)} />
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

            <div style={styles.buttonRow}>
              <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSave()} disabled={saving || uidChecking}>
                {saving ? 'Saving...' : 'Save settings'}
              </button>
              <button style={styles.button} type="button" onClick={() => navigate('/dashboard')}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default SettingsPage;
