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
    <section id="mas-vendido" className="container-bocado mt-8 md:mt-10 animate-fade-up scroll-mt-28" aria-label="Lo más vendido">
            <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="label">Top ventas</p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Lo más vendido</h2>
          <p className="text-sm text-bocado-mute mt-1">Los favoritos de la semana en tu zona</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            type="button"
            disabled={!canLeft}
            onClick={() => scrollBy(-320)}
            className="w-10 h-10 rounded-full border border-bocado-line bg-white hover:bg-bocado-paper2 disabled:opacity-30 transition"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            type="button"
            disabled={!canRight}
            onClick={() => scrollBy(320)}
            className="w-10 h-10 rounded-full border border-bocado-line bg-white hover:bg-bocado-paper2 disabled:opacity-30 transition"
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative -mx-1">
                <div
          ref={trackRef}
          className="carousel-track flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 pb-2 scrollbar-hide"
        >
          {dishes.map((d) => {
            const img = d.images[0];
            return (
              <a
                key={d.id}
                href={`/platos/${d.slug}`}
                className="carousel-card snap-start shrink-0 w-[min(280px,78vw)] group"
              >
                <article className="food-card h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {img && (
                      <img
                        src={img}
                        alt={d.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {d.sold_count != null && d.sold_count > 0 && (
                      <span className="absolute top-3 left-3 bg-bocado-ink text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        🔥 {d.sold_count}+ pedidos
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-bocado-lime text-bocado-ink text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                      {eur(d.price_cents)}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-[10px] uppercase tracking-wider text-bocado-mute">{restaurants[d.restaurant_id]}</p>
                    <h3 className="font-semibold mt-1 leading-tight group-hover:underline">{d.name}</h3>
                    <p className="text-xs text-bocado-mute mt-auto pt-3">
                      ★ {d.rating.toFixed(1)} · {d.delivery_time_min} min
                    </p>
                  </div>
                </article>
              </a>
            );
          })}
        </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bocado-paper to-transparent hidden sm:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bocado-paper to-transparent hidden sm:block" />
      </div>
    </section>
  );
}
