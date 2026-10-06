import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Camera, CircleUserRound, Coins, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { getCachedBalance, subscribeBalance, syncBalanceFromBackend } from '../utils/balance';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import ImagePickerButton from './ImagePickerButton';
import ProfileImageCropModal from './ProfileImageCropModal';

const baseStyles = {
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { paddingTop: '8px', display: 'grid', gap: '14px', marginTop: '14px' },
  rowList: { display: 'grid', gap: '10px', width: '100%', minWidth: 0, padding: '4px', borderRadius: '16px', border: '1px solid transparent', boxSizing: 'border-box' as const },
  profilePhotoCard: { width: 'fit-content', maxWidth: '100%', margin: '0 auto' },
  row: { width: '100%', maxWidth: '100%', border: '1px solid transparent', borderRadius: '15px', padding: '13px 14px', display: 'grid', gap: '6px', textAlign: 'left' as const, minWidth: 0, boxSizing: 'border-box' as const },
  grid: { display: 'grid', gap: '12px', gridTemplateColumns: 'minmax(0, 1fr)' },
  infoList: { display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: '8px' },
  infoRow: { width: '100%', padding: '13px 14px', borderRadius: '15px', boxSizing: 'border-box' as const, display: 'grid', gap: '6px', textAlign: 'left' as const, minWidth: 0, gridColumn: '1 / -1' },
  card: {},
  profileIdentity: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'min(58vw, 200px)', aspectRatio: '1 / 1', margin: '0', padding: '0', overflow: 'hidden', borderRadius: '15px', boxSizing: 'border-box' as const },
  profileAvatarFrame: { position: 'relative' as const, width: '100%', height: '100%' },
  profileAvatar: { width: '100%', height: '100%', borderRadius: '15px', objectFit: 'cover' as const, border: '4px solid rgba(255,255,255,0.9)', boxShadow: '0 0 0 3px rgba(56,189,248,0.35), 0 14px 34px rgba(0,0,0,0.35)', background: '#111827', flexShrink: 0 },
  profileAvatarFallback: { width: '100%', height: '100%', borderRadius: '15px', display: 'grid', placeItems: 'center', border: '4px solid rgba(255,255,255,0.9)', boxShadow: '0 0 0 3px rgba(56,189,248,0.35), 0 14px 34px rgba(0,0,0,0.35)', background: '#111827', flexShrink: 0 },
  '@media (max-width: 640px)': {
    page: { paddingBottom: '90px' }, shell: { maxWidth: '100%', padding: '14px 12px 24px' }, content: { gap: '14px', marginTop: '14px' }, card: {},
    profileIdentity: { width: 'min(64vw, 200px)', padding: '0', gap: '0' }, profileAvatarFrame: { width: '100%', height: '100%' },
    profileAvatar: { width: '100%', height: '100%', borderRadius: '15px' }, profileAvatarFallback: { width: '100%', height: '100%', borderRadius: '15px' },
    sectionTitle: { fontSize: '1.15rem' }, sectionSub: { maxWidth: '100%' }, infoList: { gap: '10px', gridTemplateColumns: 'minmax(0, 1fr)' },
    infoRow: { padding: '14px', borderRadius: '16px' }, helper: { padding: '14px 16px', borderRadius: '18px' },
  },
  sectionTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em' },
  sectionSub: { margin: '3px 0 0', lineHeight: 1.4, maxWidth: '62ch', fontSize: '0.82rem' },
  infoLabel: { margin: 0, fontSize: '0.74rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  infoValue: { margin: 0, fontSize: '0.94rem', fontWeight: 800, lineHeight: 1.5, wordBreak: 'break-word' as const, overflowWrap: 'anywhere' as const },
  helper: { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: '14px', marginTop: '8px', padding: '16px 18px', borderRadius: '16px', border: 'none', background: 'transparent', flexWrap: 'wrap' as const },
  helperText: { margin: 0, lineHeight: 1.5 },
  avatarUploadingOverlay: { position: 'absolute' as const, inset: 0, display: 'grid', placeItems: 'center', borderRadius: '15px', background: 'rgba(0,0,0,0.38)', zIndex: 2, pointerEvents: 'none' as const },
  avatarCameraButton: { position: 'absolute' as const, right: '12px', bottom: '12px', width: '36px', height: '36px', display: 'grid', placeItems: 'center', borderRadius: '999px', border: '3px solid #111827', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.28)' },
};

