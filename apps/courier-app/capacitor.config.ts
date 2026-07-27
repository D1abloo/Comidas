import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.BOCADO_APP_URL || 'https://example.invalid';
const allowLocalCleartext = process.env.BOCADO_ALLOW_LOCAL_CLEARTEXT === 'true';

const config: CapacitorConfig = {
  appId: 'app.bocado.repartidor',
  appName: 'BocadO Repartidor',
  webDir: 'www',
  server: {
    url: `${appUrl.replace(/\/$/, '')}/repartidor`,
    cleartext: allowLocalCleartext && appUrl.startsWith('http://'),
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
