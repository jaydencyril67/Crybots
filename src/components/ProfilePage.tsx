import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Camera, CircleUserRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import AppHeader from './AppHeader';
import NowBar from './NowBar';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflowX: 'hidden',
    overflowY: 'auto',
    paddingBottom: '132px',
  },
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
    marginTop: '24px',
    alignItems: 'start',
  },
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
  uploadPill: {
    position: 'absolute' as const,
    right: '6px',
    bottom: '6px',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(6,10,18,0.9)',
    color: '#e5eefc',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 10px 22px rgba(0,0,0,0.35)',
  },
  name: {
    margin: 0,
    fontSize: '1.6rem',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  } as const,
  metaCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    minWidth: 0,
  },
  metaLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#bfd0ee',
    fontSize: '0.92rem',
  },
  metaValue: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.92rem',
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
  content: {
    padding: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.6rem',
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
    padding: '18px',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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

const ProfilePage = () => {
  const profile = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('kingshall_user') || window.localStorage.getItem('user');
      return raw ? JSON.parse(raw) as {
        firstName?: string;
        lastName?: string;
        fullName?: string;
        name?: string;
        email?: string;
        uid?: string;
      } : null;
    } catch {
      return null;
    }
  }, []);

  const fullName = profile?.fullName || profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || 'Trader';
  const email = profile?.email || 'Not available';
  const uid = profile?.uid || 'Pending confirmation';
  const initials = fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'T';

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
            <section style={{ ...styles.panel, ...styles.avatarPanel }}>
              <div style={styles.avatarShell}>
                <div style={styles.avatar}>
                  <CircleUserRound style={styles.avatarIcon} />
                  <span style={{ position: 'absolute', bottom: '18px', right: '18px', fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{initials}</span>
                </div>
                <button type="button" aria-label="Upload profile picture" style={styles.uploadPill}>
                  <Camera size={18} />
                </button>
              </div>

              <div>
                <p style={styles.sectionTitle}>Profile details</p>
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
                    <span style={styles.metaLabel}><UserRound size={16} /> Username</span>
                    <span style={styles.metaValue}>{profile?.name || profile?.firstName || 'Trader profile'}</span>
                  </div>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}><ShieldCheck size={16} /> UID</span>
                    <span style={styles.metaValue}>{uid}</span>
                  </div>
                </div>

                <div style={{ ...styles.helper, justifyContent: 'flex-start' }}>
                  <p style={styles.helperText}>
                    Profile picture upload will be added next.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <NowBar />
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
