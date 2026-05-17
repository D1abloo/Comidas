import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PDFDocument, PDFImage } from 'pdf-lib';

const THUMB_FETCH_TIMEOUT_MS = 10_000;
const cache = new Map<string, PDFImage | null>();

export const DISH_THUMB_PT = 52;

function resolveImageUrl(imageUrl: string, baseOrigin?: string): string {
  const u = imageUrl.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/') && baseOrigin) return `${baseOrigin.replace(/\/$/, '')}${u}`;
  return u;
}

async function readPublicAsset(relativePath: string): Promise<Uint8Array | null> {
  const rel = relativePath.replace(/^\//, '');
  const roots = [join(process.cwd(), 'public'), join(process.cwd(), 'apps/web/public')];
  for (const root of roots) {
    try {
      return await readFile(join(root, rel));
    } catch {
      /* try next root */
    }
  }
  return null;
}

export async function embedDishThumbnail(
  pdf: PDFDocument,
  imageUrl: string | undefined,
  baseOrigin?: string,
): Promise<PDFImage | null> {
  const raw = imageUrl?.trim() ?? '';
  if (!raw) return null;
  const cacheKey = raw;
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  try {
    let bytes: Uint8Array | null = null;
    if (raw.startsWith('/')) {
      bytes = await readPublicAsset(raw);
    }
    if (!bytes) {
      const url = resolveImageUrl(raw, baseOrigin);
      const res = await fetch(url, {
        signal: AbortSignal.timeout(THUMB_FETCH_TIMEOUT_MS),
        headers: { Accept: 'image/*' },
      });
      if (!res.ok) {
        cache.set(cacheKey, null);
        return null;
      }
      bytes = new Uint8Array(await res.arrayBuffer());
    }
    let embedded: PDFImage;
    const isPng = raw.toLowerCase().endsWith('.png') || (bytes[0] === 0x89 && bytes[1] === 0x50);
    if (isPng) {
      embedded = await pdf.embedPng(bytes);
    } else {
      try {
        embedded = await pdf.embedJpg(bytes);
      } catch {
        embedded = await pdf.embedPng(bytes);
      }
    }
    cache.set(cacheKey, embedded);
    return embedded;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

export function clearMenuPdfImageCache(): void {
  cache.clear();
}
