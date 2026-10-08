import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingshall.exchange',
  appName: 'CryBots',
  webDir: 'build',
  server: {
    // Keep Capacitor's default secure Android origin.
    // WebAuthn uses a dedicated localhost RP ID inside the APK.
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
