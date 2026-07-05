import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  return new Response(JSON.stringify({ orders: store.orders }), {
    headers: { 'content-type': 'application/json' },
  });
};
