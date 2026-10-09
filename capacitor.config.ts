import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingshall.exchange',
  appName: 'CryBots',
  webDir: 'build',
  server: {
    // WebAuthn requires a real, certificate-valid HTTPS origin. Capacitor's
    // synthetic local HTTPS origin cannot present the production domain's TLS
    // certificate, even when hostname is changed to that domain. Load the live
    // site in the release WebView so Android validates the real TLS certificate
    // and WebAuthn sees the exact production RP origin.
    url: 'https://crybots.kingshall.online',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['crybots.kingshall.online'],
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
