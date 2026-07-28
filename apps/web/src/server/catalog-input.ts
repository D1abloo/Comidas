import { sanitizeDishImageUrl } from './security.js';
import type { Dish, MenuSection } from './types.js';

const ALLERGENS = new Set([
  'gluten', 'lacteos', 'huevos', 'pescado', 'crustaceos', 'moluscos',
  'cacahuetes', 'frutos_secos', 'soja', 'apio', 'mostaza', 'sesamo',
  'sulfitos', 'altramuces',
]);

export function catalogSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueCatalogSlug(value: string, occupied: Iterable<string>): string {
  const base = catalogSlug(value) || 'elemento';
  const used = new Set(occupied);
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_payload');
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, max: number, required = false): string | undefined {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string') throw new Error('invalid_text');
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new Error('invalid_text');
  return result;
}

function numberValue(value: unknown, min: number, max: number, integer = false): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error('invalid_number');
  }
  if (integer && !Number.isInteger(value)) throw new Error('invalid_number');
  return value;
}

function stringList(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > maxItems) throw new Error('invalid_list');
  return value.map((item) => {
    const parsed = stringValue(item, maxLength, true);
    if (!parsed) throw new Error('invalid_list');
    return parsed;
  });
}

export function parseDishPatch(raw: unknown, requireName = false): Partial<Dish> {
  const input = object(raw);
  const patch: Partial<Dish> = {};
  const strings: Array<[keyof Dish, number]> = [
    ['restaurant_id', 100],
    ['menu_section_id', 100],
    ['name', 120],
    ['description', 500],
    ['long_description', 5_000],
    ['category', 50],
    ['cuisine', 80],
    ['portion', 80],
  ];
  for (const [key, max] of strings) {
    const parsed = stringValue(input[key], max, key === 'name' && requireName);
    if (parsed !== undefined) (patch as Record<string, unknown>)[key] = parsed;
  }
  if (requireName && !patch.name) throw new Error('invalid_name');

  const numbers: Array<[keyof Dish, number, number, boolean]> = [
    ['price_cents', 0, 100_000, true],
    ['vat_rate', 0, 1, false],
    ['delivery_time_min', 1, 240, true],
    ['rating', 0, 5, false],
    ['spicy_level', 0, 5, true],
  ];
  for (const [key, min, max, integer] of numbers) {
    const parsed = numberValue(input[key], min, max, integer);
    if (parsed !== undefined) (patch as Record<string, unknown>)[key] = parsed;
  }
  for (const key of ['is_available', 'is_featured', 'vegetarian', 'vegan', 'gluten_free'] as const) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'boolean') throw new Error('invalid_boolean');
      patch[key] = input[key];
    }
  }

  patch.tags = stringList(input.tags, 30, 60);
  const allergens = stringList(input.allergens, 30, 60);
  if (allergens && allergens.some((item) => !ALLERGENS.has(item))) throw new Error('invalid_allergens');
  patch.allergens = allergens as Dish['allergens'] | undefined;
  patch.ingredients = stringList(input.ingredients, 80, 120);
  if (!patch.tags) delete patch.tags;
  if (!patch.allergens) delete patch.allergens;
  if (!patch.ingredients) delete patch.ingredients;

  if (input.images !== undefined) {
    const images = stringList(input.images, 8, 2_100) ?? [];
    patch.images = images.map(sanitizeDishImageUrl).filter((url): url is string => Boolean(url));
    if (patch.images.length !== images.length) throw new Error('invalid_images');
  }
  if (input.nutrition !== undefined) {
    const nutrition = object(input.nutrition);
    patch.nutrition = {
      kcal: numberValue(nutrition.kcal, 0, 10_000) ?? 0,
      protein_g: numberValue(nutrition.protein_g, 0, 1_000) ?? 0,
      carbs_g: numberValue(nutrition.carbs_g, 0, 1_000) ?? 0,
      fat_g: numberValue(nutrition.fat_g, 0, 1_000) ?? 0,
    };
  }
  if (input.content_sections !== undefined) {
    if (!Array.isArray(input.content_sections) || input.content_sections.length > 20) {
      throw new Error('invalid_content_sections');
    }
    patch.content_sections = input.content_sections.map((rawSection, index) => {
      const section = object(rawSection);
      return {
        id: stringValue(section.id, 100) ?? `section-${index + 1}`,
        title: stringValue(section.title, 120, true)!,
        body: stringValue(section.body, 4_000) ?? '',
      };
    });
  }
  return patch;
}

export function parseMenuSectionPatch(raw: unknown, requireTitle = false): Partial<MenuSection> {
  const input = object(raw);
  const patch: Partial<MenuSection> = {};
  const title = stringValue(input.title, 100, requireTitle);
  if (title !== undefined) patch.title = title;
  const description = stringValue(input.description, 400);
  if (description !== undefined) patch.description = description;
  const emoji = stringValue(input.emoji, 16);
  if (emoji !== undefined) patch.emoji = emoji;
  const sortOrder = numberValue(input.sort_order, 0, 10_000, true);
  if (sortOrder !== undefined) patch.sort_order = sortOrder;
  if (input.is_active !== undefined) {
    if (typeof input.is_active !== 'boolean') throw new Error('invalid_boolean');
    patch.is_active = input.is_active;
  }
  return patch;
}
