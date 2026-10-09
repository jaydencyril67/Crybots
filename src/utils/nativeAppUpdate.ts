import { registerPlugin } from '@capacitor/core';

export type NativeAppInfo = {
  versionName: string;
  versionCode: number;
};

export type NativeAppUpdatePlugin = {
  getAppInfo(): Promise<NativeAppInfo>;
  downloadAndInstall(options: { url: string }): Promise<{
    status?: string;
    downloadId?: number;
    requiresPermission?: boolean;
  }>;
  addListener?(eventName: 'downloadError', listener: (event: { message?: string }) => void): Promise<{ remove: () => Promise<void> }>;
};

export const NativeAppUpdate = registerPlugin<NativeAppUpdatePlugin>('NativeAppUpdate');
