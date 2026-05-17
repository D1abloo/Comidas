import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { randomUUID } from 'node:crypto';

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const body = (await request.json()) as any;
  const store = getStore();
  if (body.id) {
    const i = store.dishes.findIndex((d) => d.id === body.id);
    if (i < 0) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    store.dishes[i] = { ...store.dishes[i]!, ...body, slug: body.slug ?? slugify(body.name) };
    return new Response(JSON.stringify({ dish: store.dishes[i] }));
  }
  const dish = {
    id: 'd-' + randomUUID().slice(0, 8),
    slug: slugify(body.name ?? 'plato'),
    created_at: new Date().toISOString(),
    rating: 4.7,
    images: [],
    tags: [],
    allergens: [],
    ingredients: [],
    nutrition: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    portion: '1 ración',
    is_available: true,
    is_featured: false,
    spicy_level: 0,
    vegetarian: false,
    vegan: false,
    gluten_free: false,
    vat_rate: 0.1,
    delivery_time_min: 25,
    long_description: '',
    description: '',
    category: 'main',
    cuisine: 'Mediterránea',
    price_cents: 1000,
    restaurant_id: store.restaurants[0]!.id,
    ...body,
  };
  store.dishes.push(dish);
  return new Response(JSON.stringify({ dish }), { status: 201 });
};
