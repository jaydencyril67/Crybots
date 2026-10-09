import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingshall.exchange',
  appName: 'CryBots',
  webDir: 'build',
  server: {
    // Keep Capacitor's default localhost hostname. Its bundled certificate is
    // issued for localhost; using the production hostname here makes Android
    // WebAuthn reject navigator.credentials.create() for a TLS error.
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: '#050817',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      launchFadeOutDuration: 0,
    },
  },
};

export default config;
