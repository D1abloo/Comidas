import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { randomUUID } from 'node:crypto';
import type { MenuSection } from '../../../server/types';
import { persistCatalog } from '../../../server/store-service';
import { parseMenuSectionPatch } from '../../../server/catalog-input';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const GET: APIRoute = async () => {
  const store = getStore();
  const sections = [...store.menu_sections].sort((a, b) => a.sort_order - b.sort_order);
  return new Response(JSON.stringify({ sections }), { headers: { 'content-type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as (Partial<MenuSection> & { id?: string }) | null;
  if (!body) return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
  const store = getStore();

  if (body.id) {
    const i = store.menu_sections.findIndex((s) => s.id === body.id);
    if (i < 0) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    let patch;
    try {
      patch = parseMenuSectionPatch(body);
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_section' }), { status: 400 });
    }
    store.menu_sections[i] = {
      ...store.menu_sections[i]!,
      ...patch,
      slug: patch.title ? slugify(patch.title) : store.menu_sections[i]!.slug,
    };
    await persistCatalog(store);
    return new Response(JSON.stringify({ section: store.menu_sections[i] }));
  }

  let patch;
  try {
    patch = parseMenuSectionPatch(body, true);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_section' }), { status: 400 });
  }
  const section: MenuSection = {
    id: 'sec-' + randomUUID().slice(0, 8),
    title: patch.title!,
    slug: slugify(patch.title!),
    description: patch.description ?? '',
    emoji: patch.emoji ?? '🍽️',
    sort_order: patch.sort_order ?? store.menu_sections.length + 1,
    is_active: patch.is_active ?? true,
    created_at: new Date().toISOString(),
  };
  store.menu_sections.push(section);
  await persistCatalog(store);
  return new Response(JSON.stringify({ section }), { status: 201 });
};
