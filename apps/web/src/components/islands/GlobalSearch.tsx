import { useMemo, useState, useEffect } from 'react';
import { DishGrid, type GridDish } from './DishGrid';
import { filterDishes, uniqueCuisines, type SortKey, type SearchableDish } from '../../utils/menu-search';

interface Section {
  id: string;
  title: string;
  slug: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface Props {
  dishes: SearchableDish[];
  sections: Section[];
  restaurants: Restaurant[];
  initialQ?: string;
  initialCuisine?: string;
  initialDiet?: string;
  initialSection?: string;
}

export default function GlobalSearch({
  dishes,
  sections,
  restaurants,
  initialQ = '',
  initialCuisine = '',
  initialDiet = '',
  initialSection = '',
}: Props) {
  const [q, setQ] = useState(initialQ);
  const [sectionId, setSectionId] = useState(initialSection);
  const [restaurantId, setRestaurantId] = useState('');
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [diet, setDiet] = useState(initialDiet);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sort, setSort] = useState<SortKey>('featured');
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(initialCuisine || initialDiet || initialSection));

  useEffect(() => {
    setQ(initialQ);
    setCuisine(initialCuisine);
    setDiet(initialDiet);
    setSectionId(initialSection);
  }, [initialQ, initialCuisine, initialDiet, initialSection]);

  const scoped = useMemo(
    () => (sectionId ? dishes.filter((d) => d.menu_section_id === sectionId) : dishes),
    [dishes, sectionId],
  );

  const cuisines = useMemo(() => uniqueCuisines(scoped), [scoped]);
  const restMap = useMemo(() => Object.fromEntries(restaurants.map((r) => [r.id, r.name])), [restaurants]);
  const sectionMap = useMemo(() => Object.fromEntries(sections.map((s) => [s.id, s.title])), [sections]);

  const filtered = useMemo(
    () =>
      filterDishes(scoped, {
        q,
        restaurantId: restaurantId || undefined,
        cuisine: cuisine || undefined,
        diet: (diet as 'vegan' | 'vegetarian' | 'gluten_free') || undefined,
        availableOnly,
        sort,
      }),
    [scoped, q, restaurantId, cuisine, diet, availableOnly, sort],
  );

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (sectionId) params.set('seccion', sectionId);
    if (restaurantId) params.set('restaurante', restaurantId);
    if (cuisine) params.set('cuisine', cuisine);
    if (diet) params.set('diet', diet);
    if (!availableOnly) params.set('todos', '1');
    if (sort !== 'featured') params.set('orden', sort);
    const qs = params.toString();
    window.history.replaceState(null, '', `/buscar${qs ? `?${qs}` : ''}`);
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
            <span className="sr-only">Buscar platos</span>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bocado-mute pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 5 5" />
              </svg>
            </span>
            <input
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar platos, ingredientes, cocina…"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-bocado-line bg-bocado-paper text-sm focus:border-bocado-lime focus:ring-2 focus:ring-bocado-lime/20 outline-none"
              autoFocus={Boolean(initialQ)}
            />
          </label>
          <button type="submit" className="premium-btn shrink-0 h-11 px-6">
            Buscar
          </button>
          <button
            type="button"
            className="premium-chip shrink-0 h-11"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            Filtros avanzados {advancedOpen ? '▲' : '▼'}
          </button>
        </div>

        {advancedOpen && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2 border-t border-bocado-line/60">
            <label className="block text-sm">
              <span className="font-medium text-bocado-mute text-xs uppercase tracking-wide">Sección</span>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-bocado-line px-3 text-sm bg-white"
              >
                <option value="">Toda la carta</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
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
            <label className="flex items-center gap-2 text-sm self-end pb-1">
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

        <p className="text-sm text-bocado-mute">{filtered.length} resultados</p>
      </form>

      <DishGrid dishes={filtered as GridDish[]} restaurants={restMap} />

      {filtered.length > 0 && sectionId && (
        <p className="text-center text-sm text-bocado-mute">
          Sección: <strong>{sectionMap[sectionId]}</strong> ·{' '}
          <a href={`/carta/${sections.find((s) => s.id === sectionId)?.slug}`} className="text-bocado-ink underline">
            Ver todos los platos de esta sección
          </a>
        </p>
      )}
    </div>
  );
}
