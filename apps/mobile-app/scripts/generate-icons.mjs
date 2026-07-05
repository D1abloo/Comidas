import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, '..', 'web', 'public', 'icons', 'icon-512.png');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');

if (!existsSync(source)) {
  console.error('No se encontró el logo:', source);
  process.exit(1);
}

const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const splashSizes = {
  'drawable-port-mdpi': 320,
  'drawable-port-hdpi': 480,
  'drawable-port-xhdpi': 720,
  'drawable-port-xxhdpi': 960,
  'drawable-port-xxxhdpi': 1280,
};

async function writePng(folder, name, size, fit = 'cover') {
  const dir = path.join(res, folder);
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, name);
  await sharp(source)
    .resize(size, size, { fit, background: '#1a2421' })
    .png()
    .toFile(out);
  console.log('✓', path.relative(root, out));
}

for (const [folder, size] of Object.entries(launcherSizes)) {
  await writePng(folder, 'ic_launcher.png', size);
  await writePng(folder, 'ic_launcher_round.png', size);
  await writePng(folder, 'ic_launcher_foreground.png', size);
}

await writePng('drawable', 'splash.png', 512, 'contain');

for (const [folder, width] of Object.entries(splashSizes)) {
  const dir = path.join(res, folder);
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'splash.png');
  const height = Math.round(width * 1.8);
  await sharp(source)
    .resize(Math.round(width * 0.45), Math.round(width * 0.45), {
      fit: 'contain',
      background: { r: 26, g: 36, b: 33, alpha: 1 },
    })
    .extend({
      top: Math.round(height * 0.28),
      bottom: Math.round(height * 0.28),
      left: Math.round(width * 0.275),
      right: Math.round(width * 0.275),
      background: { r: 26, g: 36, b: 33, alpha: 1 },
    })
    .png()
    .toFile(out);
  console.log('✓', path.relative(root, out));
}

console.log('Iconos BocadO generados.');
