/** Rutas locales en /public/carta — una imagen por slug, acorde al nombre del plato. */
export function dishImagePath(slug: string): string {
  return `/carta/${slug}.jpg`;
}

const FALLBACK = '/carta/placeholder.jpg';

export function applyDishImages<T extends { slug: string; images: string[] }>(dishes: T[]): T[] {
  for (const d of dishes) {
    d.images = [dishImagePath(d.slug)];
  }
  return dishes;
}

export { FALLBACK as DISH_IMAGE_FALLBACK };
