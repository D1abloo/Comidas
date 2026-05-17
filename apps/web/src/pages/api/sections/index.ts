import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { randomUUID } from 'node:crypto';
import type { MenuSection } from '../../../server/types';

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
  const body = (await request.json()) as Partial<MenuSection>;
  const store = getStore();

  if (body.id) {
    const i = store.menu_sections.findIndex((s) => s.id === body.id);
    if (i < 0) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    store.menu_sections[i] = {
      ...store.menu_sections[i]!,
      ...body,
      slug: body.slug ?? slugify(body.title ?? store.menu_sections[i]!.title),
    };
    return new Response(JSON.stringify({ section: store.menu_sections[i] }));
  }

  const section: MenuSection = {
    id: 'sec-' + randomUUID().slice(0, 8),
    title: body.title ?? 'Nueva sección',
    slug: slugify(body.title ?? 'nueva-seccion'),
    description: body.description ?? '',
    emoji: body.emoji ?? '🍽️',
    sort_order: body.sort_order ?? store.menu_sections.length + 1,
    is_active: body.is_active ?? true,
    created_at: new Date().toISOString(),
  };
  store.menu_sections.push(section);
  return new Response(JSON.stringify({ section }), { status: 201 });
};
