import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import InlineLoadingDots from './InlineLoadingDots';

const styles = {
  page: {
    minHeight: '100vh',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background:
      'radial-gradient(circle at top, rgba(103,232,249,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(196,181,253,0.16), transparent 30%), linear-gradient(180deg, #071022 0%, #050816 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  backdrop: {
    position: 'absolute' as const,
    inset: 0,
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 100%)',
    pointerEvents: 'none' as const,
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(8,15,33,0.72)',
    padding: '36px',
    textAlign: 'center' as const,
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
    position: 'relative' as const,
    zIndex: 1,
  },
  button: {
    marginTop: '28px',
    border: 'none',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #67e8f9 0%, #c4b5fd 100%)',
    color: '#050816',
    padding: '13px 22px',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textDecoration: 'none',
    boxShadow: '0 12px 30px rgba(103,232,249,0.2)',

  },
  iconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '22px',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.9rem, 4vw, 2.8rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
  },
  text: {
    margin: '14px 0 0',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 1.75,
    fontSize: '15px',
  },
  meta: { marginTop: '22px', fontSize: '14px', color: '#67e8f9', fontWeight: 700 },
};

const VerifyEmailPage = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [uid, setUid] = useState('');

  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') ?? '', []);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing from the link.');
        return;
      }

      try {
        const response = await api.get('/api/auth/verify-email', { params: { token } });
        setStatus('success');
        setUid(response.data?.uid || '');
        setMessage(response.data?.message || 'Your account has been confirmed successfully.');
      } catch (error) {
        setStatus('error');
        setMessage('This verification link is invalid or has expired. Please sign up again.');
      }
    };

    void verify();
  }, [token]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          navigate('/signin');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const icon = status === 'success' ? <CheckCircle2 size={30} /> : status === 'error' ? <XCircle size={30} /> : <CheckCircle2 size={30} />;
  const iconBackground = status === 'success' ? 'rgba(34,197,94,0.14)' : status === 'error' ? 'rgba(248,113,113,0.14)' : 'rgba(103,232,249,0.14)';
  const iconColor = status === 'success' ? '#4ade80' : status === 'error' ? '#f87171' : '#67e8f9';

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Verify email</title>
      </Helmet>
      <main style={styles.page}>
        <div style={styles.backdrop} />
        <section style={styles.card}>
          <div style={{ ...styles.iconWrap, background: iconBackground, color: iconColor }}>{icon}</div>
          <h1 style={styles.title}>{status === 'success' ? 'Account confirmed' : status === 'error' ? 'Verification failed' : 'Verifying account'}</h1>
          <p style={styles.text}>{message}</p>
          {status === 'loading' ? (
            <div style={{ marginTop: '18px', color: 'rgba(255,255,255,0.7)' }}>
              <InlineLoadingDots />
            </div>
          ) : null}
          {status === 'success' && uid ? <p style={styles.meta}>Your UID: {uid}</p> : null}
          {status !== 'loading' ? (
            <>
              <p style={styles.meta}>Redirecting to sign in in {secondsLeft} seconds...</p>
              <a
                href="/signin"
                style={styles.button}

              >
                Continue to sign in
                <ArrowRight size={18} />
              </a>
            </>
          ) : null}
        </section>
      </main>
    </>
  );
};

export default VerifyEmailPage;
