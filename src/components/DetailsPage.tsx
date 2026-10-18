import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Coins, Eye, Image as ImageIcon, Mail, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import { getCachedBalance, subscribeBalance, syncBalanceFromBackend } from '../utils/balance';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
import ImagePickerButton from './ImagePickerButton';
import ProfileImageCropModal from './ProfileImageCropModal';
import ImagePreviewModal from './ImagePreviewModal';
import './DetailsPage.css';

const baseStyles = {
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px' },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { paddingTop: '8px', display: 'grid', gap: '14px', marginTop: '14px' },
  rowList: { display: 'grid', gap: '14px', width: '100%', minWidth: 0, padding: '16px', borderRadius: '22px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', boxSizing: 'border-box' as const },
  profilePhotoCard: { width: '100%', maxWidth: '552px', margin: '0 auto' },
  row: { width: '100%', maxWidth: '100%', border: 'none', borderRadius: 0, padding: '10px 0', background: 'transparent', display: 'grid', gap: '6px', textAlign: 'left' as const, minWidth: 0, boxSizing: 'border-box' as const },
  grid: { display: 'grid', gap: '12px', gridTemplateColumns: 'minmax(0, 1fr)' },
  infoList: { display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: '8px' },
  infoRow: { width: '100%', padding: '13px 14px', borderRadius: '15px', boxSizing: 'border-box' as const, display: 'grid', gap: '6px', textAlign: 'left' as const, minWidth: 0, gridColumn: '1 / -1' },
  card: {},
  profileIdentity: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'min(58vw, 180px)', aspectRatio: '1 / 1', margin: '0', padding: '0', overflow: 'visible', borderRadius: '15px', boxSizing: 'border-box' as const },
  profileAvatarFrame: { position: 'relative' as const, width: '100%', height: '100%', overflow: 'visible' as const },
  profileAvatar: { width: '100%', height: '100%', borderRadius: '15px', objectFit: 'cover' as const, border: '0', boxShadow: '0 0 0 3px rgba(56,189,248,0.35), 0 14px 34px rgba(0,0,0,0.35)', background: '#111827', flexShrink: 0 },
  profileAvatarFallback: { width: '100%', height: '100%', borderRadius: '15px', display: 'grid', placeItems: 'center', border: '0', boxShadow: '0 0 0 3px rgba(56,189,248,0.35), 0 14px 34px rgba(0,0,0,0.35)', background: '#111827', flexShrink: 0 },
  '@media (max-width: 640px)': {
    page: { paddingBottom: '90px' }, shell: { maxWidth: '100%', padding: '14px 12px 24px' }, content: { gap: '14px', marginTop: '14px' }, card: {},
    profileIdentity: { width: 'min(64vw, 180px)', padding: '0', gap: '0' }, profileAvatarFrame: { width: '100%', height: '100%' },
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
  avatarCameraButton: { position: 'absolute' as const, right: '-6px', bottom: '-6px', width: '36px', height: '36px', display: 'grid', placeItems: 'center', borderRadius: '999px', border: '3px solid #111827', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.28)' },
};

