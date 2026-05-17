import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { available } = (await request.json()) as { available: boolean };
  const store = getStore();
  const dish = store.dishes.find((d) => d.id === params.id);
  if (!dish) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  dish.is_available = available;
  return new Response(JSON.stringify({ dish }));
};
