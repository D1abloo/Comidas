export interface SearchableDish {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags?: string[];
  cuisine: string;
  category: string;
  restaurant_id: string;
  price_cents: number;
  rating: number;
  is_available?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  gluten_free?: boolean;
  menu_section_id?: string | null;
}

export type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'name';

export interface DishFilters {
  q?: string;
  restaurantId?: string;
  cuisine?: string;
  category?: string;
  diet?: 'vegan' | 'vegetarian' | 'gluten_free';
  availableOnly?: boolean;
  sort?: SortKey;
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function matchesQuery(dish: SearchableDish, q: string): boolean {
  const needle = norm(q.trim());
  if (!needle) return true;
  const hay = norm([dish.name, dish.description, dish.cuisine, dish.category, ...(dish.tags ?? [])].join(' '));
  return hay.includes(needle);
}

export function filterDishes<T extends SearchableDish>(dishes: T[], filters: DishFilters): T[] {
  let list = dishes.filter((d) => {
    if (filters.q && !matchesQuery(d, filters.q)) return false;
    if (filters.restaurantId && d.restaurant_id !== filters.restaurantId) return false;
    if (filters.cuisine && d.cuisine !== filters.cuisine) return false;
    if (filters.category && d.category !== filters.category) return false;
    if (filters.diet === 'vegan' && !d.vegan) return false;
    if (filters.diet === 'vegetarian' && !d.vegetarian) return false;
    if (filters.diet === 'gluten_free' && !d.gluten_free) return false;
    if (filters.availableOnly && d.is_available === false) return false;
    return true;
  });

  const sort = filters.sort ?? 'featured';
  list = [...list].sort((a, b) => {
    if (sort === 'price_asc') return a.price_cents - b.price_cents;
    if (sort === 'price_desc') return b.price_cents - a.price_cents;
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'name') return a.name.localeCompare(b.name, 'es');
    const af = a.is_available === false ? 1 : 0;
    const bf = b.is_available === false ? 1 : 0;
    if (af !== bf) return af - bf;
    return b.rating - a.rating;
  });

  return list;
}

export function uniqueCuisines(dishes: SearchableDish[]): string[] {
  return [...new Set(dishes.map((d) => d.cuisine))].sort((a, b) => a.localeCompare(b, 'es'));
}
