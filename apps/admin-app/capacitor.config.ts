import type { CapacitorConfig } from '@capacitor/cli';

/**
 * URL del backend BocadO (Astro en Vercel o local).
 * Sobrescribe con BOCADO_APP_URL al ejecutar `npm run config:prod` o `config:local`.
 */
const appUrl = process.env.BOCADO_APP_URL || 'https://comidas.vercel.app';

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
