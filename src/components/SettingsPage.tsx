import React, { useEffect, useRef, useState } from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS, type HybridThemeMode } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { getFriendlyErrorMessage } from '../utils/errorMessage';

const EDGE_LIGHT_COLOR_OPTIONS = [
  { key: 'blue', label: 'Blue', value: '#38bdf8' },
  { key: 'purple', label: 'Purple', value: '#a855f7' },
  { key: 'pink', label: 'Pink', value: '#ec4899' },
  { key: 'green', label: 'Green', value: '#22c55e' },
  { key: 'amber', label: 'Amber', value: '#f59e0b' },
  { key: 'red', label: 'Red', value: '#ef4444' },
] as const;

type EdgeLightColorKey = typeof EDGE_LIGHT_COLOR_OPTIONS[number]['key'];
type EdgeLightMode = 'stable-light' | 'stable' | 'blink-light' | 'blink' | 'pulse-light' | 'pulse' | 'sweep-light' | 'sweep' | 'color-light' | 'color';

const EDGE_LIGHT_MODES: Array<{ key: EdgeLightMode; label: string }> = [
  { key: 'stable-light', label: 'Stable Light' },
  { key: 'stable', label: 'Stable glow' },
  { key: 'blink-light', label: 'Blinking Light' },
  { key: 'blink', label: 'Blinking glow' },
  { key: 'pulse-light', label: 'Breathing Light' },
  { key: 'pulse', label: 'Breathing glow' },
  { key: 'sweep-light', label: 'Moving Light' },
  { key: 'sweep', label: 'Moving glow' },
  { key: 'color-light', label: 'Changing Light' },
  { key: 'color', label: 'Changing glow' },
];

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
import { Helmet } from 'react-helmet-async';
import { RotateCcw, Upload, WalletCards, Landmark, UserCircle2 } from 'lucide-react';
import api from '../api/axios';
import NotificationBanner from './NotificationBanner';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
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


type SettingsStatusSection = 'profile' | 'theme' | 'edgeLight' | 'wallet';

type StatusState = {
  kind: 'idle' | 'success' | 'error';
  message: string;
  section: SettingsStatusSection;
};

type WalletValidationState = {
  valid: boolean;
  message: string;
};

const trc20WalletPattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(14px, 3vw, 28px) clamp(8px, 1.5vw, 16px) 40px',
    boxSizing: 'border-box' as const,
  },
  panel: {
    display: 'grid',
    gap: '16px',
    width: '100%',
  },
  body: {
    padding: 'clamp(0px, 2vw, 30px) 0 0',
    display: 'grid',
    gap: '16px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '18px',
  } as const,
  card: {
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
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
    color: theme.textMuted,
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
    color: theme.text,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '14px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
    color: theme.text,
    padding: '13px 14px',
    outline: 'none',
  },
  helper: {
    fontSize: '0.85rem',
    color: theme.textMuted,
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
    border: `1px solid ${theme.borderGlass}`,
    padding: '12px 16px',
    fontWeight: 700,
    color: theme.text,
    background: theme.surfaceMuted,
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
    border: `1px solid ${theme.borderGlass}`,
    padding: '10px 14px',
    fontWeight: 700,
    color: theme.text,
    background: theme.surfaceMuted,
    cursor: 'pointer',
  },
  togglePillActive: {
    background: theme.primary,
    color: theme.textInverse,
    border: `1px solid ${theme.primary}`,
  },
  primaryButton: {
    background: theme.primary,
    color: theme.textInverse,
    border: `1px solid ${theme.primary}`,
  },
  dangerButton: {
    background: theme.danger,
    color: theme.textInverse,
    border: `1px solid ${theme.danger}`,
  },
});

