import React, { useEffect, useState } from 'react';
import { navigate } from '../utils/navigate';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2 } from 'lucide-react';

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
  iconWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(34,197,94,0.14)',
    color: '#4ade80',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
    lineHeight: 1.1,
  },
  text: {
    margin: '12px 0 0',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 1.7,
    fontSize: '15px',
  },
  countdown: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#67e8f9',
    fontWeight: 700,
  },
};

const SignupConfirmationSentPage = () => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
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
  }, []);

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Confirm your account</title>
      </Helmet>
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.iconWrap}>
            <CheckCircle2 size={30} />
          </div>
          <h1 style={styles.title}>Account created</h1>
          <p style={styles.text}>
            We sent a confirmation link to your email. Open it within 15 minutes to verify your account before signing in.
          </p>
          <p style={styles.countdown}>Redirecting to sign in in {secondsLeft} seconds...</p>
        </section>
      </main>
    </>
  );
};

export default SignupConfirmationSentPage;
