import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'prod';

const urls = {
  prod: process.env.BOCADO_APP_URL || 'https://comidas-web.vercel.app',
  local: process.env.BOCADO_APP_URL || 'http://10.0.2.2:4321',
};

const appUrl = urls[mode] ?? urls.prod;
const content = `import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = '${appUrl.replace(/'/g, "\\'")}';

const config: CapacitorConfig = {
  appId: 'app.bocado.admin',
  appName: 'BocadO Admin',
  webDir: 'www',
  server: {
    url: \`\${appUrl.replace(/\\/$/, '')}/admin\`,
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
`;

writeFileSync(path.join(root, 'capacitor.config.ts'), content, 'utf8');
console.log(`capacitor.config.ts → ${appUrl}/admin (${mode})`);
