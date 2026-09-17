import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';
import { CircleUserRound, Coins, LogOut, Mail, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { getCachedBalance, subscribeBalance, syncBalanceFromBackend } from '../utils/balance';
import AppHeader from './AppHeader';
import HybridTheme, { HYBRID_CARD_STYLES, HYBRID_THEME_TOKENS } from './HybridTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';

const styles = {
  page: {
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  } as const,
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  content: {
    paddingTop: '8px',
    display: 'grid',
    gap: '18px',
    marginTop: '18px',
  },
  grid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
  infoList: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    marginTop: '12px',
  },
  infoRow: {
    width: '100%',
    padding: '16px',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    boxSizing: 'border-box' as const,
    display: 'grid',
    gap: '6px',
    textAlign: 'left' as const,
    minWidth: 0,
    gridColumn: '1 / -1',
  },
  card: HYBRID_CARD_STYLES.card,
  '@media (max-width: 640px)': {
    page: { paddingBottom: '156px' },
    shell: { maxWidth: '100%', padding: '14px 12px 24px' },
    content: { gap: '14px', marginTop: '14px' },
    card: HYBRID_CARD_STYLES.cardMobile,
    sectionTitle: { fontSize: '1.15rem' },
    sectionSub: { maxWidth: '100%' },
    infoList: { gap: '10px', gridTemplateColumns: 'minmax(0, 1fr)' },
    infoRow: { padding: '14px', borderRadius: '16px' },
    helper: { padding: '14px 16px', borderRadius: '18px' },
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  sectionSub: {
    margin: '8px 0 0',
    lineHeight: 1.6,
    maxWidth: '58ch',
    color: HYBRID_THEME_TOKENS.dark.textMuted,
  },
  infoLabel: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  infoValue: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: HYBRID_THEME_TOKENS.dark.text,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
  helper: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: '14px',
    marginTop: '8px',
    padding: '16px 18px',
    borderRadius: '16px',
    border: 'none',
    background: 'transparent',
    flexWrap: 'wrap' as const,
  },
  helperText: {
    margin: 0,
    color: HYBRID_THEME_TOKENS.dark.textMuted,
    lineHeight: 1.5,
  },
  helperAction: {
    border: 'none',
    background: 'transparent',
    color: HYBRID_THEME_TOKENS.dark.text,
    borderRadius: '999px',
    padding: '12px 16px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoutButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    color: HYBRID_THEME_TOKENS.dark.text,
    cursor: 'pointer',
    flexShrink: 0,
  },
};

type ProfileDetails = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  uid?: string;
  usdtBalance?: number;
  profilePicture?: string;
};

type MeResponse = {
  user?: ProfileDetails;
};


const ProfilePage = () => {
  const [liveProfile, setLiveProfile] = useState<ProfileDetails | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ usdtBalance: number | null } | null>(() => ({
    usdtBalance: null,
  }));

  useEffect(() => {
    let isMounted = true;
    let intervalId = 0;
    const unsubscribe = subscribeBalance((balance) => {
      if (isMounted) {
        setBalance(balance);
      }
    });

    const loadProfile = async () => {
      try {
        const [liveBalance, meResponse] = await Promise.all([
          syncBalanceFromBackend(),
          api.get<MeResponse>('/api/auth/me'),
        ]);
        if (!isMounted) {
          return;
        }

        const serverProfile = meResponse.data.user ?? null;
        console.log('[ProfilePage] /api/auth/me response:', JSON.stringify(serverProfile));
        console.log('[ProfilePage] profilePicture value:', JSON.stringify(serverProfile?.profilePicture));

        const nextBalance = typeof liveBalance?.usdtBalance === 'number' ? liveBalance : { usdtBalance: null };
        setBalance(nextBalance);
        setLiveProfile(serverProfile);
        setBalanceError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setBalance({ usdtBalance: null });
        setLiveProfile(null);
        setBalanceError(null);
      }
    };

    void loadProfile();
    intervalId = window.setInterval(() => {
      void loadProfile();
    }, 12000);

    const handleFocus = () => {
      void loadProfile();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      unsubscribe();
    };
  }, []);

  const profileDetails = liveProfile;
  const avatarPicture = profileDetails?.profilePicture ?? null;
  const fullName = profileDetails?.fullName || profileDetails?.name || [profileDetails?.firstName, profileDetails?.lastName].filter(Boolean).join(' ').trim() || 'Trader';
  const email = profileDetails?.email || 'Not available';
  const uid = profileDetails?.uid || 'Pending confirmation';
  const usdtBalance = typeof balance?.usdtBalance === 'number' ? balance.usdtBalance : typeof profileDetails?.usdtBalance === 'number' ? profileDetails.usdtBalance : 0;


  const handleLogout = async () => {
    try {
      await api.post('/api/auth/signout');
    } catch {
      // Even if signout API fails, clear local state
    }
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('kingshall_user');
    window.localStorage.removeItem('firstName');
    window.localStorage.removeItem('kingshall_first_name');
    navigate('/');
  };

  return (
    <HybridTheme mode="dark">
      <>
        <Helmet>
          <title>KingsHall Exchange | Details</title>
        </Helmet>
        <main style={styles.page}>
          <div style={styles.shell}>
            <AppHeader />

            <div style={styles.content}>
              <section style={styles.card}>
                <h1 style={styles.sectionTitle}>Details</h1>
                <p style={styles.sectionSub}>Your account summary is shown here in a simple direct layout.</p>
              </section>

              <div style={styles.infoList}>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}><UserRound size={16} /> Display name</p>
                  <p style={styles.infoValue}>{fullName}</p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}><Mail size={16} /> Email</p>
                  <p style={styles.infoValue}>{email}</p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}><ShieldCheck size={16} /> Account status</p>
                  <p style={styles.infoValue}>Protected</p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}><ShieldCheck size={16} /> UID</p>
                  <p style={styles.infoValue}>{uid}</p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}><Coins size={16} /> USDT Balance</p>
                  <p style={styles.infoValue}>{usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</p>
                </div>
              </div>

              {balanceError ? <div style={styles.helperText}>{balanceError}</div> : null}

              <div style={styles.helper}>
                <button type="button" onClick={handleLogout} style={styles.helperAction}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </div>

          <NowBar />
        </main>
      </>
    </HybridTheme>
  );
};

export default ProfilePage;
