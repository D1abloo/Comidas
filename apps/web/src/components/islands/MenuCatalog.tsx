import { useMemo, useState } from 'react';

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
    <div className="space-y-14">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`chip shrink-0 ${activeSection === 'all' ? '!bg-bocado-ink !text-white' : ''}`}
        >
          Todo el menú
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveSection(s.id);
              document.getElementById(`sec-${s.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`chip shrink-0 ${activeSection === s.id ? '!bg-bocado-ink !text-white' : ''}`}
          >
            {s.emoji} {s.title}
          </button>
        ))}
      </div>

      {sections.map((sec, si) => {
        const list = bySection.get(sec.id) ?? [];
        if (!list.length) return null;
        return (
          <section key={sec.id} id={`sec-${sec.slug}`} className="scroll-mt-28 animate-fade-up" style={{ animationDelay: `${si * 0.05}s` }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{sec.emoji}</span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{sec.title}</h2>
                {sec.description && <p className="text-sm text-bocado-mute">{sec.description}</p>}
              </div>
            </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  return (
    <article
      className="food-card group"
      style={{ animationDelay: `${delay ?? 0}s` }}
    >
      <a href={`/platos/${dish.slug}`} className="block relative aspect-[4/3] overflow-hidden">
        {img && (
          <img
            src={img}
            alt={dish.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-[10px] uppercase tracking-wider opacity-90">{restaurant}</p>
          <h3 className="font-semibold text-[15px] leading-tight mt-0.5">{dish.name}</h3>
        </div>
        <span className="absolute top-3 right-3 bg-bocado-lime text-bocado-ink text-xs font-semibold px-2.5 py-1 rounded-full">
          {eur(dish.price_cents)}
        </span>
      </a>
      <div className="p-3 flex items-center justify-between text-xs text-bocado-mute">
        <span>★ {dish.rating.toFixed(1)} · {dish.delivery_time_min} min</span>
        {dish.vegan && <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">Vegano</span>}
      </div>
    </article>
  );
}
