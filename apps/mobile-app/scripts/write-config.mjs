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
  appId: 'app.bocado.mobile',
  appName: 'BocadO',
  webDir: 'www',
  server: {
    url: \`\${appUrl.replace(/\\/$/, '')}/movil\`,
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
`;

writeFileSync(path.join(root, 'capacitor.config.ts'), content, 'utf8');
console.log(`capacitor.config.ts → ${appUrl}/movil (${mode})`);
