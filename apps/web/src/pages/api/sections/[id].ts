import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  const id = params.id!;
  store.menu_sections = store.menu_sections.filter((s) => s.id !== id);
  store.dishes.forEach((d) => {
    if (d.menu_section_id === id) d.menu_section_id = null;
  });
  return new Response(JSON.stringify({ ok: true }));
};