type ProfileDetails = {
  firstName?: string; lastName?: string; fullName?: string; name?: string; email?: string; uid?: string; usdtBalance?: number; profilePicture?: string; coverPhoto?: string;
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
    row: { ...baseStyles.row, border: 'none', background: 'transparent' },
    infoRow: { ...baseStyles.infoRow, border: 'none', background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' },
  }), [theme]);

  const [liveProfile, setLiveProfile] = useState<ProfileDetails | null>(null); const [profileLoading, setProfileLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true); const [balanceError, setBalanceError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null); const [coverUploading, setCoverUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null); const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [coverCropSource, setCoverCropSource] = useState<string | null>(null);
  const [viewingAvatarUrl, setViewingAvatarUrl] = useState(''); const [viewingCoverUrl, setViewingCoverUrl] = useState('');
  const [photoActionsOpen, setPhotoActionsOpen] = useState(false); const [coverActionsOpen, setCoverActionsOpen] = useState(false);
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState<'profile' | 'cover' | null>(null);
  const photoStackRef = useRef<HTMLDivElement | null>(null);
  const [balance, setBalance] = useState<{ usdtBalance: number | null } | null>(() => ({ usdtBalance: null }));

  useEffect(() => {
    let isMounted = true; let intervalId = 0;
    const unsubscribe = subscribeBalance((balance) => { if (isMounted) setBalance(balance); });
    const loadProfile = async () => {
      try {
        const [liveBalance, meResponse] = await Promise.all([syncBalanceFromBackend(), api.get<MeResponse>('/api/auth/me')]);
        if (!isMounted) return;
        const serverProfile = meResponse.data.user ?? null; const nextBalance = typeof liveBalance?.usdtBalance === 'number' ? liveBalance : { usdtBalance: null };
        setBalance(nextBalance); setLiveProfile(serverProfile); setAvatarPreview(serverProfile?.profilePicture ?? null); setCoverPreview(serverProfile?.coverPhoto ?? null); setProfileLoading(false); setBalanceLoading(false); setBalanceError(null);
      } catch {
        if (!isMounted) return;
        setBalance({ usdtBalance: null }); setLiveProfile(null); setAvatarPreview(null); setCoverPreview(null); setProfileLoading(false); setBalanceLoading(false); setBalanceError(null);
      }
    };
    void loadProfile(); intervalId = window.setInterval(() => { void loadProfile(); }, 12000);
    const handleFocus = () => { void loadProfile(); }; window.addEventListener('focus', handleFocus);
    return () => { isMounted = false; window.clearInterval(intervalId); window.removeEventListener('focus', handleFocus); unsubscribe(); };
  }, []);

  useEffect(() => {
    const closePhotoMenus = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.cr-details-photo-stack')) {
        setPhotoActionsOpen(false); setCoverActionsOpen(false); setDeletePhotoConfirm(null);
      }
    };
    document.addEventListener('click', closePhotoMenus);
    return () => document.removeEventListener('click', closePhotoMenus);
  }, []);

  const profileDetails = liveProfile; const avatarPicture = avatarPreview ?? profileDetails?.profilePicture ?? null;
  const coverPicture = coverPreview ?? profileDetails?.coverPhoto ?? null;
  const fullName = profileDetails?.fullName || profileDetails?.name || [profileDetails?.firstName, profileDetails?.lastName].filter(Boolean).join(' ').trim();
  const email = profileDetails?.email; const uid = profileDetails?.uid; const securityFunctions = profileDetails?.securityFunctions;
  const allSecurityFunctionsEnabled = Boolean(securityFunctions?.emailConfirmed && securityFunctions.securityCode && securityFunctions.twoFactor && securityFunctions.passkey);
  const accountStatus = profileLoading ? null : profileDetails?.accountStatus === 'active' ? allSecurityFunctionsEnabled ? 'Protected' : 'Active' : profileDetails?.accountStatus ? accountStatusLabels[profileDetails.accountStatus] : 'Active';
  const usdtBalance = typeof balance?.usdtBalance === 'number' ? balance.usdtBalance : typeof profileDetails?.usdtBalance === 'number' ? profileDetails.usdtBalance : null;

  const handlePhotoFileChange = async (file: File, kind: 'profile' | 'cover') => {
    if (!file.type.startsWith('image/')) { setAvatarError('Please choose an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setAvatarError('Choose an image smaller than 10 MB.'); return; }
    setAvatarError(null); setPhotoActionsOpen(false); setCoverActionsOpen(false); setDeletePhotoConfirm(null);
    const sourceUrl = URL.createObjectURL(file);
    if (kind === 'profile') setAvatarCropSource(sourceUrl); else setCoverCropSource(sourceUrl);
  };
  const handlePhotoCropDone = async (file: File, kind: 'profile' | 'cover') => {
    if (kind === 'profile') { setAvatarCropSource(null); setAvatarUploading(true); }
    else { setCoverCropSource(null); setCoverUploading(true); }
    setAvatarError(null);
    try {
      const configResponse = await api.get('/api/cloudinary/upload'); const cloudinaryConfig = configResponse.data as { cloudName?: string; uploadPreset?: string };
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) throw new Error('Image upload is not configured.');
      const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('Unable to upload image.');
      const uploadedFile = await uploadResponse.json() as { secure_url?: string }; if (!uploadedFile.secure_url) throw new Error('Image upload did not return a usable URL.');
      const imageUrl = uploadedFile.secure_url;
      if (kind === 'profile') {
        await api.patch('/api/settings/profile-picture', { profilePicture: imageUrl });
        setAvatarPreview(imageUrl);
      } else {
        await api.patch('/api/settings/cover-photo', { coverPhoto: imageUrl });
        setCoverPreview(imageUrl);
      }
      setLiveProfile((current) => current ? { ...current, profilePicture: kind === 'profile' ? imageUrl : current.profilePicture, coverPhoto: kind === 'cover' ? imageUrl : current.coverPhoto } : current);
    } catch (error) { setAvatarError(error instanceof Error ? error.message : 'Unable to upload image.'); }
    finally { setAvatarUploading(false); setCoverUploading(false); }
  };
  const handlePhotoCropCancel = (kind: 'profile' | 'cover') => {
    const source = kind === 'profile' ? avatarCropSource : coverCropSource;
    if (source) URL.revokeObjectURL(source);
    if (kind === 'profile') setAvatarCropSource(null); else setCoverCropSource(null);
  };
  const handleDeletePhoto = async (kind: 'profile' | 'cover') => {
    setDeletePhotoConfirm(null); setPhotoActionsOpen(false); setCoverActionsOpen(false); setAvatarError(null);
    try {
      if (kind === 'profile') {
        await api.patch('/api/settings/profile-picture', { profilePicture: '' });
        setAvatarPreview('');
      } else {
        await api.patch('/api/settings/cover-photo', { coverPhoto: '' });
        setCoverPreview('');
      }
      setLiveProfile((current) => current ? { ...current, profilePicture: kind === 'profile' ? '' : current.profilePicture, coverPhoto: kind === 'cover' ? '' : current.coverPhoto } : current);
    } catch (error) { setAvatarError(error instanceof Error ? error.message : 'Unable to remove photo.'); }
  };

  return (
    <HybridTheme mode={themeMode}>
      <>
        <Helmet><title>CryBots | Details</title></Helmet>
        {avatarCropSource ? <ProfileImageCropModal imageUrl={avatarCropSource} onCancel={() => handlePhotoCropCancel('profile')} onDone={async (file) => { URL.revokeObjectURL(avatarCropSource); await handlePhotoCropDone(file, 'profile'); }} title="Edit profile photo" aspectRatio={1} /> : null}
        {coverCropSource ? <ProfileImageCropModal imageUrl={coverCropSource} onCancel={() => handlePhotoCropCancel('cover')} onDone={async (file) => { URL.revokeObjectURL(coverCropSource); await handlePhotoCropDone(file, 'cover'); }} title="Edit cover photo" aspectRatio={3} /> : null}
        {viewingAvatarUrl ? <ImagePreviewModal imageUrl={viewingAvatarUrl} onClose={() => setViewingAvatarUrl('')} /> : null}
        {viewingCoverUrl ? <ImagePreviewModal imageUrl={viewingCoverUrl} onClose={() => setViewingCoverUrl('')} /> : null}
        <main style={styles.page}>
          <div style={styles.shell}>
            <button type="button" style={styles.portfolioBack} onClick={() => navigate('/profile')}><ArrowLeft size={17} /> Profile</button>
            <div style={styles.content}>
              <div style={{ ...styles.rowList, ...styles.profilePhotoCard }}>
                <div className="cr-details-photo-stack" ref={photoStackRef}>
                  <div className="cr-details-cover-frame" style={{ borderColor: theme.borderGlass, background: theme.surfaceGlass }}>
                    <button type="button" className="cr-details-cover-trigger" aria-label="Cover photo actions" aria-expanded={coverActionsOpen} onClick={() => { setCoverActionsOpen(open => !open); setPhotoActionsOpen(false); setDeletePhotoConfirm(null); }} disabled={coverUploading || avatarUploading}>
                      {coverPicture ? <img src={coverPicture} alt="Your cover photo" /> : <span className="cr-details-cover-empty"><ImageIcon /><small>Cover photo</small></span>}
                      <span className="cr-details-cover-hint">{coverUploading ? 'Uploading…' : 'Cover photo options'}</span>
                    </button>
                    {coverActionsOpen && <div className="cr-details-photo-popout cr-details-photo-popout-cover" role="group" aria-label="Cover photo actions">
                      <ImagePickerButton accept="image/*" onImageSelected={(file) => handlePhotoFileChange(file, 'cover')} disabled={coverUploading || avatarUploading} aria-label="Upload cover photo" title="Upload cover photo"><Upload size={15} /> Upload</ImagePickerButton>
                      <button type="button" disabled={!coverPicture} onClick={() => { setCoverActionsOpen(false); setViewingCoverUrl(coverPicture || ''); }}><Eye size={15} /> View</button>
                      <button type="button" className="cr-details-danger" disabled={!coverPicture || coverUploading || avatarUploading} onClick={() => setDeletePhotoConfirm('cover')}><Trash2 size={15} /> Delete</button>
                    </div>}
                    {deletePhotoConfirm === 'cover' && <div className="cr-details-photo-confirm" role="alertdialog"><strong>Delete cover photo?</strong><div><button type="button" onClick={() => setDeletePhotoConfirm(null)}>Cancel</button><button type="button" className="cr-details-danger" onClick={() => void handleDeletePhoto('cover')}>Delete</button></div></div>}
                  </div>
                  <div className="cr-details-avatar-wrap">
                    <button type="button" className="cr-details-avatar-trigger" aria-label="Profile picture actions" aria-expanded={photoActionsOpen} onClick={() => { setPhotoActionsOpen(open => !open); setCoverActionsOpen(false); setDeletePhotoConfirm(null); }} disabled={avatarUploading || coverUploading} style={{ borderColor: theme.surface, color: theme.text }}>
                      {avatarPicture ? <img src={avatarPicture} alt="Your profile" /> : <span>{(fullName || profileDetails?.firstName || 'C').trim().charAt(0).toUpperCase()}</span>}
                    </button>
                    {avatarUploading && <div className="cr-details-avatar-uploading" aria-label="Uploading profile photo"><LoadingDots /></div>}
                    {photoActionsOpen && <div className="cr-details-photo-popout cr-details-photo-popout-avatar" role="group" aria-label="Profile picture actions">
                      <ImagePickerButton accept="image/*" onImageSelected={(file) => handlePhotoFileChange(file, 'profile')} disabled={avatarUploading || coverUploading} aria-label="Upload profile picture" title="Upload profile picture"><Upload size={15} /> Upload</ImagePickerButton>
                      <button type="button" disabled={!avatarPicture} onClick={() => { setPhotoActionsOpen(false); setViewingAvatarUrl(avatarPicture || ''); }}><Eye size={15} /> View</button>
                      <button type="button" className="cr-details-danger" disabled={!avatarPicture || avatarUploading || coverUploading} onClick={() => setDeletePhotoConfirm('profile')}><Trash2 size={15} /> Delete</button>
                    </div>}
                    {deletePhotoConfirm === 'profile' && <div className="cr-details-photo-confirm cr-details-photo-confirm-avatar" role="alertdialog"><strong>Delete profile picture?</strong><div><button type="button" onClick={() => setDeletePhotoConfirm(null)}>Cancel</button><button type="button" className="cr-details-danger" onClick={() => void handleDeletePhoto('profile')}>Delete</button></div></div>}
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
