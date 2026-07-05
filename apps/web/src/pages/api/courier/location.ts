import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { upsertCourierLocation } from '../../../server/courier-location';

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'courier') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const body = (await request.json()) as {
    lat?: number;
    lng?: number;
    accuracy_m?: number | null;
    active_order_id?: string | null;
  };

  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return new Response(JSON.stringify({ error: 'invalid_coordinates' }), { status: 400 });
  }
  if (body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) {
    return new Response(JSON.stringify({ error: 'invalid_coordinates' }), { status: 400 });
  }

  const store = getStore();
  upsertCourierLocation(store, locals.user, {
    lat: body.lat,
    lng: body.lng,
    accuracy_m: body.accuracy_m,
    active_order_id: body.active_order_id ?? null,
  });

  const loc = store.courier_locations.find((l) => l.courier_id === locals.user!.id);
  return new Response(JSON.stringify({ location: loc }), {
    headers: { 'content-type': 'application/json' },
  });
};
