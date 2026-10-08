import type { CapacitorConfig } from '@capacitor/cli';

const androidWebViewHostname =
  process.env.CAPACITOR_APP_HOSTNAME?.trim() || 'crybots.kingshall.online';

const config: CapacitorConfig = {
  appId: 'com.kingshall.exchange',
  appName: 'CryBots',
  webDir: 'build',
  server: {
    // Keep the bundled APK origin on the production HTTPS domain.
    // This makes the WebAuthn RP ID a direct match instead of forcing
    // a Related Origin Request from https://localhost.
    hostname: androidWebViewHostname,
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
