import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'prod';

const urls = {
  prod: process.env.BOCADO_APP_URL,
  local: process.env.BOCADO_APP_URL || 'http://10.0.2.2:4321',
};

const appUrl = urls[mode] ?? urls.prod;
if (!appUrl) throw new Error('BOCADO_APP_URL es obligatorio para la configuración de producción');
const parsedUrl = new URL(appUrl);
if (mode === 'prod' && parsedUrl.protocol !== 'https:') {
  throw new Error('BOCADO_APP_URL debe usar HTTPS en producción');
}
const allowLocalCleartext = mode === 'local' && parsedUrl.protocol === 'http:';
const content = `import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = '${appUrl.replace(/'/g, "\\'")}';
const allowLocalCleartext = ${allowLocalCleartext};

const config: CapacitorConfig = {
  appId: 'app.bocado.repartidor',
  appName: 'BocadO Repartidor',
  webDir: 'www',
  server: {
    url: \`\${appUrl.replace(/\\/$/, '')}/repartidor\`,
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
`;

writeFileSync(path.join(root, 'capacitor.config.ts'), content, 'utf8');
console.log(`capacitor.config.ts → ${appUrl}/repartidor (${mode})`);
