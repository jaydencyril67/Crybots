import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingshall.exchange',
  appName: 'CryBots',
  webDir: 'build',
  server: {
    // Serve bundled app content under the same HTTPS origin as the WebAuthn RP.
    // WebAuthn related-origin lists require registrable web domains; localhost
    // cannot be delegated to crybots.kingshall.online through /.well-known/webauthn.
    hostname: 'crybots.kingshall.online',
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
