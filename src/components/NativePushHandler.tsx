import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { navigate } from '../utils/navigate';

export default function NativePushHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void PushNotifications.addListener('pushNotificationActionPerformed', action => {
      const target = action.notification.data?.url;
      if (typeof target === 'string' && target.startsWith('/')) navigate(target);
    }).then(handle => {
      if (cancelled) void handle.remove();
      else listener = handle;
    }).catch(error => {
      console.error('[native-push] unable to register notification tap handler:', error);
    });

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, []);

  return null;
}
