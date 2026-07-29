import AddToCart from './AddToCart'
import AvailabilityBadge from './AvailabilityBadge'

const DISH_IMAGE_FALLBACK = '/carta/placeholder.jpg'

export interface GridDish {
  id: string
  slug: string
  name: string
  description: string
  price_cents: number
  rating: number
  delivery_time_min: number
  images: string[]
  is_featured?: boolean
  is_available?: boolean
  restaurant_id: string
  vegan?: boolean
  vegetarian?: boolean
  category?: string
}

const eur = (c: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100)

export function DishGrid({
  dishes,
  restaurants,
  compact = false,
}: {
  dishes: GridDish[]
  restaurants: Record<string, string>
  /** Grid más estrecho (p. ej. al lado de filtros) */
  compact?: boolean
}) {
  if (!dishes.length) {
    return (
      <p className="text-center text-bocado-mute py-16 rounded-2xl bg-bocado-paper2 border border-bocado-line/60">
        No hay platos con estos filtros. Prueba otra búsqueda o quita algún filtro.
      </p>
    )
  }

  return (
    <div
      className={
        compact
          ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
          : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {dishes.map((d, i) => (
        <DishTile
          key={d.id}
          dish={d}
          restaurant={restaurants[d.restaurant_id]}
          priority={i < 6}
        />
      ))}
    </div>
  )
}

function DishTile({
  dish,
  restaurant,
  priority,
}: {
  dish: GridDish
  restaurant?: string
  priority?: boolean
}) {
  const img = dish.images[0]
  const isBrandDrink = dish.category === 'drink' || dish.slug.endsWith('-lata')
  const available = dish.is_available !== false

  return (
    <article
      className={`dish-card group flex flex-col ${!available ? 'opacity-85 ring-1 ring-red-200/60' : ''}`}
    >
      <a href={`/platos/${dish.slug}`} className="dish-card-media">
        <span className="dish-card-media-bg" aria-hidden="true" />
        {img && (
          <img
            src={img}
            alt={dish.name}
            width={640}
            height={480}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className={isBrandDrink ? 'dish-card-img--contain' : undefined}
            onError={(e) => {
              const el = e.currentTarget
              if (!el.src.includes('placeholder')) el.src = DISH_IMAGE_FALLBACK
            }}
          />
        )}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          <AvailabilityBadge available={available} size="sm" />
          {dish.is_featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-bocado-coral text-white px-2 py-0.5 rounded-full">
              Destacado
            </span>
          )}
        </div>
        <span className="absolute top-2.5 right-2.5 z-10 bg-bocado-lime text-bocado-ink text-sm font-bold px-2.5 py-1 rounded-full shadow-glow">
          {eur(dish.price_cents)}
        </span>
      </a>

      <div className="dish-card-body">
        <p className="dish-card-rest">{restaurant || 'BocadO'}</p>
        <h3>
          <a href={`/platos/${dish.slug}`}>{dish.name}</a>
        </h3>
        <div className="dish-card-meta">
          <span>★ {dish.rating.toFixed(1)} · {dish.delivery_time_min} min</span>
          {dish.vegan && (
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Vegano
            </span>
          )}
        </div>
      </div>

      <div className="dish-card-footer">
        <strong>{eur(dish.price_cents)}</strong>
        {available ? (
          <AddToCart
            variant="circle"
            line={{
              dish_id: dish.id,
              dish_name: dish.name,
              restaurant_name: restaurant,
              unit_price_cents: dish.price_cents,
              image: img,
            }}
          />
        ) : (
          <span className="text-[10px] font-semibold text-red-700">No disponible</span>
        )}
      </div>
    </article>
  )
}
