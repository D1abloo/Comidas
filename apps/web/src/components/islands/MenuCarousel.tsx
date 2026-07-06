import { useRef, useState, useEffect, useCallback } from 'react'
import AddToCart from './AddToCart'
import AvailabilityBadge from './AvailabilityBadge'
import type { GridDish } from './DishGrid'

const DISH_IMAGE_FALLBACK = '/carta/placeholder.jpg'
const eur = (c: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100)

function isDrink(d: GridDish) {
  return d.category === 'drink' || d.slug.includes('-lata') || d.slug.includes('limonada')
}

interface Props {
  dishes: GridDish[]
  restaurants: Record<string, string>
  /** Auto-scroll cada N ms; 0 = desactivado */
  autoPlayMs?: number
}

export default function MenuCarousel({ dishes, restaurants, autoPlayMs = 6000 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const pausedRef = useRef(false)

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    updateState()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateState, { passive: true })
    window.addEventListener('resize', updateState)
    return () => {
      el.removeEventListener('scroll', updateState)
      window.removeEventListener('resize', updateState)
    }
  }, [dishes, updateState])

  useEffect(() => {
    if (dishes.length < 2 || !autoPlayMs) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (pausedRef.current) return
      const el = trackRef.current
      if (!el) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      const atEnd = el.scrollLeft >= maxScroll - 12
      el.scrollBy({ left: atEnd ? -maxScroll : 300, behavior: 'smooth' })
    }, autoPlayMs)
    return () => window.clearInterval(id)
  }, [dishes.length, autoPlayMs])

  function scrollBy(dx: number) {
    trackRef.current?.scrollBy({ left: dx, behavior: 'smooth' })
  }

  if (!dishes.length) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onFocusCapture={() => { pausedRef.current = true }}
      onBlurCapture={() => { pausedRef.current = false }}
    >
      {dishes.length > 2 && (
        <div className="hidden sm:flex gap-2 absolute -top-14 right-0 z-10">
          <button
            type="button"
            disabled={!canLeft}
            onClick={() => scrollBy(-300)}
            className="carousel-nav-btn"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            type="button"
            disabled={!canRight}
            onClick={() => scrollBy(300)}
            className="carousel-nav-btn"
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      )}

      <div
        ref={trackRef}
        className="carousel-track flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-hide -mx-1 px-1"
        role="list"
        aria-label="Platos del menú"
      >
        {dishes.map((d) => {
          const drink = isDrink(d)
          const img = d.images[0]
          const available = d.is_available !== false
          const restaurant = restaurants[d.restaurant_id]
          return (
            <article
              key={d.id}
              role="listitem"
              className="carousel-card snap-start shrink-0 w-[min(260px,78vw)] food-card flex flex-col"
            >
              <a href={`/platos/${d.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-white">
                {img && (
                  <img
                    src={img}
                    alt={d.name}
                    loading="lazy"
                    className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                      drink ? 'object-contain p-5' : 'object-cover'
                    }`}
                    onError={(e) => {
                      const el = e.currentTarget
                      if (!el.src.includes('placeholder')) el.src = DISH_IMAGE_FALLBACK
                    }}
                  />
                )}
                {!drink && <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <AvailabilityBadge available={available} size="sm" />
                </div>
                <span className="absolute top-2.5 right-2.5 bg-bocado-lime text-bocado-ink text-sm font-bold px-2.5 py-1 rounded-full shadow-glow z-10">
                  {eur(d.price_cents)}
                </span>
                <div className={`absolute bottom-0 left-0 right-0 p-3 z-10 ${drink ? 'bg-gradient-to-t from-white via-white/95 to-transparent' : ''}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${drink ? 'text-bocado-mute' : 'text-white/80'}`}>
                    {restaurant}
                  </p>
                  <h3 className={`font-display text-base leading-tight mt-0.5 ${drink ? 'text-bocado-ink' : 'text-white'}`}>
                    {d.name}
                  </h3>
                </div>
              </a>
              <div className="p-3 flex items-center justify-between gap-2 border-t border-bocado-line/50 mt-auto">
                <span className="text-xs text-bocado-mute">★ {d.rating.toFixed(1)} · {d.delivery_time_min} min</span>
                {available ? (
                  <AddToCart
                    variant="pill"
                    line={{
                      dish_id: d.id,
                      dish_name: d.name,
                      restaurant_name: restaurant,
                      unit_price_cents: d.price_cents,
                      image: img,
                    }}
                  />
                ) : (
                  <span className="text-[10px] font-semibold text-red-700">Agotado</span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
