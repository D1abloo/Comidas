import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = 'https://comidas-web.vercel.app';

const config: CapacitorConfig = {
  appId: 'app.bocado.repartidor',
  appName: 'BocadO Repartidor',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/repartidor`,
    cleartext: appUrl.startsWith('http://'),
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a2421',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1a2421',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a2421',
    },
  },
};

export default config;
