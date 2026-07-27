import type { APIRoute } from 'astro';
import { isDatabaseEnabled } from '../../server/env';
import { pgQuery } from '../../server/pg';

export const GET: APIRoute = async () => {
  try {
    if (isDatabaseEnabled()) await pgQuery('SELECT 1');
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  }
};
