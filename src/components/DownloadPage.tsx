import React from 'react';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import HybridTheme, { createHybridCardStyles, HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';
import { useAppTheme } from './AppTheme';

const downloadOptions = [
  {
    title: 'Playstore',
    description: 'Find the Android app on Google Play.',
    url: 'https://play.google.com/store/search?q=CryBots&c=apps',
  },
  {
    title: 'Appstore',
    description: 'Find the iPhone app on the Apple App Store.',
    url: 'https://apps.apple.com/us/search?term=CryBots',
  },
  {
    title: 'Android APK',
    description: 'Get the Android installation package from the project releases page.',
    url: 'https://github.com/jaydencyril67/Kingshall/releases',
  },
];

const DownloadPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];

  const styles = {
    page: {
      minHeight: '100vh',
      overflowX: 'hidden' as const,
      overflowY: 'auto' as const,
      paddingBottom: '90px',
      background: theme.background,
      color: theme.text,
    },
    shell: {
      width: '100%',
      maxWidth: '920px',
      margin: '0 auto',
      padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px',
      boxSizing: 'border-box' as const,
    },
    content: { display: 'grid', gap: '14px', marginTop: '10px' },
    outerCard: {
      padding: '10px',
      borderRadius: '16px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
    },
    downloadCard: {
      ...createHybridCardStyles(theme).card,
      display: 'grid',
      gap: '8px',
      width: '100%',
      maxWidth: '100%',
      padding: '14px',
      borderRadius: '15px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceMuted,
      minWidth: 0,
      boxSizing: 'border-box' as const,
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      alignSelf: 'start',
      justifySelf: 'start',
      width: 'fit-content',
      gap: '6px',
      border: `1px solid ${theme.borderGlass}`,
      borderRadius: '10px',
      padding: '7px 10px',
      background: theme.surfaceGlass,
      color: theme.text,
      cursor: 'pointer',
      fontSize: '0.84rem',
      marginBottom: '12px',
    },
    title: {
      margin: 0,
      fontSize: '1.15rem',
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: theme.text,
    },
    description: {
      margin: '3px 0 0',
      fontSize: '0.82rem',
      color: theme.textMuted,
      lineHeight: 1.5,
    },
    downloadButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      boxSizing: 'border-box' as const,
      borderRadius: '999px',
      padding: '12px 16px',
      border: `1px solid ${theme.primary}`,
      cursor: 'pointer',
      fontWeight: 800,
      fontSize: '0.9rem',
      textDecoration: 'none',
      color: theme.textInverse,
      background: theme.primary,
      marginTop: '5px',
    },
  };

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.backButton} onClick={() => navigate('/store')}>
              <ArrowLeft size={17} /> Store
            </button>
            {downloadOptions.map((option) => (
              <div style={styles.outerCard} key={option.title}>
                <section style={styles.downloadCard}>
                  <h3 style={styles.title}>{option.title}</h3>
                  <p style={styles.description}>{option.description}</p>
                  <a
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadButton}
                  >
                    <Download size={17} />
                    Download
                    <ExternalLink size={15} />
                  </a>
                </section>
              </div>
            ))}
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DownloadPage;
