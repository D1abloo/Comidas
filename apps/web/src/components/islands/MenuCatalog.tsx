import { useMemo, useState } from 'react';
import MenuCarousel from './MenuCarousel';
import type { GridDish } from './DishGrid';

interface Section {
  id: string;
  title: string;
  slug: string;
  emoji?: string;
  description?: string;
}

interface Dish extends GridDish {
  menu_section_id?: string | null;
  category?: string;
}

interface Props {
  sections: Section[];
  dishes: Dish[];
  restaurants: Record<string, string>;
  previewLimit?: number;
}

const PREVIEW_LIMIT = 12;

export default function MenuCatalog({ sections, dishes, restaurants, previewLimit = PREVIEW_LIMIT }: Props) {
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
      <div className="catalog-sticky-bar">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
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
      </div>

      {sections.map((sec, si) => {
        const list = bySection.get(sec.id) ?? [];
        if (!list.length) return null;
        const hasMore = list.length > previewLimit;
        const carouselDishes = list.slice(0, previewLimit);
        return (
          <section key={sec.id} id={`sec-${sec.slug}`} className="scroll-mt-32 animate-fade-up" style={{ animationDelay: `${si * 0.04}s` }}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-bocado-line/60">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bocado-lime/30 to-bocado-coral/20 grid place-items-center text-3xl shadow-sm">
                  {sec.emoji}
                </span>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl">{sec.title}</h2>
                  {sec.description && <p className="text-sm text-bocado-mute mt-1">{sec.description}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-bocado-mute bg-bocado-paper2 px-3 py-1.5 rounded-full">
                  {list.length} platos
                </span>
                {hasMore && (
                  <a
                    href={`/carta/${sec.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-bocado-ink hover:text-bocado-coral transition-colors"
                  >
                    Ver todos los platos
                    <span aria-hidden>→</span>
                  </a>
                )}
              </div>
            </div>
            <MenuCarousel dishes={carouselDishes} restaurants={restaurants} />
          </section>
        );
      })}
    </div>
  );
}
