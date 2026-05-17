import { useRef, useState, useEffect } from 'react';

interface Dish {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  rating: number;
  delivery_time_min: number;
  images: string[];
  restaurant_id: string;
  sold_count?: number;
}

interface Props {
  dishes: Dish[];
  restaurants: Record<string, string>;
}

const eur = (c: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

export default function BestsellerCarousel({ dishes, restaurants }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  function updateArrows() {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, [dishes]);

  function scrollBy(dx: number) {
    trackRef.current?.scrollBy({ left: dx, behavior: 'smooth' });
  }

  if (!dishes.length) return null;

  return (
    <section id="mas-vendido" className="container-bocado mt-6 md:mt-8 animate-fade-up scroll-mt-28" aria-label="Lo más vendido">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="premium-eyebrow">🔥 Top ventas</p>
          <h2 className="premium-title mt-1">Lo más vendido</h2>
          <p className="premium-sub mt-2 text-sm md:text-base">Los favoritos de la semana en tu zona</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            type="button"
            disabled={!canLeft}
            onClick={() => scrollBy(-340)}
            className="w-11 h-11 rounded-full border border-bocado-line bg-white hover:bg-bocado-lime/20 hover:border-bocado-lime disabled:opacity-30 transition-all font-bold"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            type="button"
            disabled={!canRight}
            onClick={() => scrollBy(340)}
            className="w-11 h-11 rounded-full border border-bocado-line bg-white hover:bg-bocado-lime/20 hover:border-bocado-lime disabled:opacity-30 transition-all font-bold"
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
            const img = d.images[0];
            return (
              <a
                key={d.id}
                href={`/platos/${d.slug}`}
                className="carousel-card snap-start shrink-0 w-[min(300px,82vw)] group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <article className="food-card h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {img && (
                      <img
                        src={img}
                        alt={d.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                    {d.sold_count != null && d.sold_count > 0 && (
                      <span className="absolute top-3 left-3 bg-bocado-ink/90 backdrop-blur text-bocado-lime text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-bocado-lime/30">
                        🔥 {d.sold_count}+ pedidos
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-bocado-lime text-bocado-ink text-base font-bold px-4 py-1.5 rounded-full shadow-glow">
                      {eur(d.price_cents)}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-bocado-mute">{restaurants[d.restaurant_id]}</p>
                    <h3 className="font-display text-xl mt-1 leading-tight group-hover:text-bocado-coral transition-colors">{d.name}</h3>
                    <p className="text-xs text-bocado-mute mt-auto pt-4 font-medium">
                      ★ {d.rating.toFixed(1)} · {d.delivery_time_min} min entrega
                    </p>
                  </div>
                </article>
              </a>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bocado-paper to-transparent hidden md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bocado-paper to-transparent hidden md:block" />
      </div>
    </section>
  );
}
