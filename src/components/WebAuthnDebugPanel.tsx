import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { logWebAuthnDebug, getWebAuthnDebugHistory, subscribeWebAuthnDebug, clearWebAuthnDebugHistory, WebAuthnDebugEntry } from '../utils/webauthnDebug';

type NativeDiagnostics = {
  platform?: string;
  androidVersion?: string;
  manufacturer?: string;
  model?: string;
  webViewPackage?: string;
  webViewVersion?: string;
  webViewUrl?: string;
  webAuthenticationFeatureSupported?: boolean;
  webAuthenticationSupport?: number | string;
  secureContext?: boolean;
  error?: string;
};

type NativeDiagnosticsPlugin = {
  getDiagnostics(): Promise<NativeDiagnostics>;
};

const NativeWebAuthnDiagnostics = registerPlugin<NativeDiagnosticsPlugin>('WebAuthnDiagnostics');

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 14,
  borderRadius: 14,
  border: '1px solid rgba(150, 160, 190, .35)',
  background: 'rgba(18, 24, 43, .92)',
  color: '#eef2ff',
  minWidth: 0,
};
const buttonStyle: React.CSSProperties = {
  border: '1px solid rgba(170, 180, 220, .4)',
  borderRadius: 9,
  padding: '9px 11px',
  background: '#252d48',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const getBrowserDiagnostics = () => {
  const nav = navigator as Navigator & {
    userAgentData?: { brands?: Array<{ brand: string; version: string }>; mobile?: boolean; platform?: string };
    credentials?: CredentialsContainer & { getClientCapabilities?: () => Promise<Record<string, unknown>> };
  };
  const publicKey = window.PublicKeyCredential as typeof PublicKeyCredential & {
    isConditionalMediationAvailable?: () => Promise<boolean>;
    getClientCapabilities?: () => Promise<Record<string, unknown>>;
    isPasskeyPlatformAuthenticatorAvailable?: () => Promise<boolean>;
  };
  const url = new URL(window.location.href);
  return {
    capturedAt: new Date().toISOString(),
    href: url.origin + url.pathname,
    origin: window.location.origin,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port || '(default)',
    isSecureContext: window.isSecureContext,
    crossOriginIsolated: window.crossOriginIsolated,
    documentReferrerOrigin: (() => { try { return document.referrer ? new URL(document.referrer).origin : '(empty)'; } catch { return '(unparseable)'; } })(),
    documentVisibility: document.visibilityState,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    vendor: navigator.vendor,
    userAgent: navigator.userAgent,
    userAgentData: nav.userAgentData ? {
      brands: nav.userAgentData.brands,
      mobile: nav.userAgentData.mobile,
      platform: nav.userAgentData.platform,
    } : '(not exposed)',
    capacitor: {
      platform: Capacitor.getPlatform(),
      isNativePlatform: Capacitor.isNativePlatform(),
    },
    apiPresence: {
      PublicKeyCredential: typeof window.PublicKeyCredential,
      navigatorCredentials: typeof navigator.credentials,
      credentialsCreate: typeof navigator.credentials?.create,
      credentialsGet: typeof navigator.credentials?.get,
      isSecureContext: window.isSecureContext,
      cryptoSubtle: typeof window.crypto?.subtle,
    },
    location: {
      pathname: url.pathname,
      hasSearchParams: Boolean(url.search),
      hasHash: Boolean(url.hash),
    },
    serviceWorkerSupported: 'serviceWorker' in navigator,
    displayModeStandalone: (() => { try { return window.matchMedia('(display-mode: standalone)').matches; } catch { return false; } })(),
    topLevelFrame: (() => { try { return window.top === window.self; } catch { return false; } })(),
    hasWebAuthnCreate: typeof window.PublicKeyCredential !== 'undefined' && typeof navigator.credentials?.create === 'function',
    publicKeyCredentialStaticMethods: {
      isUserVerifyingPlatformAuthenticatorAvailable: typeof publicKey?.isUserVerifyingPlatformAuthenticatorAvailable,
      isConditionalMediationAvailable: typeof publicKey?.isConditionalMediationAvailable,
      isPasskeyPlatformAuthenticatorAvailable: typeof publicKey?.isPasskeyPlatformAuthenticatorAvailable,
      getClientCapabilities: typeof publicKey?.getClientCapabilities,
    },
  };
};

const WebAuthnDebugPanel = () => {
  const [entries, setEntries] = useState<WebAuthnDebugEntry[]>(getWebAuthnDebugHistory());
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeWebAuthnDebug((entry) => setEntries(getWebAuthnDebugHistory()));
    const onError = (event: ErrorEvent) => {
      logWebAuthnDebug('window.error', 'error', event.message || 'Uncaught window error', {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error instanceof Error ? { name: event.error.name, message: event.error.message, stack: event.error.stack } : String(event.error ?? ''),
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logWebAuthnDebug('unhandledrejection', 'error', 'Unhandled promise rejection', reason instanceof Error
        ? { name: reason.name, message: reason.message, stack: reason.stack }
        : { reason: String(reason) });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    logWebAuthnDebug('debug-panel', 'info', 'WebAuthn debug panel mounted', getBrowserDiagnostics());
    return () => {
      unsubscribe();
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  const runDiagnostics = useCallback(async () => {
    setRunning(true);
    logWebAuthnDebug('diagnostics', 'info', 'Starting browser and native diagnostics');
    const result: Record<string, unknown> = { browser: getBrowserDiagnostics() };
    const pkc = window.PublicKeyCredential as typeof PublicKeyCredential & {
      isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
      isConditionalMediationAvailable?: () => Promise<boolean>;
      isPasskeyPlatformAuthenticatorAvailable?: () => Promise<boolean>;
      getClientCapabilities?: () => Promise<Record<string, unknown>>;
    };

    const runCheck = async (name: string, fn?: () => Promise<unknown>) => {
      if (!fn) {
        result[name] = { supported: false, reason: 'API method is not exposed in this runtime' };
        return;
      }
      try {
        result[name] = { supported: true, result: await fn() };
      } catch (error) {
        result[name] = { supported: true, rejected: true, error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error) };
      }
    };

    await runCheck('platformAuthenticatorAvailability', pkc?.isUserVerifyingPlatformAuthenticatorAvailable?.bind(pkc));
    await runCheck('conditionalMediationAvailability', pkc?.isConditionalMediationAvailable?.bind(pkc));
    await runCheck('passkeyPlatformAuthenticatorAvailability', pkc?.isPasskeyPlatformAuthenticatorAvailable?.bind(pkc));
    await runCheck('webAuthnClientCapabilities', pkc?.getClientCapabilities?.bind(pkc));

    if (Capacitor.isNativePlatform()) {
      try {
        const native = await NativeWebAuthnDiagnostics.getDiagnostics();
        result.nativeAndroid = native;
        logWebAuthnDebug('native-diagnostics', 'success', 'Native Android diagnostics returned', native);
      } catch (error) {
        result.nativeAndroid = { bridgeCallFailed: true, error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error) };
        logWebAuthnDebug('native-diagnostics', 'error', 'Native diagnostics bridge failed', result.nativeAndroid);
      }
    } else {
      result.nativeAndroid = { skipped: true, reason: 'Not running inside a native Capacitor platform' };
    }

    setDiagnostics(result);
    logWebAuthnDebug('diagnostics', 'success', 'Diagnostics completed', {
      secureContext: window.isSecureContext,
      origin: window.location.origin,
      nativeDiagnosticsReturned: Boolean(result.nativeAndroid && !(result.nativeAndroid as { skipped?: boolean }).skipped),
    });
    setRunning(false);
  }, []);

  const copyLogs = async () => {
    const payload = JSON.stringify({
      exportedAt: new Date().toISOString(),
      diagnostics: diagnostics ?? { browser: getBrowserDiagnostics() },
      events: getWebAuthnDebugHistory(),
    }, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const area = document.createElement('textarea');
        area.value = payload;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const success = document.execCommand('copy');
        area.remove();
        if (!success) throw new Error('Clipboard copy command was rejected');
      }
      setCopied(true);
      logWebAuthnDebug('export', 'success', 'Diagnostic log copied to clipboard', { characters: payload.length });
    } catch (error) {
      logWebAuthnDebug('export', 'error', 'Copying logs failed', error);
      setCopied(false);
    }
  };

  const clearLogs = () => {
    clearWebAuthnDebugHistory();
    setEntries([]);
    setDiagnostics(null);
    setCopied(false);
    logWebAuthnDebug('debug-panel', 'info', 'Log history cleared');
  };

  const refreshBrowserInfo = () => {
    const browser = getBrowserDiagnostics();
    setDiagnostics((previous) => ({ ...(previous ?? {}), browser }));
    logWebAuthnDebug('diagnostics', 'success', 'Browser runtime information refreshed', browser);
  };

  const levelColor = (level: string) => level === 'error' ? '#ff8b8b' : level === 'warning' ? '#ffd27d' : level === 'success' ? '#91f0b5' : '#a8c8ff';

  return (
    <section style={cardStyle} aria-label="WebAuthn debug panel">
      <div>
        <div style={{ fontSize: 16, fontWeight: 900 }}>WebAuthn Debug Panel</div>
        <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: '#bdc7e3' }}>
          Temporary diagnostics for the APK passkey issue. Exported logs redact common credential and secret fields.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={buttonStyle} onClick={() => void runDiagnostics()} disabled={running}>{running ? 'Running…' : 'Run diagnostics'}</button>
        <button type="button" style={buttonStyle} onClick={refreshBrowserInfo}>Refresh browser info</button>
        <button type="button" style={buttonStyle} onClick={() => void copyLogs()}>{copied ? 'Copied logs' : 'Copy logs'}</button>
        <button type="button" style={buttonStyle} onClick={clearLogs}>Clear logs</button>
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>Runtime snapshot</div>
        <pre style={{ margin: 0, padding: 10, borderRadius: 9, background: '#0a0e1b', color: '#dbe6ff', fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 320, overflow: 'auto' }}>
          {JSON.stringify(diagnostics ?? { browser: getBrowserDiagnostics(), nativeAndroid: 'Tap Run diagnostics to query native Android' }, null, 2)}
        </pre>
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>Event log ({entries.length})</div>
        <pre style={{ margin: 0, padding: 10, borderRadius: 9, background: '#0a0e1b', color: '#dbe6ff', fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 360, overflow: 'auto' }}>
          {entries.length ? entries.map((entry) => `[${entry.time}] [${entry.level.toUpperCase()}] ${entry.stage}: ${entry.message}${entry.details === undefined ? '' : `\n${JSON.stringify(entry.details, null, 2)}`}`).join('\n\n') : 'No events logged yet.'}
        </pre>
      </div>
      <div style={{ fontSize: 11, color: '#bdc7e3', lineHeight: 1.5 }}>
        Note: browser JavaScript cannot inspect every Android system/WebView log. The native snapshot below reports the WebView package and WebAuthn support setting exposed by the APK.
      </div>
    </section>
  );
};

export default WebAuthnDebugPanel;
