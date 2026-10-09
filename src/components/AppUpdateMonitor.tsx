import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import api from '../api/axios';
import { NativeAppUpdate } from '../utils/nativeAppUpdate';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type UpdateCheckResponse = {
  updateAvailable: boolean;
  latestVersion?: string;
  tag?: string;
  downloadUrl?: string;
  releaseNotes?: string;
};

const AppUpdateMonitor = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [update, setUpdate] = useState<UpdateCheckResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [installing, setInstalling] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    try {
      const appInfo = await NativeAppUpdate.getAppInfo();
      if (!appInfo?.versionName) return;

      const response = await api.get<UpdateCheckResponse>('/api/notifications/app-update-check', {
        params: { installedVersion: appInfo.versionName },
      });
      if (response.data?.updateAvailable && response.data.downloadUrl && response.data.latestVersion) {
        setUpdate(response.data);
        setHidden(false);
      } else {
        setUpdate(null);
      }
    } catch {
      // Update checks are best-effort and must never interrupt normal app use.
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();
    const interval = window.setInterval(() => { void checkForUpdate(); }, 15 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkForUpdate();
    };
    const onAuthChanged = () => { void checkForUpdate(); };
    const onUpdateNotification = () => { void checkForUpdate(); };
    window.addEventListener('focus', onVisibilityChange);
    window.addEventListener('ke:auth-changed', onAuthChanged);
    window.addEventListener('ke:app-update-check-now', onUpdateNotification);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onVisibilityChange);
      window.removeEventListener('ke:auth-changed', onAuthChanged);
      window.removeEventListener('ke:app-update-check-now', onUpdateNotification);
    };
  }, [checkForUpdate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || !NativeAppUpdate.addListener) return;
    let listenerHandle: { remove: () => Promise<void> } | undefined;
    void NativeAppUpdate.addListener('downloadError', (event) => {
      setInstalling(false);
      setActionMessage(event.message || 'The APK download or installer could not complete.');
    }).then((handle) => {
      listenerHandle = handle;
    }).catch(() => {
      // The native listener is optional; update checks and the download button remain usable.
    });
    return () => {
      if (listenerHandle) void listenerHandle.remove();
    };
  }, []);

  const startUpdate = async () => {
    if (!update?.downloadUrl || installing) return;
    setInstalling(true);
    setActionMessage('Preparing the update…');
    try {
      const result = await NativeAppUpdate.downloadAndInstall({ url: update.downloadUrl });
      if (result.requiresPermission) {
        setActionMessage('Allow CryBots to install unknown apps in Android settings, return here, then tap Update now again.');
      } else {
        setActionMessage('The APK is downloading. Android will ask you to approve the update when it finishes.');
      }
    } catch {
      setActionMessage('The in-app installer could not start. You can download the APK from the Download page.');
      window.setTimeout(() => {
        if (update.downloadUrl) window.open(update.downloadUrl, '_blank', 'noopener,noreferrer');
      }, 500);
    } finally {
      setInstalling(false);
    }
  };

  if (!update || hidden) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '62px',
        left: '12px',
        right: '12px',
        zIndex: 49,
        width: 'auto',
        maxWidth: '560px',
        margin: '0 auto',
        padding: '12px 14px',
        borderRadius: '16px',
        border: `1px solid ${theme.primary}`,
        background: theme.surfaceElevated,
        color: theme.text,
        boxShadow: '0 14px 36px rgba(0,0,0,0.32)',
        backdropFilter: 'blur(22px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '0.9rem', fontWeight: 900 }}>CryBots update available</strong>
          <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.8rem', lineHeight: 1.45 }}>
            Version {update.latestVersion} is ready. Update without uninstalling your current app.
          </p>
          {actionMessage ? <p style={{ margin: '7px 0 0', color: theme.primary, fontSize: '0.78rem', lineHeight: 1.45 }}>{actionMessage}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => { setHidden(true); setActionMessage(''); }}
          aria-label="Dismiss update notice"
          style={{ border: 0, background: 'transparent', color: theme.textMuted, fontSize: '1.1rem', lineHeight: 1, cursor: 'pointer', padding: '2px 4px' }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={() => void startUpdate()}
          disabled={installing}
          style={{ flex: 1, border: `1px solid ${theme.primary}`, borderRadius: '999px', padding: '9px 12px', background: theme.primary, color: theme.textInverse, fontWeight: 850, fontSize: '0.82rem', cursor: installing ? 'wait' : 'pointer', opacity: installing ? 0.75 : 1 }}
        >
          {installing ? 'Starting…' : 'Update now'}
        </button>
        <button
          type="button"
          onClick={() => setHidden(true)}
          style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: '999px', padding: '9px 12px', background: theme.surfaceMuted, color: theme.text, fontWeight: 750, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Later
        </button>
      </div>
    </aside>
  );
};

export default AppUpdateMonitor;
