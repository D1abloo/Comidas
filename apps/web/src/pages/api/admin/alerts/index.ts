import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  const since = url.searchParams.get('since');
  let alerts = store.admin_alerts;
  if (since) {
    alerts = alerts.filter((a) => a.created_at > since);
  }
  const unseen = alerts.filter((a) => !a.seen);
  return new Response(JSON.stringify({ alerts: unseen, unseen_count: unseen.length }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const body = (await request.json()) as { ids?: string[]; all?: boolean };
  const store = getStore();
  if (body.all) {
    store.admin_alerts.forEach((a) => {
      a.seen = true;
    });
  } else if (body.ids?.length) {
    const set = new Set(body.ids);
    store.admin_alerts.forEach((a) => {
      if (set.has(a.id)) a.seen = true;
    });
  }
  return new Response(JSON.stringify({ ok: true }));
};