type ProfileDetails = {
  firstName?: string; lastName?: string; fullName?: string; name?: string; email?: string; uid?: string; usdtBalance?: number; profilePicture?: string;
  accountStatus?: 'active' | 'disabled' | 'self_excluded' | 'pending_delete';
  securityFunctions?: { emailConfirmed?: boolean; securityCode?: boolean; twoFactor?: boolean; passkey?: boolean };
};
type MeResponse = { user?: ProfileDetails };
const accountStatusLabels: Record<Exclude<NonNullable<ProfileDetails['accountStatus']>, 'active'>, string> = { disabled: 'Disabled', self_excluded: 'Restricted', pending_delete: 'Pending deletion' };

const DetailsPage = () => {
  const { themeMode } = useAppTheme(); const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = useMemo(() => ({
    ...baseStyles, sectionSub: { ...baseStyles.sectionSub, color: theme.textMuted }, infoLabel: { ...baseStyles.infoLabel, color: theme.textMuted },
    infoValue: { ...baseStyles.infoValue, color: theme.text }, helperText: { ...baseStyles.helperText, color: theme.textMuted },
    portfolioBack: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    avatarCameraButton: { ...baseStyles.avatarCameraButton, background: theme.primary, color: theme.textInverse, borderColor: theme.surface },
    profileAvatarFallback: { ...baseStyles.profileAvatarFallback, color: theme.text },
    card: createHybridCardStyles(theme).card,
    rowList: { ...baseStyles.rowList, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    row: { ...baseStyles.row, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
    infoRow: { ...baseStyles.infoRow, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(18px) saturate(1.08)', WebkitBackdropFilter: 'blur(18px) saturate(1.08)' },
  }), [theme]);

  const [liveProfile, setLiveProfile] = useState<ProfileDetails | null>(null); const [profileLoading, setProfileLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true); const [balanceError, setBalanceError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null); const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ usdtBalance: number | null } | null>(() => ({ usdtBalance: null }));

  useEffect(() => {
    let isMounted = true; let intervalId = 0;
    const unsubscribe = subscribeBalance((balance) => { if (isMounted) setBalance(balance); });
    const loadProfile = async () => {
      try {
        const [liveBalance, meResponse] = await Promise.all([syncBalanceFromBackend(), api.get<MeResponse>('/api/auth/me')]);
        if (!isMounted) return;
        const serverProfile = meResponse.data.user ?? null; const nextBalance = typeof liveBalance?.usdtBalance === 'number' ? liveBalance : { usdtBalance: null };
        setBalance(nextBalance); setLiveProfile(serverProfile); setAvatarPreview(serverProfile?.profilePicture ?? null); setProfileLoading(false); setBalanceLoading(false); setBalanceError(null);
      } catch {
        if (!isMounted) return;
        setBalance({ usdtBalance: null }); setLiveProfile(null); setProfileLoading(false); setBalanceLoading(false); setBalanceError(null);
      }
    };
    void loadProfile(); intervalId = window.setInterval(() => { void loadProfile(); }, 12000);
    const handleFocus = () => { void loadProfile(); }; window.addEventListener('focus', handleFocus);
    return () => { isMounted = false; window.clearInterval(intervalId); window.removeEventListener('focus', handleFocus); unsubscribe(); };
  }, []);

  const profileDetails = liveProfile; const avatarPicture = avatarPreview ?? profileDetails?.profilePicture ?? null;
  const fullName = profileDetails?.fullName || profileDetails?.name || [profileDetails?.firstName, profileDetails?.lastName].filter(Boolean).join(' ').trim();
  const email = profileDetails?.email; const uid = profileDetails?.uid; const securityFunctions = profileDetails?.securityFunctions;
  const allSecurityFunctionsEnabled = Boolean(securityFunctions?.emailConfirmed && securityFunctions.securityCode && securityFunctions.twoFactor && securityFunctions.passkey);
  const accountStatus = profileLoading ? null : profileDetails?.accountStatus === 'active' ? allSecurityFunctionsEnabled ? 'Protected' : 'Active' : profileDetails?.accountStatus ? accountStatusLabels[profileDetails.accountStatus] : 'Active';
  const usdtBalance = typeof balance?.usdtBalance === 'number' ? balance.usdtBalance : typeof profileDetails?.usdtBalance === 'number' ? profileDetails.usdtBalance : null;

  const handleAvatarFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) { setAvatarError('Please choose an image file.'); return; }
    setAvatarError(null); const sourceUrl = URL.createObjectURL(file); setAvatarCropSource(sourceUrl);
  };
  const handleAvatarCropDone = async (file: File) => {
    setAvatarCropSource(null); setAvatarUploading(true); setAvatarError(null);
    try {
      const configResponse = await api.get('/api/cloudinary/upload'); const cloudinaryConfig = configResponse.data as { cloudName?: string; uploadPreset?: string };
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) throw new Error('Image upload is not configured.');
      const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('Unable to upload image.');
      const uploadedFile = await uploadResponse.json() as { secure_url?: string }; if (!uploadedFile.secure_url) throw new Error('Image upload did not return a usable URL.');
      await api.patch('/api/settings/profile-picture', { profilePicture: uploadedFile.secure_url }); setAvatarPreview(uploadedFile.secure_url);
      setLiveProfile((current) => current ? { ...current, profilePicture: uploadedFile.secure_url } : current);
    } catch (error) { setAvatarError(error instanceof Error ? error.message : 'Unable to upload image.'); }
    finally { setAvatarUploading(false); }
  };
  const handleAvatarCropCancel = () => { if (avatarCropSource) URL.revokeObjectURL(avatarCropSource); setAvatarCropSource(null); };

  return (
    <HybridTheme mode={themeMode}>
      <>
        <Helmet><title>KingsHall Exchange | Details</title></Helmet>
        {avatarCropSource ? <ProfileImageCropModal imageUrl={avatarCropSource} onCancel={handleAvatarCropCancel} onDone={async (file) => { URL.revokeObjectURL(avatarCropSource); await handleAvatarCropDone(file); }} /> : null}
        <main style={styles.page}>
          <div style={styles.shell}>
            <button type="button" style={styles.portfolioBack} onClick={() => navigate('/profile')}><ArrowLeft size={17} /> Profile</button>
            <div style={styles.content}>
              <div style={{ ...styles.rowList, ...styles.profilePhotoCard }}>
                <div style={{ ...styles.row, ...styles.profileIdentity }}>
                  <div style={styles.profileAvatarFrame}>
                    {avatarPicture ? <img src={avatarPicture} alt={`${fullName || 'User'} profile`} style={styles.profileAvatar} /> : <div style={styles.profileAvatarFallback} aria-label="Profile picture placeholder"><CircleUserRound size={58} strokeWidth={1.6} /></div>}
                    <ImagePickerButton accept="image/*" onImageSelected={handleAvatarFileChange} disabled={avatarUploading} style={styles.avatarCameraButton} aria-label={avatarUploading ? 'Uploading profile photo' : 'Change profile photo'} title={avatarUploading ? 'Uploading profile photo' : 'Change profile photo'}><Camera size={17} strokeWidth={2.2} /></ImagePickerButton>
                    {avatarUploading ? <div style={styles.avatarUploadingOverlay} aria-label="Uploading profile photo"><LoadingDots /></div> : null}
                  </div>
                </div>
              </div>
              {avatarError ? <p style={{ ...styles.helperText, color: theme.danger }}>{avatarError}</p> : null}
              <div style={styles.rowList}>
                <div style={styles.row}><p style={styles.infoLabel}><UserRound size={16} /> Display name</p><div style={styles.infoValue}>{profileLoading ? <LoadingDots /> : fullName}</div></div>
                <div style={styles.row}><p style={styles.infoLabel}><Mail size={16} /> Email</p><div style={styles.infoValue}>{profileLoading ? <LoadingDots /> : email}</div></div>
                <div style={styles.row}><p style={styles.infoLabel}><ShieldCheck size={16} /> Account status</p><p style={styles.infoValue}>{profileLoading ? <LoadingDots /> : accountStatus}</p></div>
                <div style={styles.row}><p style={styles.infoLabel}><ShieldCheck size={16} /> UID</p><div style={styles.infoValue}>{profileLoading ? <LoadingDots /> : uid}</div></div>
                <div style={styles.row}><p style={styles.infoLabel}><Coins size={16} /> USDT Balance</p><div style={styles.infoValue}>{balanceLoading ? <LoadingDots /> : typeof usdtBalance === 'number' ? `${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : null}</div></div>
              </div>
              {balanceError ? <div style={styles.helperText}>{balanceError}</div> : null}
            </div>
          </div>
          <NowBar />
        </main>
      </>
    </HybridTheme>
  );
};
export default DetailsPage;
