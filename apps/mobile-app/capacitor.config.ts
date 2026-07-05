import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = 'https://comidas-web.vercel.app';

const config: CapacitorConfig = {
  appId: 'app.bocado.mobile',
  appName: 'BocadO',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/movil`,
    cleartext: appUrl.startsWith('http://'),
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a2421',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1400,
      backgroundColor: '#1a2421',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a2421',
    },
  },
};

export default config;
