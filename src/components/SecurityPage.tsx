import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, KeyRound, Smartphone, Fingerprint, Laptop2, LockKeyhole, Globe } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

type SecurityDevice = {
  id?: string;
  name?: string;
  ip?: string;
  location?: string;
  lastActiveAt?: string;
  status?: string;
};

type SecurityLogin = {
  id?: string;
  device?: string;
  ip?: string;
  location?: string;
  createdAt?: string;
  success?: boolean;
};

type SecurityMeResponse = {
  user?: {
    uid?: string;
    securityCodeSet?: boolean;
    twoFactorEnabled?: boolean;
    biometricEnabled?: boolean;
    hardwareKeyEnabled?: boolean;
  };
  devices?: SecurityDevice[];
  logins?: SecurityLogin[];
};

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const styles = {
  page: {
    minHeight: '100vh',
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
  content: {
    display: 'grid',
    gap: '18px',
    marginTop: '18px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: HYBRID_THEME_TOKENS.dark.text,
  },
  sectionText: {
    margin: '8px 0 0',
    fontSize: '0.92rem',
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    lineHeight: 1.7,
    maxWidth: '64ch',
  },
  block: {
    display: 'grid',
    gap: '12px',
    paddingTop: '8px',
  },
  rowList: {
    display: 'grid',
    gap: '10px',
  },
  row: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    padding: '16px',
    display: 'grid',
    gap: '6px',
    textAlign: 'left' as const,
  },
  rowLabel: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  rowValue: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.text,
    fontSize: '1rem',
    fontWeight: 800,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
  note: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    fontSize: '0.9rem',
    lineHeight: 1.7,
  },
  control: {
    display: 'grid',
    gap: '10px',
    marginTop: '8px',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
  },
  card: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
  },
  '@media (max-width: 640px)': {
    page: { paddingBottom: '156px' },
    shell: { maxWidth: '100%', padding: '14px 12px 24px' },
    content: { gap: '14px', marginTop: '14px' },
    card: { padding: '16px', borderRadius: '18px' },
    rowList: { gap: '12px' },
    row: { padding: '14px', borderRadius: '16px' },
    control: { gridTemplateColumns: 'minmax(0, 1fr)', gap: '8px' },
    button: { width: '100%' },
    input: { width: '100%' },
    sectionTitle: { fontSize: '1.15rem' },
    sectionText: { maxWidth: '100%' },
  },
  input: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.14)',
    background: 'transparent',
    color: HYBRID_THEME_TOKENS.dark.text,
    padding: '12px 0',
    outline: 'none',
    fontSize: '1rem',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  button: {
    border: 'none',
    background: 'transparent',
    color: HYBRID_THEME_TOKENS.dark.text,
    padding: '0',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: '0.98rem',
  },
  mutedButton: {
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    fontWeight: 700,
  },
  status: {
    margin: '8px 0 0',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
  },
};

