import React, { useEffect, useMemo, useRef, useState } from 'react';

const EDGE_LIGHT_COLOR_OPTIONS = [
  { key: 'blue', label: 'Blue', value: 'rgba(56, 189, 248, 0.9)' },
  { key: 'purple', label: 'Purple', value: 'rgba(168, 85, 247, 0.9)' },
  { key: 'pink', label: 'Pink', value: 'rgba(236, 72, 153, 0.9)' },
  { key: 'green', label: 'Green', value: 'rgba(34, 197, 94, 0.9)' },
  { key: 'amber', label: 'Amber', value: 'rgba(245, 158, 11, 0.9)' },
  { key: 'red', label: 'Red', value: 'rgba(239, 68, 68, 0.9)' },
] as const;

type EdgeLightColorKey = typeof EDGE_LIGHT_COLOR_OPTIONS[number]['key'];

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, LockKeyhole, RotateCcw, ShieldCheck, Trash2, Upload, WalletCards, Landmark, UserCircle2 } from 'lucide-react';
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
    profilePicture?: string;
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
  toggleRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px',
  },
  togglePill: {
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '10px 14px',
    fontWeight: 700,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.06)',
    cursor: 'pointer',
  },
  togglePillActive: {
    background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
    border: 'none',
  },
  colorSwatches: {
    display: 'flex',
    flexWrap: 'nowrap' as const,
    gap: '10px',
    marginTop: '12px',
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  colorSwatch: {
    width: '38px',
    height: '38px',
    borderRadius: '999px',
    border: '2px solid rgba(255,255,255,0.14)',
    cursor: 'pointer',
  },
  colorSwatchActive: {
    boxShadow: '0 0 0 3px rgba(255,255,255,0.18)',
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
  const [securityCodeCardSaving, setSecurityCodeCardSaving] = useState(false);
  const [activeCard, setActiveCard] = useState<'password' | 'wallet' | 'uid' | 'securityCode' | null>(null);
  const [initialUid, setInitialUid] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodeConfirm, setSecurityCodeConfirm] = useState('');
  const [currentSecurityPassword, setCurrentSecurityPassword] = useState('');
  const [walletValidation, setWalletValidation] = useState<WalletValidationState>({ valid: false, message: 'Enter a valid TRC-20 wallet address.' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<StatusState>({ kind: 'idle', message: '' });
  const [deactivating, setDeactivating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [edgeLightEnabled, setEdgeLightEnabled] = useState(false);
  const [edgeLightColor, setEdgeLightColor] = useState<EdgeLightColorKey>('blue');
  const [edgeLightSavedEnabled, setEdgeLightSavedEnabled] = useState(false);
  const [edgeLightSavedColor, setEdgeLightSavedColor] = useState<EdgeLightColorKey>('blue');
  const [edgeLightCardSaving, setEdgeLightCardSaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(EDGE_LIGHT_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as { enabled?: boolean; color?: EdgeLightColorKey };
      const nextEnabled = Boolean(parsed.enabled);
      const nextColor = parsed.color && EDGE_LIGHT_COLOR_OPTIONS.some((option) => option.key === parsed.color)
        ? parsed.color
        : 'blue';
      setEdgeLightEnabled(nextEnabled);
      setEdgeLightColor(nextColor);
      setEdgeLightSavedEnabled(nextEnabled);
      setEdgeLightSavedColor(nextColor);
    } catch {
      // Ignore invalid localStorage data and keep defaults.
    }
  }, []);

  const uidDigits = uid.replace(/\D/g, '').slice(0, 5);
  const uidReadyToSave = Boolean(uidEditorActive && uidDigits.length === 5 && uidAvailable !== false && uidDigits !== initialUid);
  const showUidSaveButton = Boolean(activeCard === 'uid' && uidReadyToSave) || uidCardSaving;

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/auth/me');
        const user = data.user;
        console.log('[SettingsPage] /api/auth/me response user:', JSON.stringify(user));
        console.log('[SettingsPage] profilePicture from response:', JSON.stringify(user?.profilePicture));
        const loadedUid = (user?.uid ?? '').replace(/\D/g, '').slice(0, 5);
        setUid(loadedUid);
        setInitialUid(loadedUid);
        setActiveCard(null);
        setWalletAddress(user?.walletAddress ?? '');
        setWalletValidation({ valid: Boolean(user?.walletAddress && trc20WalletPattern.test(user.walletAddress)), message: user?.walletAddress && trc20WalletPattern.test(user.walletAddress) ? 'TRC-20 wallet format looks valid.' : 'Enter a valid TRC-20 wallet address.' });
        console.log('[SettingsPage] setting avatarPreview to:', JSON.stringify(user?.profilePicture ?? null));
        setAvatarPreview(user?.profilePicture ?? null);

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

  const securityCodeValid = securityCode.trim().replace(/\D/g, '').length === 6 && securityCode === securityCodeConfirm;
  const showStatus = (kind: StatusState['kind'], message: string) => {
    setStatus({ kind, message });
  };

  const clearActiveIfMatches = (card: typeof activeCard) => {
    setActiveCard((current) => (current === card ? null : current));
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



  const persistEdgeLight = (enabled: boolean, color: EdgeLightColorKey) => {
    window.localStorage.setItem(
      EDGE_LIGHT_STORAGE_KEY,
      JSON.stringify({ enabled, color }),
    );
    window.dispatchEvent(new Event('nowbar-edge-light-changed'));
    setEdgeLightSavedEnabled(enabled);
    setEdgeLightSavedColor(color);
  };

  const handleToggleEdgeLight = () => {
    setEdgeLightEnabled((current) => {
      const nextEnabled = !current;
      persistEdgeLight(nextEnabled, edgeLightColor);
      showStatus('success', nextEnabled ? 'NowBar edge lighting turned on.' : 'NowBar edge lighting turned off.');
      return nextEnabled;
    });
  };

  const handleSetEdgeLightColor = (nextColor: EdgeLightColorKey) => {
    setEdgeLightColor(nextColor);
    persistEdgeLight(edgeLightEnabled, nextColor);
    showStatus('success', 'NowBar edge lighting color updated.');
  };

  const handleSaveEdgeLight = () => {
    setEdgeLightCardSaving(true);
    try {
      persistEdgeLight(edgeLightEnabled, edgeLightColor);
      showStatus('success', 'NowBar edge lighting updated.');
    } finally {
      setEdgeLightCardSaving(false);
    }
  };

  const handleSaveSecurityCode = async () => {
    if (!currentPassword) {
      showStatus('error', 'Enter your current password to update your security code.');
      return;
    }

    if (!securityCodeValid) {
      showStatus('error', 'Security code must be 6 digits and match confirmation.');
      return;
    }

    setSecurityCodeCardSaving(true);
    try {
      await api.patch('/api/withdrawals/security-code', {
        currentPassword,
        securityCode,
      });
      showStatus('success', 'Security code updated successfully.');
      setCurrentSecurityPassword('');
      setSecurityCode('');
      setSecurityCodeConfirm('');
      setActiveCard(null);
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || 'Unable to update security code.');
    } finally {
      setSecurityCodeCardSaving(false);
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

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please choose an image file.');
      return;
    }

    setAvatarUploading(true);

    try {
      const authResponse = await api.get('/api/cloudinary/upload');
      const auth = authResponse.data as { cloudName?: string; uploadPreset?: string };

      if (!auth.cloudName || !auth.uploadPreset) {
        throw new Error('Unable to prepare image upload.');
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('upload_preset', auth.uploadPreset);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${auth.cloudName}/image/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Unable to upload profile picture.');
      }

      const uploadedFile = await uploadResponse.json() as { secure_url?: string };
      if (!uploadedFile.secure_url) {
        throw new Error('Image upload did not return a usable URL.');
      }

      await api.patch('/api/settings/profile-picture', {
        profilePicture: uploadedFile.secure_url,
      });

      setAvatarPreview(uploadedFile.secure_url);
      showStatus('success', 'Portfolio picture updated.');
    } catch (error) {
      console.error('[SettingsPage] avatar upload failed:', error);
      showStatus('error', error instanceof Error ? error.message : 'Unable to upload image.');
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const avatarDisplayStyle = {
    position: 'relative' as const,
    width: 'min(72vw, 360px)',
    maxWidth: '100%',
    aspectRatio: '1 / 1',
    borderRadius: '18px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
  };

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

            <section style={styles.card}>
              <h2 style={styles.cardTitle}><UserCircle2 size={18} /> Portfolio picture</h2>
              <p style={styles.cardText}>Choose a photo and upload it directly as-is.</p>
              <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ ...avatarDisplayStyle, width: '96px', height: '96px', flex: '0 0 auto' }}>
                    {avatarPreview ? (
                      <div style={{ position: 'absolute', inset: 0, background: `url(${avatarPreview}) center/cover no-repeat` }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 30% 20%, rgba(125,211,252,0.26), rgba(14,18,33,1) 58%)' }}>
                        <UserCircle2 size={42} />
                      </div>
                    )}
                  </div>
                  <label style={{ ...styles.button, ...styles.primaryButton, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={16} />
                    <span>{avatarUploading ? 'Uploading...' : 'Choose photo'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </section>

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
                <h2 style={styles.cardTitle}>⚡ NowBar edge lighting</h2>
                <p style={styles.cardText}>Turn on a glowing edge around the NowBar and choose a color.</p>
                <div style={styles.toggleRow}>
                  <button
                    type="button"
                    style={{ ...styles.togglePill, ...(edgeLightEnabled ? styles.togglePillActive : {}) }}
                    onClick={handleToggleEdgeLight}
                  >
                    {edgeLightEnabled ? 'On' : 'Off'}
                  </button>
                </div>
                <div style={styles.colorSwatches}>
                  {EDGE_LIGHT_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-label={`${option.label} edge light`}
                      title={option.label}
                      onClick={() => handleSetEdgeLightColor(option.key)}
                      style={{
                        ...styles.colorSwatch,
                        background: option.value,
                        ...(edgeLightColor === option.key ? styles.colorSwatchActive : {}),
                      }}
                    />
                  ))}
                </div>
                {((edgeLightEnabled !== edgeLightSavedEnabled || edgeLightColor !== edgeLightSavedColor) || edgeLightCardSaving) ? (
                  <div style={styles.buttonRow}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={handleSaveEdgeLight} disabled={edgeLightCardSaving}>
                      {edgeLightCardSaving ? 'Saving...' : 'Save edge lighting'}
                    </button>
                  </div>
                ) : null}
              </section>

              <section style={styles.card}>
                <h2 style={styles.cardTitle}><WalletCards size={18} /> Withdrawal wallet</h2>
                <p style={styles.cardText}>Bind your TRC-20 wallet address now so withdrawals can be added later without changing your portfolio again.</p>
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
                <h2 style={styles.cardTitle}><ShieldCheck size={18} /> Security code</h2>
                <p style={styles.cardText}>Set or change a withdrawal security code. Changing it requires your password.</p>
                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>Current password</span>
                    <input style={styles.input} type="password" value={currentSecurityPassword} onChange={(event) => { setCurrentSecurityPassword(event.target.value); setActiveCard('securityCode'); }} onFocus={() => setActiveCard('securityCode')} />
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>Security code</span>
                    <input style={styles.input} type="password" value={securityCode} onChange={(event) => { setSecurityCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setActiveCard('securityCode'); }} onFocus={() => setActiveCard('securityCode')} placeholder="6 digits" />
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>Confirm security code</span>
                    <input style={styles.input} type="password" value={securityCodeConfirm} onChange={(event) => { setSecurityCodeConfirm(event.target.value.replace(/\D/g, '').slice(0, 6)); setActiveCard('securityCode'); }} onFocus={() => setActiveCard('securityCode')} placeholder="Repeat 6 digits" />
                  </label>
                </div>
                {((activeCard === 'securityCode' && securityCodeValid) || securityCodeCardSaving) ? (
                  <div style={styles.buttonRow}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSaveSecurityCode()} disabled={securityCodeCardSaving || !securityCodeValid}>
                      {securityCodeCardSaving ? 'Saving...' : 'Save security code'}
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
                {showUidSaveButton ? (
                  <div style={styles.buttonRow}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={() => void handleSaveUid()} disabled={uidCardSaving || !uidReadyToSave}>
                      {uidCardSaving ? 'Saving...' : 'Save UID'}
                    </button>
                  </div>
                ) : null}
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
