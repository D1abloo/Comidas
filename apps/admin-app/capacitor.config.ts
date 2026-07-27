import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.BOCADO_APP_URL || 'https://example.invalid';
const allowLocalCleartext = process.env.BOCADO_ALLOW_LOCAL_CLEARTEXT === 'true';

const config: CapacitorConfig = {
  appId: 'app.bocado.admin',
  appName: 'BocadO Admin',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/admin`,
    cleartext: allowLocalCleartext && appUrl.startsWith('http://'),
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
