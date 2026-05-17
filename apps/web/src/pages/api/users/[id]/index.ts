import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  if (params.id === locals.user.id) {
    return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), { status: 400 });
  }
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === params.id);
  if (idx < 0) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  store.users.splice(idx, 1);
  return new Response(JSON.stringify({ ok: true }));
};
