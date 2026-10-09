import React from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeAppUpdate, type NativeAppUpdateEvent } from '../utils/nativeAppUpdate';
import { ArrowLeft } from 'lucide-react';
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
    description: 'Download the latest signed CryBots APK. Android will guide you through updating the installed app.',
    url: 'https://crybots.kingshall.online/downloads/CryBots.apk',
  },
];

const DownloadPage = () => {
  const { themeMode } = useAppTheme();
  const [apkActionMessage, setApkActionMessage] = React.useState('');
  const [debugOpen, setDebugOpen] = React.useState(true);
  const [debugLogs, setDebugLogs] = React.useState<Array<{ time: string; level: string; message: string; details?: unknown }>>([]);
  const [debugDiagnostics, setDebugDiagnostics] = React.useState<Record<string, unknown> | null>(null);
  const [probeResult, setProbeResult] = React.useState<Record<string, unknown> | null>(null);
  const [debugBusy, setDebugBusy] = React.useState('');

  const handleDownloadClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
    option: typeof downloadOptions[number],
  ) => {
    if (option.title !== 'Android APK' || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    event.preventDefault();
    setApkActionMessage('Preparing the APK update…');
    pushDebugLog('INFO', 'User tapped Download / Update.', { url: option.url });
    try {
      const result = await NativeAppUpdate.downloadAndInstall({ url: option.url });
      if (result.requiresPermission) {
        setApkActionMessage('Allow CryBots to install unknown apps in Android settings, return here, then tap Download / Update again.');
      } else {
        setApkActionMessage('The APK is downloading. Android will ask you to approve the update when it finishes.');
        pushDebugLog('INFO', 'Native download plugin accepted the request.', result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushDebugLog('ERROR', 'Native download plugin rejected the request.', message);
      setApkActionMessage('The in-app installer could not start: ' + message + '. Opening the direct APK download instead.');
      window.setTimeout(() => window.open(option.url, '_blank', 'noopener,noreferrer'), 500);
    }
  };
  const theme = HYBRID_THEME_TOKENS[themeMode];

  const pushDebugLog = React.useCallback((level: string, message: string, details?: unknown) => {
    setDebugLogs((previous) => [
      ...previous,
      { time: new Date().toISOString(), level, message, ...(details === undefined ? {} : { details }) },
    ].slice(-100));
  }, []);

  const refreshDebugStatus = React.useCallback(async () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    setDebugBusy('status');
    pushDebugLog('INFO', 'Refreshing native download status.');
    try {
      const [appInfo, diagnostics] = await Promise.all([
        NativeAppUpdate.getAppInfo(),
        NativeAppUpdate.getDownloadDiagnostics(),
      ]);
      const combined = { ...diagnostics, appVersion: appInfo.versionName, appVersionCode: appInfo.versionCode };
      setDebugDiagnostics(combined);
      pushDebugLog('INFO', 'Native status refreshed.', combined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushDebugLog('ERROR', 'Could not read native download status.', message);
    } finally {
      setDebugBusy('');
    }
  }, [pushDebugLog]);

  const probeEndpoint = React.useCallback(async () => {
    setDebugBusy('probe');
    setProbeResult(null);
    pushDebugLog('INFO', 'Probing APK endpoint headers using the native Android network stack.');
    try {
      const result = await NativeAppUpdate.probeDownloadEndpoint({
        url: 'https://crybots.kingshall.online/downloads/CryBots.apk',
      });
      setProbeResult(result);
      const passed = result.ok === true;
      pushDebugLog(passed ? 'PASS' : 'ERROR', passed ? 'Endpoint probe returned an APK response.' : 'Endpoint probe did not return a valid APK response.', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const result = { ok: false, error: message };
      setProbeResult(result);
      pushDebugLog('ERROR', 'Endpoint probe failed.', result);
    } finally {
      setDebugBusy('');
    }
  }, [pushDebugLog]);

  const copyDebugLogs = React.useCallback(async () => {
    const report = JSON.stringify({
      exportedAt: new Date().toISOString(),
      platform: Capacitor.getPlatform(),
      appUrl: window.location.origin + window.location.pathname,
      diagnostics: debugDiagnostics,
      endpointProbe: probeResult,
      logs: debugLogs,
    }, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        const field = document.createElement('textarea');
        field.value = report;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(field);
        if (!copied) throw new Error('Clipboard copy was blocked by Android.');
      }
      pushDebugLog('INFO', 'Diagnostic report copied to clipboard.');
      setApkActionMessage('Diagnostic logs copied. Paste them into this chat so we can identify the failure.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushDebugLog('ERROR', 'Copy failed.', message);
      setApkActionMessage('Could not copy automatically. Please try again.');
    }
  }, [debugDiagnostics, debugLogs, probeResult, pushDebugLog]);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || !NativeAppUpdate.addListener) return;
    let errorHandle: { remove: () => Promise<void> } | undefined;
    let logHandle: { remove: () => Promise<void> } | undefined;
    void NativeAppUpdate.addListener('downloadError', (event: NativeAppUpdateEvent) => {
      const message = event.message || 'The APK download or installer could not complete.';
      setApkActionMessage(message);
      pushDebugLog('ERROR', message, event);
    }).then((handle) => {
      errorHandle = handle;
    }).catch((error) => {
      pushDebugLog('WARN', 'Could not attach the download error listener.', String(error));
    });
    void NativeAppUpdate.addListener('downloadLog', (event: NativeAppUpdateEvent) => {
      pushDebugLog(String(event.stage || 'INFO').toUpperCase(), String(event.message || 'Native download event.'), event);
    }).then((handle) => {
      logHandle = handle;
    }).catch((error) => {
      pushDebugLog('WARN', 'Could not attach the native download log listener.', String(error));
    });
    void refreshDebugStatus();
    return () => {
      if (errorHandle) void errorHandle.remove();
      if (logHandle) void logHandle.remove();
    };
  }, [pushDebugLog, refreshDebugStatus]);

  const debugButtonStyle = (theme: typeof HYBRID_THEME_TOKENS[keyof typeof HYBRID_THEME_TOKENS]): React.CSSProperties => ({
    minHeight: '38px',
    border: `1px solid ${theme.borderGlass}`,
    borderRadius: '9px',
    padding: '8px 9px',
    background: theme.surfaceMuted,
    color: theme.text,
    fontSize: '0.76rem',
    fontWeight: 800,
    cursor: 'pointer',
  });

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
                    onClick={(event) => { void handleDownloadClick(event, option); }}
                    style={styles.downloadButton}
                  >
                    {option.title === 'Android APK' ? 'Download / Update' : 'Download'}
                  </a>
                  {option.title === 'Android APK' && apkActionMessage ? (
                    <p role="status" style={styles.description}>{apkActionMessage}</p>
                  ) : null}
                  {option.title === 'Android APK' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' ? (
                    <section style={{
                      marginTop: '8px',
                      border: `1px solid ${theme.borderGlass}`,
                      borderRadius: '12px',
                      padding: '12px',
                      background: theme.surfaceGlass,
                      display: 'grid',
                      gap: '10px',
                      minWidth: 0,
                    }}>
                      <button type="button" onClick={() => setDebugOpen((open) => !open)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                        width: '100%', border: 0, background: 'transparent', color: theme.text,
                        padding: '2px 0', fontWeight: 850, cursor: 'pointer',
                      }}>
                        <span>APK Download Debug Panel</span>
                        <span>{debugOpen ? 'Hide −' : 'Show +'}</span>
                      </button>
                      {debugOpen ? (
                        <>
                          <p style={{ ...styles.description, margin: 0 }}>
                            Captures Android DownloadManager errors and checks the APK endpoint. No account credentials are collected.
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '7px' }}>
                            <button type="button" disabled={Boolean(debugBusy)} onClick={() => { void refreshDebugStatus(); }} style={debugButtonStyle(theme)}>
                              {debugBusy === 'status' ? 'Checking…' : 'Refresh status'}
                            </button>
                            <button type="button" disabled={Boolean(debugBusy)} onClick={() => { void probeEndpoint(); }} style={debugButtonStyle(theme)}>
                              {debugBusy === 'probe' ? 'Testing…' : 'Probe APK URL'}
                            </button>
                            <button type="button" onClick={() => { void copyDebugLogs(); }} style={debugButtonStyle(theme)}>
                              Copy logs
                            </button>
                            <button type="button" onClick={() => { setDebugLogs([]); pushDebugLog('INFO', 'Local debug log cleared.'); }} style={debugButtonStyle(theme)}>
                              Clear logs
                            </button>
                          </div>
                          {debugDiagnostics ? (
                            <div style={{ borderRadius: '9px', padding: '9px', background: theme.surfaceMuted, overflowWrap: 'anywhere' }}>
                              <p style={{ ...styles.description, margin: '0 0 5px', fontWeight: 800 }}>Latest Android status</p>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.72rem', lineHeight: 1.45, color: theme.text }}>
                                {JSON.stringify(debugDiagnostics, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                          {probeResult ? (
                            <div style={{ borderRadius: '9px', padding: '9px', background: theme.surfaceMuted, overflowWrap: 'anywhere' }}>
                              <p style={{ ...styles.description, margin: '0 0 5px', fontWeight: 800 }}>Endpoint probe result</p>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.72rem', lineHeight: 1.45, color: theme.text }}>
                                {JSON.stringify(probeResult, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                          <div style={{ display: 'grid', gap: '6px', maxHeight: '260px', overflowY: 'auto', borderRadius: '9px', padding: '8px', background: theme.surfaceMuted }}>
                            <p style={{ ...styles.description, margin: 0, fontWeight: 800 }}>Event log ({debugLogs.length})</p>
                            {debugLogs.length ? debugLogs.slice().reverse().map((entry, index) => (
                              <div key={entry.time + '-' + index} style={{ borderBottom: `1px solid ${theme.borderGlass}`, paddingBottom: '6px', overflowWrap: 'anywhere' }}>
                                <p style={{ margin: 0, color: theme.text, fontSize: '0.73rem', fontWeight: 800 }}>
                                  {entry.level} · {entry.time}
                                </p>
                                <p style={{ margin: '3px 0 0', color: theme.textMuted, fontSize: '0.75rem', lineHeight: 1.4 }}>{entry.message}</p>
                                {entry.details !== undefined ? (
                                  <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.68rem', color: theme.textMuted }}>
                                    {JSON.stringify(entry.details, null, 2)}
                                  </pre>
                                ) : null}
                              </div>
                            )) : (
                              <p style={{ ...styles.description, margin: 0 }}>No events yet. Tap Probe APK URL, then try Download / Update once.</p>
                            )}
                          </div>
                        </>
                      ) : null}
                    </section>
                  ) : null}
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
