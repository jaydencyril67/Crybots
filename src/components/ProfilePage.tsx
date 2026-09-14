import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CircleUserRound, Coins, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { getCachedBalance, subscribeBalance, syncBalanceFromBackend } from '../utils/balance';
import AppHeader from './AppHeader';
import NowBar from './NowBar';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  } as const,
  shell: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  glow: {
    position: 'absolute' as const,
    inset: '110px auto auto 50%',
    width: '520px',
    height: '520px',
    transform: 'translateX(-50%)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(120,119,198,0.16), rgba(5,8,22,0))',
    filter: 'blur(28px)',
    pointerEvents: 'none' as const,
  },
  topLine: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
    pointerEvents: 'none' as const,
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '24px',
    marginTop: '18px',
    alignItems: 'start',
    justifyItems: 'center',
  },
  profileStack: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '24px',
    justifyItems: 'center',
  } as const,
  panel: {
    position: 'relative' as const,
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(14,18,33,0.92), rgba(9,12,24,0.86))',
    boxShadow: '0 22px 80px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  avatarPanel: {
    padding: 'clamp(18px, 4vw, 28px)',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
    gap: 'clamp(18px, 3vw, 28px)',
    alignItems: 'center',
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      justifyItems: 'center',
      textAlign: 'center',
    },
    '@media (max-width: 600px)': {
      justifyItems: 'center',
      textAlign: 'center',
    },
  } as const,
  avatarShell: {
    position: 'relative' as const,
    width: '140px',
    height: '140px',
    margin: '0 auto',
    borderRadius: '50%',
    padding: '4px',
    background: 'linear-gradient(135deg, rgba(125,211,252,0.8), rgba(167,139,250,0.7), rgba(34,211,238,0.7))',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 40px rgba(0,0,0,0.35)',
    '@media (max-width: 600px)': {
      width: '120px',
      height: '120px',
      margin: '0 auto',
    },
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(125,211,252,0.26), rgba(14,18,33,1) 58%)',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  avatarIcon: {
    width: '56px',
    height: '56px',
    opacity: 0.95,
  },

  name: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  role: {
    margin: 0,
    color: '#93a4c3',
    fontSize: '0.95rem',
  },
  metaRow: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: '6px',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: '8px',
    },
  } as const,
  metaCard: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'flex-start' as const,
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    '@media (max-width: 900px)': {
      padding: '10px 12px',
    },
    '@media (max-width: 600px)': {
      alignItems: 'center',
      textAlign: 'center',
      padding: '12px 14px',
    },
  },
  metaLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#bfd0ee',
    fontSize: '0.92rem',
    '@media (max-width: 600px)': {
      justifyContent: 'center',
      gap: '8px',
    },
  },
  metaValue: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.92rem',
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
  content: {
    width: '100%',
    padding: 'clamp(18px, 4vw, 28px)',
    boxSizing: 'border-box' as const,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  sectionSub: {
    margin: '8px 0 0',
    color: '#9aaac9',
    lineHeight: 1.6,
    maxWidth: '58ch',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    marginTop: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  } as const,
  infoCard: {
    padding: '16px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  infoLabel: {
    margin: '0 0 10px',
    color: '#95a8ca',
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  infoValue: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#eef4ff',
    lineHeight: 1.5,
  },
  helper: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: '14px',
    marginTop: '24px',
    padding: '18px 20px',
    borderRadius: '22px',
    background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(167,139,250,0.08))',
    border: '1px solid rgba(255,255,255,0.08)',
    flexWrap: 'wrap' as const,
  },
  helperText: {
    margin: 0,
    color: '#dbe7fb',
    lineHeight: 1.5,
  },
  helperAction: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    borderRadius: '999px',
    padding: '12px 16px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
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
};

const ProfilePage = () => {
  const profile = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('kingshall_user') || window.localStorage.getItem('user');
      return raw ? JSON.parse(raw) as ProfileDetails : null;
    } catch {
      return null;
    }
  }, []);

  const [liveBalance, setLiveBalance] = useState<number | null>(() => getCachedBalance() ?? (typeof profile?.usdtBalance === 'number' ? profile.usdtBalance : null));
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeBalance((balance) => {
      if (isMounted) {
        setLiveBalance(balance);
      }
    });

    const loadProfile = async () => {
      try {
        const liveBalance = await syncBalanceFromBackend();
        if (!isMounted) {
          return;
        }

        setLiveBalance(typeof liveBalance === 'number' ? liveBalance : getCachedBalance() ?? (typeof profile?.usdtBalance === 'number' ? profile.usdtBalance : null));
        setBalanceError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setLiveBalance(getCachedBalance() ?? (typeof profile?.usdtBalance === 'number' ? profile.usdtBalance : null));
        setBalanceError(null);
      }
    };

    void loadProfile();
    const intervalId = window.setInterval(() => {
      void loadProfile();
    }, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, [profile?.usdtBalance]);

  const fullName = profile?.fullName || profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || 'Trader';
  const email = profile?.email || 'Not available';
  const uid = profile?.uid || 'Pending confirmation';
  const usdtBalance = typeof liveBalance === 'number' ? liveBalance : typeof profile?.usdtBalance === 'number' ? profile.usdtBalance : 0;


  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Profile</title>
      </Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.glow} />
          <div style={styles.topLine} />
          <AppHeader />

          <div style={styles.hero}>
            <div style={styles.profileStack}>
              <section style={{ ...styles.panel, ...styles.avatarPanel }}>
                <div style={styles.avatarShell}>
                  <div style={styles.avatar}>
                    <CircleUserRound style={styles.avatarIcon} />
                  </div>
                 </div>
              </section>

              <section style={{ ...styles.panel, ...styles.content }}>
                {balanceError ? <div style={{ marginBottom: '12px', color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{balanceError}</div> : null}
                <div style={styles.metaRow}>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}><UserRound size={16} /> Display name</span>
                    <span style={styles.metaValue}>{fullName}</span>
                  </div>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}><Mail size={16} /> Email</span>
                    <span style={styles.metaValue}>{email}</span>
                  </div>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}><ShieldCheck size={16} /> Account status</span>
                    <span style={styles.metaValue}>Protected</span>
                  </div>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}><ShieldCheck size={16} /> UID</span>
                    <span style={styles.metaValue}>{uid}</span>
                  </div>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}><Coins size={16} /> USDT Balance</span>
                    <span style={styles.metaValue}>{usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <NowBar />
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
