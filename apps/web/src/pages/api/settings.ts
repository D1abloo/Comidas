import type { APIRoute } from 'astro';
import { getStore } from '../../server/db';
import { pickCompanyPatch, pickSettingsPatch } from '../../server/security';
import { isDatabaseEnabled } from '../../server/env';
import { pgSaveCompanyConfig } from '../../server/company-config-db';
import { persistOperationalState } from '../../server/store-persistence';

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
  try {
    const body = (await request.json()) as { company?: Record<string, unknown>; settings?: Record<string, unknown> };
    const store = getStore();
    if (body.company) Object.assign(store.company, pickCompanyPatch(body.company));
    if (body.settings) Object.assign(store.settings, pickSettingsPatch(body.settings));
    if (isDatabaseEnabled()) await pgSaveCompanyConfig(store.company, store.settings);
    else await persistOperationalState(store);
    return new Response(JSON.stringify({ company: store.company, settings: store.settings }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_settings' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