const SecurityPage = () => {
  const [uid, setUid] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentSecurityPassword, setCurrentSecurityPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [confirmSecurityCode, setConfirmSecurityCode] = useState('');
  const [status, setStatus] = useState<{ kind: SaveState; text: string }>({ kind: 'idle', text: '' });
  const [devices, setDevices] = useState<SecurityDevice[]>([]);
  const [logins, setLogins] = useState<SecurityLogin[]>([]);
  const [securityCodeSet, setSecurityCodeSet] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hardwareKeyEnabled, setHardwareKeyEnabled] = useState(false);
  const [savingUid, setSavingUid] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSecurityCode, setSavingSecurityCode] = useState(false);
  const [saving2fa, setSaving2fa] = useState(false);
  const [savingSecurityQuestion, setSavingSecurityQuestion] = useState(false);
  const [savingBiometric, setSavingBiometric] = useState(false);
  const [savingHardware, setSavingHardware] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<SecurityMeResponse>('/api/settings/me');
        setUid(data.user?.uid ?? '');
        setSecurityCodeSet(Boolean(data.user?.securityCodeSet));
        setTwoFactorEnabled(Boolean(data.user?.twoFactorEnabled));
        setBiometricEnabled(Boolean(data.user?.biometricEnabled));
        setHardwareKeyEnabled(Boolean(data.user?.hardwareKeyEnabled));
        setDevices(data.devices ?? []);
        setLogins(data.logins ?? []);
      } catch {
        setStatus({ kind: 'error', text: 'Unable to load security details right now.' });
      }
    };
    void load();
  }, []);

  const currentLoginCount = useMemo(() => devices.length, [devices.length]);

  const showStatus = (kind: SaveState, text: string) => setStatus({ kind, text });

  const handleUidSave = async () => {
    if (!uid.trim()) return showStatus('error', 'Enter a UID to continue.');
    setSavingUid(true);
    try {
      await api.patch('/api/settings/uid', { uid: uid.trim() });
      showStatus('success', 'UID updated successfully.');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update UID.');
    } finally {
      setSavingUid(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return showStatus('error', 'Enter your current password, new password, and confirmation.');
    }

    if (newPassword !== confirmPassword) {
      return showStatus('error', 'New password and confirmation must match.');
    }

    setSavingPassword(true);
    try {
      await api.patch('/api/settings/password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      showStatus('success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSecurityCodeSave = async () => {
    if (!currentSecurityPassword.trim()) {
      return showStatus('error', 'Enter your current password to update the security code.');
    }

    if (securityCode.length !== 6 || securityCode !== confirmSecurityCode) {
      return showStatus('error', 'Security code must be 6 digits and match confirmation.');
    }

    setSavingSecurityCode(true);
    try {
      await api.patch('/api/withdrawals/security-code', {
        currentPassword: currentSecurityPassword.trim(),
        securityCode,
      });
      setSecurityCodeSet(true);
      setCurrentSecurityPassword('');
      setSecurityCode('');
      setConfirmSecurityCode('');
      showStatus('success', 'Security code updated successfully.');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update security code.');
    } finally {
      setSavingSecurityCode(false);
    }
  };

  const handleToggle2fa = async () => {
    setSaving2fa(true);
    try {
      showStatus('success', '2FA setup will be added in the backend next.');
    } finally {
      setSaving2fa(false);
    }
  };

  const handleToggleBiometric = async () => {
    setSavingBiometric(true);
    try {
      showStatus('success', 'Biometric security will be wired to the backend next.');
    } finally {
      setSavingBiometric(false);
    }
  };

  const handleToggleHardware = async () => {
    setSavingHardware(true);
    try {
      showStatus('success', 'Hardware security will be wired to the backend next.');
    } finally {
      setSavingHardware(false);
    }
  };

  const handleSecurityQuestionSave = async () => {
    setSavingSecurityQuestion(true);
    try {
      await api.patch('/api/settings/security-question', {});
      showStatus('success', 'Security question updated successfully.');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update security question.');
    } finally {
      setSavingSecurityQuestion(false);
    }
  };

  return (
    <HybridTheme mode="dark">
      <div style={styles.page}>
        <div style={styles.shell}>
          <Helmet>
            <title>KingsHall Exchange | Security</title>
          </Helmet>
          <AppHeader />
          <div style={styles.content}>
            <section style={styles.card}>
              <h1 style={styles.sectionTitle}>Security</h1>
              <p style={styles.sectionText}>Manage identity, sign-in protection, device access, and future security tooling from one flat, direct page.</p>
            </section>

            <div style={styles.rowList}>
              <div style={styles.row}>
                <p style={styles.rowLabel}><ShieldCheck size={16} /> UID</p>
                <p style={styles.rowValue}>{uid || 'Not set yet'}</p>
                <div style={styles.control}>
                  <input style={styles.input} value={uid} onChange={(event) => setUid(event.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="Edit UID" inputMode="numeric" maxLength={5} />
                  <button type="button" style={styles.button} onClick={() => void handleUidSave()} disabled={savingUid}>{savingUid ? 'Saving...' : 'Save UID'}</button>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><Smartphone size={16} /> Devices logged in</p>
                <p style={styles.rowValue}>{currentLoginCount} active device{currentLoginCount === 1 ? '' : 's'}</p>
                <div style={styles.control}>
                  {devices.map((device, index) => (
                    <div key={device.id ?? `${device.name ?? 'device'}-${index}`} style={styles.row}>
                      <p style={styles.rowLabel}><Laptop2 size={14} /> {device.name || 'Device'}</p>
                      <p style={styles.rowValue}>{device.ip || 'IP not available'} {device.location ? `• ${device.location}` : ''}</p>
                      <p style={styles.note}>{device.lastActiveAt ? `Last active ${device.lastActiveAt}` : 'Last activity unavailable'}{device.status ? ` • ${device.status}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><Globe size={16} /> Recent logins</p>
                <div style={styles.control}>
                  {logins.map((login, index) => (
                    <div key={login.id ?? `${login.device ?? 'login'}-${index}`} style={styles.row}>
                      <p style={styles.rowValue}>{login.device || 'Unknown device'} • {login.ip || 'IP not available'}</p>
                      <p style={styles.note}>{login.location || 'Location unavailable'}{login.createdAt ? ` • ${login.createdAt}` : ''} • {login.success ? 'Success' : 'Review needed'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><KeyRound size={16} /> Password</p>
                <p style={styles.rowValue}>Change your account password</p>
                <div style={styles.control}>
                  <input style={styles.input} type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" />
                  <input style={styles.input} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" />
                  <input style={styles.input} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" />
                  <button type="button" style={styles.button} onClick={() => void handlePasswordSave()} disabled={savingPassword}>{savingPassword ? 'Saving...' : 'Change password'}</button>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><LockKeyhole size={16} /> Security code</p>
                <p style={styles.rowValue}>{securityCodeSet ? 'Security code is active' : 'Security code not set yet'}</p>
                <div style={styles.control}>
                  <input style={styles.input} type="password" value={currentSecurityPassword} onChange={(event) => setCurrentSecurityPassword(event.target.value)} placeholder="Current password" />
                  <input style={styles.input} type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit security code" />
                  <input style={styles.input} type="password" value={confirmSecurityCode} onChange={(event) => setConfirmSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Confirm security code" />
                  <button type="button" style={styles.button} onClick={() => void handleSecurityCodeSave()} disabled={savingSecurityCode}>{savingSecurityCode ? 'Saving...' : 'Save security code'}</button>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><ShieldCheck size={16} /> 2FA</p>
                <p style={styles.rowValue}>{twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled'}</p>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.button} onClick={() => void handleToggle2fa()} disabled={saving2fa}>{saving2fa ? 'Updating...' : twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}</button>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><Fingerprint size={16} /> Biometric</p>
                <p style={styles.rowValue}>{biometricEnabled ? 'Biometric security enabled' : 'Biometric security disabled'}</p>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.button} onClick={() => void handleToggleBiometric()} disabled={savingBiometric}>{savingBiometric ? 'Updating...' : biometricEnabled ? 'Disable biometric' : 'Enable biometric'}</button>
                </div>
              </div>

              <div style={styles.row}>
                <p style={styles.rowLabel}><Laptop2 size={16} /> Hardware security</p>
                <p style={styles.rowValue}>{hardwareKeyEnabled ? 'Hardware security enabled' : 'Hardware security disabled'}</p>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.button} onClick={() => void handleToggleHardware()} disabled={savingHardware}>{savingHardware ? 'Updating...' : hardwareKeyEnabled ? 'Disable hardware security' : 'Enable hardware security'}</button>
                </div>
              </div>
            </div>

            {status.text ? <p style={styles.status}>{status.text}</p> : null}
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default SecurityPage;
