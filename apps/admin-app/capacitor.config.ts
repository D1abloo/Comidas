import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = 'https://comidas.vercel.app';

const config: CapacitorConfig = {
  appId: 'app.bocado.admin',
  appName: 'BocadO Admin',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/admin`,
    cleartext: appUrl.startsWith('http://'),
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#f4f2ec',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#f4f2ec',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f4f2ec',
    },
  },
};

export default config;
