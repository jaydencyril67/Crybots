import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '../api/axios';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    padding: '32px',
    textAlign: 'center' as const,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  button: {
    marginTop: '24px',
    border: 'none',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #67e8f9 0%, #c4b5fd 100%)',
    color: '#050816',
    padding: '12px 20px',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  iconWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: { margin: 0, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1.1 },
  text: { margin: '12px 0 0', color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, fontSize: '15px' },
  meta: { marginTop: '20px', fontSize: '14px', color: '#67e8f9', fontWeight: 700 },
};

const VerifyEmailPage = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const [secondsLeft, setSecondsLeft] = useState(5);

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
          window.location.pathname = '/signin';
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const icon = status === 'success' ? <CheckCircle2 size={30} /> : status === 'error' ? <XCircle size={30} /> : <Loader2 size={30} className="animate-spin" />;
  const iconBackground = status === 'success' ? 'rgba(34,197,94,0.14)' : status === 'error' ? 'rgba(248,113,113,0.14)' : 'rgba(103,232,249,0.14)';
  const iconColor = status === 'success' ? '#4ade80' : status === 'error' ? '#f87171' : '#67e8f9';

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Verify email</title>
      </Helmet>
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={{ ...styles.iconWrap, background: iconBackground, color: iconColor }}>{icon}</div>
          <h1 style={styles.title}>{status === 'success' ? 'Account confirmed' : status === 'error' ? 'Verification failed' : 'Verifying account'}</h1>
          <p style={styles.text}>{message}</p>
          {status !== 'loading' ? (
            <>
              <p style={styles.meta}>Redirecting to sign in in {secondsLeft} seconds...</p>
              <a href="/signin" style={styles.button}>
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
