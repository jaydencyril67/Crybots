import React, { useEffect, useState } from 'react';
import { navigate } from '../utils/navigate';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2 } from 'lucide-react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'clamp(14px, 2.5vw, 24px) clamp(12px, 2vw, 18px) 32px',
  },
  card: {
    ...createHybridCardStyles(theme).card,
    width: '100%',
    maxWidth: '760px',
    padding: 'clamp(18px, 3.5vw, 26px)',
  },
  innerCard: { padding: 0, textAlign: 'center' as const, background: 'transparent', border: 'none', borderRadius: 0 },
  iconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.highlightSoft,
    color: theme.success,
    marginBottom: '14px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
    lineHeight: 1.1,
  },
  text: {
    margin: '12px 0 0',
    color: theme.textMuted,
    lineHeight: 1.7,
    fontSize: '15px',
  },
  countdown: {
    marginTop: '20px',
    fontSize: '14px',
    color: theme.primary,
    fontWeight: 700,
  },
});

const SignupConfirmationSentPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
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
    <HybridTheme mode={themeMode}>
      <Helmet>
        <title>CryBots | Confirm your account</title>
      </Helmet>
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.innerCard}>
            <div style={styles.iconWrap}>
              <CheckCircle2 size={30} />
            </div>
            <h2 style={styles.title}>Account created</h2>
            <p style={styles.text}>
              We sent a confirmation link to your email. Open it within 15 minutes to verify your account before signing in.
            </p>
            <p style={styles.countdown}>Redirecting to sign in in {secondsLeft} seconds...</p>
          </div>
        </section>
      </main>
    </HybridTheme>
  );
};

export default SignupConfirmationSentPage;
