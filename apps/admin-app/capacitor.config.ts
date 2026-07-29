import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = 'https://bocado.31-70-114-94.sslip.io';
const allowLocalCleartext = false;

const config: CapacitorConfig = {
  appId: 'app.bocado.admin',
  appName: 'BocadO Admin',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/admin`,
    cleartext: allowLocalCleartext,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
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
