import type { PDFDocument, PDFImage } from 'pdf-lib';

const THUMB_FETCH_TIMEOUT_MS = 10_000;
const cache = new Map<string, PDFImage | null>();

export const DISH_THUMB_PT = 52;

export async function embedDishThumbnail(pdf: PDFDocument, imageUrl: string | undefined): Promise<PDFImage | null> {
  const url = imageUrl?.trim();
  if (!url) return null;
  if (cache.has(url)) return cache.get(url) ?? null;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(THUMB_FETCH_TIMEOUT_MS),
      headers: { Accept: 'image/*' },
    });
    if (!res.ok) {
      cache.set(url, null);
      return null;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    const ct = (res.headers.get('content-type') ?? '').toLowerCase();
    let embedded: PDFImage;
    if (ct.includes('png')) {
      embedded = await pdf.embedPng(bytes);
    } else {
      try {
        embedded = await pdf.embedJpg(bytes);
      } catch {
        embedded = await pdf.embedPng(bytes);
      }
    }
    cache.set(url, embedded);
    return embedded;
  } catch {
    cache.set(url, null);
    return null;
  }
}

export function clearMenuPdfImageCache(): void {
  cache.clear();
}
