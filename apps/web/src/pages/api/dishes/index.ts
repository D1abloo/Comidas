import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { randomUUID } from 'node:crypto';
import { persistCatalog } from '../../../server/store-service';
import { parseDishPatch, uniqueCatalogSlug } from '../../../server/catalog-input';
import type { Dish } from '../../../server/types';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  return new Response(
    JSON.stringify({
      dishes: store.dishes,
      restaurants: store.restaurants,
      sections: store.menu_sections,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};

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
    const restaurantId = patch.restaurant_id ?? store.dishes[i]!.restaurant_id;
    const sectionId = patch.menu_section_id ?? store.dishes[i]!.menu_section_id;
    if (!store.restaurants.some((restaurant) => restaurant.id === restaurantId)) {
      return new Response(JSON.stringify({ error: 'invalid_restaurant' }), { status: 400 });
    }
    if (sectionId && !store.menu_sections.some((section) => section.id === sectionId)) {
      return new Response(JSON.stringify({ error: 'invalid_section' }), { status: 400 });
    }
    store.dishes[i] = {
      ...store.dishes[i]!,
      ...patch,
      slug: patch.name
        ? uniqueCatalogSlug(
            patch.name,
            store.dishes.filter((dish) => dish.id !== raw.id).map((dish) => dish.slug),
          )
        : store.dishes[i]!.slug,
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
  const restaurantId = patch.restaurant_id ?? store.restaurants[0]?.id;
  if (!restaurantId || !store.restaurants.some((restaurant) => restaurant.id === restaurantId)) {
    return new Response(JSON.stringify({ error: 'invalid_restaurant' }), { status: 400 });
  }
  if (
    patch.menu_section_id &&
    !store.menu_sections.some((section) => section.id === patch.menu_section_id)
  ) {
    return new Response(JSON.stringify({ error: 'invalid_section' }), { status: 400 });
  }
  const dish: Dish = {
    id: 'd-' + randomUUID().slice(0, 8),
    slug: uniqueCatalogSlug(patch.name!, store.dishes.map((candidate) => candidate.slug)),
    created_at: new Date().toISOString(),
    rating: 0,
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
    restaurant_id: restaurantId,
    ...patch,
    name: patch.name!,
    images: patch.images?.length
      ? patch.images
      : ['/carta/placeholder.jpg'],
  };
  store.dishes.push(dish);
  await persistCatalog(store);
  return new Response(JSON.stringify({ dish }), { status: 201 });
};
