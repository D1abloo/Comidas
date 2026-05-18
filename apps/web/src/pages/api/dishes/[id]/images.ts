import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { dishImagePath } from '../../../../server/dish-images';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 });

  const body = (await request.json()) as { images?: string[]; use_default?: boolean };
  const store = getStore();
  const dish = store.dishes.find((d) => d.id === id);
  if (!dish) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  if (body.use_default) {
    dish.images = [dishImagePath(dish.slug)];
  } else if (Array.isArray(body.images) && body.images.length > 0) {
    dish.images = body.images.filter((u) => typeof u === 'string' && u.trim().length > 0);
  } else {
    return new Response(JSON.stringify({ error: 'invalid_images' }), { status: 400 });
  }

  return new Response(JSON.stringify({ dish }), {
    headers: { 'content-type': 'application/json' },
  });
};
