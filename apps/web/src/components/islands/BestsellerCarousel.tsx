import { useRef, useState, useEffect, useCallback } from 'react'

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
}

const eur = (c: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100)

const rankLabel = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`)

export default function BestsellerCarousel({ dishes, restaurants }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const pausedRef = useRef(false)

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)

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
      el.scrollBy({ left: atEnd ? -maxScroll : 320, behavior: 'smooth' })
    }, 5000)

    return () => window.clearInterval(id)
  }, [dishes.length])

  function scrollBy(dx: number) {
    trackRef.current?.scrollBy({ left: dx, behavior: 'smooth' })
  }

  if (!dishes.length) return null

  const pageCount = Math.min(dishes.length, 5)

  return (
    <section
      id="mas-vendido"
      className="container-bocado mt-8 md:mt-10 animate-fade-up scroll-mt-28"
      aria-label="Lo más vendido"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onFocusCapture={() => { pausedRef.current = true }}
      onBlurCapture={() => { pausedRef.current = false }}
    >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="premium-eyebrow">🔥 Top ventas</p>
          <h2 className="premium-title mt-1">Platos más pedidos</h2>
          <p className="premium-sub mt-2 text-sm md:text-base">
            Favoritos de la semana — desliza o deja que avance solo
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            type="button"
            disabled={!canLeft}
            onClick={() => scrollBy(-340)}
            className="carousel-nav-btn"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            type="button"
            disabled={!canRight}
            onClick={() => scrollBy(340)}
            className="carousel-nav-btn"
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative -mx-1">
        <div
          ref={trackRef}
          className="carousel-track flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 pb-3 scrollbar-hide"
        >
          {dishes.map((d, i) => {
            const img = d.images[0]
            return (
              <a
                key={d.id}
                href={`/platos/${d.slug}`}
                className="carousel-card snap-start shrink-0 w-[min(300px,82vw)] group bestseller-card-enter"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <article className="food-card h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {img && (
                      <img
                        src={img}
                        alt={d.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <span className="absolute top-3 left-3 bestseller-rank-badge" aria-hidden="true">
                      {rankLabel(i)}
                    </span>
                    {d.sold_count != null && d.sold_count > 0 && (
                      <span className="absolute top-3 right-3 bg-bocado-ink/90 backdrop-blur text-bocado-lime text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-bocado-lime/30">
                        {d.sold_count}+ pedidos
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-bocado-lime text-bocado-ink text-base font-bold px-4 py-1.5 rounded-full shadow-glow transition-transform group-hover:scale-105">
                      {eur(d.price_cents)}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-bocado-mute">
                      {restaurants[d.restaurant_id]}
                    </p>
                    <h3 className="font-display text-xl mt-1 leading-tight group-hover:text-bocado-coral transition-colors duration-300">
                      {d.name}
                    </h3>
                    <p className="text-xs text-bocado-mute mt-auto pt-4 font-medium">
                      ★ {d.rating.toFixed(1)} · {d.delivery_time_min} min entrega
                    </p>
                  </div>
                </article>
              </a>
            )
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bocado-paper to-transparent hidden md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bocado-paper to-transparent hidden md:block" />
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
