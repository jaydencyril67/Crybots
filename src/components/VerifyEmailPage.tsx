import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import InlineLoadingDots from './InlineLoadingDots';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    color: theme.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(12px, 3vw, 20px)',
    background: theme.background,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  backdrop: {
    position: 'absolute' as const,
    inset: 0,
    background: theme.surfaceShine,
    pointerEvents: 'none' as const,
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    borderRadius: '22px',
    border: `1px solid ${theme.borderGlass}`,
    background: theme.surfaceGlass,
    padding: 'clamp(20px, 4vw, 28px)',
    textAlign: 'center' as const,
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    position: 'relative' as const,
    zIndex: 1,
  },
  button: {
    marginTop: '20px',
    border: 'none',
    borderRadius: '999px',
    background: theme.primary,
    color: theme.textInverse,
    padding: '13px 22px',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textDecoration: 'none',

  },
  iconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '22px',
    border: `1px solid ${theme.borderGlass}`,
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.9rem, 4vw, 2.8rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
  },
  text: {
    margin: '14px 0 0',
    color: theme.textMuted,
    lineHeight: 1.75,
    fontSize: '15px',
  },
  meta: { marginTop: '22px', fontSize: '14px', color: theme.primary, fontWeight: 700 },
});

const VerifyEmailPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
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
  const iconBackground = status === 'success' ? theme.highlightSoft : status === 'error' ? theme.primarySoft : theme.surfaceShine;
  const iconColor = status === 'success' ? theme.success : status === 'error' ? theme.danger : theme.primary;

  return (
    <HybridTheme mode={themeMode}>
      <Helmet>
        <title>KingsHall Exchange | Verify email</title>
      </Helmet>
      <main style={styles.page}>
        <div style={styles.backdrop} />
        <section style={styles.card}>
          <div style={{ ...styles.iconWrap, background: iconBackground, color: iconColor }}>{icon}</div>
          <h2 style={styles.title}>{status === 'success' ? 'Account confirmed' : status === 'error' ? 'Verification failed' : 'Verifying account'}</h2>
          <p style={styles.text}>{message}</p>
          {status === 'loading' ? (
            <div style={{ marginTop: '18px', color: theme.textMuted }}>
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
    </HybridTheme>
  );
};

export default VerifyEmailPage;
