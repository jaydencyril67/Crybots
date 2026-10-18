import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2 } from 'lucide-react';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
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
    width: '100%',
    maxWidth: '760px',
    borderRadius: '20px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    padding: 'clamp(18px, 3.5vw, 26px)',
    textAlign: 'center' as const,
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  },
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

const AccountConfirmedPage = () => {
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
        <title>CryBots | Account confirmed</title>
      </Helmet>
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.iconWrap}>
            <CheckCircle2 size={30} />
          </div>
          <h2 style={styles.title}>Account confirmed</h2>
          <p style={styles.text}>Your email has been verified successfully. You can now sign in to your account.</p>
          <p style={styles.countdown}>Redirecting to sign in in {secondsLeft} seconds...</p>
        </section>
      </main>
    </HybridTheme>
  );
};

export default AccountConfirmedPage;
