import type { APIRoute } from 'astro';
import { listUnseenAlerts, markAlertsSeen } from '../../../../server/order-service';

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  let alerts = await listUnseenAlerts();
  const since = url.searchParams.get('since');
  if (since) alerts = alerts.filter((a) => a.created_at > since);
  return new Response(JSON.stringify({ alerts, unseen_count: alerts.length }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const body = (await request.json()) as { ids?: string[]; all?: boolean };
  if (body.all) {
    const all = await listUnseenAlerts();
    await markAlertsSeen(all.map((a) => a.id));
  } else if (body.ids?.length) {
    await markAlertsSeen(body.ids);
  }
  return new Response(JSON.stringify({ ok: true }));
};
