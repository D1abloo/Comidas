import { useRef, useState, useEffect, useCallback } from 'react'
import AddToCart from './AddToCart'

interface Dish {
  id: string
  slug: string
  name: string
  price_cents: number
  rating: number
  delivery_time_min: number
  images: string[]
  restaurant_id: string
  sold_count?: number
}

interface Props {
  dishes: Dish[]
  restaurants: Record<string, string>
  deliveryFeeCents: number
}

const eur = (c: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100)

export default function BestsellerCarousel({ dishes, restaurants, deliveryFeeCents }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const pausedRef = useRef(false)

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return

    const cards = Array.from(el.children) as HTMLElement[]
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    cards.forEach((c, i) => {
      const center = c.offsetLeft + c.offsetWidth / 2
      const dist = Math.abs(center - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActive(best)
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
    if (dishes.length < 2) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const id = window.setInterval(() => {
      if (pausedRef.current) return
      const el = trackRef.current
      if (!el) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      const atEnd = el.scrollLeft >= maxScroll - 12
      el.scrollBy({ left: atEnd ? -maxScroll : Math.max(260, el.clientWidth * 0.82), behavior: 'smooth' })
    }, 5000)

    return () => window.clearInterval(id)
  }, [dishes.length])

  if (!dishes.length) return null

  const pageCount = Math.min(dishes.length, 5)
  const deliveryLabel = deliveryFeeCents > 0 ? `Envío ${eur(deliveryFeeCents)}` : 'Envío gratis'

  return (
    <section
      id="mas-vendido"
      className="container-bocado bestseller-section animate-fade-up scroll-mt-28"
      aria-label="Lo más vendido"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onFocusCapture={() => { pausedRef.current = true }}
      onBlurCapture={() => { pausedRef.current = false }}
    >
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="bestseller-kicker">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M13 3c1 4-2 5-2 8 0 2 1 3 3 3 3 0 4-3 3-6 3 2 4 5 3 8-1 4-4 6-8 6s-8-3-8-8c0-4 2-7 5-9 0 3 1 5 3 5 1-2 0-4 1-7Z"></path>
            </svg>
            Favoritos de la semana
          </p>
          <h2 className="premium-title mt-1">Platos más pedidos</h2>
          <p className="premium-sub mt-1.5 text-sm md:text-base">
            Favoritos de la semana — avanza solo
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="carousel-track bestseller-track"
          role="list"
          aria-label="Platos más pedidos"
        >
          {dishes.map((d, i) => {
            const img = d.images[0]
            const restaurant = restaurants[d.restaurant_id] ?? 'BocadO'
            return (
              <article
                key={d.id}
                role="listitem"
                className="carousel-card bestseller-card group bestseller-card-enter"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <a href={`/platos/${d.slug}`} className="bestseller-card-link" aria-label={`Ver ${d.name}`}>
                  <div className="bestseller-image-wrap">
                    {img && (
                      <img
                        src={img}
                        alt={d.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="bestseller-rank-badge">
                      #{i + 1}
                    </span>
                    {d.sold_count != null && d.sold_count > 0 && (
                      <span className="bestseller-sold-badge">
                        {d.sold_count}+ pedidos
                      </span>
                    )}
                  </div>
                  <div className="bestseller-card-body">
                    <p className="bestseller-restaurant">{restaurant}</p>
                    <h3>
                      {d.name}
                    </h3>
                    <p className="bestseller-meta">
                      <span className="bestseller-rating">★ {d.rating.toFixed(1)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{d.delivery_time_min} min</span>
                      <span aria-hidden="true">·</span>
                      <span>{deliveryLabel}</span>
                    </p>
                  </div>
                </a>
                <div className="bestseller-card-footer">
                  <a href={`/platos/${d.slug}`} className="bestseller-price-link" aria-label={`Ver ${d.name}`}>
                    <strong>{eur(d.price_cents)}</strong>
                  </a>
                  <AddToCart
                    variant="circle"
                    line={{
                      dish_id: d.id,
                      dish_name: d.name,
                      restaurant_name: restaurant,
                      unit_price_cents: d.price_cents,
                      image: img,
                    }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {dishes.length > 1 && (
        <div className="flex justify-center gap-2 mt-4" aria-hidden="true">
          {Array.from({ length: pageCount }, (_, i) => (
            <span
              key={i}
              className={`bestseller-dot ${Math.floor((active / dishes.length) * pageCount) === i ? 'bestseller-dot--active' : ''}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
