import AddToCart from './AddToCart';
import AvailabilityBadge from './AvailabilityBadge';
const DISH_IMAGE_FALLBACK = '/carta/placeholder.jpg';

export interface GridDish {
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
  restaurant_id: string;
  vegan?: boolean;
  vegetarian?: boolean;
  category?: string;
}

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

export function DishGrid({
  dishes,
  restaurants,
}: {
  dishes: GridDish[];
  restaurants: Record<string, string>;
}) {
  if (!dishes.length) {
    return (
      <p className="text-center text-bocado-mute py-16 rounded-2xl bg-bocado-paper2 border border-bocado-line/60">
        No hay platos con estos filtros. Prueba otra búsqueda o quita algún filtro.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dishes.map((d, i) => (
        <DishTile key={d.id} dish={d} restaurant={restaurants[d.restaurant_id]} delay={i * 0.03} />
      ))}
    </div>
  );
}

function DishTile({ dish, restaurant, delay }: { dish: GridDish; restaurant?: string; delay?: number }) {
  const img = dish.images[0];
  const isBrandDrink = dish.category === 'drink' || dish.slug.endsWith('-lata');
  const available = dish.is_available !== false;
  return (
    <article
      className={`food-card group flex flex-col ${!available ? 'opacity-85 ring-1 ring-red-200/60' : ''}`}
      style={{ animationDelay: `${delay ?? 0}s` }}
    >
      <a href={`/platos/${dish.slug}`} className={`block relative aspect-[4/3] overflow-hidden ${isBrandDrink ? 'bg-white' : ''}`}>
        {img && (
          <img
            src={img}
            alt={dish.name}
            loading="lazy"
            className={`w-full h-full transition-transform duration-700 ease-out ${
              isBrandDrink
                ? 'object-contain p-8 bg-white group-hover:scale-105'
                : 'object-cover group-hover:scale-110'
            }`}
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.includes('placeholder')) return;
              el.src = DISH_IMAGE_FALLBACK;
            }}
          />
        )}
        {!isBrandDrink && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          <AvailabilityBadge available={available} size="md" />
          {dish.is_featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-bocado-coral text-white px-2.5 py-1 rounded-full">
              Destacado
            </span>
          )}
        </div>
        {!isBrandDrink ? (
          <div className="absolute bottom-3 left-3 right-3 text-white z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{restaurant}</p>
            <h3 className="font-display text-lg leading-tight mt-0.5">{dish.name}</h3>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-bocado-mute">{restaurant}</p>
            <h3 className="font-display text-lg leading-tight mt-0.5 text-bocado-ink">{dish.name}</h3>
          </div>
        )}
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
