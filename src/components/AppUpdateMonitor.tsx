import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import api from '../api/axios';
import { NativeAppUpdate } from '../utils/nativeAppUpdate';
import { openCrownStoreApp } from '../utils/crownStore';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type UpdateCheckResponse = {
  updateAvailable: boolean;
  latestVersion?: string;
  installedVersion?: string;
  tag?: string;
  releaseNotes?: string;
};

const AppUpdateMonitor = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [update, setUpdate] = useState<UpdateCheckResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const checkForUpdate = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    try {
      const appInfo = await NativeAppUpdate.getAppInfo();
      if (!appInfo?.versionName) return;

      const response = await api.get<UpdateCheckResponse>('/api/notifications/app-update-check', {
        params: { installedVersion: appInfo.versionName },
      });
      if (response.data?.updateAvailable && response.data.latestVersion) {
        setUpdate({ ...response.data, installedVersion: appInfo.versionName });
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

  const startUpdate = () => {
    if (!update?.latestVersion) return;
    openCrownStoreApp('crybots', setActionMessage);
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
        backdropFilter: 'blur(8px)',
      }}
    >
      <style>{'@keyframes kh-update-spin { to { transform: rotate(360deg); } }'}</style>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '0.9rem', fontWeight: 900 }}>CryBots update available</strong>
        <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.8rem', lineHeight: 1.45 }}>
          Latest APK available: v{update.latestVersion}. Currently installed: v{update.installedVersion || 'unknown'}. Update without uninstalling your current app.
        </p>
        {actionMessage ? <p style={{ margin: '7px 0 0', color: theme.primary, fontSize: '0.78rem', lineHeight: 1.45 }}>{actionMessage}</p> : null}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={startUpdate}
          style={{ flex: 1, border: `1px solid ${theme.primary}`, borderRadius: '999px', padding: '9px 12px', background: theme.primary, color: theme.textInverse, fontWeight: 850, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Open CrownStore to update
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
