import type { APIRoute } from 'astro';
import { getAppUrl } from '../server/env';

const STATIC_PATHS = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/carta', changefreq: 'daily', priority: '0.9' },
  { path: '/restaurantes', changefreq: 'weekly', priority: '0.8' },
  { path: '/buscar', changefreq: 'weekly', priority: '0.7' },
  { path: '/ayuda', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacidad', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/terminos', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site, url }) => {
  let origin = site?.toString() ?? url.origin;
  try {
    origin = new URL(getAppUrl()).origin;
  } catch {
    /* keep site/url origin */
  }
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = STATIC_PATHS.map(
    ({ path, changefreq, priority }) =>
      `<url><loc>${escapeXml(new URL(path, origin).toString())}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  ).join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } },
  );
};
