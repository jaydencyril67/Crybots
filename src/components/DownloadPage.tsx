import React from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeAppUpdate, type NativeAppUpdateEvent } from '../utils/nativeAppUpdate';
import { ArrowLeft } from 'lucide-react';
import InstallAppButton from './InstallAppButton';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';
import { useAppTheme } from './AppTheme';

const downloadOptions = [
  {
    title: 'KingsStore',
    description: 'Your home for KingsHall apps. The store is coming soon.',
    url: '',
  },
  {
    title: 'Android APK',
    description: 'Download the latest signed CryBots APK. Android will guide you through updating the installed app.',
    url: 'https://crybots.kingshall.online/downloads/CryBots.apk',
  },
];

const DownloadPage = () => {
  const { themeMode } = useAppTheme();
  const [apkActionMessage, setApkActionMessage] = React.useState('');

  const handleDownloadClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
    option: typeof downloadOptions[number],
  ) => {
    if (option.title !== 'Android APK' || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    event.preventDefault();
    setApkActionMessage('Preparing the APK update…');
    try {
      const result = await NativeAppUpdate.downloadAndInstall({ url: option.url });
      if (result.requiresPermission) {
        setApkActionMessage('Allow CryBots to install unknown apps in Android settings, return here, then tap Download / Update again.');
      } else {
        setApkActionMessage('The APK is downloading. Android will ask you to approve the update when it finishes.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setApkActionMessage('The in-app installer could not start: ' + message + '. Opening the direct APK download instead.');
      window.setTimeout(() => window.open(option.url, '_blank', 'noopener,noreferrer'), 500);
    }
  };
  const theme = HYBRID_THEME_TOKENS[themeMode];

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || !NativeAppUpdate.addListener) return;
    let errorHandle: { remove: () => Promise<void> } | undefined;
    void NativeAppUpdate.addListener('downloadError', (event: NativeAppUpdateEvent) => {
      setApkActionMessage(event.message || 'The APK download or installer could not complete.');
    }).then((handle) => {
      errorHandle = handle;
    }).catch(() => {
      // The download page remains usable if native event registration is unavailable.
    });
    return () => {
      if (errorHandle) void errorHandle.remove();
    };
  }, []);

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
      padding: '16px',
      borderRadius: '22px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      display: 'grid',
      gap: '16px',
      boxSizing: 'border-box' as const,
      minWidth: 0,
    },
    downloadCard: {
      display: 'grid',
      gap: '12px',
      width: '100%',
      maxWidth: '100%',
      padding: '16px',
      borderRadius: '22px',
      border: `1px solid ${theme.borderGlass}`,
      background: theme.surfaceGlass,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
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
      border: `1px solid ${theme.borderGlass}`,
      cursor: 'pointer',
      fontWeight: 800,
      fontSize: '0.9rem',
      textDecoration: 'none',
      color: theme.text,
      background: theme.surfaceGlass,
      boxShadow: theme.mode === 'dark'
        ? 'inset 0 1px rgba(255,255,255,.13), inset 0 -1px rgba(0,0,0,.18), 0 4px 14px rgba(0,0,0,.22)'
        : 'inset 0 1px rgba(255,255,255,.48), inset 0 -1px rgba(70,70,70,.08), 0 4px 14px rgba(30,30,30,.10)',
      backdropFilter: 'blur(12px) saturate(125%)',
      WebkitBackdropFilter: 'blur(12px) saturate(125%)',
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
                <section style={styles.downloadCard} key={option.title}>
                  <h3 style={styles.title}>{option.title}</h3>
                  <p style={styles.description}>{option.description}</p>
                  <a
                    href={option.url || undefined}
                    target={option.url ? '_blank' : undefined}
                    rel={option.url ? 'noopener noreferrer' : undefined}
                    aria-disabled={!option.url}
                    onClick={(event) => {
                      if (!option.url) {
                        event.preventDefault();
                        return;
                      }
                      void handleDownloadClick(event, option);
                    }}
                    style={{
                      ...styles.downloadButton,
                      ...(option.url ? {} : { opacity: 0.55, cursor: 'not-allowed' }),
                    }}
                  >
                    {option.title === 'Android APK' ? 'Download / Update' : 'Coming soon'}
                  </a>
                  {option.title === 'Android APK' && apkActionMessage ? (
                    <p role="status" style={styles.description}>{apkActionMessage}</p>
                  ) : null}

                </section>
            ))}
              <section style={styles.downloadCard}>
                <h3 style={styles.title}>PWA (Web App)</h3>
                <p style={styles.description}>
                  Install CryBots directly from your browser as an app, without downloading an APK.
                  If the install button is unavailable, open your browser menu and choose “Install app” or “Add to Home screen”.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5px' }}>
                  <InstallAppButton />
                </div>
              </section>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default DownloadPage;
