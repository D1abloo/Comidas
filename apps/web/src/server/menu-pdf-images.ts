import { join } from 'node:path';
import type { PDFDocument, PDFImage } from 'pdf-lib';
import { resolveUnderRoot } from './security.js';

const cache = new Map<string, PDFImage | null>();

export const DISH_THUMB_PT = 52;

async function readPublicAsset(relativePath: string): Promise<Uint8Array | null> {
  const rel = relativePath.replace(/^\//, '');
  const roots = [join(process.cwd(), 'public'), join(process.cwd(), 'apps/web/public')];
  for (const root of roots) {
    const abs = resolveUnderRoot(root, rel);
    if (!abs) continue;
    try {
      const { readFile } = await import('node:fs/promises');
      return await readFile(abs);
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
      // ponytail: miniaturas PDF solo desde assets locales; sin fetch externo (SSRF).
      cache.set(cacheKey, null);
      return null;
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
