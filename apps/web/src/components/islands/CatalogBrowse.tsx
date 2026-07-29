import { useMemo, useState } from 'react'
import { DishGrid, type GridDish } from './DishGrid'
import { filterDishes, uniqueCuisines, type SortKey } from '../../utils/menu-search'

interface Section {
  id: string
  title: string
  slug: string
}

interface Props {
  dishes: (GridDish & {
    cuisine: string
    category: string
    tags?: string[]
    menu_section_id?: string | null
  })[]
  sections: Section[]
  restaurants: Record<string, string>
  initialSection?: string
}

const eur = (c: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100)

export default function CatalogBrowse({ dishes, sections, restaurants, initialSection = '' }: Props) {
  const priceBounds = useMemo(() => {
    const prices = dishes.map((d) => d.price_cents)
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 5000,
    }
  }, [dishes])

  const [q, setQ] = useState('')
  const [sectionId, setSectionId] = useState(initialSection)
  const [cuisine, setCuisine] = useState('')
  const [diet, setDiet] = useState('')
  const [availableOnly, setAvailableOnly] = useState(true)
  const [sort, setSort] = useState<SortKey>('featured')
  const [priceMin, setPriceMin] = useState(priceBounds.min)
  const [priceMax, setPriceMax] = useState(priceBounds.max)

  const cuisines = useMemo(() => uniqueCuisines(dishes), [dishes])

  const filtered = useMemo(() => {
    const base = filterDishes(dishes, {
      q,
      cuisine: cuisine || undefined,
      diet: (diet as 'vegan' | 'vegetarian' | 'gluten_free') || undefined,
      availableOnly,
      sort,
    }).filter((d) => {
      if (sectionId && d.menu_section_id !== sectionId) return false
      if (d.price_cents < priceMin || d.price_cents > priceMax) return false
      return true
    })
    return base
  }, [dishes, q, sectionId, cuisine, diet, availableOnly, sort, priceMin, priceMax])

  const clearFilters = () => {
    setQ('')
    setSectionId('')
    setCuisine('')
    setDiet('')
    setAvailableOnly(true)
    setSort('featured')
    setPriceMin(priceBounds.min)
    setPriceMax(priceBounds.max)
  }

  return (
    <div className="catalog-browse">
      <aside className="catalog-browse-sidebar" aria-label="Filtros de carta">
        <div className="catalog-browse-sidebar-inner">
          <h2 className="catalog-browse-sidebar-title">Filtros</h2>

          <label className="catalog-filter-field">
            <span>Buscar</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre o ingrediente"
              className="catalog-filter-input"
            />
          </label>

          <fieldset className="catalog-filter-fieldset">
            <legend>Sección</legend>
            <label className="catalog-filter-radio">
              <input type="radio" name="sec" checked={!sectionId} onChange={() => setSectionId('')} />
              Toda la carta
            </label>
            {sections.map((s) => (
              <label key={s.id} className="catalog-filter-radio">
                <input
                  type="radio"
                  name="sec"
                  checked={sectionId === s.id}
                  onChange={() => setSectionId(s.id)}
                />
                {s.title}
              </label>
            ))}
          </fieldset>

          <fieldset className="catalog-filter-fieldset">
            <legend>Precio</legend>
            <div className="catalog-price-range">
              <label>
                <span>Desde</span>
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={50}
                  value={priceMin}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setPriceMin(Math.min(v, priceMax))
                  }}
                />
                <em>{eur(priceMin)}</em>
              </label>
              <label>
                <span>Hasta</span>
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={50}
                  value={priceMax}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setPriceMax(Math.max(v, priceMin))
                  }}
                />
                <em>{eur(priceMax)}</em>
              </label>
            </div>
          </fieldset>

          <label className="catalog-filter-field">
            <span>Cocina</span>
            <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="catalog-filter-input">
              <option value="">Todas</option>
              {cuisines.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="catalog-filter-field">
            <span>Dieta</span>
            <select value={diet} onChange={(e) => setDiet(e.target.value)} className="catalog-filter-input">
              <option value="">Sin filtro</option>
              <option value="vegan">Vegano</option>
              <option value="vegetarian">Vegetariano</option>
              <option value="gluten_free">Sin gluten</option>
            </select>
          </label>

          <label className="catalog-filter-field">
            <span>Ordenar</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="catalog-filter-input">
              <option value="featured">Recomendados</option>
              <option value="price_asc">Precio ↑</option>
              <option value="price_desc">Precio ↓</option>
              <option value="rating">Mejor valorados</option>
              <option value="name">Nombre A–Z</option>
            </select>
          </label>

          <label className="catalog-filter-check">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            Solo disponibles
          </label>

          <button type="button" className="catalog-filter-clear" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      </aside>

      <div className="catalog-browse-main">
        <p className="catalog-browse-count">
          {filtered.length} {filtered.length === 1 ? 'plato' : 'platos'}
        </p>
        <DishGrid dishes={filtered} restaurants={restaurants} compact />
      </div>
    </div>
  )
}
