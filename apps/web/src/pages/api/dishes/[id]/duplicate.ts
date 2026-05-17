import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  const src = store.dishes.find((d) => d.id === params.id);
  if (!src) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  const copy = {
    ...src,
    id: 'd-' + randomUUID().slice(0, 8),
    name: src.name + ' (copia)',
    slug: src.slug + '-copia-' + Date.now(),
    is_available: false,
    is_featured: false,
  };
  store.dishes.push(copy);
  return new Response(JSON.stringify({ dish: copy }));
};
