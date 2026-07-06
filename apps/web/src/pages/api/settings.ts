import type { APIRoute } from 'astro';
import { getStore } from '../../server/db';
import { pickCompanyPatch, pickSettingsPatch } from '../../server/security';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  return new Response(JSON.stringify({ company: store.company, settings: store.settings }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const body = (await request.json()) as { company?: Record<string, unknown>; settings?: Record<string, unknown> };
  const store = getStore();
  if (body.company) Object.assign(store.company, pickCompanyPatch(body.company));
  if (body.settings) Object.assign(store.settings, pickSettingsPatch(body.settings));
  return new Response(JSON.stringify({ company: store.company, settings: store.settings }));
};