const SettingsPage = () => {
  const [accountLoading, setAccountLoading] = useState(true);
  const [walletCardSaving, setWalletCardSaving] = useState(false);
  const [activeCard, setActiveCard] = useState<'wallet' | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletValidation, setWalletValidation] = useState<WalletValidationState>({ valid: false, message: 'Enter a valid TRC-20 wallet address.' });
  const [status, setStatus] = useState<StatusState>({ kind: 'idle', message: '', section: 'profile' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { themeMode, setThemeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [edgeLightEnabled, setEdgeLightEnabled] = useState(false);
  const [edgeLightColor, setEdgeLightColor] = useState('#38bdf8');
  const [edgeLightMode, setEdgeLightMode] = useState<EdgeLightMode>('stable');
  const [edgeLightSavedEnabled, setEdgeLightSavedEnabled] = useState(false);
  const [edgeLightSavedColor, setEdgeLightSavedColor] = useState('#38bdf8');
  const [edgeLightSavedMode, setEdgeLightSavedMode] = useState<EdgeLightMode>('stable');
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

      const parsed = JSON.parse(raw) as { enabled?: boolean; color?: string | EdgeLightColorKey; mode?: EdgeLightMode };
      const legacyOption = EDGE_LIGHT_COLOR_OPTIONS.find((option) => option.key === parsed.color);
      const legacyColor = legacyOption?.value ?? parsed.color;
      const nextEnabled = Boolean(parsed.enabled);
      const nextColor = typeof legacyColor === 'string' && /^#[0-9a-f]{6}$/i.test(legacyColor) ? legacyColor : '#38bdf8';
      const nextMode = parsed.mode && EDGE_LIGHT_MODES.some((option) => option.key === parsed.mode) ? parsed.mode : 'stable';
      setEdgeLightEnabled(nextEnabled);
      setEdgeLightColor(nextColor);
      setEdgeLightMode(nextMode);
      setEdgeLightSavedEnabled(nextEnabled);
      setEdgeLightSavedColor(nextColor);
      setEdgeLightSavedMode(nextMode);

    } catch {
      // Ignore invalid localStorage data and keep defaults.
    }
  }, []);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/auth/me');
        const user = data.user;
        console.log('[SettingsPage] /api/auth/me response user:', JSON.stringify(user));
        console.log('[SettingsPage] profilePicture from response:', JSON.stringify(user?.profilePicture));
        setActiveCard(null);
        setWalletAddress(user?.walletAddress ?? '');
        setWalletValidation({ valid: Boolean(user?.walletAddress && trc20WalletPattern.test(user.walletAddress)), message: user?.walletAddress && trc20WalletPattern.test(user.walletAddress) ? 'TRC-20 wallet format looks valid.' : 'Enter a valid TRC-20 wallet address.' });
        console.log('[SettingsPage] setting avatarPreview to:', JSON.stringify(user?.profilePicture ?? null));
        setAvatarPreview(user?.profilePicture ?? null);

      } catch {
        navigate('/signin');
      } finally {
        setAccountLoading(false);
      }
    };

    void loadAccount();
  }, []);

  const walletAddressChanged = walletAddress.trim() !== '';
  const walletCanSave = walletAddressChanged && walletValidation.valid;

  const showStatus = (kind: StatusState['kind'], message: string, section: SettingsStatusSection) => {
    setStatus({ kind, message, section });
  };

  const renderStatus = (section: SettingsStatusSection) => status.kind !== 'idle' && status.section === section ? (
    <NotificationBanner
      tone={status.kind === 'success' ? 'success' : 'error'}
      title={status.kind === 'success' ? 'Settings updated' : 'Check your details'}
      message={status.message}
    />
  ) : null;

  const handleSaveWallet = async () => {
    const trimmedWallet = walletAddress.trim();

    if (!trc20WalletPattern.test(trimmedWallet)) {
      setWalletValidation({ valid: false, message: 'Wallet address must be a valid TRC-20 address starting with T.' });
      showStatus('error', 'Enter a valid TRC-20 wallet address before saving.', 'wallet');
      return;
    }

    setWalletCardSaving(true);
    try {
      await api.patch('/api/settings/wallet', {
        walletAddress: trimmedWallet,
      });
      setWalletValidation({ valid: true, message: 'TRC-20 wallet format looks valid.' });
      showStatus('success', 'Wallet address saved successfully.', 'wallet');
      setActiveCard(null);
    } catch (error: any) {
      setWalletValidation({ valid: false, message: 'Enter a valid TRC-20 wallet address.' });
      showStatus('error', getFriendlyErrorMessage(error, 'Unable to save your wallet address. Please check it and try again.'), 'wallet');
    } finally {
      setWalletCardSaving(false);
    }
  };



  const persistTheme = (nextMode: HybridThemeMode) => {
    setThemeMode(nextMode);
  };

  const persistEdgeLight = (enabled: boolean, color: string, mode: EdgeLightMode) => {
    window.localStorage.setItem(
      EDGE_LIGHT_STORAGE_KEY,
      JSON.stringify({ enabled, color, mode }),
    );
    window.dispatchEvent(new Event('nowbar-edge-light-changed'));
    setEdgeLightSavedEnabled(enabled);
    setEdgeLightSavedColor(color);
    setEdgeLightSavedMode(mode);
  };

  const handleToggleEdgeLight = () => {
    setEdgeLightEnabled((current) => {
      const nextEnabled = !current;
      persistEdgeLight(nextEnabled, edgeLightColor, edgeLightMode);
      showStatus('success', nextEnabled ? 'NowBar edge lighting turned on.' : 'NowBar edge lighting turned off.', 'edgeLight');
      return nextEnabled;
    });
  };

  const handleSetEdgeLightMode = (nextMode: EdgeLightMode) => {
    setEdgeLightMode(nextMode);
    persistEdgeLight(edgeLightEnabled, edgeLightColor, nextMode);
    showStatus('success', 'NowBar edge lighting style updated.', 'edgeLight');
  };

  const handleSaveEdgeLight = () => {
    setEdgeLightCardSaving(true);
    try {
      persistEdgeLight(edgeLightEnabled, edgeLightColor, edgeLightMode);
      showStatus('success', 'NowBar edge lighting updated.', 'edgeLight');
    } finally {
      setEdgeLightCardSaving(false);
    }
  };

  const handleToggleTheme = () => {
    persistTheme(themeMode === 'dark' ? 'light' : 'dark');
    showStatus('success', `Theme switched to ${themeMode === 'dark' ? 'Light' : 'Dark'} mode.`, 'theme');
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please choose an image file.', 'profile');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarUploading(true);

    try {
      const configResponse = await api.get('/api/cloudinary/upload');
      const cloudinaryConfig = configResponse.data as { cloudName?: string; uploadPreset?: string };
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        throw new Error('Image upload is not configured.');
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      if (!uploadResponse.ok) {
        throw new Error('Unable to upload image.');
      }

      const uploadedFile = await uploadResponse.json() as { secure_url?: string };
      if (!uploadedFile.secure_url) {
        throw new Error('Image upload did not return a usable URL.');
      }

      await api.patch('/api/settings/profile-picture', {
        profilePicture: uploadedFile.secure_url,
      });

      setAvatarPreview(uploadedFile.secure_url);
      showStatus('success', 'Profile picture updated.', 'profile');
    } catch (error) {
      console.error('[SettingsPage] avatar upload failed:', error);
      showStatus('error', error instanceof Error ? error.message : 'Unable to upload image.', 'profile');
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
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceMuted,
  };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
      <Helmet>
        <title>Settings | KingsHall Exchange</title>
      </Helmet>
      <div style={styles.shell}>
        
        <div style={styles.panel}>
          <div style={styles.body}>
            <section style={styles.card}>
              {renderStatus('profile')}
              <h2 style={styles.cardTitle}><UserCircle2 size={18} /> Profile picture</h2>
              <p style={styles.cardText}>Choose a photo and upload it directly as-is.</p>
              <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ ...avatarDisplayStyle, width: '96px', height: '96px', flex: '0 0 auto' }}>
                    {accountLoading ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><LoadingDots /></div>
                    ) : avatarPreview ? (
                      <div style={{ position: 'absolute', inset: 0, background: `url(${avatarPreview}) center/cover no-repeat` }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: theme.surfaceShine }}>
                        <UserCircle2 size={42} />
                      </div>
                    )}
                  </div>
                  <label style={{ ...styles.button, ...styles.primaryButton, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={16} />
                    <span>{avatarUploading ? <InlineLoadingDots /> : 'Choose photo'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </section>

            <div style={styles.grid}>

              <section style={styles.card}>
                {renderStatus('theme')}
                <h2 style={styles.cardTitle}>🎨 Theme</h2>
                <p style={styles.cardText}>Switch the app theme instantly. The choice is saved across reloads.</p>
                <div style={styles.toggleRow}>
                  <button
                    type="button"
                    style={{ ...styles.togglePill, ...(themeMode === 'dark' ? styles.togglePillActive : {}) }}
                    onClick={() => persistTheme('dark')}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.togglePill, ...(themeMode === 'light' ? styles.togglePillActive : {}) }}
                    onClick={() => persistTheme('light')}
                  >
                    Light
                  </button>
                </div>
                <div style={styles.buttonRow}>
                  <button type="button" style={{ ...styles.button, ...styles.primaryButton }} onClick={handleToggleTheme}>
                    Toggle theme
                  </button>
                </div>
              </section>

              <section style={styles.card}>
                {renderStatus('edgeLight')}
                <h2 style={styles.cardTitle}>⚡ NowBar edge lighting</h2>
                <p style={styles.cardText}>Create a fully customizable NowBar edge effect with any color and multiple professional lighting styles.</p>
                <div style={{ ...styles.toggleRow, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{ ...styles.togglePill, ...(edgeLightEnabled ? styles.togglePillActive : {}) }}
                    onClick={handleToggleEdgeLight}
                  >
                    {edgeLightEnabled ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/nowbar-color')}
                    style={{ ...styles.button, display: 'inline-flex', alignItems: 'center', gap: '10px', borderRadius: '12px' }}
                  >
                    <span style={{ width: '24px', height: '24px', borderRadius: '8px', background: edgeLightColor, boxShadow: `0 0 14px ${edgeLightColor}` }} />
                    Choose color
                  </button>
                  <code style={{ color: theme.textMuted, fontSize: '0.85rem' }}>{edgeLightColor.toUpperCase()}</code>
                </div>
                <div style={{ ...styles.field, marginTop: '16px' }}>
                  <span style={styles.label}>Lighting style</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '4px' }}>
                    {EDGE_LIGHT_MODES.map((option) => (
                      <button key={option.key} type="button" onClick={() => handleSetEdgeLightMode(option.key)} style={{ ...styles.button, borderRadius: '14px', textAlign: 'left', display: 'grid', gap: '3px', ...(edgeLightMode === option.key ? styles.primaryButton : {}) }}>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {((edgeLightEnabled !== edgeLightSavedEnabled || edgeLightColor !== edgeLightSavedColor || edgeLightMode !== edgeLightSavedMode) || edgeLightCardSaving) ? (
                  <div style={styles.buttonRow}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} type="button" onClick={handleSaveEdgeLight} disabled={edgeLightCardSaving}>
                      {edgeLightCardSaving ? <InlineLoadingDots /> : 'Save edge lighting'}
                    </button>
                  </div>
                ) : null}
              </section>

              <section style={styles.card}>
                {renderStatus('wallet')}
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
                      {walletCardSaving ? <InlineLoadingDots /> : 'Save wallet'}
                    </button>
                  </div>
                ) : null}
              </section>

            </div>

          </div>
        </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default SettingsPage;
