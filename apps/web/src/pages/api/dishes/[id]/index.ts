import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  const idx = store.dishes.findIndex((d) => d.id === params.id);
  if (idx < 0) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  store.dishes.splice(idx, 1);
  return new Response(JSON.stringify({ ok: true }));
};
