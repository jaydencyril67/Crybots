import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingshall.exchange',
  appName: 'CryBots',
  webDir: 'build',
  server: {
    // Capacitor serves bundled assets locally. Keep this on localhost instead
    // of impersonating the production domain with a local WebView certificate.
    // The production RP ID is associated separately through assetlinks.json.
    hostname: 'localhost',
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
