import type { APIRoute } from 'astro';

const STATIC_PATHS = [
  '/',
  '/buscar',
  '/restaurantes',
  '/ayuda',
  '/privacidad',
  '/cookies',
  '/terminos',
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
  const origin = site ?? url.origin;
  const urls = STATIC_PATHS.map(
    (path) => `<url><loc>${escapeXml(new URL(path, origin).toString())}</loc></url>`,
  ).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
