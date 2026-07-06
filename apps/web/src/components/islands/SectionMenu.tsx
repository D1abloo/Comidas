import { useMemo, useState, useEffect } from 'react';
import MenuCarousel from './MenuCarousel';
import type { GridDish } from './DishGrid';
import {
  filterDishes,
  uniqueCuisines,
  type SortKey,
  type SearchableDish,
} from '../../utils/menu-search';

interface SectionInfo {
  id: string;
  title: string;
  slug: string;
  emoji?: string;
  description?: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface Props {
  section: SectionInfo;
  dishes: SearchableDish[];
  restaurants: Restaurant[];
  initialQ?: string;
  initialCuisine?: string;
  initialDiet?: string;
  initialRestaurant?: string;
}

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'starter', label: 'Entrante' },
  { value: 'main', label: 'Principal' },
  { value: 'side', label: 'Guarnición' },
  { value: 'dessert', label: 'Postre' },
  { value: 'drink', label: 'Bebida' },
];

export default function SectionMenu({
  section,
  dishes,
  restaurants,
  initialQ = '',
  initialCuisine = '',
  initialDiet = '',
  initialRestaurant = '',
}: Props) {
  const [q, setQ] = useState(initialQ);
  const [restaurantId, setRestaurantId] = useState(initialRestaurant);
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [category, setCategory] = useState('');
  const [diet, setDiet] = useState(initialDiet);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sort, setSort] = useState<SortKey>('featured');
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(initialCuisine || initialDiet || initialRestaurant),
  );

  useEffect(() => {
    setQ(initialQ);
    setCuisine(initialCuisine);
    setDiet(initialDiet);
    setRestaurantId(initialRestaurant);
  }, [initialQ, initialCuisine, initialDiet, initialRestaurant]);

  const cuisines = useMemo(() => uniqueCuisines(dishes), [dishes]);
  const restMap = useMemo(() => Object.fromEntries(restaurants.map((r) => [r.id, r.name])), [restaurants]);

  const filtered = useMemo(
    () =>
      filterDishes(dishes, {
        q,
        restaurantId: restaurantId || undefined,
        cuisine: cuisine || undefined,
        category: category || undefined,
        diet: (diet as 'vegan' | 'vegetarian' | 'gluten_free') || undefined,
        availableOnly,
        sort,
      }),
    [dishes, q, restaurantId, cuisine, category, diet, availableOnly, sort],
  );

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (restaurantId) params.set('restaurante', restaurantId);
    if (cuisine) params.set('cuisine', cuisine);
    if (diet) params.set('diet', diet);
    if (category) params.set('categoria', category);
    if (!availableOnly) params.set('todos', '1');
    if (sort !== 'featured') params.set('orden', sort);
    const qs = params.toString();
    const path = `/carta/${section.slug}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', path);
  };

  return (
    <div className="space-y-8">
      <form
        className="rounded-2xl border border-bocado-line/80 bg-white p-4 md:p-5 shadow-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          syncUrl();
        }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 relative">
            <span className="sr-only">Buscar en {section.title}</span>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bocado-mute pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 5 5" />
              </svg>
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Buscar en ${section.title}…`}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-bocado-line bg-bocado-paper text-sm focus:border-bocado-lime focus:ring-2 focus:ring-bocado-lime/20 outline-none"
            />
          </label>
          <button type="submit" className="premium-btn shrink-0 h-11 px-6">
            Buscar
          </button>
          <button
            type="button"
            className="premium-chip shrink-0 h-11"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            Filtros avanzados {advancedOpen ? '▲' : '▼'}
          </button>
        </div>

        {advancedOpen && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2 border-t border-bocado-line/60">
            <label className="block text-sm">
              <span className="font-medium text-bocado-mute text-xs uppercase tracking-wide">Restaurante</span>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-bocado-line px-3 text-sm bg-white"
              >
                <option value="">Todos</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-bocado-mute text-xs uppercase tracking-wide">Cocina</span>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-bocado-line px-3 text-sm bg-white"
              >
                <option value="">Todas</option>
                {cuisines.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-bocado-mute text-xs uppercase tracking-wide">Categoría</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-bocado-line px-3 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-bocado-mute text-xs uppercase tracking-wide">Dieta</span>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-bocado-line px-3 text-sm bg-white"
              >
                <option value="">Sin filtro</option>
                <option value="vegan">Vegano</option>
                <option value="vegetarian">Vegetariano</option>
                <option value="gluten_free">Sin gluten</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-bocado-mute text-xs uppercase tracking-wide">Ordenar</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="mt-1 w-full h-10 rounded-lg border border-bocado-line px-3 text-sm bg-white"
              >
                <option value="featured">Recomendados</option>
                <option value="rating">Mejor valorados</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name">Nombre A–Z</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-1 self-end pb-1">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-bocado-line"
              />
              Solo disponibles
            </label>
          </div>
        )}

        <p className="text-sm text-bocado-mute">
          {filtered.length} de {dishes.length} platos en {section.title}
        </p>
      </form>

      {filtered.length > 0 ? (
        <MenuCarousel dishes={filtered as GridDish[]} restaurants={restMap} autoPlayMs={8000} />
      ) : (
        <p className="text-center text-bocado-mute py-16 rounded-2xl bg-bocado-paper2 border border-bocado-line/60">
          No hay platos con estos filtros. Prueba otra búsqueda o quita algún filtro.
        </p>
      )}
    </div>
  );
}
