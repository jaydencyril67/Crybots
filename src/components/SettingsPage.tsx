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
    profilePictureFileId?: string;
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

type AvatarEditorState = {
  source: string;
  fileName: string;
  file: File;
};

type CropBox = {
  x: number;
  y: number;
  size: number;
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
  const [avatarEditor, setAvatarEditor] = useState<AvatarEditorState | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 70, y: 70, size: 160 });
  const cropInputRef = useRef<HTMLInputElement | null>(null);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);
  const cropOverlayRef = useRef<HTMLDivElement | null>(null);
  const cropDragStateRef = useRef<{ mode: 'move' | 'resize' | null; startX: number; startY: number; startBox: CropBox | null; startSize: number | null }>({ mode: null, startX: 0, startY: 0, startBox: null, startSize: null });
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
        const loadedUid = (user?.uid ?? '').replace(/\D/g, '').slice(0, 5);
        setUid(loadedUid);
        setInitialUid(loadedUid);
        setActiveCard(null);
        setWalletAddress(user?.walletAddress ?? '');
        setWalletValidation({ valid: Boolean(user?.walletAddress && trc20WalletPattern.test(user.walletAddress)), message: user?.walletAddress && trc20WalletPattern.test(user.walletAddress) ? 'TRC-20 wallet format looks valid.' : 'Enter a valid TRC-20 wallet address.' });
        setAvatarPreview(user?.profilePicture ? `${user.profilePicture}${user.profilePicture.includes('?') ? '&' : '?'}v=${Date.now()}` : null);

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

  const openAvatarEditor = (file: File) => {
    const source = URL.createObjectURL(file);
    setAvatarEditor({
      source,
      fileName: file.name || `avatar-${Date.now()}.png`,
      file,
    });
    setCropBox({ x: 70, y: 70, size: 160 });
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please choose an image file.');
      return;
    }

    openAvatarEditor(file);
    event.target.value = '';
  };

  const closeAvatarEditor = () => {
    if (avatarEditor?.source) {
      URL.revokeObjectURL(avatarEditor.source);
    }
    setAvatarEditor(null);
    if (cropInputRef.current) {
      cropInputRef.current.value = '';
    }
  };

  const clampCropBox = (nextBox: CropBox) => {
    const imageSize = avatarImageRef.current?.getBoundingClientRect();
    const limit = imageSize ? Math.min(imageSize.width, imageSize.height) : 320;
    const size = Math.max(80, Math.min(nextBox.size, limit));
    const x = Math.max(0, Math.min(nextBox.x, limit - size));
    const y = Math.max(0, Math.min(nextBox.y, limit - size));
    return { x, y, size };
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>, mode: 'move' | 'resize') => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragStateRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startBox: cropBox,
      startSize: cropBox.size,
    };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = cropDragStateRef.current;
    if (!dragState.mode || !dragState.startBox) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (dragState.mode === 'move') {
      setCropBox(clampCropBox({
        ...dragState.startBox,
        x: dragState.startBox.x + deltaX,
        y: dragState.startBox.y + deltaY,
      }));
      return;
    }

    const nextSize = (dragState.startSize ?? dragState.startBox.size) + Math.max(deltaX, deltaY);
    setCropBox(clampCropBox({
      ...dragState.startBox,
      size: nextSize,
    }));
  };

  const handleCropPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = cropDragStateRef.current;
    if (dragState.mode) {
      dragState.mode = null;
      dragState.startBox = null;
      dragState.startSize = null;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
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

  const handleAvatarUpload = async () => {
    const file = avatarEditor?.file;
    const image = avatarImageRef.current;

    if (!file || !image) {
      showStatus('error', 'Unable to load the selected image.');
      return;
    }

    const imageRect = image.getBoundingClientRect();
    const displaySize = Math.min(imageRect.width, imageRect.height) || 320;
    const scale = (image.naturalWidth && image.naturalHeight) ? Math.min(image.naturalWidth, image.naturalHeight) / displaySize : 1;
    const cropSize = Math.round(cropBox.size * scale);
    const cropX = Math.round(cropBox.x * scale);
    const cropY = Math.round(cropBox.y * scale);

    setAvatarUploading(true);
    try {
      const authResponse = await api.get('/api/imagekit/auth');
      const auth = authResponse.data as { publicKey?: string; token?: string; expire?: number; signature?: string };

      if (!auth.publicKey || !auth.token || !auth.expire || !auth.signature) {
        throw new Error('Unable to prepare image upload.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropSize;
      canvas.height = cropSize;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to prepare image crop.');
      }

      context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);

      const croppedBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob((blob) => resolve(blob), file.type || 'image/png'));
      if (!croppedBlob) {
        throw new Error('Unable to prepare cropped image.');
      }

      const croppedFile = new File([croppedBlob], avatarEditor?.fileName || file.name, { type: croppedBlob.type || file.type || 'image/png' });
      const uploadFormData = new FormData();
      uploadFormData.append('file', croppedFile);
      uploadFormData.append('fileName', croppedFile.name);
      uploadFormData.append('useUniqueFileName', 'true');
      uploadFormData.append('token', auth.token);
      uploadFormData.append('expire', String(auth.expire));
      uploadFormData.append('signature', auth.signature);
      uploadFormData.append('publicKey', auth.publicKey);
      uploadFormData.append('folder', 'kingshall/avatars');

      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Unable to upload profile picture.');
      }

      const uploadedFile = await uploadResponse.json() as { url?: string; fileId?: string };
      if (!uploadedFile.url) {
        throw new Error('Image upload did not return a usable URL.');
      }

      const { data } = await api.patch('/api/settings/profile-picture', {
        profilePicture: uploadedFile.url,
        profilePictureFileId: uploadedFile.fileId,
      });
      const nextProfile = data?.user ?? null;
      setAvatarPreview(nextProfile?.profilePicture
        ? `${nextProfile.profilePicture}${nextProfile.profilePicture.includes('?') ? '&' : '?'}v=${Date.now()}`
        : null);
      closeAvatarEditor();
      showStatus('success', 'Profile picture updated successfully.');
    } catch (error: any) {
      showStatus('error', error?.response?.data?.message || error?.message || 'Unable to update profile picture.');
    } finally {
      setAvatarUploading(false);
    }
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
              <h2 style={styles.cardTitle}><UserCircle2 size={18} /> Profile picture</h2>
              <p style={styles.cardText}>Choose a photo, adjust it in the modal, and save a clean cropped avatar.</p>
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
                    <span>Choose photo</span>
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
        {avatarEditor ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(3, 7, 20, 0.82)', backdropFilter: 'blur(18px)', display: 'grid', placeItems: 'center', padding: '0' }}>
            <div style={{ width: '100%', height: '100%', maxWidth: '100%', borderRadius: 0, background: 'linear-gradient(180deg, rgba(9,13,25,0.98), rgba(4,8,16,0.98))', border: 'none', padding: '0', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" style={{ ...styles.button, padding: '10px 14px', background: 'rgba(255,255,255,0.06)' }} onClick={closeAvatarEditor} disabled={avatarUploading}>Cancel</button>
                <span style={{ color: '#c6d3ea', fontSize: '0.95rem', fontWeight: 700 }}>Crop photo</span>
                <button type="button" style={{ ...styles.button, ...styles.primaryButton, padding: '10px 14px' }} onClick={() => void handleAvatarUpload()} disabled={avatarUploading}>
                  {avatarUploading ? 'Saving...' : 'Crop & upload'}
                </button>
              </div>
              <div
                ref={cropOverlayRef}
                style={{ position: 'relative', minHeight: '320px', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: '18px' }}
              >
                <img
                  ref={avatarImageRef}
                  src={avatarEditor.source}
                  alt="Selected avatar preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', filter: 'saturate(1.08) contrast(1.04)' }}
                />
                <div
                  role="presentation"
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerLeave={handleCropPointerUp}
                  style={{ position: 'absolute', inset: '18px', pointerEvents: 'none' }}
                >
                  <div
                    onPointerDown={(event) => handleCropPointerDown(event, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${cropBox.x}px`,
                      top: `${cropBox.y}px`,
                      width: `${cropBox.size}px`,
                      height: `${cropBox.size}px`,
                      border: '2px solid rgba(125, 211, 252, 0.95)',
                      borderRadius: '18px',
                      boxShadow: '0 0 0 9999px rgba(3, 7, 20, 0.45)',
                      background: 'transparent',
                      cursor: 'move',
                      pointerEvents: 'auto',
                    }}
                  >
                    <div
                      onPointerDown={(event) => handleCropPointerDown(event, 'resize')}
                      style={{
                        position: 'absolute',
                        right: '-10px',
                        bottom: '-10px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '999px',
                        background: '#7dd3fc',
                        border: '2px solid #050816',
                        cursor: 'nwse-resize',
                        pointerEvents: 'auto',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 18px calc(18px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: '#8ea2c7', fontSize: '0.9rem', marginRight: 'auto' }}>Drag the crop box or resize it from the corner.</span>
                <label style={{ ...styles.button, background: 'rgba(255,255,255,0.06)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={16} />
                  <span>Choose another photo</span>
                  <input ref={cropInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        ) : null}
        <NowBar />
      </div>
    </div>
  );
};

export default SettingsPage;
