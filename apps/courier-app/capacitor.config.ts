import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = 'https://bocado.31-70-114-94.sslip.io';
const allowLocalCleartext = false;

const config: CapacitorConfig = {
  appId: 'app.bocado.repartidor',
  appName: 'BocadO Repartidor',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/repartidor`,
    cleartext: allowLocalCleartext,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
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
