import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Coins, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { getCachedBalance, subscribeBalance, syncBalanceFromBackend } from '../utils/balance';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';
import LoadingDots from './LoadingDots';
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
  const [balance, setBalance] = useState<{ usdtBalance: number | null } | null>(() => ({ usdtBalance: null }));

  useEffect(() => {
    let isMounted = true; let intervalId = 0;
    const unsubscribe = subscribeBalance((balance) => { if (isMounted) setBalance(balance); });
    const loadProfile = async () => {
      try {
        const [liveBalance, meResponse] = await Promise.all([syncBalanceFromBackend(), api.get<MeResponse>('/api/auth/me')]);
        if (!isMounted) return;
        const serverProfile = meResponse.data.user ?? null; const nextBalance = typeof liveBalance?.usdtBalance === 'number' ? liveBalance : { usdtBalance: null };
        setBalance(nextBalance); setLiveProfile(serverProfile); setProfileLoading(false); setBalanceLoading(false); setBalanceError(null);
      } catch {
        if (!isMounted) return;
        setBalance({ usdtBalance: null }); setLiveProfile(null); setProfileLoading(false); setBalanceLoading(false); setBalanceError(null);
      }
    };
    void loadProfile(); intervalId = window.setInterval(() => { void loadProfile(); }, 12000);
    const handleFocus = () => { void loadProfile(); }; window.addEventListener('focus', handleFocus);
    return () => { isMounted = false; window.clearInterval(intervalId); window.removeEventListener('focus', handleFocus); unsubscribe(); };
  }, []);

  const profileDetails = liveProfile; const avatarPicture = profileDetails?.profilePicture || '';
  const coverPicture = profileDetails?.coverPhoto || '';
  const fullName = profileDetails?.fullName || profileDetails?.name || [profileDetails?.firstName, profileDetails?.lastName].filter(Boolean).join(' ').trim();
  const email = profileDetails?.email; const uid = profileDetails?.uid; const securityFunctions = profileDetails?.securityFunctions;
  const allSecurityFunctionsEnabled = Boolean(securityFunctions?.emailConfirmed && securityFunctions.securityCode && securityFunctions.twoFactor && securityFunctions.passkey);
  const accountStatus = profileLoading ? null : profileDetails?.accountStatus === 'active' ? allSecurityFunctionsEnabled ? 'Protected' : 'Active' : profileDetails?.accountStatus ? accountStatusLabels[profileDetails.accountStatus] : 'Active';
  const usdtBalance = typeof balance?.usdtBalance === 'number' ? balance.usdtBalance : typeof profileDetails?.usdtBalance === 'number' ? profileDetails.usdtBalance : null;

  return (
    <HybridTheme mode={themeMode}>
      <>
        <Helmet><title>CryBots | Details</title></Helmet>
        <main style={styles.page}>
          <div style={styles.shell}>
            <button type="button" style={styles.portfolioBack} onClick={() => navigate('/profile')}><ArrowLeft size={17} /> Profile</button>
            <div style={styles.content}>
              <div className="cr-details-photo-card">
                <div className="cr-details-photo-stack">
                  <div className="cr-details-cover-frame" style={{ borderColor: theme.borderGlass, background: theme.surfaceGlass }}>
                    {coverPicture
                      ? <img className="cr-details-cover-trigger" src={coverPicture} alt="KingsHall cover photo" />
                      : <div className="cr-details-cover-empty"><span>Cover photo from KingsHall</span></div>}
                  </div>
                  <div className="cr-details-avatar-wrap">
                    <div className="cr-details-avatar-trigger" style={{ borderColor: theme.surface, color: theme.text }}>
                      {avatarPicture
                        ? <img src={avatarPicture} alt="KingsHall profile picture" />
                        : <span>{(fullName || profileDetails?.firstName || 'C').trim().charAt(0).toUpperCase()}</span>}
                    </div>
                  </div>
                </div>
              </div>
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
