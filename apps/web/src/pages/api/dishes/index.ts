import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { randomUUID } from 'node:crypto';
import { persistCatalog } from '../../../server/store-service';
import { parseDishPatch } from '../../../server/catalog-input';
import type { Dish } from '../../../server/types';

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
  const store = getStore();
  if (typeof raw.id === 'string') {
    const i = store.dishes.findIndex((d) => d.id === raw.id);
    if (i < 0) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    let patch;
    try {
      patch = parseDishPatch(raw);
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_dish' }), { status: 400 });
    }
    store.dishes[i] = {
      ...store.dishes[i]!,
      ...patch,
      slug: patch.name ? slugify(patch.name) : store.dishes[i]!.slug,
    };
    await persistCatalog(store);
    return new Response(JSON.stringify({ dish: store.dishes[i] }));
  }
  let patch;
  try {
    patch = parseDishPatch(raw, true);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_dish' }), { status: 400 });
  }
  const dish: Dish = {
    id: 'd-' + randomUUID().slice(0, 8),
    slug: slugify(patch.name!),
    created_at: new Date().toISOString(),
    rating: 4.7,
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
    ...patch,
    name: patch.name!,
    images: patch.images?.length
      ? patch.images
      : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
  };
  store.dishes.push(dish);
  await persistCatalog(store);
  return new Response(JSON.stringify({ dish }), { status: 201 });
};
