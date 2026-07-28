import { resolve } from 'node:path';
import { unlink } from 'node:fs/promises';
import { isProductionRuntime } from './env.js';

/** Rutas locales en /public/carta — una imagen por slug, acorde al nombre del plato. */
export function dishImagePath(slug: string): string {
  return `/carta/${slug}.jpg`;
}

export const MAX_DISH_IMAGE_BYTES = 2_000_000;

export function dishUploadDirectory(): string {
  return resolve(process.cwd(), isProductionRuntime() ? 'dist/client/uploads' : 'public/uploads');
}

export function detectDishImageExtension(bytes: Uint8Array): 'jpg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

export async function removeDishUpload(imageUrl: string): Promise<void> {
  const match = imageUrl.match(
    /^\/uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp))$/i,
  );
  if (!match?.[1]) return;
  await unlink(resolve(dishUploadDirectory(), match[1])).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

const FALLBACK = '/carta/placeholder.jpg';

export function applyDishImages<T extends { slug: string; images: string[] }>(dishes: T[]): T[] {
  for (const d of dishes) {
    d.images = [dishImagePath(d.slug)];
  }
  return dishes;
}

export { FALLBACK as DISH_IMAGE_FALLBACK };
