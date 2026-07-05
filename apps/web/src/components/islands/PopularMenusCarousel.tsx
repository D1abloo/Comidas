import { useRef, useState, useEffect, useCallback } from 'react'

interface MenuSection {
  id: string
  slug: string
  title: string
  emoji: string
  description?: string
  order_count: number
  top_dish?: string
}

interface Props {
  sections: MenuSection[]
}

export default function PopularMenusCarousel({ sections }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const pausedRef = useRef(false)

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current
    if (!el) return
    const card = el.children[i] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el || sections.length < 2) return

    const onScroll = () => {
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
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [sections.length])

  useEffect(() => {
    if (sections.length < 2) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const id = window.setInterval(() => {
      if (pausedRef.current) return
      setActive((prev) => {
        const next = (prev + 1) % sections.length
        scrollToIndex(next)
        return next
      })
    }, 4500)

    return () => window.clearInterval(id)
  }, [sections.length, scrollToIndex])

  if (!sections.length) return null

  return (
    <section
      className="popular-menus-band animate-fade-up scroll-mt-28"
      aria-label="Menús más pedidos"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onFocusCapture={() => { pausedRef.current = true }}
      onBlurCapture={() => { pausedRef.current = false }}
    >
      <div className="container-bocado py-10 md:py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="premium-eyebrow text-bocado-lime/90">Menús del momento</p>
            <h2 className="font-display text-2xl md:text-3xl text-white mt-1 tracking-tight">
              Lo más pedido por categoría
            </h2>
            <p className="text-sm text-white/60 mt-2 max-w-lg">
              Secciones favoritas de la carta según pedidos reales de la semana
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(0, active - 1))}
              className="popular-menus-nav"
              aria-label="Menú anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex((active + 1) % sections.length)}
              className="popular-menus-nav"
              aria-label="Menú siguiente"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="popular-menus-track scrollbar-hide"
          role="list"
        >
          {sections.map((sec, i) => (
            <a
              key={sec.id}
              href={`/carta/${sec.slug}`}
              role="listitem"
              className="popular-menu-card group"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className="popular-menu-rank" aria-hidden="true">#{i + 1}</span>
              <span className="popular-menu-emoji" aria-hidden="true">{sec.emoji}</span>
              <h3 className="font-display text-xl text-white mt-3 group-hover:text-bocado-lime transition-colors">
                {sec.title}
              </h3>
              {sec.description && (
                <p className="text-xs text-white/55 mt-1 line-clamp-2">{sec.description}</p>
              )}
              {sec.top_dish && (
                <p className="text-[11px] text-bocado-lime/80 mt-3 font-semibold">
                  ★ {sec.top_dish}
                </p>
              )}
              <p className="popular-menu-count mt-auto pt-4">
                {sec.order_count > 0 ? `${sec.order_count}+ pedidos` : 'Destacado'}
              </p>
            </a>
          ))}
        </div>

        {sections.length > 1 && (
          <div className="flex justify-center gap-2 mt-5" role="tablist" aria-label="Paginación menús">
            {sections.map((sec, i) => (
              <button
                key={sec.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Ir a ${sec.title}`}
                onClick={() => scrollToIndex(i)}
                className={`popular-menus-dot ${i === active ? 'popular-menus-dot--active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
