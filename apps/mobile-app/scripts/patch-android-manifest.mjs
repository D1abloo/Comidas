import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml',
);

if (!existsSync(manifest)) {
  console.warn('AndroidManifest.xml no encontrado');
  process.exit(0);
}

let xml = readFileSync(manifest, 'utf8');

const permissions = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
  'android.permission.WAKE_LOCK',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.VIBRATE',
];

for (const perm of permissions) {
  if (!xml.includes(perm)) {
    xml = xml.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name="${perm}" />`);
  }
}

if (!xml.includes('usesCleartextTraffic')) {
  xml = xml.replace(/<application/, '<application android:usesCleartextTraffic="true"');
}

writeFileSync(manifest, xml, 'utf8');
console.log('AndroidManifest.xml actualizado');
