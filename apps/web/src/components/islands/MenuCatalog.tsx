import { useMemo, useState } from 'react';
import AddToCart from './AddToCart';
import AvailabilityBadge from './AvailabilityBadge';

interface Section {
  id: string;
  title: string;
  slug: string;
  emoji?: string;
  description?: string;
}

interface Dish {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  rating: number;
  delivery_time_min: number;
  images: string[];
  is_featured?: boolean;
  is_available?: boolean;
  menu_section_id?: string | null;
  restaurant_id: string;
  vegan?: boolean;
  vegetarian?: boolean;
}

interface Props {
  sections: Section[];
  dishes: Dish[];
  restaurants: Record<string, string>;
}

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

export default function MenuCatalog({ sections, dishes, restaurants }: Props) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? 'all');

  const bySection = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const s of sections) map.set(s.id, []);
    for (const d of dishes) {
      const sid = d.menu_section_id ?? sections[0]?.id;
      if (sid && map.has(sid)) map.get(sid)!.push(d);
      else if (sections[0]) map.get(sections[0].id)!.push(d);
    }
    return map;
  }, [dishes, sections]);

  return (
    <div className="space-y-16 md:space-y-20">
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1 snap-x">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`premium-chip shrink-0 snap-start ${activeSection === 'all' ? '!bg-bocado-ink !text-white !border-bocado-ink' : ''}`}
        >
          ✨ Todo
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveSection(s.id);
              document.getElementById(`sec-${s.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`premium-chip shrink-0 snap-start ${activeSection === s.id ? '!bg-bocado-ink !text-white !border-bocado-ink' : ''}`}
          >
            {s.emoji} {s.title}
          </button>
        ))}
      </div>

      {sections.map((sec, si) => {
        const list = bySection.get(sec.id) ?? [];
        if (!list.length) return null;
        return (
          <section key={sec.id} id={`sec-${sec.slug}`} className="scroll-mt-32 animate-fade-up" style={{ animationDelay: `${si * 0.04}s` }}>
            <div className="flex items-end justify-between gap-4 mb-8 pb-4 border-b border-bocado-line/60">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bocado-lime/30 to-bocado-coral/20 grid place-items-center text-3xl shadow-sm">
                  {sec.emoji}
                </span>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl">{sec.title}</h2>
                  {sec.description && <p className="text-sm text-bocado-mute mt-1">{sec.description}</p>}
                </div>
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-bocado-mute bg-bocado-paper2 px-3 py-1.5 rounded-full">
                {list.length} platos
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((d, i) => (
                <DishTile key={d.id} dish={d} restaurant={restaurants[d.restaurant_id]} delay={i * 0.03} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DishTile({ dish, restaurant, delay }: { dish: Dish; restaurant?: string; delay?: number }) {
  const img = dish.images[0];
  const available = dish.is_available !== false;
  return (
    <article
      className={`food-card group flex flex-col ${!available ? 'opacity-85 ring-1 ring-red-200/60' : ''}`}
      style={{ animationDelay: `${delay ?? 0}s` }}
    >
      <a href={`/platos/${dish.slug}`} className="block relative aspect-[4/3] overflow-hidden">
        {img && (
          <img
            src={img}
            alt={dish.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          <AvailabilityBadge available={available} size="md" />
          {dish.is_featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-bocado-coral text-white px-2.5 py-1 rounded-full">
              Destacado
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white z-10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{restaurant}</p>
          <h3 className="font-display text-lg leading-tight mt-0.5">{dish.name}</h3>
        </div>
        <span className="absolute top-3 right-3 bg-bocado-lime text-bocado-ink text-sm font-bold px-3 py-1.5 rounded-full shadow-glow z-10">
          {eur(dish.price_cents)}
        </span>
      </a>
      <div className="p-4 flex items-center justify-between gap-2 mt-auto border-t border-bocado-line/50 bg-gradient-to-b from-white to-bocado-cream/50">
        <span className="text-xs text-bocado-mute font-medium">
          ★ {dish.rating.toFixed(1)} · {dish.delivery_time_min} min
        </span>
        <div className="flex items-center gap-2">
          {dish.vegan && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Vegano</span>}
          {available ? (
            <AddToCart
              variant="pill"
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
      </div>
    </article>
  );
}
